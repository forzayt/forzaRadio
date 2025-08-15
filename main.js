/*
ForzaRadio - IA Music Player
Implementing current playing logic from original index.html
*/

new Vue({
    el: "#app",
    data() {
      return {
        audio: null,
        circleLeft: null,
        barWidth: null,
        duration: null,
        currentTime: null,
        isTimerPlaying: false,
        tracks: [],
        currentTrack: null,
        currentTrackIndex: 0,
        transitionName: null,
        items: [],
        currentIndex: 0,
        isPlaying: false,
        currentSongData: null,
        currentAlbumArt: null,
        nextPreloadStarted: false,
        nextBufferedForIndex: -1,
        bufferPlayer: null,
        PRELOAD_AFTER_SECONDS: 7,
        preloadedImages: new Map(), // Store preloaded images
        SPOTIFY_CONFIG: {
            clientId: '57e7d63ff50e46058facee08174119c7',
            clientSecret: 'c8f8624cc0c245db82a065d2f8182f7c'
        },
        spotifyAccessToken: null,
        spotifyTokenExpiry: null
      };
    },
    methods: {
      async loadSongList() {
        try {
          const response = await fetch("../songs.json");
          if (response.ok) return await response.json();
          throw new Error('Failed to load songs.json');
        } catch (error) {
          console.error(error);
          return [];
        }
      },

      formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      },

      updateProgress() {
        if (this.audio.duration) {
          const progressPercent = (this.audio.currentTime / this.audio.duration) * 100;
          this.barWidth = progressPercent + "%";
          this.circleLeft = progressPercent + "%";
          this.currentTime = this.formatTime(this.audio.currentTime);
          this.duration = this.formatTime(this.audio.duration);

          // Start buffering the NEXT track only after some seconds of the CURRENT track
          if (this.isPlaying && !this.nextPreloadStarted && this.audio.currentTime >= this.PRELOAD_AFTER_SECONDS) {
            this.preloadNext();
          }
        }
      },

      async getSpotifyToken() {
        if (this.spotifyAccessToken && Date.now() < this.spotifyTokenExpiry) return this.spotifyAccessToken;
        const res = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(this.SPOTIFY_CONFIG.clientId + ':' + this.SPOTIFY_CONFIG.clientSecret)
          },
          body: 'grant_type=client_credentials'
        });
        const data = await res.json();
        this.spotifyAccessToken = data.access_token;
        this.spotifyTokenExpiry = Date.now() + (data.expires_in * 1000);
        return this.spotifyAccessToken;
      },

      async searchSpotifyAlbumArt(songTitle, artistName) {
        try {
          const token = await this.getSpotifyToken();
          const query = encodeURIComponent(`${songTitle} ${artistName}`);
          const res = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.tracks.items.length > 0) return data.tracks.items[0].album.images[0].url;
        } catch {}
        return this.getFallbackAlbumArt();
      },

      getFallbackAlbumArt() {
        return 'https://avatars.githubusercontent.com/u/127679210?v=4';
      },

      // Preload album art image
      async preloadAlbumArt(songData) {
        try {
          const imageUrl = await this.searchSpotifyAlbumArt(songData.title, songData.artist);
          const key = `${songData.title}-${songData.artist}`;
          
          if (!this.preloadedImages.has(key)) {
            const img = new Image();
            img.onload = () => {
              this.preloadedImages.set(key, imageUrl);
              console.log(`Preloaded album art for: ${songData.title}`);
            };
            img.onerror = () => {
              console.warn(`Failed to preload album art for: ${songData.title}`);
            };
            img.src = imageUrl;
          }
        } catch (error) {
          console.warn('Error preloading album art:', error);
        }
      },

      // Get preloaded album art or fetch it
      async getAlbumArt(songData) {
        const key = `${songData.title}-${songData.artist}`;
        
        // Check if image is already preloaded
        if (this.preloadedImages.has(key)) {
          return this.preloadedImages.get(key);
        }
        
        // If not preloaded, fetch and cache it
        const imageUrl = await this.searchSpotifyAlbumArt(songData.title, songData.artist);
        this.preloadedImages.set(key, imageUrl);
        return imageUrl;
      },

      async updateSongInfo(songData) {
        this.currentSongData = songData;
        
        // Use preloaded image if available, otherwise fetch it
        const coverUrl = await this.getAlbumArt(songData);
        
        this.currentTrack = {
          name: songData.title || "Unknown Title",
          artist: songData.artist || "Unknown Artist",
          cover: coverUrl,
          source: songData.audioUrl || songData.filename,
          url: "#",
          favorited: false
        };
        this.currentAlbumArt = this.currentTrack.cover;
        
        // Smoothly transition background image
        await this.transitionBackgroundImage(this.currentAlbumArt);
      },

      shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
      },

      normalizeMatch(a, b) {
        if (!a || !b) return false;
        return a === b || a.endsWith(b) || b.endsWith(a);
      },

      preloadNext() {
        if (this.items.length === 0) return;

        let nextIndex = this.currentIndex;
        if (nextIndex >= this.items.length) nextIndex = 0;

        const nextSong = this.items[nextIndex];
        const nextSrc = nextSong.audioUrl || nextSong.filename;

        this.bufferPlayer.src = nextSrc;
        this.bufferPlayer.preload = "auto";
        this.bufferPlayer.load?.();
        this.nextPreloadStarted = true;
        this.nextBufferedForIndex = nextIndex;

        // Also preload the album art for the next track
        this.preloadAlbumArt(nextSong);
      },

      playNext() {
        if (this.items.length === 0) return;

        if (this.currentIndex >= this.items.length) {
          this.shuffleArray(this.items);
          this.currentIndex = 0;
        }

        const song = this.items[this.currentIndex];
        const expectedSrc = song.audioUrl || song.filename;
        this.updateSongInfo({ title: song.title, artist: song.artist });

        if (this.nextBufferedForIndex === this.currentIndex &&
            this.normalizeMatch(this.bufferPlayer.src, expectedSrc) &&
            this.bufferPlayer.readyState >= 2) {
          this.audio.src = this.bufferPlayer.src;
        } else {
          this.audio.src = expectedSrc;
        }

        this.nextPreloadStarted = false;
        this.nextBufferedForIndex = -1;

        this.audio.onerror = () => {
          console.error('Failed to load audio:', song.title);
          this.currentIndex++;
          setTimeout(() => this.playNext(), 1000);
        };

        this.audio.oncanplay = () => {
          if (this.isPlaying) {
            this.audio.play().catch(error => {
              console.error('Autoplay failed:', error);
              this.isPlaying = false;
              this.isTimerPlaying = false;
            });
          }
        };

        this.currentIndex++;
      },

      playPrev() {
        this.currentIndex = Math.max(0, this.currentIndex - 2);
        this.playNext();
      },

      play() {
        if (this.audio.paused) {
          this.audio.play();
          this.isTimerPlaying = true;
          this.isPlaying = true;
        } else {
          this.audio.pause();
          this.isTimerPlaying = false;
          this.isPlaying = false;
        }
      },

      clickProgress(e) {
        this.isTimerPlaying = true;
        this.isPlaying = true;
        this.audio.pause();
        this.updateBar(e.pageX);
      },

      updateBar(x) {
        let progress = this.$refs.progress;
        let maxduration = this.audio.duration;
        let position = x - progress.offsetLeft;
        let percentage = (100 * position) / progress.offsetWidth;
        if (percentage > 100) {
          percentage = 100;
        }
        if (percentage < 0) {
          percentage = 0;
        }
        this.barWidth = percentage + "%";
        this.circleLeft = percentage + "%";
        this.audio.currentTime = (maxduration * percentage) / 100;
        this.audio.play();
      },

      prevTrack() {
        this.transitionName = "scale-in";
        this.playPrev();
      },

      nextTrack() {
        this.transitionName = "scale-out";
        this.playNext();
      },

      favorite() {
        if (this.currentTrack) {
          this.currentTrack.favorited = !this.currentTrack.favorited;
        }
      },

      async initPlayer() {
        this.items = await this.loadSongList();
        if (this.items.length === 0) {
          this.currentTrack = {
            name: "No songs available",
            artist: "",
            cover: this.getFallbackAlbumArt(),
            source: "",
            url: "#",
            favorited: false
          };
          return;
        }
        this.shuffleArray(this.items);
        this.currentIndex = 0;

        const song = this.items[this.currentIndex];
        await this.updateSongInfo({ title: song.title, artist: song.artist });
        this.audio.src = song.audioUrl || song.filename;

        this.nextPreloadStarted = false;
        this.nextBufferedForIndex = -1;

        this.currentIndex++;
      },



      // Smoothly transition background image
      async transitionBackgroundImage(newImageUrl) {
        const bgImg = document.getElementById('bg-img');
        if (bgImg) {
          // Create a temporary image to preload
          const tempImg = new Image();
          tempImg.onload = () => {
            // Once loaded, smoothly transition the background
            bgImg.style.transition = 'opacity 0.5s ease-in-out';
            bgImg.style.opacity = '0';
            
            setTimeout(() => {
              bgImg.src = newImageUrl;
              bgImg.style.opacity = '1';
            }, 250);
          };
          tempImg.src = newImageUrl;
        }
      },
    },
    async created() {
      let vm = this;
      
      // Initialize buffer player
      this.bufferPlayer = new Audio();
      this.bufferPlayer.preload = "auto";

      // Initialize main audio
      this.audio = new Audio();
      
      this.audio.ontimeupdate = function() {
        vm.updateProgress();
      };
      
      this.audio.onloadedmetadata = function() {
        vm.updateProgress();
      };
      
      this.audio.onended = function() {
        vm.playNext();
        vm.isTimerPlaying = true;
        vm.isPlaying = true;
      };

      // Initialize player
      await this.initPlayer();

      // Fallback: Check if song has ended but event didn't fire
      setInterval(() => {
        if (this.isPlaying && this.audio.duration && this.audio.currentTime >= this.audio.duration - 0.1) {
          this.playNext();
        }
      }, 1000);
    }
  });
  