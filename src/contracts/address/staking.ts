import { ChainId, Web3Address } from 'src/app.type';

export const stakingAddresses: Record<ChainId, Web3Address> = {
  [ChainId.BinanceSmartChain]: '0x3025D402BC3e3068F6b7aFBf3aF9402cE5e72BBb',
  [ChainId.Arbitrum]: '0x6Ad370a60C8DDB9022fbb884E7660FB0142B1D29',
  [ChainId.Ethereum]: '0x6Ad370a60C8DDB9022fbb884E7660FB0142B1D29',
  [ChainId.Polygon]: '0x6Ad370a60C8DDB9022fbb884E7660FB0142B1D29',
  [ChainId.BinanceSmartChainTestNet]:
    '0x3025D402BC3e3068F6b7aFBf3aF9402cE5e72BBb',
};
