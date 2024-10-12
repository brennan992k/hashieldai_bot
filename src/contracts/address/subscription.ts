import { ChainId, Web3Address } from 'src/app.type';

export const subscriptionAddresses: Record<ChainId, Web3Address> = {
  [ChainId.BinanceSmartChain]: '0xA464a361037DEDbaED363CcFAa6ec26cA928Db0c',
  [ChainId.Arbitrum]: '0xA464a361037DEDbaED363CcFAa6ec26cA928Db0c',
  [ChainId.Ethereum]: '0xA464a361037DEDbaED363CcFAa6ec26cA928Db0c',
  [ChainId.Polygon]: '0xA464a361037DEDbaED363CcFAa6ec26cA928Db0c',
  [ChainId.BinanceSmartChainTestNet]:
    '0x1B06453e00Ee1ebE8c63B23596ebbE1006D0Ea50',
};
