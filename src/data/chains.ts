import { ethers } from 'ethers';
import * as eTokens from './tokens/1.json';
import * as bTokens from './tokens/56.json';
import * as aTokens from './tokens/42161.json';
import * as pTokens from './tokens/137.json';
import { ChainId, ChainData, Token, Web3Address } from 'src/app.type';

export const chains: { [chain in ChainId]: ChainData } = {
  [ChainId.Ethereum]: {
    name: 'Ethereum',
    rpc: 'https://eth.llamarpc.com',
    hasExplorer: true,
    explorer: {
      name: 'EtherScan',
      root: 'https://etherscan.io/',
      address: 'address/',
      tx: 'tx/',
      token: 'token/',
    },
    chart: 'https://www.geckoterminal.com/eth/pools',
    rpcProvider: new ethers.JsonRpcProvider('https://eth.llamarpc.com'),
    logo: '',
    chainId: ChainId.Ethereum,
    native: {
      symbol: 'ETH',
      name: 'Ether',
      decimals: 18,
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      logoURI:
        'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
      tags: ['native', 'PEG:ETH'],
    },
    wrap: {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      decimals: 18,
      logoURI:
        'https://tokens.1inch.io/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png',
      tags: ['tokens', 'PEG:ETH'],
    },
    tokens: eTokens as Record<Web3Address, Token>,
  },

  [ChainId.BinanceSmartChain]: {
    name: 'Binance Smart Chain',
    rpc: 'https://bsc-dataseed4.bnbchain.org',
    hasExplorer: true,
    explorer: {
      name: 'BscScan',
      root: 'https://bscscan.com/',
      address: 'address/',
      tx: 'tx/',
      token: 'token/',
    },
    chart: 'https://www.geckoterminal.com/bsc/pools/',
    rpcProvider: new ethers.JsonRpcProvider(
      'https://bsc-dataseed.binance.org/',
    ),
    logo: '',
    chainId: ChainId.BinanceSmartChain,
    native: {
      symbol: 'BNB',
      name: 'BNB',
      decimals: 18,
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      logoURI:
        'https://tokens.1inch.io/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png',
      tags: ['native'],
    },
    wrap: {
      symbol: 'WBNB',
      name: 'Wrapped BNB',
      decimals: 18,
      address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
      logoURI:
        'https://tokens.1inch.io/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png',
      tags: ['tokens', 'PEG:BNB'],
    },
    tokens: bTokens as Record<Web3Address, Token>,
  },

  [ChainId.BinanceSmartChainTestNet]: {
    name: 'Binance Smart Chain Test Net',
    rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    hasExplorer: true,
    explorer: {
      name: 'BscScan',
      root: 'https://testnet.bscscan.com/',
      address: 'address/',
      tx: 'tx/',
      token: 'token/',
    },
    chart: 'https://www.geckoterminal.com/bsc/pools/',
    rpcProvider: new ethers.JsonRpcProvider(
      'https://data-seed-prebsc-1-s1.binance.org:8545/',
    ),
    logo: '',
    chainId: ChainId.BinanceSmartChainTestNet,
    native: {
      symbol: 'tBNB',
      name: 'tBNB',
      decimals: 18,
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      logoURI:
        'https://tokens.1inch.io/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png',
      tags: ['native'],
    },
    wrap: {
      symbol: 'tWBNB',
      name: 'Wrapped tBNB',
      decimals: 18,
      address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
      logoURI:
        'https://tokens.1inch.io/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png',
      tags: ['tokens', 'PEG:tBNB'],
    },
    tokens: bTokens as Record<Web3Address, Token>,
  },

  [ChainId.Arbitrum]: {
    name: 'Arbitrum',
    rpc: 'https://arb1.arbitrum.io/rpc/',
    hasExplorer: true,
    explorer: {
      name: 'ArbiScan',
      root: 'https://arbiscan.io/',
      address: 'address/',
      tx: 'tx/',
      token: 'token/',
    },
    chart: 'https://www.geckoterminal.com/arbitrum/pools/',
    rpcProvider: new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc/'),
    logo: '',
    chainId: ChainId.Arbitrum,
    native: {
      symbol: 'ETH',
      name: 'Ether',
      decimals: 18,
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      logoURI:
        'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
      tags: ['native'],
    },
    wrap: {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
      logoURI:
        'https://tokens.1inch.io/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png',
      tags: ['tokens', 'PEG:ETH'],
    },
    tokens: aTokens as Record<Web3Address, Token>,
  },

  [ChainId.Polygon]: {
    name: 'Polygon',
    rpc: 'https://polygon-rpc.com/',
    hasExplorer: true,
    explorer: {
      name: 'PolygonScan',
      root: 'https://polygonscan.com/',
      address: 'address/',
      tx: 'tx/',
      token: 'token/',
    },
    chart: 'https://www.geckoterminal.com/polygon_pos/pools/',
    rpcProvider: new ethers.JsonRpcProvider('https://polygon-rpc.com/'),
    logo: '',
    chainId: ChainId.Polygon,
    native: {
      symbol: 'MATIC',
      name: 'MATIC',
      decimals: 18,
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      logoURI:
        'https://tokens.1inch.io/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png',
      tags: ['native'],
    },
    wrap: {
      symbol: 'WMATIC',
      name: 'Wrapped Matic',
      decimals: 18,
      address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
      logoURI:
        'https://tokens.1inch.io/0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270.png',
      tags: ['tokens'],
    },
    tokens: pTokens as Record<Web3Address, Token>,
  },
};
