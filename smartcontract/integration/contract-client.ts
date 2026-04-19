/**
 * ============================================================================
 * NFT Ticket Smart Contract — Frontend Integration Client
 * ============================================================================
 *
 * This module provides a TypeScript client that wraps the deployed Soroban
 * smart contract for use in the Next.js frontend. It replaces the raw
 * Stellar classic operations in `src/utils/stellar.ts` with secure,
 * contract-based transaction flows.
 *
 * Usage:
 *   import { createEvent, mintTicket, getEvent } from './contract-client';
 *
 * Prerequisites:
 *   - NEXT_PUBLIC_CONTRACT_ID set in .env.local
 *   - @stellar/stellar-sdk installed
 *   - Freighter wallet extension for signing
 * ============================================================================
 */

import {
  Contract,
  Server,
  TransactionBuilder,
  Networks,
  xdr,
  Address,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org:443";
const NETWORK_PASSPHRASE = Networks.TESTNET;
const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || "";

const server = new Server(SOROBAN_RPC_URL);
const contract = new Contract(CONTRACT_ID);

// ---------------------------------------------------------------------------
// Helper: Build, Simulate, Sign, and Submit a Transaction
// ---------------------------------------------------------------------------

async function invokeContract(
  sourcePublicKey: string,
  method: string,
  args: xdr.ScVal[]
): Promise<any> {
  // 1. Load user account from Soroban RPC
  const account = await server.getAccount(sourcePublicKey);

  // 2. Build the transaction with the contract invocation
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  // 3. Simulate to get resource estimation
  const simulated = await server.simulateTransaction(tx);
  if ("error" in simulated) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  // 4. Assemble the transaction with the simulation results
  const assembled = TransactionBuilder.cloneFrom(tx)
    .setSorobanData(simulated.transactionData.build())
    .build();

  // 5. Have the user sign with Freighter
  const signedXdr = await signTransaction(assembled.toXDR(), {
    network: "TESTNET",
  });

  // 6. Parse the signed transaction and submit
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const result = await server.sendTransaction(signedTx);

  // 7. Wait for confirmation
  if (result.status === "PENDING") {
    let getResult = await server.getTransaction(result.hash);
    while (getResult.status === "NOT_FOUND") {
      await new Promise((r) => setTimeout(r, 1000));
      getResult = await server.getTransaction(result.hash);
    }
    return getResult;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Helper: Read-only contract call (no signing required)
// ---------------------------------------------------------------------------

async function queryContract(
  method: string,
  args: xdr.ScVal[]
): Promise<any> {
  // Use a dummy source for read-only calls
  const dummySource =
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

  try {
    const account = await server.getAccount(dummySource);
    const tx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    const simulated = await server.simulateTransaction(tx);
    if ("error" in simulated) {
      throw new Error(`Query failed: ${simulated.error}`);
    }

    return simulated.result?.retval
      ? scValToNative(simulated.result.retval)
      : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API: Event Management
// ---------------------------------------------------------------------------

/**
 * Creates a new event on-chain.
 * Maps to the `create_event` contract function.
 */
export async function createEvent(
  organizerPublicKey: string,
  eventId: string,
  title: string,
  date: string,
  location: string,
  category: string,
  priceStroops: bigint,
  currency: string,
  maxSupply: number
) {
  return invokeContract(organizerPublicKey, "create_event", [
    new Address(organizerPublicKey).toScVal(),
    nativeToScVal(eventId, { type: "string" }),
    nativeToScVal(title, { type: "string" }),
    nativeToScVal(date, { type: "string" }),
    nativeToScVal(location, { type: "string" }),
    nativeToScVal(category, { type: "string" }),
    nativeToScVal(priceStroops, { type: "u64" }),
    nativeToScVal(currency, { type: "string" }),
    nativeToScVal(maxSupply, { type: "u32" }),
  ]);
}

/**
 * Deactivates an event, preventing further ticket sales.
 */
export async function deactivateEvent(
  organizerPublicKey: string,
  eventId: string
) {
  return invokeContract(organizerPublicKey, "deactivate_event", [
    new Address(organizerPublicKey).toScVal(),
    nativeToScVal(eventId, { type: "string" }),
  ]);
}

// ---------------------------------------------------------------------------
// Public API: Ticket Minting (Soulbound / Non-Transferable)
// ---------------------------------------------------------------------------

/**
 * Mints a soulbound NFT ticket to the attendee's wallet.
 *
 * This replaces the trustline + payment + freeze flow in `stellar.ts`:
 *   - No more changeTrust operation from the user
 *   - No more AUTH_REQUIRED/AUTH_REVOCABLE flag gymnastics
 *   - Non-transferability is enforced at the contract level
 *
 * @returns The unique ticket ID
 */
export async function mintTicket(
  attendeePublicKey: string,
  eventId: string
): Promise<number> {
  const result = await invokeContract(attendeePublicKey, "mint_ticket", [
    new Address(attendeePublicKey).toScVal(),
    nativeToScVal(eventId, { type: "string" }),
  ]);

  return result?.returnValue ? scValToNative(result.returnValue) : 0;
}

// ---------------------------------------------------------------------------
// Public API: Ticket Validation & Check-In
// ---------------------------------------------------------------------------

/**
 * Validates and checks in a ticket at the event entrance.
 * Only the event organizer can call this.
 */
export async function checkInTicket(
  organizerPublicKey: string,
  ticketId: number
) {
  return invokeContract(organizerPublicKey, "check_in", [
    new Address(organizerPublicKey).toScVal(),
    nativeToScVal(ticketId, { type: "u64" }),
  ]);
}

// ---------------------------------------------------------------------------
// Public API: Read-Only Queries
// ---------------------------------------------------------------------------

/**
 * Gets event details from the contract.
 */
export async function getEvent(eventId: string) {
  return queryContract("get_event", [
    nativeToScVal(eventId, { type: "string" }),
  ]);
}

/**
 * Gets ticket details from the contract.
 */
export async function getTicket(ticketId: number) {
  return queryContract("get_ticket", [
    nativeToScVal(ticketId, { type: "u64" }),
  ]);
}

/**
 * Gets remaining ticket count for an event.
 */
export async function getRemainingTickets(eventId: string): Promise<number> {
  const result = await queryContract("get_remaining_tickets", [
    nativeToScVal(eventId, { type: "string" }),
  ]);
  return result ?? 0;
}

/**
 * Checks if a user owns a ticket for a specific event.
 * Returns the ticket ID if found, null otherwise.
 */
export async function getUserTicket(
  eventId: string,
  userPublicKey: string
): Promise<number | null> {
  return queryContract("get_user_ticket", [
    nativeToScVal(eventId, { type: "string" }),
    new Address(userPublicKey).toScVal(),
  ]);
}

/**
 * Verifies if a ticket is valid (exists, owned, and unused).
 */
export async function verifyTicket(
  ticketId: number,
  ownerPublicKey: string
): Promise<boolean> {
  const result = await queryContract("verify_ticket", [
    nativeToScVal(ticketId, { type: "u64" }),
    new Address(ownerPublicKey).toScVal(),
  ]);
  return result ?? false;
}
