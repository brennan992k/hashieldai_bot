/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, InjectBot } from 'nestjs-telegraf';
import { CommonLogger } from 'src/common/logger';
import { Scenes, Telegraf } from 'telegraf';
import { BotService } from './bot.service';
import { BotAuthService } from './bot.auth.service';
import { CallbackData, CallbackDataKey } from './types';
import { BotWalletsService } from './bot.wallets.service';
import { BotMenuService } from './bot.menu.service';
import { BotAboutService } from './bot.about.service';
import { BotWeb2LoginsService } from './bot.web2-logins.service';
import { BotDefiWalletsService } from './bot.defi-wallets.service';
import { BotPasswordHealthService } from './bot.password-health.service';
import { BotWalletHealthService } from './bot.wallet-health.service';
import { BotAutoFillService } from './bot.auto-fill.service';

@Injectable()
export class BotBackService {
  constructor(
    @InjectBot()
    protected readonly bot: Telegraf<Scenes.SceneContext>,
    protected readonly configService: ConfigService,
    protected readonly authService: BotAuthService,
    protected readonly menuService: BotMenuService,
    protected readonly faqService: BotAboutService,
    protected readonly walletsService: BotWalletsService,
    protected readonly web2LoginsService: BotWeb2LoginsService,
    protected readonly defiWalletsService: BotDefiWalletsService,
    protected readonly passwordHealthService: BotPasswordHealthService,
    protected readonly walletHealthService: BotWalletHealthService,
    protected readonly autoFillService: BotAutoFillService,
    protected readonly service: BotService,
  ) {}

  public async onBackQuery(@Ctx() ctx) {
    try {
      if (ctx.update && ctx.update.callback_query) {
        const { data } = ctx.update.callback_query;
        const callback_data = CallbackData.fromJSON<CallbackDataKey>(data);
        const [backTo, ...params] = callback_data.params.split('_');
        switch (backTo as CallbackDataKey) {
          case CallbackDataKey.menu:
            this.menuService.onMenu(ctx, callback_data.key);
            break;
          case CallbackDataKey.about:
            this.faqService.onAbout(ctx, callback_data.key);
            break;
          case CallbackDataKey.wallets:
            this.walletsService.onWallets(ctx, callback_data.key);
            break;
          case CallbackDataKey.createWallet:
            this.walletsService.onCreateWallet(
              ctx,
              callback_data.key,
              CallbackDataKey.wallets,
            );
            break;
          case CallbackDataKey.web2Logins:
            this.web2LoginsService.onWeb2Logins(ctx, callback_data.key);
            break;
          case CallbackDataKey.defiWallets:
            this.defiWalletsService.onDefiWallets(ctx, callback_data.key);
            break;
          case CallbackDataKey.selectDefiWallet:
            const [defiWalletId] = params;
            this.defiWalletsService.onSelectDefiWallet(
              ctx,
              defiWalletId,
              callback_data.key,
              CallbackDataKey.defiWallets,
            );
            break;
          case CallbackDataKey.autoFill:
            this.autoFillService.onAutoFill(ctx, callback_data.key);
            break;
          case CallbackDataKey.profileCards:
            this.autoFillService.onProfileCards(
              ctx,
              callback_data.key,
              CallbackDataKey.autoFill,
            );
            break;
          default:
            break;
        }
      }
    } catch (error) {
      CommonLogger.instance.error(`onBackQuery error ${error?.message}`);
    }
  }
}
