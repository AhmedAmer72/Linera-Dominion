# 🎵 Background Music for Linera Dominion

This folder contains the background music for the game.

## Adding Music Files

Add your MP3 files here with the following names (or update the component):

1. `space-ambient-1.mp3` - "Cosmic Voyage" 
2. `space-ambient-2.mp3` - "Nebula Dreams"
3. `space-ambient-3.mp3` - "Stellar Drift"

## Recommended Free Music Sources

You can find royalty-free space ambient music at:

- **Pixabay Music**: https://pixabay.com/music/search/space%20ambient/
- **Free Music Archive**: https://freemusicarchive.org/
- **Incompetech**: https://incompetech.com/music/
- **OpenGameArt**: https://opengameart.org/art-search-advanced?field_art_type_tid[]=12

## Music Requirements

- Format: MP3 (recommended) or OGG
- Duration: 2-5 minutes (will loop)
- Style: Space ambient, sci-fi, electronic
- License: Royalty-free / Creative Commons

## Quick Download Commands

```bash
# Example: Download from Pixabay (replace with actual URLs)
cd frontend/public/audio

# Option 1: Use wget
wget -O space-ambient-1.mp3 "YOUR_MUSIC_URL_HERE"

# Option 2: Use curl  
curl -L -o space-ambient-1.mp3 "YOUR_MUSIC_URL_HERE"
```

## Component Configuration

The music player is located at:
`/frontend/src/components/ui/BackgroundMusic.tsx`

To add more tracks, edit the `tracks` array in the component:

```tsx
const tracks = [
  { name: 'Cosmic Voyage', file: '/audio/space-ambient-1.mp3' },
  { name: 'Nebula Dreams', file: '/audio/space-ambient-2.mp3' },
  { name: 'Stellar Drift', file: '/audio/space-ambient-3.mp3' },
  // Add more tracks here
];
```

## Features

- ▶️ Play/Pause toggle
- ⏮️ ⏭️ Previous/Next track
- 🔊 Volume slider with persistence
- 💾 Saves preferences to localStorage
- 🎨 Space-themed UI matching game design
