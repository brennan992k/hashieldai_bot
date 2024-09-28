import { CommonLogger } from 'src/common/logger';
import { BaseRepository } from './base.repository';
import { Web3Address } from 'src/app.type';

export class CoinBaseRepository extends BaseRepository {
  private static _instance: CoinBaseRepository;

  public static get instance(): CoinBaseRepository {
    if (!CoinBaseRepository._instance) {
      CoinBaseRepository._instance = new CoinBaseRepository();
    }
    return CoinBaseRepository._instance;
  }

  constructor() {
    super('https://api.coinbase.com/v2/');
  }

  async getTokenRatesOf(
    currency: string,
  ): Promise<Record<Web3Address, number>> {
    try {
      const response: { data: { rates: Record<Web3Address, number> } } =
        await this.get(`exchange-rates?currency=${currency}`);
      if (!response.data || !response.data.rates) {
        throw new Error('Can not get token rates.');
      }

      CommonLogger.instance.log(
        `getTokenRatesOf response ${JSON.stringify(response)}`,
      );

      return response.data.rates;
    } catch (error) {
      CommonLogger.instance.error(`getTokenRatesOf error ${error?.message}`);
      throw error;
    }
  }
}
