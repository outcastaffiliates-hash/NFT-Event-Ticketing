#!/bin/bash
# ============================================================================
# NFT Ticket Smart Contract - Deploy Script (Stellar Testnet)
# ============================================================================
# Deploys the optimized WASM to Stellar Testnet and initializes the contract.
#
# Prerequisites:
#   - `soroban` CLI installed
#   - A funded Stellar Testnet account
#   - Set ADMIN_SECRET in your environment
# ============================================================================

set -e

echo "============================================"
echo "  Deploying NFT Ticket Contract to Testnet"
echo "============================================"
echo ""

# Configuration
NETWORK="testnet"
WASM_PATH="target/wasm32-unknown-unknown/release/nft_ticket.optimized.wasm"

# Check for required environment variable
if [ -z "$ADMIN_SECRET" ]; then
    echo "❌ Error: ADMIN_SECRET environment variable is required."
    echo "   Export your Stellar testnet secret key:"
    echo "   export ADMIN_SECRET=S..."
    exit 1
fi

# Check if the WASM file exists
if [ ! -f "$WASM_PATH" ]; then
    echo "❌ WASM binary not found. Run ./scripts/build.sh first."
    exit 1
fi

# Configure Soroban CLI for testnet
echo "→ Configuring network..."
soroban network add \
    --global testnet \
    --rpc-url https://soroban-testnet.stellar.org:443 \
    --network-passphrase "Test SDF Network ; September 2015" \
    2>/dev/null || true

# Add identity for deployer
echo "→ Configuring deployer identity..."
soroban keys add deployer --secret-key <<< "$ADMIN_SECRET" 2>/dev/null || true

ADMIN_ADDRESS=$(soroban keys address deployer)
echo "   Admin Address: $ADMIN_ADDRESS"

# Step 1: Deploy the contract
echo ""
echo "→ Deploying contract to testnet..."
CONTRACT_ID=$(soroban contract deploy \
    --wasm "$WASM_PATH" \
    --source deployer \
    --network testnet)

echo "   Contract ID: $CONTRACT_ID"

# Step 2: Initialize the contract
echo ""
echo "→ Initializing contract with admin..."
soroban contract invoke \
    --id "$CONTRACT_ID" \
    --source deployer \
    --network testnet \
    -- \
    initialize \
    --admin "$ADMIN_ADDRESS"

echo ""
echo "============================================"
echo "  ✅ Deployment Complete!"
echo "============================================"
echo ""
echo "  Contract ID:  $CONTRACT_ID"
echo "  Admin:        $ADMIN_ADDRESS"
echo "  Network:      Stellar Testnet"
echo ""
echo "  Add this to your frontend .env.local:"
echo "  NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID"
echo "============================================"
