import { ChainId, Web3Address } from 'src/app.type';

export const hashieldAIAddresses: Record<ChainId, Web3Address> = {
  [ChainId.BinanceSmartChain]: '0x1e33E4C40B892Cc38045dCD82d522B2ed5b3Baa9',
  [ChainId.Arbitrum]: '0x1e33E4C40B892Cc38045dCD82d522B2ed5b3Baa9',
  [ChainId.Ethereum]: '0x1e33E4C40B892Cc38045dCD82d522B2ed5b3Baa9',
  [ChainId.Polygon]: '0x1e33E4C40B892Cc38045dCD82d522B2ed5b3Baa9',
  [ChainId.BinanceSmartChainTestNet]:
    '0x1e33E4C40B892Cc38045dCD82d522B2ed5b3Baa9',
};
