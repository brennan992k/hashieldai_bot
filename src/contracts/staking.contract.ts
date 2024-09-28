import * as ethers from 'ethers';
import * as stakingAbi from './abi/staking.json';
import { CommonContract } from 'src/common/contract';
import { CommonLogger } from 'src/common/logger';
import { ChainId, Web3Address } from 'src/app.type';
import { stakingAddresses } from './address/staking';
import { StakingData } from './type';

export class StakingContract extends CommonContract {
  constructor(
    chainId: ChainId,
    runner: ethers.ethers.ContractRunner | null | undefined,
  ) {
    super(stakingAddresses[chainId], stakingAbi, runner);
  }

  async claimETHReward() {
    const data = await this.contract.claimETHReward();
    CommonLogger.instance.log(`claimETHReward ${JSON.stringify(data)}`);
    return data;
  }

  async claimStuckTokens(
    tokenAddress: Web3Address,
  ): Promise<string | undefined> {
    const data = await this.contract.claimStuckTokens(tokenAddress);
    CommonLogger.instance.log(`claimStuckTokens ${JSON.stringify(data)}`);
    return data;
  }

  async claimTokenReward(): Promise<string | undefined> {
    const data = await this.contract.claimTokenReward();
    CommonLogger.instance.log(`claimTokenReward ${JSON.stringify(data)}`);
    return data;
  }

  async distributeETHRewards() {
    const data = await this.contract.distributeETHRewards();
    CommonLogger.instance.log(`distributeETHRewards ${JSON.stringify(data)}`);
    return data;
  }

  async distributeTokenRewards() {
    const data = await this.contract.distributeTokenRewards();
    CommonLogger.instance.log(`distributeTokenRewards ${JSON.stringify(data)}`);
    return data;
  }

  async getStakeInfo(accountAddress: Web3Address): Promise<StakingData> {
    if (!accountAddress) throw new Error('Param is invalid.');
    const data: Array<any> = await this.contract.getStakeInfo(accountAddress);
    CommonLogger.instance.log(`getStakeInfo ${JSON.stringify(data)}`);
    return {
      stakedAmount: data[0] ?? BigInt(0),
      isStaked: data[1] ?? false,
      tokenRewardAmount: data[2] ?? BigInt(0),
      nativeRewardAmount: data[3] ?? BigInt(0),
    };
  }

  async getStakersCount(): Promise<bigint> {
    const data: bigint = await this.contract.getStakersCount();
    CommonLogger.instance.log(`getStakersCount ${JSON.stringify(data)}`);
    return data;
  }

  async maxUsers(): Promise<bigint> {
    const data: bigint = await this.contract.maxUsers();
    CommonLogger.instance.log(`maxUsers ${JSON.stringify(data)}`);
    return data;
  }

  async owner(): Promise<string> {
    const data: string = await this.contract.owner();
    CommonLogger.instance.log(`owner ${JSON.stringify(data)}`);
    return data;
  }

  async rewardToken(): Promise<string> {
    const data: string = await this.contract.rewardToken();
    CommonLogger.instance.log(`rewardToken ${JSON.stringify(data)}`);
    return data;
  }

  async setMaxUsers(maxUser: number): Promise<void> {
    if (!maxUser) throw new Error('Param is invalid.');
    const data = await this.contract.setMaxUsers(maxUser);
    CommonLogger.instance.log(`setMaxUsers ${JSON.stringify(data)}`);
  }

  async setRewardToken(address: Web3Address) {
    if (!address) throw new Error('Param is invalid.');
    const data = await this.contract.setRewardToken(address);
    CommonLogger.instance.log(`setRewardToken ${JSON.stringify(data)}`);
  }

  async setStakeLimit(limit: number) {
    if (!limit) throw new Error('Param is invalid.');
    const data = await this.contract.setStakeLimit(limit);
    CommonLogger.instance.log(`setStakeLimit ${JSON.stringify(data)}`);
  }

  async setStakingToken(tokenAddress: Web3Address): Promise<void> {
    if (!tokenAddress) throw new Error('Param is invalid.');
    const data = await this.contract.setStakingToken(tokenAddress);
    CommonLogger.instance.log(`setStakingToken ${JSON.stringify(data)}`);
  }

  async stake(amount: bigint): Promise<ethers.ContractTransactionResponse> {
    if (!amount) throw new Error('Param is invalid.');
    const data: ethers.ContractTransactionResponse = await this.contract.stake(
      amount,
    );
    CommonLogger.instance.log(`stake ${JSON.stringify(data)}`);
    return data;
  }

  async stakers(): Promise<Array<string>> {
    const data = await this.contract.stakers();
    CommonLogger.instance.log(`stakers ${JSON.stringify(data)}`);
    return data;
  }

  async stakes(accountAddress: Web3Address): Promise<StakingData | undefined> {
    if (!accountAddress) throw new Error('Param is invalid.');
    const data = await this.contract.stakes(accountAddress);
    if (!data) return;

    CommonLogger.instance.log(`stakes ${JSON.stringify(data)}`);

    return {
      stakedAmount: data[0],
      isStaked: data[1],
      tokenRewardAmount: data[2],
      nativeRewardAmount: data[3],
    };
  }

  async stakingToken(accountAddress: Web3Address) {
    const data = await this.contract.stakingToken(accountAddress);
    CommonLogger.instance.log(`stakingToken ${JSON.stringify(data)}`);
    return data;
  }

  async unStake(amount: bigint) {
    if (!amount) throw new Error('Param is invalid.');
    const data = await this.contract.unstake(amount);
    CommonLogger.instance.log(`unStake ${JSON.stringify(data)}`);
    return data;
  }

  async getTotalStaked(): Promise<bigint> {
    const data = await this.contract.getTotalStaked();
    CommonLogger.instance.log(`getTotalStaked ${JSON.stringify(data)}`);
    return data;
  }

  async totalStaked(): Promise<bigint> {
    const data = await this.contract.totalStaked();
    CommonLogger.instance.log(`totalStaked ${JSON.stringify(data)}`);
    return data;
  }
}
