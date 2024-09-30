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
  updateDefiWalletOrganization = 'dwudwo',
  deleteDefiWallet = 'dwddw',
  selectWalletOfDefiWallet = 'dwswodw',
  deleteWalletOfDefiWallet = 'dwdwodw',
  refreshWalletOfDefiWallet = 'dwrwodw',
  updateWalletNameOfDefiWallet = 'dwuwnodw',
}

export enum Web2LoginKey {
  selectCredential = 'w2lsc',
  templateCredentials = 'w2ltc',
  importCredentials = 'w2lic',
  refreshWeb2Logins = 'w2lrw2l',
  updateCredentialWebsites = 'w2lecws',
  updateCredentialEmail = 'w2luce',
  updateCredentialUsername = 'w2lucun',
  updateCredentialPassword = 'w2lucp',
  updateCredentialAutoLogin = 'w2lucal',
  updateCredentialAutoFill = 'w2lucaf',
  updateCredentialProtectItem = 'w2lucpi',
  deleteCredential = 'w2ldc',
  refreshCredential = 'w2lrc',
}

export enum ProfileKey {
  updateProfileFirstName = 'pupfn',
  updateProfileLastName = 'pupln',
  updateProfileGender = 'pupg',
  updateProfileDateOfBirth = 'pupdob',
  updateProfileCity = 'pupc',
  updateProfileState = 'pups',
  updateProfilePostcode = 'puppc',
  updateProfilePhone = 'pupp',
  profileCards = 'ppcs',
  selectCardOfProfile = 'pscop',
  updateCardNumberOfProfile = 'pucnop',
  updateCardExpDateOfProfile = 'pucedop',
  updateCardCVCOfProfile = 'puccvcop',
  refreshCardOfProfile = 'prcop',
  deleteCardOfProfile = 'pdcop',
  refreshAutoFill = 'praf',
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

  selectCredential = Web2LoginKey.selectCredential,
  templateCredentials = Web2LoginKey.templateCredentials,
  importCredentials = Web2LoginKey.importCredentials,
  refreshWeb2Logins = Web2LoginKey.refreshWeb2Logins,
  updateCredentialWebsites = Web2LoginKey.updateCredentialWebsites,
  updateCredentialEmail = Web2LoginKey.updateCredentialEmail,
  updateCredentialUsername = Web2LoginKey.updateCredentialUsername,
  updateCredentialPassword = Web2LoginKey.updateCredentialPassword,
  updateCredentialAutoLogin = Web2LoginKey.updateCredentialAutoLogin,
  updateCredentialAutoFill = Web2LoginKey.updateCredentialAutoFill,
  updateCredentialProtectItem = Web2LoginKey.updateCredentialProtectItem,
  deleteCredential = Web2LoginKey.deleteCredential,
  refreshCredential = Web2LoginKey.refreshCredential,

  templateDefiWallets = DefiWalletKey.templateDefiWallets,
  importDefiWallets = DefiWalletKey.importDefiWallets,
  refreshDefiWallets = DefiWalletKey.refreshDefiWallets,
  selectDefiWallet = DefiWalletKey.selectDefiWallet,
  refreshDefiWallet = DefiWalletKey.refreshDefiWallet,
  updateDefiWalletOrganization = DefiWalletKey.updateDefiWalletOrganization,
  deleteDefiWallet = DefiWalletKey.deleteDefiWallet,
  selectWalletOfDefiWallet = DefiWalletKey.selectWalletOfDefiWallet,
  deleteWalletOfDefiWallet = DefiWalletKey.deleteWalletOfDefiWallet,
  refreshWalletOfDefiWallet = DefiWalletKey.refreshWalletOfDefiWallet,
  updateWalletNameOfDefiWallet = DefiWalletKey.updateWalletNameOfDefiWallet,

  updateProfileFirstName = ProfileKey.updateProfileFirstName,
  updateProfileLastName = ProfileKey.updateProfileLastName,
  updateProfileGender = ProfileKey.updateProfileGender,
  updateProfileDateOfBirth = ProfileKey.updateProfileDateOfBirth,
  updateProfileCity = ProfileKey.updateProfileCity,
  updateProfileState = ProfileKey.updateProfileState,
  updateProfilePostcode = ProfileKey.updateProfilePostcode,
  updateProfilePhone = ProfileKey.updateProfilePhone,
  updateCardNumberOfProfile = ProfileKey.updateCardNumberOfProfile,
  updateCardExpDateOfProfile = ProfileKey.updateCardNumberOfProfile,
  updateCardCVCOfProfile = ProfileKey.updateCardNumberOfProfile,
  profileCards = ProfileKey.profileCards,
  selectCardOfProfile = ProfileKey.selectCardOfProfile,
  refreshCardOfProfile = ProfileKey.refreshCardOfProfile,
  deleteCardOfProfile = ProfileKey.deleteCardOfProfile,
  refreshAutoFill = ProfileKey.refreshAutoFill,
}

export enum JobAction {
  enterUserId = 'enterUserId',
  enterWalletName = 'enterWalletName',
  enterWalletPrivateKey = 'enterWalletPrivateKey',
  importDefiWallets = 'importDefiWallets',
  updateDefiWallet = 'updateDefiWallet',
  importCredentials = 'importCredentials',
  updateCredential = 'updateCredential',
  updateProfile = 'updateProfile',
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
