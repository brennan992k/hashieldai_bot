import { BadRequestException } from '@nestjs/common';
import * as ethers from 'ethers';
import { Web3Address } from 'src/app.type';

export abstract class CommonContract {
  constructor(
    tokenAddress: Web3Address,
    abi: ethers.ethers.Interface | ethers.ethers.InterfaceAbi,
    runner?: ethers.ethers.ContractRunner | null | undefined,
  ) {
    this._contract = new ethers.Contract(tokenAddress, abi, runner);
    this._address = tokenAddress;
  }

  private _contract?: ethers.Contract;

  private _address: Web3Address;

  public get contract() {
    if (!this._contract) throw new BadRequestException('Connect your wallet.');
    return this._contract;
  }

  public get address() {
    return this._address;
  }
}
