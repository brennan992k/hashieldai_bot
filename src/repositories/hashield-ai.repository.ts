import { Web3Address } from 'src/app.type';
import { BaseRepository } from './base.repository';
import * as CryptoJS from 'crypto-js';

export enum Gender {
  male = 'male',
  female = 'female',
  others = 'others',
}

export type PasswordHealth = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export type WalletHealth = {
  ///
};

export type Credential = {
  _id: string;
  owner: Web3Address;
  url: Array<string>;
  autoLogin: boolean;
  autoFill: boolean;
  isProtect: boolean;
  type: 'owner' | 'transfer';
  email: string;
  username: string;
  password: string;
  note: string;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
  limit_rights: Array<any>;
  full_rights: Array<any>;
  __v: number;
};

export type CredentialParams = {
  url?: Array<string>;
  autoLogin?: boolean;
  autoFill?: boolean;
  isProtect?: boolean;
  username?: string;
  password?: string;
  email?: string;
  note?: string;
};

export type Wallet = {
  wallet_name: string;
  private_key: string;
};

export type DefiWallet = {
  _id: string;
  owner: Web3Address;
  organization: string;
  seed_phrase: string;
  wallets: Array<Wallet>;
  is_deleted: boolean;
  autoLogin: boolean;
  autoFill: boolean;
  isProtect: boolean;
  type: 'owner' | 'transfer';
  createdAt: string;
  updatedAt: string;
  limit_rights: Array<any>;
  full_rights: Array<any>;
  __v: number;
};

export type WalletParams = { wallet_name?: string; private_key?: string };

export type DefiWalletParams = {
  organization?: string;
  seed_phrase?: string;
  wallets?: Array<WalletParams>;
};

export type Card = {
  card_number: string;
  cvc: string;
  expire_date: string;
};

export type Profile = {
  _id: string;
  owner: Web3Address;
  cards: Array<Card>;
  profile: {
    first_name: string;
    last_name: string;
    gender: Gender;
    birthday: string;
    city: string;
    state: string;
    post_code: string;
    phone: string;
  };
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

export type CardParams = {
  card_number?: string;
  expire_date?: string;
  cvc?: string;
};

export type ProfileParams = {
  profile?: {
    first_name?: string;
    last_name?: string;
    gender?: Gender;
    birthday?: string;
    city?: string;
    post_code?: string;
    phone?: string;
    state?: string;
  };
  cards?: Array<CardParams>;
};
export class HashieldAIRepository extends BaseRepository {
  private static _instance: HashieldAIRepository;
  private _secret: string;

  public static get instance(): HashieldAIRepository {
    if (!HashieldAIRepository._instance) {
      HashieldAIRepository._instance = new HashieldAIRepository();
    }
    return HashieldAIRepository._instance;
  }

  constructor() {
    super('https://blockchain-servers-ce2a1453900d.herokuapp.com/hashield/');
    this._secret = 'hashield';
  }

  async getPasswordHealths(): Promise<Array<PasswordHealth>> {
    return new Promise<Array<PasswordHealth>>((resolve) => {
      setTimeout(() => {
        resolve([]);
      }, 10000);
    });
  }

  async getWalletHealths(): Promise<Array<Wallet>> {
    return new Promise<Array<Wallet>>((resolve) => {
      setTimeout(() => {
        resolve([]);
      }, 10000);
    });
  }

  async getCredentials(owner: Web3Address): Promise<Array<Credential>> {
    const response: Array<Credential> = await this.get('web2', {
      headers: {
        api_key: this.encryptData(owner),
      },
    });

    if (!response) {
      throw new Error('Can not get credentials.');
    }

    return response.map(({ password, ...rest }) => ({
      ...rest,
      password: HashieldAIRepository.instance.decryptData(password),
    }));
  }

  async createCredentials(
    owner: Web3Address,
    params: Array<CredentialParams>,
  ): Promise<boolean> {
    const response: Credential = await this.post(
      'web2/upload',
      params.map((item) => ({ ...item })),
      {
        headers: {
          api_key: this.encryptData(owner),
        },
      },
    );

    if (!response) {
      throw new Error('Can not create credentials.');
    }

    return true;
  }

  async updateCredential(
    owner: Web3Address,
    credentialId: string,
    params: CredentialParams,
  ): Promise<boolean> {
    const response: { data: Array<Credential> } = await this.patch(
      'web2',
      {
        ...params,
        _id: credentialId,
      },
      {
        headers: {
          api_key: this.encryptData(owner),
        },
      },
    );
    if (!response) {
      throw new Error('Can not update credential.');
    }

    return true;
  }

  async deleteCredentials(
    owner: Web3Address,
    credentialIds: Array<string>,
  ): Promise<boolean> {
    const response: { data: Array<Credential> } = await this.delete('web2', {
      data: credentialIds,
      headers: {
        api_key: this.encryptData(owner),
      },
    });

    if (!response) {
      throw new Error('Can not delete credentials.');
    }

    return true;
  }

  public async getDefiWallets(owner: Web3Address): Promise<Array<DefiWallet>> {
    const response: Array<DefiWallet> = await this.get('defi', {
      headers: {
        api_key: this.encryptData(owner),
      },
    });

    if (!response) {
      throw new Error('Can not update defi wallets');
    }

    return response.map(({ wallets, ...rest }) => ({
      ...rest,
      wallets: wallets.map(({ private_key, ...rest }) => ({
        ...rest,
        private_key: HashieldAIRepository.instance.decryptData(private_key),
      })),
    }));
  }

  public async createDefiWallet(
    owner: Web3Address,
    params: DefiWalletParams,
  ): Promise<boolean> {
    const response = await this.post(
      'defi',
      { ...params },
      {
        headers: {
          api_key: this.encryptData(owner),
        },
      },
    );

    if (!response) {
      throw new Error('Can not create defi wallet.');
    }

    return true;
  }

  public async createDefiWallets(
    owner: Web3Address,
    params: Array<DefiWalletParams>,
  ): Promise<boolean> {
    const response = await this.post(
      'defi/upload',
      params.map((item) => ({ ...item })),
      {
        headers: {
          api_key: this.encryptData(owner),
        },
      },
    );

    if (!response) {
      throw new Error('Can not create defi wallets.');
    }

    return true;
  }

  public async updateDefiWallet(
    owner: Web3Address,
    defiWalletId: string,
    params: DefiWalletParams,
  ): Promise<boolean> {
    const response = await this.patch(
      'defi',
      {
        ...params,
        _id: defiWalletId,
      },
      {
        headers: {
          api_key: this.encryptData(owner),
        },
      },
    );

    if (!response) {
      throw new Error('Can not update defi wallet.');
    }

    return true;
  }

  public async deleteDefiWallets(
    owner: Web3Address,
    defiWalletIds: Array<string>,
  ): Promise<boolean> {
    const response = await this.delete('defi', {
      data: defiWalletIds,
      headers: {
        api_key: this.encryptData(owner),
      },
    });

    if (!response) {
      throw new Error('Can not delete defi wallets.');
    }

    return true;
  }

  public async getContacts(owner: Web3Address): Promise<Array<Web3Address>> {
    const response = await this.get('contact', {
      headers: {
        api_key: this.encryptData(owner),
      },
    });

    if (!response) {
      throw new Error('Can not get contacts.');
    }

    return response;
  }

  public async updateContacts(
    owner: Web3Address,
    contacts: Array<Web3Address>,
  ): Promise<boolean> {
    const response = await this.patch(
      'contact',
      {
        contacts,
      },
      {
        headers: {
          api_key: this.encryptData(owner),
        },
      },
    );

    if (!response) {
      throw new Error('Can not update contacts.');
    }

    return response;
  }

  public async getProfile(owner: Web3Address): Promise<Profile> {
    const response: Profile = await this.get('autofill', {
      headers: {
        api_key: this.encryptData(owner),
      },
    });

    if (!response) {
      throw new Error('Can not get profile.');
    }

    return {
      ...response,
      profile: response.profile,
      cards: response.cards.map(({ cvc, ...rest }) => ({
        ...rest,
        cvc: HashieldAIRepository.instance.decryptData(cvc),
      })),
    };
  }

  public async updateProfile(
    owner: Web3Address,
    params: ProfileParams,
  ): Promise<boolean> {
    const response = await this.post(
      'autofill',
      {
        ...params,
      },
      {
        headers: {
          api_key: this.encryptData(owner),
        },
      },
    );

    if (!response) {
      throw new Error('Can not update profile.');
    }

    return true;
  }

  public decryptData(hashedData: string): string {
    const dataString = hashedData
      .toString()
      .replaceAll('xCvl6kl', '+')
      .replaceAll('6Hjmaqt', '/')
      .replaceAll('gHtfrd5', '=');
    const bytes = CryptoJS.AES.decrypt(dataString, this._secret);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  public encryptData(data: string): string {
    const ciphertext = CryptoJS.AES.encrypt(data, this._secret).toString();
    const secretId = ciphertext
      .toString()
      .replaceAll('+', 'xCvl6kl')
      .replaceAll('/', '6Hjmaqt')
      .replaceAll('=', 'gHtfrd5');
    return secretId;
  }
}
