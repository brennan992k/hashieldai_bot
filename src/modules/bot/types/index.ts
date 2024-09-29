export enum MenuKey {
  wallets = 'mw',
  web2Logins = 'mwl',
  defiWallets = 'mdw',
  autoFill = 'maf',
  passwordHealth = 'mph',
  walletHealth = 'mwh',
  about = 'ma',
}

export enum WalletKey {
  createWallet = 'wcrw',
  selectWallet = 'wsw',
  refreshWallets = 'wrws',
  connectWallet = 'wcow',
  generateWallet = 'wgw',
  setWalletDefault = 'wswd',
  refreshWallet = 'wrw',
  deleteWallet = 'wdw',
}

export enum DefiWalletKey {
  templateDefiWallets = 'dwtdws',
  importDefiWallets = 'dwidws',
  refreshDefiWallets = 'dwrdws',
  selectDefiWallet = 'dwsdw',
  refreshDefiWallet = 'dwrdw',
  editDefiWallet = 'dwedw',
  deleteDefiWallet = 'dwddw',
  selectWalletOfDefiWallet = 'dwswodw',
  deleteWalletOfDefiWallet = 'dwdwodw',
  refreshWalletOfDefiWallet = 'dwrwodw',
  editWalletOfDefiWallet = 'dwewodw',
}

export enum CallbackDataKey {
  none = 'none',
  menu = 'menu',
  close = 'close',
  back = 'back',

  wallets = MenuKey.wallets,
  web2Logins = MenuKey.web2Logins,
  defiWallets = MenuKey.defiWallets,
  autoFill = MenuKey.autoFill,
  passwordHealth = MenuKey.passwordHealth,
  walletHealth = MenuKey.walletHealth,
  about = MenuKey.about,

  createWallet = WalletKey.createWallet,
  selectWallet = WalletKey.selectWallet,
  refreshWallets = WalletKey.refreshWallets,
  connectWallet = WalletKey.connectWallet,
  generateWallet = WalletKey.generateWallet,
  setWalletDefault = WalletKey.setWalletDefault,
  refreshWallet = WalletKey.refreshWallet,
  deleteWallet = WalletKey.deleteWallet,

  addNewCredential = 'addNewCredential',
  refreshWeb2Logins = 'refreshWeb2Logins',

  templateDefiWallets = DefiWalletKey.templateDefiWallets,
  importDefiWallets = DefiWalletKey.importDefiWallets,
  refreshDefiWallets = DefiWalletKey.refreshDefiWallets,
  selectDefiWallet = DefiWalletKey.selectDefiWallet,
  refreshDefiWallet = DefiWalletKey.refreshDefiWallet,
  editDefiWallet = DefiWalletKey.editDefiWallet,
  deleteDefiWallet = DefiWalletKey.deleteDefiWallet,
  selectWalletOfDefiWallet = DefiWalletKey.selectWalletOfDefiWallet,
  deleteWalletOfDefiWallet = DefiWalletKey.deleteWalletOfDefiWallet,
  refreshWalletOfDefiWallet = DefiWalletKey.refreshWalletOfDefiWallet,
  editWalletOfDefiWallet = DefiWalletKey.editWalletOfDefiWallet,

  updateProfile = 'updateProfile',
  refreshAutoFill = 'refreshAutoFill',
}

export enum JobAction {
  enterUserId = 'enterUserId',
  enterWalletName = 'enterWalletName',
  enterWalletPrivateKey = 'enterWalletPrivateKey',
  enterDefiWalletOrganization = 'enterDefiWalletOrganization',
  enterWalletOfDefiWalletName = 'enterWalletOfDefiWalletName',
  importDefiWallets = 'importDefiWallets',
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
