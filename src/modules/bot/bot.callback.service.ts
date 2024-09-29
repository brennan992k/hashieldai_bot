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
    protected readonly passwordHealthService: BotPasswordHealthService,
    protected readonly walletHealthService: BotWalletHealthService,
    protected readonly autoFillService: BotAutoFillService,
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
          case CallbackDataKey.defiWallets:
            this.defiWalletsService.onDefiWallets(ctx);
            break;
          case CallbackDataKey.autoFill:
            this.autoFillService.onAutoFill(ctx);
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
