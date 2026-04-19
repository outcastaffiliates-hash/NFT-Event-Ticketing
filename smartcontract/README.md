# 🎫 NFT Event Ticketing — Soroban Smart Contract

> **Soulbound, non-transferable NFT event tickets on Stellar** — eliminating scalping, counterfeiting, and unauthorized resale through on-chain enforcement.

[![Stellar](https://img.shields.io/badge/Stellar-Soroban-7C3AED?style=for-the-badge&logo=stellar)](https://soroban.stellar.org)
[![Rust](https://img.shields.io/badge/Rust-2021-orange?style=for-the-badge&logo=rust)](https://www.rust-lang.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Contract Functions](#-contract-functions)
- [Folder Structure](#-folder-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Frontend Integration](#-frontend-integration)
- [Error Codes](#-error-codes)
- [Security Model](#-security-model)
- [License](#-license)

---

## 🌐 Overview

This Soroban smart contract powers the **RiseTix** NFT Event Ticketing platform. It manages the complete ticket lifecycle on-chain:

| Feature | Description |
|---------|-------------|
| **🎪 Event Management** | Organizers create events with titles, dates, venues, categories, and ticket supply caps |
| **🎟️ Soulbound Minting** | Tickets are permanently bound to the attendee's wallet address — they cannot be transferred, traded, or resold |
| **✅ Check-In Validation** | Organizers verify and mark tickets as used at event entry, preventing double-entry |
| **🔒 Anti-Scalping** | Non-transferability is enforced at the contract level (not just flag-based like Stellar classic assets) |
| **1️⃣ One-Per-User** | Each attendee can only mint one ticket per event |

### How It Replaces the Classic Approach

The existing frontend (`src/utils/stellar.ts`) uses Stellar classic asset operations to simulate non-transferability:

```
1. setOptions → AUTH_REQUIRED | AUTH_REVOCABLE
2. setTrustLineFlags → authorize trustline
3. payment → send 1 ticket asset
4. setTrustLineFlags → revoke authorization (freeze)
```

This contract **replaces all four operations** with a single `mint_ticket` invocation that enforces non-transferability natively — no flag gymnastics, no issuer secret key on the backend, and no race conditions between authorize/revoke.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Next.js Frontend                       │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ WalletConnect│  │  EventCard   │  │ StellarContext│  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘  │
│         │                │                   │          │
│         └────────────────┴───────────────────┘          │
│                          │                              │
│               ┌──────────┴──────────┐                   │
│               │  contract-client.ts │ ← Integration     │
│               └──────────┬──────────┘                   │
└──────────────────────────┼──────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Soroban RPC Server   │
              └────────────┬───────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │     NFTTicketContract (WASM)     │
         │                                 │
         │  ┌───────────┐  ┌────────────┐  │
         │  │  storage   │  │   types    │  │
         │  ├───────────┤  ├────────────┤  │
         │  │  events    │  │   errors   │  │
         │  ├───────────┤  └────────────┘  │
         │  │  ticket    │ ← Core Logic    │
         │  └───────────┘                  │
         └─────────────────────────────────┘
```

---

## 📜 Contract Functions

### Admin

| Function | Access | Description |
|----------|--------|-------------|
| `initialize(admin)` | Once | Sets the contract admin. Can only be called once. |
| `get_admin()` | Public | Returns the admin address. |

### Event Management

| Function | Access | Description |
|----------|--------|-------------|
| `create_event(organizer, event_id, title, date, location, category, price, currency, max_supply)` | Organizer | Registers a new event with ticket supply cap. |
| `deactivate_event(organizer, event_id)` | Organizer | Stops ticket sales for an event. |
| `get_event(event_id)` | Public | Returns event details. |
| `get_remaining_tickets(event_id)` | Public | Returns unsold ticket count. |

### Ticket Operations

| Function | Access | Description |
|----------|--------|-------------|
| `mint_ticket(attendee, event_id)` | Attendee | Mints a soulbound ticket to the caller's wallet. Returns ticket ID. |
| `check_in(organizer, ticket_id)` | Organizer | Marks a ticket as used at event entry. |
| `get_ticket(ticket_id)` | Public | Returns ticket details. |
| `get_user_ticket(event_id, user)` | Public | Checks if a user owns a ticket for an event. |
| `verify_ticket(ticket_id, owner)` | Public | Validates a ticket is authentic, owned, and unused. |

---

## 📁 Folder Structure

```
smartcontract/
├── Cargo.toml                        # Workspace configuration
├── .env.example                      # Environment variable template
├── README.md                         # This file
│
├── contracts/
│   └── nft_ticket/
│       ├── Cargo.toml                # Contract dependencies (soroban-sdk)
│       └── src/
│           ├── lib.rs                # Entry point & module declarations
│           ├── types.rs              # Data structures (Event, Ticket)
│           ├── errors.rs             # Custom error codes (ContractError)
│           ├── events.rs             # On-chain event emissions for indexing
│           ├── storage.rs            # Storage keys & CRUD operations
│           └── ticket.rs             # Core contract logic & unit tests
│
├── integration/
│   └── contract-client.ts            # TypeScript client for Next.js frontend
│
└── scripts/
    ├── build.sh                      # Compile & optimize WASM
    ├── deploy.sh                     # Deploy to Stellar Testnet
    └── test.sh                       # Run test suite
```

---

## ⚙️ Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Rust** | 1.74+ | [rustup.rs](https://rustup.rs) |
| **Soroban CLI** | 21.x | `cargo install --locked soroban-cli` |
| **wasm32 target** | — | `rustup target add wasm32-unknown-unknown` |
| **Node.js** | 18+ | For frontend integration |

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add the WASM compilation target
rustup target add wasm32-unknown-unknown

# Install Soroban CLI
cargo install --locked soroban-cli
```

### 2. Build the Contract

```bash
cd smartcontract

# Build & optimize the WASM binary
bash scripts/build.sh
```

This produces:
- `target/wasm32-unknown-unknown/release/nft_ticket.wasm` — Raw binary
- `target/wasm32-unknown-unknown/release/nft_ticket.optimized.wasm` — Production-ready binary

### 3. Run Tests

```bash
bash scripts/test.sh

# Or manually:
cargo test
```

---

## 🧪 Testing

The contract includes **10 comprehensive unit tests** covering all critical flows:

| Test | What It Verifies |
|------|-----------------|
| `test_initialize` | Admin address is stored correctly |
| `test_double_initialize` | Re-initialization is blocked |
| `test_create_event` | Event creation with all parameters |
| `test_mint_ticket` | Soulbound ticket minting and supply decrement |
| `test_duplicate_ticket` | 1-ticket-per-user enforcement |
| `test_check_in` | Ticket validation and usage marking |
| `test_double_check_in` | Double-entry prevention |
| `test_deactivate_event` | Event deactivation flow |
| `test_sold_out` | Supply cap enforcement |
| `test_get_user_ticket` | Ownership query |

```bash
# Run with verbose output
cargo test -- --nocapture

# Run a specific test
cargo test test_mint_ticket -- --nocapture
```

---

## 🌍 Deployment

### Deploy to Stellar Testnet

```bash
# 1. Create & fund a testnet account at:
#    https://laboratory.stellar.org/#account-creator?network=test

# 2. Set your secret key
export ADMIN_SECRET=S...YOUR_SECRET_KEY...

# 3. Deploy
bash scripts/deploy.sh
```

The script outputs a **Contract ID** — add it to your frontend:

```env
# In your Next.js project root: .env.local
NEXT_PUBLIC_CONTRACT_ID=C...YOUR_CONTRACT_ID...
```

### Manual CLI Invocation

```bash
# Create an event
soroban contract invoke \
    --id $CONTRACT_ID \
    --source deployer \
    --network testnet \
    -- \
    create_event \
    --organizer $ORGANIZER_ADDRESS \
    --event_id "evt_1" \
    --title "Global Web3 Summit" \
    --date "August 15, 2026" \
    --location "Dubai, UAE" \
    --category "Conference" \
    --price 1500000000 \
    --currency "XLM" \
    --max_supply 100

# Mint a ticket
soroban contract invoke \
    --id $CONTRACT_ID \
    --source attendee \
    --network testnet \
    -- \
    mint_ticket \
    --attendee $ATTENDEE_ADDRESS \
    --event_id "evt_1"

# Query remaining tickets
soroban contract invoke \
    --id $CONTRACT_ID \
    --network testnet \
    -- \
    get_remaining_tickets \
    --event_id "evt_1"
```

---

## 🔗 Frontend Integration

The `integration/contract-client.ts` provides a drop-in TypeScript client. Here's how to use it with the existing Next.js frontend:

### Step 1: Copy the Client

```bash
cp smartcontract/integration/contract-client.ts src/utils/contract-client.ts
```

### Step 2: Update EventCard.tsx

Replace the current `handleMint` function that uses raw API routes:

```typescript
// Before (API routes + Stellar classic operations):
const buildRes = await fetch("/api/trustline", { ... });
const signedXdr = await signTransaction(buildData.xdr, { ... });
const res = await fetch("/api/mint", { ... });

// After (direct Soroban contract call):
import { mintTicket } from "@/utils/contract-client";

const handleMint = async () => {
  const ticketId = await mintTicket(walletAddress, event.id);
  console.log("Minted ticket:", ticketId);
};
```

### Step 3: Add Event Queries

```typescript
import { getEvent, getRemainingTickets, getUserTicket } from "@/utils/contract-client";

// Fetch live remaining count from the contract
const remaining = await getRemainingTickets("evt_1");

// Check if user already has a ticket
const existingTicket = await getUserTicket("evt_1", walletAddress);
```

### Step 4: Ticket Verification (Optional)

```typescript
import { verifyTicket } from "@/utils/contract-client";

// At event check-in scanner
const isValid = await verifyTicket(ticketId, attendeeAddress);
```

---

## ❌ Error Codes

| Code | Name | Trigger |
|------|------|---------|
| 1 | `NotInitialized` | Contract hasn't been initialized with an admin |
| 2 | `AlreadyInitialized` | `initialize()` called more than once |
| 3 | `Unauthorized` | Caller is not the event organizer for this operation |
| 4 | `EventAlreadyExists` | Duplicate `event_id` in `create_event` |
| 5 | `EventNotFound` | Referenced event doesn't exist |
| 6 | `EventNotActive` | Attempting to mint for a deactivated event |
| 7 | `SoldOut` | All tickets for the event have been minted |
| 8 | `AlreadyOwnsTicket` | User already holds a ticket for this event |
| 9 | `TicketNotFound` | Referenced ticket doesn't exist |
| 10 | `TicketAlreadyUsed` | Ticket has already been checked in |
| 11 | `NotTicketOwner` | Operation requires ownership of the ticket |
| 12 | `InvalidInput` | Bad parameter (e.g., `max_supply = 0`) |

---

## 🔒 Security Model

### Soulbound / Non-Transferable Design

Tickets are **soulbound by design** — the contract has **no `transfer` function**. Once minted, a ticket is permanently bound to the attendee's address. There is no mechanism to move it to another wallet.

### Authorization Model

| Operation | Who Can Call |
|-----------|-------------|
| `initialize` | Anyone (once) |
| `create_event` | Any address (self-authorizing organizer) |
| `deactivate_event` | The original event organizer only |
| `mint_ticket` | Any address (self-authorizing attendee) |
| `check_in` | The event organizer only |
| `get_*` / `verify_*` | Anyone (read-only) |

### Key Improvements Over Classic Approach

| Concern | Classic (Current) | Soroban (This Contract) |
|---------|-------------------|------------------------|
| Non-transferability | Flag-based freeze (auth revoke race condition) | No transfer function exists |
| Issuer secret key | Backend must hold the secret | No secret key required — contract enforces rules |
| Trustline management | User must create trustline first | Not needed — contract manages ownership |
| Double-minting | No built-in check | `AlreadyOwnsTicket` error enforced |
| Supply cap | Not enforced on-chain | `SoldOut` error when `minted_count >= max_supply` |

---

## 📄 License

This project is licensed under the MIT License. See `LICENSE` for details.

---

<div align="center">

**Built with ❤️ on [Stellar Soroban](https://soroban.stellar.org)**

</div>
