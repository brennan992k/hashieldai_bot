import { ChainId, Web3Address } from 'src/app.type';

export const subscriptionAddresses: Record<ChainId, Web3Address> = {
  [ChainId.BinanceSmartChain]: '0x1B06453e00Ee1ebE8c63B23596ebbE1006D0Ea50',
  [ChainId.Arbitrum]: '0x1B06453e00Ee1ebE8c63B23596ebbE1006D0Ea50',
  [ChainId.Ethereum]: '0x1B06453e00Ee1ebE8c63B23596ebbE1006D0Ea50',
  [ChainId.Polygon]: '0x1B06453e00Ee1ebE8c63B23596ebbE1006D0Ea50',
  [ChainId.BinanceSmartChainTestNet]:
    '0x1B06453e00Ee1ebE8c63B23596ebbE1006D0Ea50',
};
