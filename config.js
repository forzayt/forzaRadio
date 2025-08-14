// Spotify API Configuration
// Get these from: https://developer.spotify.com/dashboard
const SPOTIFY_CONFIG = {
  clientId: '57e7d63ff50e46058facee08174119c7',        // Replace with your actual Client ID
  clientSecret: 'c8f8624cc0c245db82a065d2f8182f7c', // Replace with your actual Client Secret
  redirectUri: window.location.origin              // Your app's redirect URI
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SPOTIFY_CONFIG;
}
