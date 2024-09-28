import { CommonLogger } from 'src/common/logger';
import { BaseRepository } from './base.repository';
import { ChainId, Token, Web3Address } from 'src/app.type';

export class OneInchRepository extends BaseRepository {
  private static _instance: OneInchRepository;

  public static get instance(): OneInchRepository {
    if (!OneInchRepository._instance) {
      OneInchRepository._instance = new OneInchRepository();
    }
    return OneInchRepository._instance;
  }

  constructor() {
    super('https://1inch.io/');
  }

  public async getTokens(chainId: ChainId): Promise<Record<string, Token>> {
    if (chainId == ChainId.BinanceSmartChainTestNet) {
      return {
        '0xFa60D973F7642B748046464e165A65B7323b0DEE': {
          name: 'PancakeSwap',
          symbol: 'Cake',
          address: '0xFa60D973F7642B748046464e165A65B7323b0DEE',
          logoURI:
            'https://testnet.bscscan.com/assets/bsc/images/svg/empty-token.svg?v=24.6.4.0',
          decimals: 18,
        },
      };
    }

    try {
      this.setConfig({ baseURL: 'https://tokens.1inch.io' });
      const response: Record<string, Token> = await this.get(
        `/v1.2/${chainId}`,
      );

      if (!response) {
        throw new Error('Can not get tokens.');
      }

      CommonLogger.instance.log(
        `getTokens response ${JSON.stringify(response)}`,
      );

      return response;
    } catch (error) {
      CommonLogger.instance.error(`getTokens error ${error?.message}`);
      throw error;
    }
  }

  public async getToken(
    chainId: ChainId,
    tokenAddress: string,
  ): Promise<Token> {
    try {
      this.setConfig({ baseURL: 'https://tokens.1inch.io' });
      const response: Token = await this.get(
        `/v1.1/${chainId}/${tokenAddress}`,
      );

      if (!response) {
        throw new Error('Can not get token.');
      }

      CommonLogger.instance.log(
        `getToken response ${JSON.stringify(response)}`,
      );

      return response;
    } catch (error) {
      CommonLogger.instance.error(`getToken error ${error?.message}`);
      throw error;
    }
  }

  public async customToken(
    chainId: ChainId,
    tokenAddress: string,
  ): Promise<Token> {
    try {
      this.setConfig({ baseURL: 'https://tokens.1inch.io' });
      const response: Token = await this.get(
        `/v1.2/${chainId}/custom/${tokenAddress}`,
      );

      if (!response) {
        throw new Error('Not found');
      }

      CommonLogger.instance.log(
        `customToken response ${JSON.stringify(response)}`,
      );

      return response;
    } catch (error) {
      CommonLogger.instance.error(`customToken error ${error?.message}`);
      throw error;
    }
  }

  public async getTokenPrices(
    chainId: ChainId,
    currency?: string,
  ): Promise<Record<Web3Address, string>> {
    try {
      if (chainId == 97) {
        chainId = 56;
      }
      this.setConfig({ baseURL: 'https://token-prices.1inch.io' });
      let path = `/v1.1/${chainId}`;
      if (currency) {
        path += `?currency=${currency}`;
      }

      const response: Record<Web3Address, string> = await this.get(path);

      if (!response) {
        throw new Error('Can not get token prices.');
      }

      CommonLogger.instance.log(
        `getTokenPrices response ${JSON.stringify(response)}`,
      );

      return response;
    } catch (error) {
      CommonLogger.instance.error(`getTokenPrices error ${error?.message}`);
      throw error;
    }
  }

  public async getTokenPrice(
    chainId: ChainId,
    tokenAddress: Web3Address,
    currency?: string,
  ): Promise<Record<Web3Address, string>> {
    try {
      this.setConfig({ baseURL: 'https://token-prices.1inch.io' });
      let path = `/v1.1/${chainId}/${tokenAddress}`;
      if (currency) {
        path += `?currency=${currency}`;
      }

      const response: Record<Web3Address, string> = await this.get(path);

      if (!response) {
        throw new Error('Can not get token price.');
      }

      CommonLogger.instance.log(
        `getTokenPrice response ${JSON.stringify(response)}`,
      );

      return response;
    } catch (error) {
      CommonLogger.instance.error(`getTokenPrice error ${error?.message}`);
      throw error;
    }
  }
}
