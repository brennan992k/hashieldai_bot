import { ChainId, Token } from 'src/app.type';
import { hashieldAIAddresses } from 'src/contracts/address/hashield-ai';

export const FRACTION_DIGITS = 4;

export const NATIVE_TOKEN_ADDRESS =
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

export const HASHIELD_AI_TOKENS: Record<ChainId, Token> = {
  [ChainId.Ethereum]: {
    address: hashieldAIAddresses[ChainId.Ethereum],
    decimals: 18,
    logoURI: '',
    symbol: 'HASHIELDAI',
    name: 'HashieldAI',
  },
  [ChainId.BinanceSmartChainTestNet]: {
    address: hashieldAIAddresses[ChainId.BinanceSmartChainTestNet],
    decimals: 18,
    logoURI: '',
    symbol: 'HASHIELDAI',
    name: 'HashieldAI',
  },
  [ChainId.BinanceSmartChain]: {
    address: hashieldAIAddresses[ChainId.BinanceSmartChain],
    decimals: 18,
    logoURI: '',
    symbol: 'HASHIELDAI',
    name: 'HashieldAI',
  },
  [ChainId.Polygon]: {
    address: hashieldAIAddresses[ChainId.Polygon],
    decimals: 18,
    logoURI: '',
    symbol: 'HASHIELDAI',
    name: 'HashieldAI',
  },
  [ChainId.Arbitrum]: {
    address: hashieldAIAddresses[ChainId.Arbitrum],
    decimals: 18,
    logoURI: '',
    symbol: 'HASHIELDAI',
    name: 'HashieldAI',
  },
};
