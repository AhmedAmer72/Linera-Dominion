#!/bin/bash
# Deploy Linera Dominion contracts to Linera Testnet (Conway)

set -e

echo "🚀 Deploying Linera Dominion to Conway Testnet..."

# Check if linera CLI is available
if ! command -v linera &> /dev/null; then
    echo "❌ linera CLI not found. Please install it first:"
    echo "   cargo install linera-service"
    exit 1
fi

# Faucet URL for Conway testnet
FAUCET_URL="https://faucet.testnet-conway.linera.net"

# Initialize wallet and get chain from faucet
echo "📥 Initializing wallet and getting chain from faucet..."
linera wallet init --with-new-chain --faucet "$FAUCET_URL" 2>/dev/null || echo "Wallet may already exist"

# Show current chain info
echo ""
echo "📋 Current wallet info:"
linera wallet show

# Get the current chain ID
CHAIN_ID=$(linera wallet show 2>/dev/null | grep -oP 'Chain: \K[a-f0-9]+' | head -1)
echo ""
echo "📦 Using chain: $CHAIN_ID"

# Build the contracts if WASM files don't exist
CONTRACT_DIR="dominion"
CONTRACT_WASM="target/wasm32-unknown-unknown/release/linera_dominion_contract.wasm"
SERVICE_WASM="target/wasm32-unknown-unknown/release/linera_dominion_service.wasm"

if [ ! -f "$CONTRACT_WASM" ] || [ ! -f "$SERVICE_WASM" ]; then
    echo ""
    echo "📦 Building contracts..."
    cargo build --release --target wasm32-unknown-unknown
fi

# Check WASM files exist
if [ ! -f "$CONTRACT_WASM" ]; then
    echo "❌ Contract WASM not found: $CONTRACT_WASM"
    exit 1
fi

if [ ! -f "$SERVICE_WASM" ]; then
    echo "❌ Service WASM not found: $SERVICE_WASM"
    exit 1
fi

echo ""
echo "📦 Publishing and creating Dominion application..."
APP_OUTPUT=$(linera publish-and-create \
  "$CONTRACT_WASM" \
  "$SERVICE_WASM" \
  --json-argument '{}' 2>&1)

echo "$APP_OUTPUT"

# Extract application ID (it's a long hex string)
APP_ID=$(echo "$APP_OUTPUT" | grep -oP '[a-f0-9]{64}' | tail -1)

if [ -n "$APP_ID" ]; then
    echo ""
    echo "✅ Linera Dominion deployed successfully!"
    echo "═══════════════════════════════════════════════════════════════"
    echo "📋 Application ID:"
    echo "   $APP_ID"
    echo ""
    echo "📋 Chain ID:"
    echo "   $CHAIN_ID"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "🔧 Update your frontend .env.local with:"
    echo "   NEXT_PUBLIC_APP_ID=$APP_ID"
    echo "   NEXT_PUBLIC_LINERA_APP_ID=$APP_ID"
    echo ""
    
    # Optionally update the .env.local file
    if [ -f "frontend/.env.local" ]; then
        echo "📝 Updating frontend/.env.local..."
        sed -i "s/^NEXT_PUBLIC_APP_ID=.*/NEXT_PUBLIC_APP_ID=$APP_ID/" frontend/.env.local
        sed -i "s/^NEXT_PUBLIC_LINERA_APP_ID=.*/NEXT_PUBLIC_LINERA_APP_ID=$APP_ID/" frontend/.env.local
        echo "✅ Environment file updated!"
    fi
else
    echo ""
    echo "⚠️ Could not extract application ID from output"
    echo "   Check the output above for any errors"
fi
