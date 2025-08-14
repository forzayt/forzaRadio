# ForzaRadio - IA Music Player

A beautiful, modern music player that streams your music collection from Internet Archive with AI-powered album art.

## 🎵 Features

- **Beautiful UI**: Modern, responsive design with gradient animations
- **AI Album Art**: Automatic Spotify integration for album covers
- **Continuous Play**: Non-stop radio experience
- **Fullscreen Mode**: Immersive listening experience
- **Progress Bar**: Visual playback progress with click-to-seek
- **Simple Setup**: Just upload songs and generate playlist

## 🚀 Quick Start

### 1. **Prepare Your Music**
- Place your MP3 files in a folder (e.g., `C:\Users\vishn\Music`)
- Use the format: `Title - Artist.mp3`

### 2. **Generate Playlist**
```bash
# Run the batch script to generate songs.json
generate-songs.bat
```

### 3. **Upload to Internet Archive**
- Go to [archive.org](https://archive.org)
- Upload your MP3 files manually
- Copy the direct download URLs

### 4. **Update songs.json**
- Open `songs.json`
- Add `audioUrl` field with the IA download URL for each song:

```json
[
  {
    "title": "Kerosene",
    "artist": "Crystal Castles", 
    "filename": "Kerosene - Crystal Castles.mp3",
    "image": "Kerosene - Crystal Castles.png",
    "audioUrl": "https://ia802909.us.archive.org/5/items/your-collection/Kerosene%20-%20Crystal%20Castles.mp3"
  }
]
```

### 5. **Launch Player**
- Open `index.html` in your browser
- Enjoy your music!

## 📁 File Structure

```
forzaRadio/
├── index.html              # Main player interface
├── songs.json              # Generated playlist (auto-created)
├── generate-songs.bat      # Script to generate playlist
├── upload.bat              # Legacy upload script (optional)
└── readme.md               # This file
```

## 🔄 Workflow

### **Adding New Songs**
1. **Add MP3 files** to your music folder
2. **Run `generate-songs.bat`** to update the playlist
3. **Upload to Internet Archive** manually
4. **Update `audioUrl`** in songs.json with IA download links
5. **Refresh the player** to see new songs

### **Batch Script Features**
- **Automatic Detection**: Scans folder for new MP3 files
- **Metadata Parsing**: Extracts title/artist from filenames
- **JSON Generation**: Creates player-ready playlist file
- **Error Handling**: Graceful fallbacks for missing metadata

## 🎨 Customization

### **Change Music Folder**
Edit `generate-songs.bat`:
```batch
set "MUSIC_FOLDER=C:\Your\Music\Path"
```

### **Modify Player Settings**
Edit `index.html`:
```javascript
const SONG_COLLECTION = {
    jsonFile: "songs.json" // Change to your JSON file
};
```

## 🛠️ Technical Details

### **Supported Formats**
- MP3 files (primary)
- WAV files (experimental)
- FLAC files (experimental)

### **File Naming Convention**
- **Required**: `Title - Artist.mp3`
- **Example**: `Kerosene - Crystal Castles.mp3`

### **JSON Structure**
```json
{
  "title": "Song Title",
  "artist": "Artist Name", 
  "filename": "filename.mp3",
  "image": "filename.png",
  "audioUrl": "https://ia.org/download/url.mp3"
}
```

## 🎯 Benefits of This Approach

✅ **Simple**: No complex IA API integration  
✅ **Reliable**: Direct file-based playlist management  
✅ **Flexible**: Easy to add/remove songs  
✅ **Fast**: No dynamic fetching delays  
✅ **Offline**: Works without internet (local files)  

## 🚨 Troubleshooting

### **No Songs Appearing**
- Check if `songs.json` exists
- Verify file paths in batch script
- Ensure MP3 files are in correct folder

### **Audio Not Playing**
- Verify `audioUrl` in songs.json
- Check IA download links are accessible
- Test URLs in browser directly

### **Batch Script Errors**
- Ensure music folder path is correct
- Check file permissions
- Verify MP3 files exist

## 📝 License

This project is open source. Feel free to modify and distribute.

---

**ForzaRadio** - Your personal AI-powered music streaming experience! 🎵
