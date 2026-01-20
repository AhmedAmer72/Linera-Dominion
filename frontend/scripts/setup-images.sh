#!/bin/bash

# Linera Dominion - Image Setup Script
# This script helps organize game images into the correct folders

IMAGES_DIR="/mnt/e/AKINDO/Linera-Dominion/frontend/public/images"

echo "🎮 Linera Dominion Image Setup"
echo "================================"
echo ""

# Create directories
mkdir -p "$IMAGES_DIR/resources"
mkdir -p "$IMAGES_DIR/buildings"
mkdir -p "$IMAGES_DIR/ships"
mkdir -p "$IMAGES_DIR/research"

echo "✅ Created image directories"
echo ""

# Check for source images
if [ -n "$1" ]; then
    SOURCE_DIR="$1"
    echo "📁 Looking for images in: $SOURCE_DIR"
    
    # Copy logo
    if [ -f "$SOURCE_DIR/logo.png" ]; then
        cp "$SOURCE_DIR/logo.png" "$IMAGES_DIR/"
        echo "✅ Copied logo.png"
    fi
    
    # Copy resources
    for img in iron deuterium crystals; do
        if [ -f "$SOURCE_DIR/$img.png" ]; then
            cp "$SOURCE_DIR/$img.png" "$IMAGES_DIR/resources/"
            echo "✅ Copied $img.png to resources/"
        fi
    done
    
    echo ""
    echo "Done! Refresh your browser to see the new images."
else
    echo "Usage: ./setup-images.sh /path/to/your/downloaded/images"
    echo ""
    echo "Expected files in source folder:"
    echo "  - logo.png (main game logo)"
    echo "  - iron.png (orange crystal)"
    echo "  - deuterium.png (blue flask)"
    echo "  - crystals.png (purple gem)"
fi
