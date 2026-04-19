import { NextResponse } from 'next/server';
import { Server, TransactionBuilder, Networks, Operation, Asset, Keypair } from '@stellar/stellar-sdk';

const server = new Server('https://horizon-testnet.stellar.org');

export async function POST(req: Request) {
  try {
    const { userPublicKey, assetCode } = await req.json();

    if (!userPublicKey || !assetCode) {
      return NextResponse.json({ error: 'Missing requirements' }, { status: 400 });
    }

    const ISSUER_SECRET = process.env.ISSUER_SECRET;

    if (!ISSUER_SECRET) {
      // Mock mode: If there is no secret key, we bypass building a real transaction
      // and return a simulated XDR string so the frontend can mock the flow.
      console.warn("ISSUER_SECRET not found. Building simulated XDR string.");
      return NextResponse.json({ xdr: 'simulated_xdr_transaction' }, { status: 200 });
    }

    const issuerKeyPair = Keypair.fromSecret(ISSUER_SECRET);
    const asset = new Asset(assetCode, issuerKeyPair.publicKey());
    
    // Load sequence number from Horizon to build the transaction where the USER is the source
    const userAccount = await server.loadAccount(userPublicKey);
    
    const transaction = new TransactionBuilder(userAccount, { 
      fee: '100', 
      networkPassphrase: Networks.TESTNET 
    })
    .addOperation(Operation.changeTrust({
        asset: asset,
        limit: '1' // Only allowing 1 ticket per trustline for control
    }))
    .setTimeout(60)
    .build();
        
    return NextResponse.json({ xdr: transaction.toXDR() }, { status: 200 });

  } catch (error: any) {
    console.error("Error building trustline:", error);
    return NextResponse.json({ error: 'Failed to construct trustline XDR on horizon server' }, { status: 500 });
  }
}
