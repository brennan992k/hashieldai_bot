import { ChainId, Web3Address } from 'src/app.type';

export const hashieldAIAddresses: Record<ChainId, Web3Address> = {
  [ChainId.BinanceSmartChain]: '0x1e33E4C40B892Cc38045dCD82d522B2ed5b3Baa9',
  [ChainId.Arbitrum]: '0x430553840CCe3d06Ab93c9C68A3A17e3ab855bB5',
  [ChainId.Ethereum]: '0x430553840CCe3d06Ab93c9C68A3A17e3ab855bB5',
  [ChainId.Polygon]: '0x430553840CCe3d06Ab93c9C68A3A17e3ab855bB5',
  [ChainId.BinanceSmartChainTestNet]:
    '0x1e33E4C40B892Cc38045dCD82d522B2ed5b3Baa9',
};
