/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, InjectBot } from 'nestjs-telegraf';
import { Scenes, Telegraf } from 'telegraf';
import { BotService } from './bot.service';
import { CallbackData, CallbackDataKey } from './types';
import { BotWalletsService } from './bot.wallets.service';
import { BotAboutService } from './bot.about.service';
import { BotBackService } from './bot.back.service';
import { CommonLogger } from 'src/common/logger';
import { ChainId } from 'src/app.type';
import { BotWeb2LoginsService } from './bot.web2-logins.service';
import { BotDefiWalletsService } from './bot.defi-wallets.service';
import { BotPasswordHealthService } from './bot.password-health.service';
import { BotWalletHealthService } from './bot.wallet-health.service';
import { BotAutoFillService } from './bot.auto-fill.service';

@Injectable()
export class BotCallbackService {
  constructor(
    @InjectBot()
    protected readonly bot: Telegraf<Scenes.SceneContext>,
    protected readonly configService: ConfigService,
    protected readonly service: BotService,
    protected readonly aboutService: BotAboutService,
    protected readonly walletsService: BotWalletsService,
    protected readonly web2LoginsService: BotWeb2LoginsService,
    protected readonly defiWalletsService: BotDefiWalletsService,
    protected readonly autoFillService: BotAutoFillService,
    protected readonly passwordHealthService: BotPasswordHealthService,
    protected readonly walletHealthService: BotWalletHealthService,
    protected readonly backService: BotBackService,
  ) {}

  async onCallbackQuery(@Ctx() ctx) {
    try {
      if (ctx.update && ctx.update.callback_query) {
        const { data, message } = ctx.update.callback_query;
        const callback_data = CallbackData.fromJSON<any>(data);
        switch (callback_data.key) {
          case CallbackDataKey.wallets:
            this.walletsService.onWallets(ctx);
            break;
          case CallbackDataKey.refreshWallets:
            this.walletsService.onRefreshWallets(ctx, CallbackDataKey.wallets);
            break;
          case CallbackDataKey.createWallet:
            this.walletsService.onCreateWallet(
              ctx,
              CallbackDataKey.wallets,
              CallbackDataKey.wallets,
            );
            break;
          case CallbackDataKey.connectWallet:
            this.walletsService.onConnectWallet(
              ctx,
              callback_data.params as ChainId,
            );
            break;
          case CallbackDataKey.generateWallet:
            this.walletsService.onGenerateWallet(
              ctx,
              callback_data.params as ChainId,
            );
            break;
          case CallbackDataKey.selectWallet:
            this.walletsService.onSelectWallet(
              ctx,
              callback_data.params as string,
              CallbackDataKey.wallets,
              CallbackDataKey.wallets,
            );
            break;
          case CallbackDataKey.setWalletDefault:
            this.walletsService.onSetWalletDefault(
              ctx,
              callback_data.params as string,
            );
            break;
          case CallbackDataKey.refreshWallet:
            this.walletsService.onRefreshWallet(
              ctx,
              callback_data.params as string,
              CallbackDataKey.wallets,
              CallbackDataKey.wallets,
            );
            break;
          case CallbackDataKey.deleteWallet:
            this.walletsService.onDeleteWallet(
              ctx,
              callback_data.params as string,
              CallbackDataKey.wallets,
              CallbackDataKey.wallets,
            );
            break;
          case CallbackDataKey.web2Logins:
            this.web2LoginsService.onWeb2Logins(ctx);
            break;
          case CallbackDataKey.templateCredentials:
            this.web2LoginsService.onTemplateCredentials(ctx);
            break;
          case CallbackDataKey.importCredentials:
            this.web2LoginsService.onImportCredentials(ctx);
            break;
          case CallbackDataKey.refreshWeb2Logins:
            this.web2LoginsService.onRefreshWeb2Logins(
              ctx,
              CallbackDataKey.web2Logins,
            );
            break;
          case CallbackDataKey.selectCredential:
            this.web2LoginsService.onSelectCredential(
              ctx,
              callback_data.params as string,
              CallbackDataKey.web2Logins,
              CallbackDataKey.web2Logins,
            );
            break;
          case CallbackDataKey.refreshCredential:
            this.web2LoginsService.onRefreshCredential(
              ctx,
              callback_data.params as string,
              CallbackDataKey.selectCredential,
              CallbackDataKey.web2Logins,
            );
            break;
          case CallbackDataKey.deleteCredential:
            this.web2LoginsService.onDeleteCredential(
              ctx,
              callback_data.params as string,
              CallbackDataKey.selectCredential,
            );
            break;
          case CallbackDataKey.updateCredentialWebsites:
          case CallbackDataKey.updateCredentialUsername:
          case CallbackDataKey.updateCredentialPassword:
          case CallbackDataKey.updateCredentialAutoLogin:
          case CallbackDataKey.updateCredentialAutoFill:
          case CallbackDataKey.updateCredentialProtectItem:
            this.web2LoginsService.onUpdateCredential(
              ctx,
              callback_data.params as string,
              callback_data.key,
              CallbackDataKey.selectCredential,
              CallbackDataKey.selectCredential,
            );
            break;
          case CallbackDataKey.defiWallets:
            this.defiWalletsService.onDefiWallets(ctx);
            break;
          case CallbackDataKey.templateDefiWallets:
            this.defiWalletsService.onTemplateDefiWallets(ctx);
            break;
          case CallbackDataKey.importDefiWallets:
            this.defiWalletsService.onImportDefiWallets(ctx);
            break;
          case CallbackDataKey.refreshDefiWallets:
            this.defiWalletsService.onRefreshDefiWallets(
              ctx,
              CallbackDataKey.defiWallets,
            );
            break;
          case CallbackDataKey.selectDefiWallet:
            this.defiWalletsService.onSelectDefiWallet(
              ctx,
              callback_data.params as string,
              CallbackDataKey.defiWallets,
              CallbackDataKey.defiWallets,
            );
            break;
          case CallbackDataKey.refreshDefiWallet:
            this.defiWalletsService.onRefreshDefiWallet(
              ctx,
              callback_data.params as string,
              CallbackDataKey.selectDefiWallet,
              CallbackDataKey.defiWallets,
            );
            break;
          case CallbackDataKey.deleteDefiWallet:
            this.defiWalletsService.onDeleteDefiWallet(
              ctx,
              callback_data.params as string,
              CallbackDataKey.selectDefiWallet,
            );
            break;
          case CallbackDataKey.updateDefiWalletOrganization:
          case CallbackDataKey.updateWalletNameOfDefiWallet:
            (() => {
              const [defiWalletId, walletIndex] =
                callback_data.params.split('_');
              this.defiWalletsService.onUpdateDefiWallet(
                ctx,
                defiWalletId,
                callback_data.key,
                parseInt(walletIndex),
                CallbackDataKey.selectDefiWallet,
                CallbackDataKey.selectDefiWallet,
              );
            })();
            break;
          case CallbackDataKey.selectWalletOfDefiWallet:
            (() => {
              const [defiWalletId, walletIndex] =
                callback_data.params.split('_');
              this.defiWalletsService.onSelectWalletOfDefiWallet(
                ctx,
                defiWalletId,
                parseInt(walletIndex),
                CallbackDataKey.selectDefiWallet,
                CallbackDataKey.selectDefiWallet,
              );
            })();
            break;
          case CallbackDataKey.refreshWalletOfDefiWallet:
            (() => {
              const [defiWalletId, walletIndex] =
                callback_data.params.split('_');
              this.defiWalletsService.onRefreshWalletOfDefiWallet(
                ctx,
                defiWalletId,
                parseInt(walletIndex),
                CallbackDataKey.selectDefiWallet,
                CallbackDataKey.selectDefiWallet,
              );
            })();
            break;
          case CallbackDataKey.deleteWalletOfDefiWallet:
            (() => {
              const [defiWalletId, walletIndex] =
                callback_data.params.split('_');
              this.defiWalletsService.onDeleteWalletOfDefiWallet(
                ctx,
                defiWalletId,
                parseInt(walletIndex),
                CallbackDataKey.selectDefiWallet,
                CallbackDataKey.selectDefiWallet,
              );
            })();
            break;
          case CallbackDataKey.autoFill:
            this.autoFillService.onAutoFill(ctx);
            break;
          case CallbackDataKey.refreshDefiWallets:
            this.autoFillService.onRefreshAutoFill(
              ctx,
              CallbackDataKey.autoFill,
            );
            break;
          case CallbackDataKey.updateProfileFirstName:
          case CallbackDataKey.updateProfileLastName:
          case CallbackDataKey.updateCredentialEmail:
          case CallbackDataKey.updateProfilePhone:
          case CallbackDataKey.updateProfileCity:
          case CallbackDataKey.updateProfileDateOfBirth:
          case CallbackDataKey.updateProfilePostcode:
          case CallbackDataKey.updateProfileState:
          case CallbackDataKey.updateProfileGender:
          case CallbackDataKey.updateCardNumberOfProfile:
          case CallbackDataKey.updateCardCVCOfProfile:
          case CallbackDataKey.updateCardExpDateOfProfile:
            (() => {
              const [cardIndex] = callback_data.params.split('_');
              this.autoFillService.onUpdateProfile(
                ctx,
                callback_data.key,
                parseInt(cardIndex),
                CallbackDataKey.autoFill,
                CallbackDataKey.autoFill,
              );
            })();
            break;
          case CallbackDataKey.selectProfileCard:
            (() => {
              const [cardIndex] = callback_data.params.split('_');
            })();
            break;
          case CallbackDataKey.passwordHealth:
            this.passwordHealthService.onPasswordHealth(ctx);
            break;
          case CallbackDataKey.walletHealth:
            this.walletHealthService.onWalletHealth(ctx);
            break;
          case CallbackDataKey.about:
            this.aboutService.onAbout(ctx);
            break;
          case CallbackDataKey.close:
            this.service.onClose(ctx, message);
            break;
          case CallbackDataKey.back:
            this.backService.onBackQuery(ctx);
            break;
          default:
            break;
        }
      }
    } catch (error) {
      CommonLogger.instance.error(`onCallbackQuery error ${error?.message}`);
    }
  }
}
