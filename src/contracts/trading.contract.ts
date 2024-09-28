import * as ethers from 'ethers';
import * as tradingAbi from './abi/trading.json';
import { CommonContract } from 'src/common/contract';
import { CommonLogger } from 'src/common/logger';
import { ChainId, Web3Address } from 'src/app.type';
import { tradingAddresses } from './address/trading';

export class TradingContract extends CommonContract {
  constructor(
    chainId: ChainId,
    runner?: ethers.ethers.ContractRunner | null | undefined,
  ) {
    super(tradingAddresses[chainId], tradingAbi, runner);
  }

  async deposit(
    publicKey: string,
    walletAddress: Web3Address,
    amount: bigint,
  ): Promise<ethers.ContractTransactionResponse> {
    if (!publicKey || !walletAddress || !amount) {
      throw new Error('Param is invalid.');
    }

    const data: ethers.ContractTransactionResponse =
      await this.contract.deposit(publicKey, {
        from: walletAddress,
        value: amount,
        gas: 210000,
        gasPrice: ethers.parseUnits('30', 'gwei'),
      });

    CommonLogger.instance.log(`deposit ${JSON.stringify(data)}`);

    return data;
  }

  async getAmountOut(tokenOut: string, ethAmountMin: bigint): Promise<bigint> {
    if (!tokenOut || !ethAmountMin) throw new Error('Param is invalid.');
    const data: bigint = await this.contract.getAmountOut(
      tokenOut,
      ethAmountMin,
    );

    CommonLogger.instance.log(`getAmountOut ${data}`);

    return data;
  }

  async getAmountOf(publicKey: string): Promise<bigint> {
    if (!publicKey) throw new Error('Param is invalid.');
    const data: bigint = await this.contract.getAmountOf(publicKey);

    CommonLogger.instance.log(`getAmountOf ${data}`);

    return data;
  }
}
