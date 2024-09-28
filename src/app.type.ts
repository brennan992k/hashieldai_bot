import { ethers } from 'ethers';

export enum ChainId {
  Ethereum = 1,
  BinanceSmartChain = 56,
  BinanceSmartChainTestNet = 97,
  Arbitrum = 42161,
  Polygon = 137,
}

export type Web3Address = `0x${string}`;

export type Token = {
  address: Web3Address;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  eip2612?: boolean;
  tags?: Array<string>;
  providers?: Array<string>;
};

export interface ChainData {
  name: string;
  rpc: string;
  hasExplorer: boolean;
  explorer: {
    name: string;
    root: string;
    address: string;
    tx: string;
    token: string;
  };
  chart: string;
  rpcProvider: ethers.JsonRpcProvider;
  logo: string;
  chainId: ChainId;
  native: Token;
  wrap: Token;
  tokens: { [address: Web3Address]: Token };
}
