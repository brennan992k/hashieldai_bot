import * as ethers from 'ethers';
import * as balanceAbi from './abi/erc20.json';
import { CommonContract } from 'src/common/contract';
import { CommonLogger } from 'src/common/logger';
import { BadRequestException } from '@nestjs/common';
import { Web3Address } from 'src/app.type';

export class ERC20Contract extends CommonContract {
  constructor(
    tokenAddress: Web3Address,
    runner?: ethers.ethers.ContractRunner | null | undefined,
  ) {
    super(tokenAddress, balanceAbi, runner);
  }

  async balanceOf(walletAddress: Web3Address) {
    if (!walletAddress) {
      throw new BadRequestException('Param is invalid.');
    }

    const data = await this.contract.balanceOf(walletAddress);
    CommonLogger.instance.log(`balanceOf ${JSON.stringify(data)}`);
    return data;
  }

  async allowance(
    walletAddress: string,
    spenderAddress: string,
  ): Promise<bigint> {
    if (!walletAddress || !spenderAddress) {
      throw new BadRequestException('Param is invalid.');
    }

    const data = await this.contract.allowance(walletAddress, spenderAddress);

    CommonLogger.instance.log(`allowance ${JSON.stringify(data)}`);

    return data;
  }

  async approve(walletAddress: string, spenderAddress: string, amount: bigint) {
    if (!spenderAddress || !amount || !walletAddress) {
      throw new BadRequestException('Param is invalid.');
    }
    const data = await this.contract.approve(spenderAddress, amount, {
      from: walletAddress,
    });

    CommonLogger.instance.log(`approve ${JSON.stringify(data)}`);

    return data;
  }
}
