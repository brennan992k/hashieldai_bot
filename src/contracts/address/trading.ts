import { ChainId, Web3Address } from 'src/app.type';

export const tradingAddresses: Record<ChainId, Web3Address> = {
  [ChainId.BinanceSmartChain]: '0x719B5819B65734fFb68908CDc9ba0a64b966023c',
  [ChainId.Arbitrum]: '0x501A5B3e711123B7F53Bf40b64a3ec888aBd74e2',
  [ChainId.Ethereum]: '0x501A5B3e711123B7F53Bf40b64a3ec888aBd74e2',
  [ChainId.Polygon]: '0x501A5B3e711123B7F53Bf40b64a3ec888aBd74e2',
  [ChainId.BinanceSmartChainTestNet]:
    '0x719B5819B65734fFb68908CDc9ba0a64b966023c',
};
