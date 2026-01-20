#!/bin/bash
# Linera Dominion Deployment Script
# This script deploys the Dominion MMORTS game to a local Linera network

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WASM_DIR="$PROJECT_DIR/target/wasm32-unknown-unknown/release"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "=== Linera Dominion Deployment ==="
echo ""

# Check if WASM files exist
if [ ! -f "$WASM_DIR/linera_dominion_contract.wasm" ]; then
    echo "Building WASM contracts..."
    cd "$PROJECT_DIR"
    cargo build --target wasm32-unknown-unknown --release
fi

# Step 1: Initialize local network (if not already running)
echo "Step 1: Starting local Linera network..."
if ! pgrep -x "linera-proxy" > /dev/null; then
    echo "Starting a new local network..."
    linera net up --testing-prng-seed 37 &
    sleep 5
fi

# Step 2: Configure wallet
echo "Step 2: Configuring wallet..."
export LINERA_WALLET="$HOME/.linera/wallet.json"
export LINERA_STORAGE="rocksdb:$HOME/.linera/storage.db"

# Initialize wallet if needed
if [ ! -f "$LINERA_WALLET" ]; then
    echo "Initializing wallet..."
    linera wallet init --faucet http://localhost:8080
fi

# Step 3: Get chain ID
CHAIN_ID=$(linera wallet show | grep "Default Chain" | awk '{print $NF}')
echo "Using chain: $CHAIN_ID"

# Step 4: Deploy Dominion (User Chain) Application
echo ""
echo "Step 3: Deploying Dominion (User Chain) application..."
DOMINION_APP=$(linera publish-and-create \
    "$WASM_DIR/linera_dominion_contract.wasm" \
    "$WASM_DIR/linera_dominion_service.wasm" \
    --json-parameters '{
        "home_x": 100,
        "home_y": 200,
        "starting_iron": 10000,
        "starting_deuterium": 5000,
        "starting_crystals": 2500,
        "universe_seed": 12345
    }' 2>&1 | tail -1)

echo "Dominion App ID: $DOMINION_APP"

# Step 5: Deploy Region Chain Application
echo ""
echo "Step 4: Deploying Region Chain application..."
REGION_APP=$(linera publish-and-create \
    "$WASM_DIR/linera_dominion_region_contract.wasm" \
    "$WASM_DIR/linera_dominion_region_service.wasm" \
    --json-parameters '{
        "sector_x": 0,
        "sector_y": 0,
        "universe_seed": 12345,
        "sector_size": 1000
    }' 2>&1 | tail -1)

echo "Region App ID: $REGION_APP"

# Note: Battle chains are created dynamically per battle
# They require specific instantiation args with attacker/defender info

# Step 6: Update frontend .env.local
echo ""
echo "Step 5: Updating frontend configuration..."
cat > "$FRONTEND_DIR/.env.local" << ENVEOF
# Local development configuration
NEXT_PUBLIC_LINERA_GRAPHQL=http://localhost:8080/graphql
NEXT_PUBLIC_LINERA_FAUCET=http://localhost:8080

# Deployed Application IDs
NEXT_PUBLIC_DOMINION_APP_ID=$DOMINION_APP
NEXT_PUBLIC_REGION_APP_ID=$REGION_APP
NEXT_PUBLIC_BATTLE_APP_ID=

# Chain ID
NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID
ENVEOF

echo "Frontend .env.local updated"

# Step 7: Start the GraphQL service
echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Application IDs:"
echo "  Dominion: $DOMINION_APP"
echo "  Region:   $REGION_APP"
echo "  Chain ID: $CHAIN_ID"
echo ""
echo "Starting GraphQL service on port 8080..."
echo "Access the GraphQL playground at: http://localhost:8080"
echo ""

linera service --port 8080
