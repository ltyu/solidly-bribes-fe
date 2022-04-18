import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { WalletLinkConnector } from "@web3-react/walletlink-connector";
import { NetworkConnector } from "@web3-react/network-connector";

const POLLING_INTERVAL = 12000;
const RPC_URLS = {
  // 250: `https://rpc.ankr.com/fantom/${process.env.NEXT_PUBLIC_ANKR_KEY}`,
  250: "https://rpc.fantom.network",
  4002: "https://rpc.testnet.fantom.network",
  31337: "http://127.0.0.1:8545/",
};

let obj = {}
if(process.env.NEXT_PUBLIC_CHAINID == 250) {
  obj = { 250: RPC_URLS[250] }
} else if (process.env.NEXT_PUBLIC_CHAINID == 4002) {
  obj = { 4002: RPC_URLS[4002] }
} else {
  obj = { 31337: RPC_URLS[31337] }
}

export const network = new NetworkConnector({ urls: obj });

export const injected = new InjectedConnector({
  supportedChainIds: [parseInt(process.env.NEXT_PUBLIC_CHAINID)]
});

export const walletconnect = new WalletConnectConnector({
  rpc: {
    250: RPC_URLS[250],
    4002: RPC_URLS[4002],
    31337: RPC_URLS[31337]
  },
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAINID),
  bridge: "https://bridge.walletconnect.org",
  qrcode: true,
  pollingInterval: POLLING_INTERVAL
});

export const walletlink = new WalletLinkConnector({
  url: RPC_URLS[process.env.NEXT_PUBLIC_CHAINID],
  appName: "Solidly",
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAINID),
});
