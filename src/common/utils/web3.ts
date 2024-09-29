import * as crypto from 'crypto';
import { Web3Address } from 'src/app.type';

const ALGORITHM = 'aes256';
const FRACTION_DIGITS = 4;

export function encryptData(data: string, securityKey: string): string {
  const cipher = crypto.createCipher(ALGORITHM, securityKey);
  return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
}

export function decryptData(data: string, securityKey: string): string {
  const decipher = crypto.createDecipher(ALGORITHM, securityKey);
  return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
}

export const shortenWalletAddress = (
  walletAddress: string | Web3Address,
): string => {
  if (!walletAddress) return '';
  if (walletAddress.length < 10) return walletAddress;

  const start: string = walletAddress.substring(0, 8);
  const end: string = walletAddress.substring(walletAddress.length - 6);

  return `${start}...${end}`;
};

export const withDecimals = (amount: number, decimals: number) => {
  if (!amount) return BigInt(0);
  return BigInt(
    (amount * 10 ** decimals).toLocaleString('fullwide', {
      useGrouping: false,
    }),
  );
};

export const withoutDecimals = (
  amount: bigint,
  decimals: number,
  fractionDigits: number = FRACTION_DIGITS,
): number => {
  return parseFloat(
    (parseFloat(`${amount ?? 0}`) / 10 ** decimals).toFixed(fractionDigits),
  );
};

export const roundAmount = (
  amount: number,
  fractionDigits: number = FRACTION_DIGITS,
): number => {
  return Math.round(amount * 10 ** fractionDigits) / 10 ** fractionDigits;
};
