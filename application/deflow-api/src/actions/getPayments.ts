import StellarSdk from "stellar-sdk";

const server = new StellarSdk.Horizon.Server(
  "https://horizon-testnet.stellar.org",
);
const accountId: string = "GCBTWIV5Z4YDML5S2BIK6F4KPWPSDJWNQJHLPMZ672PKPA26YENI7GUZ";

// Create an API call to query payments involving the account.
const payments = server.payments().forAccount(accountId);

// If some payments have already been handled, start the results from the
// last seen payment.
const lastToken = loadLastPagingToken();
if (lastToken) {
  payments.cursor(lastToken);
}

// Call the payments to get historical records
payments.call()
  .then((recordsPage) => {
    recordsPage.records.forEach((payment: any) => {
      // Record the paging token so we can start from here next time.
      savePagingToken(payment.paging_token);

      // Determine if this is a payment sent or received by the account
      let paymentType: string;
      if (payment.to === accountId) {
        paymentType = "received";
      } else if (payment.from === accountId) {
        paymentType = "sent";
      } else {
        // This payment doesn't involve our account directly
        return;
      }

      // In Stellar's API, Lumens are referred to as the "native" type. Other
      // asset types have more detailed information.
      let asset: string;
      if (payment.asset_type === "native") {
        asset = "lumens";
      } else {
        asset = payment.asset_code + ":" + payment.asset_issuer;
      }

      if (paymentType === "received") {
        console.log("RECEIVED: " + payment.amount + " " + asset + " from " + payment.from);
      } else {
        console.log("SENT: " + payment.amount + " " + asset + " to " + payment.to);
      }
    });
  })
  .catch((error: Error) => {
    console.error("Error fetching payments:", error);
  });

function savePagingToken(token: string): void {
  // In most cases, you should save this to a local database or file so that
  // you can load it next time you stream new payments.
}

function loadLastPagingToken(): string | undefined {
  // Get the last paging token from a local database or file
  return undefined;
}
