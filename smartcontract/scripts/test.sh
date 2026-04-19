#!/bin/bash
# ============================================================================
# NFT Ticket Smart Contract - Integration Test Script
# ============================================================================
# Runs the full test suite for the smart contract.
# ============================================================================

set -e

echo "============================================"
echo "  Running NFT Ticket Contract Tests"
echo "============================================"
echo ""

# Run all tests with output
cargo test -- --nocapture

echo ""
echo "✅ All tests passed!"
