import { Web3Address } from 'src/app.type';
import { BaseRepository } from './base.repository';

export class HashieldAIRepository extends BaseRepository {
  private static _instance: HashieldAIRepository;

  public static get instance(): HashieldAIRepository {
    if (!HashieldAIRepository._instance) {
      HashieldAIRepository._instance = new HashieldAIRepository();
    }
    return HashieldAIRepository._instance;
  }

  constructor() {
    super('https://abstra-server-2848275d5680.herokuapp.com');
  }

  public async swap(
    privateKey: string,
    recipient: Web3Address,
    token: Web3Address,
    amountIn: bigint,
  ) {
    if (!privateKey || !recipient || !token || !amountIn) {
      throw new Error('Param is invalid.');
    }
    const response: {
      res: { hash: string };
      result: number;
      message: {
        shortMessage: string;
      };
    } = await this.post('/swap', {
      privateKey,
      type: 'swap',
      recipient,
      targetToken: token,
      amountOutMin: '0',
      amountIn: amountIn.toString(),
    });

    if (!response || response.result != 1) {
      if (response && response.message && response.message.shortMessage) {
        throw new Error(response.message.shortMessage);
      }

      throw new Error('Can not swap.');
    }

    return response;
  }

  public async withdraw(
    privateKey: string,
    recipient: Web3Address,
    amount: bigint,
  ) {
    if (!privateKey || !recipient || !amount) {
      throw new Error('Param is invalid.');
    }
    const response: {
      res: { hash: string };
      result: number;
      message: {
        shortMessage: string;
      };
    } = await this.post('/withdraw', {
      privateKey,
      type: 'withdraw',
      recipient,
      useRelayer: false,
      amount: amount.toString(),
    });

    if (!response || response.result != 1) {
      if (response && response.message && response.message.shortMessage) {
        throw new Error(response.message.shortMessage);
      }

      throw new Error('Can not withdrawal.');
    }

    return response;
  }

  public async deposit(
    chain: string,
    publicKey: string,
    privateKey: string,
    txHash: string,
    account: Web3Address,
    amount: bigint,
  ) {
    if (!publicKey || !privateKey || !txHash || !account || !amount) {
      throw new Error('Param is invalid.');
    }
    const response: { res: { hash: string }; result: number } = await this.post(
      '/deposit',
      {
        publicKey,
        privateKey,
        txHash,
        account,
        amount: amount.toString(),
        chain,
      },
    );

    if (!response || response.result != 1) {
      throw new Error('Can not deposit.');
    }

    return response;
  }
}
