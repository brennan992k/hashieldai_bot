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
    protected readonly service: BotService,
  ) {}

  public async onBackQuery(@Ctx() ctx) {
    try {
      if (ctx.update && ctx.update.callback_query) {
        const { data } = ctx.update.callback_query;
        const callback_data = CallbackData.fromJSON<CallbackDataKey>(data);
        switch (callback_data.params) {
          case CallbackDataKey.menu:
            this.menuService.onMenu(ctx, callback_data.key);
            break;
          case CallbackDataKey.about:
            this.faqService.onAbout(ctx, callback_data.key);
            break;
          case CallbackDataKey.wallets:
            this.walletsService.onWallets(ctx, callback_data.key);
            break;
          case CallbackDataKey.selectWallet:
            this.walletsService.onSelectWallet(ctx, callback_data.key);
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
          default:
            break;
        }
      }
    } catch (error) {
      CommonLogger.instance.error(`onBackQuery error ${error?.message}`);
    }
  }
}
