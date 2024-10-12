import { ChainId, Web3Address } from 'src/app.type';

export const hashieldAIAddresses: Record<ChainId, Web3Address> = {
  [ChainId.BinanceSmartChain]: '0x7D54fa007bD58F4fff49aDeD96eC93CBf6055a9D',
  [ChainId.Arbitrum]: '0x7D54fa007bD58F4fff49aDeD96eC93CBf6055a9D',
  [ChainId.Ethereum]: '0x7D54fa007bD58F4fff49aDeD96eC93CBf6055a9D',
  [ChainId.Polygon]: '0x7D54fa007bD58F4fff49aDeD96eC93CBf6055a9D',
  [ChainId.BinanceSmartChainTestNet]:
    '0x1e33E4C40B892Cc38045dCD82d522B2ed5b3Baa9',
};
