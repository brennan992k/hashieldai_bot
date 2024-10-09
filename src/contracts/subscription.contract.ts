import * as ethers from 'ethers';
import * as subscriptionAbi from './abi/subscription.json';
import { subscriptionAddresses } from './address/subscription';
import { CommonContract } from 'src/common/contract';
import { ChainId, Web3Address } from 'src/app.type';
import { Plan, SubscriptionData } from './type';
import { CommonLogger } from 'src/common/logger';

export class SubscriptionContract extends CommonContract {
  constructor(
    chainId: ChainId,
    runner?: ethers.ethers.ContractRunner | null | undefined,
  ) {
    super(subscriptionAddresses[chainId], subscriptionAbi, runner);
  }

  async subscribe(plan: Plan): Promise<ethers.ContractTransactionResponse> {
    const data: ethers.ContractTransactionResponse =
      await this.contract.subscribe(plan);

    CommonLogger.instance.log(`subscribe ${JSON.stringify(data)}`);

    return data;
  }

  async getSubscription(walletAddress: Web3Address): Promise<SubscriptionData> {
    if (!walletAddress) throw new Error('Param is invalid.');

    const data = await this.contract.getUserSubscription(walletAddress);

    CommonLogger.instance.log(`getSubscription ${data}`);

    return {
      plan: data[0],
      expiredTime: data[1],
    };
  }
}
