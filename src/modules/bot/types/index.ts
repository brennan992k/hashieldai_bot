export enum CallbackDataKey {
  none = 'none',
  menu = 'menu',
  wallets = 'wallets',
  web2Logins = 'web2Logins',
  defiWallets = 'defiWallets',
  autoFill = 'autoFill',
  passwordHealth = 'Password Health',
  walletHealth = 'WalletHealth',
  about = 'about',
  close = 'close',
  back = 'back',
  createWallet = 'createWallet',
  selectWallet = 'selectWallet',
  refreshWallets = 'refreshWallets',
  connectWallet = 'connectWallet',
  generateWallet = 'generateWallet',
  setWalletDefault = 'setWalletDefault',
  refreshWallet = 'refreshWallet',
  deleteWallet = 'deleteWallet',
  addNewCredential = 'addNewCredential',
  refreshWeb2Logins = 'refreshWeb2Logins',
  addNewDefiWallet = 'addNewDefiWallet',
  refreshDefiWallets = 'refreshDefiWallets',
  updateProfile = 'updateProfile',
  refreshAutoFill = 'refreshAutoFill',
}

export enum JobAction {
  enterUserId = 'enterUserId',
  enterWalletName = 'enterWalletName',
  enterWalletPrivateKey = 'enterWalletPrivateKey',
}

export enum JobStatus {
  cancel = 0,
  inProcess = 1,
  done = 2,
}

export class CallbackData<T> {
  key: CallbackDataKey;
  params: T;

  constructor(key: CallbackDataKey, params: T) {
    this.key = key;
    this.params = params;
  }

  toJSON() {
    return JSON.stringify({
      key: this.key,
      params: this.params,
    });
  }

  static fromJSON<T>(json: string) {
    const { key, params } = JSON.parse(json);
    const CallbackDataKey: CallbackDataKey = key;
    return new CallbackData<T>(CallbackDataKey, params);
  }
}
