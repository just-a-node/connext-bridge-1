import { create, NxtpSdkConfig } from "@connext/nxtp-sdk";
import { ethers } from "ethers";

// Instantiate a Wallet object using your private key (i.e. from Metamask) and use it as a Signer.
const privateKey = "PRIVATE_KEY";
let signer = new ethers.Wallet(privateKey);

// Connext to a Provider on the sending chain. You can use a provider like Infura (https://infura.io/) or Alchemy (https://www.alchemy.com/).
const provider = new ethers.providers.JsonRpcProvider("https://goerli.infura.io/v3/19d34e1e01f849b482a6586994f60293");
signer = signer.connect(provider);
const signerAddress = await signer.getAddress();

// Construct the `NxtpSdkConfig`. Values like Domain IDs and token addresses are already filled in for you. You can reference these in the "Resources" tab of the docs. 
const nxtpConfig: NxtpSdkConfig = {
    logLevel: "info",
    signerAddress: signerAddress,
    chains: {
        "1735353714": {
            providers: ["https://goerli.infura.io/v3/19d34e1e01f849b482a6586994f60293"],
            assets: [
                {
                    name: "TEST",
                    symbol: "TEST",
                    address: "0x7ea6eA49B0b0Ae9c5db7907d139D9Cd3439862a1",
                },
            ],
        },
        "9991": {
            providers: ["https://rpc-mumbai.matic.today"],
            assets: [
                {
                    name: "TEST",
                    symbol: "TEST",
                    address: "0xeDb95D8037f769B72AAab41deeC92903A98C9E16",
                },
            ],
        },
    },
};

// Create the SDK instance.
const { nxtpSdkBase } = await create(nxtpConfig);

// Address of the TEST token
const asset = "0x7ea6eA49B0b0Ae9c5db7907d139D9Cd3439862a1"

// Send 1 TEST
const amount = "1000000000000000000";

// Prepare the xcall params
const xcallParams = {
    origin: "1735353714",    // send from Goerli
    destination: "9991",     // to Mumbai
    to: signerAddress,       // the address that should receive the funds on destination
    asset: asset,            // address of the token contract
    delegate: signerAddress, // address allowed to execute transaction on destination side in addition to relayers
    amount: amount,          // amount of tokens to transfer
    slippage: "30",          // the maximum amount of slippage the user will accept in BPS, 0.3% in this case
    callData: "0x",          // empty calldata for a simple transfer
    relayerFee: "0",         // fee paid to relayers; relayers don't take any fees on testnet
};

// Approve the asset transfer. This is necessary because funds will first be sent to the Connext contract before being bridged.
const approveTxReq = await nxtpSdkBase.approveIfNeeded(
    xcallParams.origin,
    xcallParams.asset,
    xcallParams.amount
)
const approveTxReceipt = await signer.sendTransaction(approveTxReq);
await approveTxReceipt.wait();

// Send the xcall
const xcallTxReq = await nxtpSdkBase.xcall(xcallParams);
xcallTxReq.gasLimit = ethers.BigNumber.from("20000000");
const xcallTxReceipt = await signer.sendTransaction(xcallTxReq);
console.log(xcallTxReceipt);
const xcallResult = await xcallTxReceipt.wait();