#!/bin/bash
# Build script for Linera Dominion
# This script builds all Wasm applications for the Linera network

set -e

echo "🚀 Building Linera Dominion..."

# Ensure we're using the correct toolchain
rustup target add wasm32-unknown-unknown

# Build in release mode for optimal Wasm size
echo "📦 Building common library..."
cargo build --package linera-dominion-common --release

echo "📦 Building Dominion (User Chain) contract..."
cargo build --package linera-dominion --release --target wasm32-unknown-unknown

echo "📦 Building Region Chain contract..."
cargo build --package linera-dominion-region --release --target wasm32-unknown-unknown

echo "📦 Building Battle Chain contract..."
cargo build --package linera-dominion-battle --release --target wasm32-unknown-unknown

# Create output directory
mkdir -p target/deploy

# Copy Wasm binaries to deploy directory
if [ -f target/wasm32-unknown-unknown/release/linera_dominion.wasm ]; then
    cp target/wasm32-unknown-unknown/release/linera_dominion.wasm target/deploy/
    echo "✅ Dominion contract: target/deploy/linera_dominion.wasm"
fi

if [ -f target/wasm32-unknown-unknown/release/linera_dominion_region.wasm ]; then
    cp target/wasm32-unknown-unknown/release/linera_dominion_region.wasm target/deploy/
    echo "✅ Region contract: target/deploy/linera_dominion_region.wasm"
fi

if [ -f target/wasm32-unknown-unknown/release/linera_dominion_battle.wasm ]; then
    cp target/wasm32-unknown-unknown/release/linera_dominion_battle.wasm target/deploy/
    echo "✅ Battle contract: target/deploy/linera_dominion_battle.wasm"
fi

echo ""
echo "🎮 Linera Dominion build complete!"
echo ""
echo "Next steps:"
echo "1. Install Linera CLI: cargo install linera-client"
echo "2. Initialize a local network: linera net up"
echo "3. Publish applications: linera publish-application target/deploy/linera_dominion.wasm"
