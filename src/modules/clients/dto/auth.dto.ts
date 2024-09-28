import { IsEthereumAddress, IsNumber, IsString } from 'class-validator';

export class AuthDto {
  @IsEthereumAddress()
  address: string;

  @IsString()
  signature: string;

  @IsString()
  code: string;

  @IsNumber()
  timestamp: number;
}
