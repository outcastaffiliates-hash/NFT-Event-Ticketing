import { Server, Keypair, Asset, TransactionBuilder, Networks, Operation } from '@stellar/stellar-sdk';
import { signTransaction, setAllowed } from '@stellar/freighter-api';

const server = new Server('https://horizon-testnet.stellar.org');
const networkPassphrase = Networks.TESTNET;

export const connectWallet = async () => {
  try {
    await setAllowed();
    const isAllowed = await setAllowed();
    if (isAllowed) {
      // Connect to Freighter logic will be triggered in the component via other API calls.
      return true;
    }
    return false;
  } catch (error) {
    console.error('Wallet connection failed:', error);
    return false;
  }
};

export const createEventTicketAsset = (eventName: string, issuerPublicKey: string) => {
  // Using event name as the asset code (max 12 characters usually for standard usage, but let's keep it simple)
  // For Stellar, typically asset codes are 4-12 alphanumeric characters.
  const assetCode = eventName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 12).toUpperCase();
  return new Asset(assetCode, issuerPublicKey);
};

export const getAccountBalances = async (publicKey: string) => {
  try {
    const account = await server.loadAccount(publicKey);
    return account.balances;
  } catch (error) {
    console.error('Failed to load balances:', error);
    return [];
  }
};

export const configureIssuerAccount = async (issuerSecret: string) => {
    // Setup Issuer with AUTH_REQUIRED and AUTH_REVOCABLE flags to allow making assets non-transferable
    const issuerKeyPair = Keypair.fromSecret(issuerSecret);
    const issuerAccount = await server.loadAccount(issuerKeyPair.publicKey());

    const transaction = new TransactionBuilder(issuerAccount, { fee: '100', networkPassphrase })
        .addOperation(Operation.setOptions({
            setFlags: 3 // Set AUTH_REQUIRED_FLAG (1) | AUTH_REVOCABLE_FLAG (2)
        }))
        .setTimeout(30)
        .build();

    transaction.sign(issuerKeyPair);
    return await server.submitTransaction(transaction);
};

export const mintNonTransferableTicket = async (
    issuerSecret: string, 
    userPublicKey: string, 
    assetCode: string
) => {
    const issuerKeyPair = Keypair.fromSecret(issuerSecret);
    const ticketAsset = new Asset(assetCode, issuerKeyPair.publicKey());
    
    const issuerAccount = await server.loadAccount(issuerKeyPair.publicKey());

    // Minting transaction:
    // 1. Authorize the user's trustline for the ticket 
    // 2. Send the ticket to the user 
    // 3. Revoke the user's authorization (making it non-transferable)

    const transaction = new TransactionBuilder(issuerAccount, { fee: '100', networkPassphrase })
        .addOperation(Operation.setTrustLineFlags({
            trustor: userPublicKey,
            asset: ticketAsset,
            flags: {
                authorized: true, // Authorize to receive
            }
        }))
        .addOperation(Operation.payment({
            destination: userPublicKey,
            asset: ticketAsset,
            amount: '1', // 1 Ticket
        }))
        .addOperation(Operation.setTrustLineFlags({
            trustor: userPublicKey,
            asset: ticketAsset,
            flags: {
                authorized: false, // Revoke authorization to freeze the asset in the user's account
            }
        }))
        .setTimeout(30)
        .build();

    transaction.sign(issuerKeyPair);
    return await server.submitTransaction(transaction);
};
