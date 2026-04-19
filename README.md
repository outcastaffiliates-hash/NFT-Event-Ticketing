# 🎫 RiseTix — NFT Event Ticketing on Stellar

> **Soulbound, non-transferable NFT event tickets** that eliminate scalping, counterfeiting, and unauthorized resale — powered by Stellar Soroban smart contracts.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-7C3AED?style=for-the-badge&logo=stellar)](https://soroban.stellar.org)
[![Rust](https://img.shields.io/badge/Rust-Smart_Contract-orange?style=for-the-badge&logo=rust)](https://www.rust-lang.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Smart Contract](#-smart-contract)
- [Frontend](#-frontend)
- [API Routes](#-api-routes)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌐 Overview

**RiseTix** is a full-stack decentralized application (dApp) for issuing, minting, and validating NFT-based event tickets on the Stellar blockchain. Tickets are **soulbound** — permanently bound to the attendee's wallet — making them impossible to scalp, counterfeit, or resell.

The platform consists of two integrated layers:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 + React 19 + Tailwind CSS 4 | Premium glassmorphism UI for browsing events, connecting wallets, and minting tickets |
| **Smart Contract** | Rust + Soroban SDK 21.x | On-chain ticket lifecycle — event creation, soulbound minting, check-in validation |

---

## ✨ Features

### For Attendees
- 🔗 **One-click wallet connection** via Freighter browser extension
- 🎟️ **Mint NFT tickets** directly to your Stellar wallet
- 🔒 **Soulbound ownership** — your ticket is permanently yours, no one can take or transfer it
- 🔍 **Search & filter** events by name and category

### For Organizers
- 🎪 **Create events** with custom titles, dates, venues, categories, and ticket supply caps
- ✅ **Check-in validation** — scan and verify tickets at event entry
- 🚫 **Anti-scalping** — non-transferability enforced at the smart contract level
- 📊 **Real-time supply tracking** — remaining ticket counts on-chain

### Technical Highlights
- 💎 **Glassmorphism UI** with animated gradients, backdrop blur, and micro-animations
- 🏗️ **BFF Architecture** — backend-for-frontend API routes handle issuer operations securely
- ⛓️ **Dual-mode** — works in simulation mode without Stellar keys for local development
- 1️⃣ **One-ticket-per-user** enforcement on-chain

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     RiseTix Frontend                         │
│                     (Next.js 16 + React 19)                  │
│                                                              │
│  ┌──────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ WalletConnect │  │  EventCard  │  │  StellarContext     │ │
│  │  (Freighter)  │  │  (Minting)  │  │  (Wallet State)    │ │
│  └──────┬───────┘  └──────┬──────┘  └─────────┬───────────┘ │
│         │                 │                    │             │
│         └─────────────────┼────────────────────┘             │
│                           │                                  │
│              ┌────────────┴────────────┐                     │
│              │     Next.js API Routes   │                    │
│              │  /api/trustline          │                    │
│              │  /api/mint               │                    │
│              └────────────┬─────────────┘                    │
└───────────────────────────┼──────────────────────────────────┘
                            │
               ┌────────────┴────────────┐
               │    Stellar Network       │
               │  (Horizon + Soroban RPC) │
               └────────────┬─────────────┘
                            │
              ┌─────────────┴──────────────┐
              │   NFTTicketContract (WASM)   │
              │                             │
              │  initialize()               │
              │  create_event()             │
              │  mint_ticket()  ← Soulbound │
              │  check_in()                 │
              │  verify_ticket()            │
              └─────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| [Next.js](https://nextjs.org) | 16.2.3 | React framework with App Router and API routes |
| [React](https://react.dev) | 19.2.4 | UI component library |
| [Tailwind CSS](https://tailwindcss.com) | 4.x | Utility-first CSS framework |
| [Stellar SDK](https://www.npmjs.com/package/@stellar/stellar-sdk) | 15.x | Blockchain interaction |
| [Freighter API](https://www.npmjs.com/package/@stellar/freighter-api) | 6.x | Wallet connection & signing |
| [Lucide React](https://lucide.dev) | 1.8.x | Icon library |

### Smart Contract
| Technology | Version | Purpose |
|-----------|---------|---------|
| [Rust](https://www.rust-lang.org) | 2021 Edition | Smart contract language |
| [Soroban SDK](https://soroban.stellar.org) | 21.7.6 | Stellar smart contract framework |
| [WASM](https://webassembly.org) | — | Compilation target |

---

## 📁 Project Structure

```
NFT Event Ticketing/
│
├── src/                                    # ── Next.js Frontend ──
│   ├── app/
│   │   ├── layout.tsx                      # Root layout with StellarProvider
│   │   ├── page.tsx                        # Home page — hero, search, event grid
│   │   ├── globals.css                     # Design system — glassmorphism, gradients
│   │   └── api/
│   │       ├── mint/route.ts               # Backend minting with issuer signing
│   │       └── trustline/route.ts          # Trustline XDR builder for user signing
│   ├── components/
│   │   ├── EventCard.tsx                   # Event card with mint button + Freighter flow
│   │   └── WalletConnect.tsx               # Freighter wallet connect/disconnect
│   ├── context/
│   │   └── StellarContext.tsx              # Global wallet state provider
│   └── utils/
│       └── stellar.ts                      # Stellar SDK helpers (classic operations)
│
├── smartcontract/                          # ── Soroban Smart Contract ──
│   ├── Cargo.toml                          # Workspace config
│   ├── README.md                           # Smart contract documentation
│   ├── .env.example                        # Environment template
│   ├── contracts/nft_ticket/
│   │   ├── Cargo.toml                      # Contract dependencies
│   │   └── src/
│   │       ├── lib.rs                      # Entry point
│   │       ├── types.rs                    # Event & Ticket data structures
│   │       ├── errors.rs                   # 12 custom error codes
│   │       ├── events.rs                   # On-chain event emissions
│   │       ├── storage.rs                  # Storage layer & CRUD operations
│   │       └── ticket.rs                   # Core contract logic + 10 unit tests
│   ├── integration/
│   │   └── contract-client.ts              # TypeScript client for frontend
│   └── scripts/
│       ├── build.sh                        # Compile & optimize WASM
│       ├── deploy.sh                       # Deploy to Stellar Testnet
│       └── test.sh                         # Run test suite
│
├── package.json                            # Frontend dependencies
├── tsconfig.json                           # TypeScript configuration
├── next.config.ts                          # Next.js configuration
└── README.md                              # This file
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Required For | Install |
|------|-------------|---------|
| **Node.js** 18+ | Frontend | [nodejs.org](https://nodejs.org) |
| **Rust** 1.74+ | Smart contract | [rustup.rs](https://rustup.rs) |
| **Soroban CLI** | Contract build/deploy | `cargo install --locked soroban-cli` |
| **Freighter Wallet** | Browser extension | [freighter.app](https://freighter.app) |

### 1. Clone & Install Frontend

```bash
git clone <repository-url>
cd "NFT Event Ticketing"
npm install
```

### 2. Configure Environment

```bash
# Create .env.local in the project root
cp .env.example .env.local  # if available, or create manually
```

```env
# .env.local
ISSUER_SECRET=S...YOUR_STELLAR_TESTNET_SECRET...
NEXT_PUBLIC_CONTRACT_ID=C...AFTER_DEPLOYMENT...
```

> **Simulation Mode:** If `ISSUER_SECRET` is not set, the app runs in simulation mode — the minting flow works end-to-end with mock responses so you can develop the UI without blockchain setup.

### 3. Run the Frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll see the animated gradient hero section and event cards.

### 4. Build & Deploy the Smart Contract

```bash
cd smartcontract

# Install WASM target (first time only)
rustup target add wasm32-unknown-unknown

# Build
bash scripts/build.sh

# Test
bash scripts/test.sh

# Deploy to testnet
export ADMIN_SECRET=S...YOUR_SECRET...
bash scripts/deploy.sh
```

See [`smartcontract/README.md`](./smartcontract/README.md) for detailed contract documentation.

---

## ⛓️ Smart Contract

The Soroban smart contract manages the full ticket lifecycle on-chain. For comprehensive documentation including all function signatures, error codes, security model, and CLI usage examples, see:

👉 **[`smartcontract/README.md`](./smartcontract/README.md)**

### Quick Reference

| Function | Description |
|----------|-------------|
| `initialize(admin)` | One-time admin setup |
| `create_event(...)` | Register event with supply cap |
| `mint_ticket(attendee, event_id)` | Mint soulbound ticket |
| `check_in(organizer, ticket_id)` | Validate at entry |
| `verify_ticket(ticket_id, owner)` | Check authenticity |
| `get_remaining_tickets(event_id)` | Query remaining supply |

### Why Soulbound?

Traditional approaches use Stellar classic asset flags (`AUTH_REQUIRED` + `AUTH_REVOCABLE`) to freeze assets after transfer. This creates a race condition window and requires the issuer's secret key on the backend. The smart contract **has no transfer function at all** — tickets are permanently bound to their original owner at the contract level.

---

## 🖥️ Frontend

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| **Home Page** | `src/app/page.tsx` | Hero section, event search/filter, event grid |
| **EventCard** | `src/components/EventCard.tsx` | Event display with mint button, Freighter signing flow |
| **WalletConnect** | `src/components/WalletConnect.tsx` | Freighter connect/disconnect with dropdown |
| **StellarContext** | `src/context/StellarContext.tsx` | Global wallet state (address, connection status) |

### Minting Flow

```
User clicks "Mint Ticket NFT"
         │
         ▼
  ┌─ Is wallet connected? ──── No ──→ Show "Connect wallet" error
  │
  Yes
  │
  ▼
  POST /api/trustline
  → Builds changeTrust XDR with issuer's asset
  → Returns unsigned XDR
         │
         ▼
  Freighter signs the trustline XDR
         │
         ▼
  POST /api/mint
  → Submits signed trustline to Horizon
  → Authorizes → Pays 1 ticket → Revokes auth (freeze)
  → Returns transaction hash
         │
         ▼
  ✅ "Ticket Minted!" — card updates with success state
```

---

## 🔌 API Routes

### `POST /api/trustline`

Builds an unsigned `changeTrust` transaction for the user to sign via Freighter.

| Parameter | Type | Description |
|-----------|------|-------------|
| `userPublicKey` | `string` | The attendee's Stellar public key |
| `assetCode` | `string` | Derived from event ID (uppercase, max 12 chars) |

**Response:** `{ xdr: string }` — The unsigned transaction XDR.

---

### `POST /api/mint`

Submits the signed trustline and mints a non-transferable ticket to the user.

| Parameter | Type | Description |
|-----------|------|-------------|
| `destinationPublicKey` | `string` | The attendee's Stellar public key |
| `assetCode` | `string` | The ticket asset code |
| `signedTrustlineXdr` | `string` | Freighter-signed trustline transaction |

**Response:** `{ success: boolean, hash: string, message: string }`

---

## 🔐 Environment Variables

| Variable | Required | Where | Description |
|----------|----------|-------|-------------|
| `ISSUER_SECRET` | No* | `.env.local` | Stellar testnet secret key for the ticket issuer account |
| `NEXT_PUBLIC_CONTRACT_ID` | No* | `.env.local` | Deployed Soroban contract ID |
| `ADMIN_SECRET` | For deploy | Shell | Admin secret for contract deployment |

> \* Both are optional for local development — the app falls back to simulation mode.

---

## 🌍 Deployment

### Frontend (Vercel)

```bash
npm run build
# Deploy via Vercel CLI or GitHub integration
```

### Smart Contract (Stellar Testnet)

```bash
cd smartcontract
export ADMIN_SECRET=S...
bash scripts/deploy.sh
```

The deploy script outputs a `CONTRACT_ID` — add it to your frontend's `.env.local` as `NEXT_PUBLIC_CONTRACT_ID`.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/ticket-scanner`)
3. Commit your changes (`git commit -m 'Add QR ticket scanner'`)
4. Push to the branch (`git push origin feature/ticket-scanner`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

**Built with ❤️ on [Stellar](https://stellar.org) · Powered by [Soroban](https://soroban.stellar.org)**

</div>
