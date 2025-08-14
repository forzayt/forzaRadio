const fs = require("fs");
const path = require("path");

// ==== CONFIG ====
const MUSIC_FOLDER = "C:/Users/vishn/Music";
const OUTPUT_FILE = "songs.json";
const ARCHIVE_BASE = "https://ia902909.us.archive.org/5/items/kerosene-crystal-castles_202508/";
// =================

// Load existing songs
let songs = [];
if (fs.existsSync(OUTPUT_FILE)) {
  try {
    songs = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
  } catch (err) {
    console.warn("Invalid JSON, starting fresh.");
    songs = [];
  }
}

// Map for duplicate check
const existing = new Set(songs.map(s => s.filename.toLowerCase()));

let added = 0;
let skipped = 0;

// Get all mp3 files in folder
fs.readdirSync(MUSIC_FOLDER)
  .filter(f => f.toLowerCase().endsWith(".mp3"))
  .sort()
  .forEach(file => {
    if (existing.has(file.toLowerCase())) {
      skipped++;
      return;
    }

    const base = path.basename(file, ".mp3");
    let title = base;
    let artist = "Unknown Artist";

    // Parse "Title - Artist"
    const parts = base.split(" - ");
    if (parts.length === 2) {
      title = parts[0].trim();
      artist = parts[1].trim();
    }

    const encodedFilename = encodeURIComponent(file);

    songs.push({
      title,
      artist,
      filename: file,
      image: `${base}.png`,
      audioUrl: ARCHIVE_BASE + encodedFilename
    });

    added++;
  });

// Save updated JSON
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(songs, null, 2));
console.log(`songs.json updated! Added: ${added}, Skipped: ${skipped}`);
