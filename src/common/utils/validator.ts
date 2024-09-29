/* eslint-disable no-useless-escape */
import { ethers } from 'ethers';

export const validator = {
  isURL: (url: string): boolean => {
    const regex =
      /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-\.~:?#@!$&'()*+,;=\[\\\]\/%]*)*$/i;
    return regex.test(url);
  },
  isDomain: (domain: string): boolean => {
    const regex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z]{2,})+$/;
    return regex.test(domain);
  },
  isUsername: (username: string): boolean => {
    // Regular expression for valid username
    const regex = /^(?![_.])(?!.*[_.]{2})[A-Za-z0-9._]+(?<![._])$/;
    return regex.test(username);
  },
  isEmail(email: string): boolean {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  },
  isWalletPrivateKey(privateKey: string) {
    try {
      const wallet = new ethers.Wallet(privateKey);
      return wallet.privateKey.slice(2, wallet.privateKey.length) == privateKey;
    } catch (error) {
      return false;
    }
  },
};
