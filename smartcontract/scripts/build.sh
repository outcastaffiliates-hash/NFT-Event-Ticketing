#!/bin/bash
# ============================================================================
# NFT Ticket Smart Contract - Build Script
# ============================================================================
# This script compiles the Soroban smart contract and generates the WASM
# binary along with TypeScript bindings for frontend integration.
# ============================================================================

set -e

echo "============================================"
echo "  Building NFT Ticket Smart Contract"
echo "============================================"
echo ""

# Step 1: Build the contract
echo "→ Compiling contract to WASM..."
soroban contract build

# Step 2: Optimize the WASM binary
echo "→ Optimizing WASM binary..."
soroban contract optimize --wasm target/wasm32-unknown-unknown/release/nft_ticket.wasm

echo ""
echo "→ Build artifacts:"
echo "   Raw WASM:       target/wasm32-unknown-unknown/release/nft_ticket.wasm"
echo "   Optimized WASM: target/wasm32-unknown-unknown/release/nft_ticket.optimized.wasm"
echo ""
echo "✅ Build complete!"
