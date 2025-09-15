import StellarSdk from "stellar-sdk";
import dotenv from "dotenv";
dotenv.config();

async function makeTransaction() {
// Initialize Horizon server for testnet
const server = new StellarSdk.Horizon.Server(
  "https://horizon-testnet.stellar.org"
);

// Initalize the source account's secret key and destination account ID.
// The source account is the one that will send the payment, and the destination account
// is the one that will receive the payment.

const sourceKeys = StellarSdk.Keypair.fromSecret(
  process.env.USER_SECRET as string
);

const destinationId: string = "GCBTWIV5Z4YDML5S2BIK6F4KPWPSDJWNQJHLPMZ672PKPA26YENI7GUZ";

// First, check to make sure that the destination account exists.
try {
  await server.loadAccount(destinationId);
} catch (error) {
  console.error("Error checking destination account:", error);
  throw error;
}

// Now we also load the source account to build the transaction.
let sourceAccount: any;
try {
  sourceAccount = await server.loadAccount(sourceKeys.publicKey());
} catch (error) {
  console.error("Error checking source account:", error);
  throw error;
}

// The next step is to parametrize and build the transaction object:
// Using the source account we just loaded we begin to assemble the transaction.
// We set the fee to the base fee, which is 100 stroops (0.00001 XLM).
// We also set the network passphrase to TESTNET.
const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
  // We then add a payment operation to the transaction oject.
  // This operation will send 5000 XLM to the destination account.
  // Obs.: Not specifying a explicit source account here means that the
  // operation will use the source account of the whole transaction, which we specified above.
  .addOperation(
    StellarSdk.Operation.payment({
      destination: destinationId,
      asset: StellarSdk.Asset.native(),
      amount: "5000",
    })
  )
  // We include an optional memo which oftentimes is used to identify the transaction
  // when working with pooled accounts or to facilitate reconciliation.
  .addMemo(StellarSdk.Memo.id("1234567890"))
  // Finally, we set a timeout for the transaction.
  // This means that the transaction will not be valid anymore after 180 seconds.
  .setTimeout(180)
  .build();


// We sign the transaction with the source account's secret key.
transaction.sign(sourceKeys);

// Now we can send the transaction to the network.
// The sendTransaction method returns a promise that resolves with the transaction result.
// The result will contain the transaction hash and other details.
try {
  const result: any = await server.submitTransaction(transaction);
  console.log("Success! Results:", result);
} catch (error) {
  console.error("Something went wrong!", error);
}
}

makeTransaction().catch(console.error);
