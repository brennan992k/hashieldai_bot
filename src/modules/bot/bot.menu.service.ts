/* eslint-disable @typescript-eslint/no-unused-vars */
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, InjectBot } from 'nestjs-telegraf';
import { CommonLogger } from 'src/common/logger';
import { Scenes, Telegraf } from 'telegraf';
import { BotService } from './bot.service';
import { CallbackData, CallbackDataKey } from './types';
import { User } from 'telegraf/typings/core/types/typegram';
import { BotAuthService } from './bot.auth.service';
import { BotHelperService } from './bot.helper.service';

@Injectable()
export class BotMenuService {
  constructor(
    @InjectBot()
    protected readonly bot: Telegraf<Scenes.SceneContext>,
    protected readonly configService: ConfigService,
    protected readonly helperService: BotHelperService,
    @Inject(forwardRef(() => BotAuthService))
    protected readonly authService: BotAuthService,
    @Inject(forwardRef(() => BotService))
    protected readonly service: BotService,
  ) {}

  private buildMenuOptions(from: User, backTo?: CallbackDataKey) {
    return {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '💰 Wallets',
              callback_data: new CallbackData<number>(
                CallbackDataKey.wallets,
                from.id,
              ).toJSON(),
            },
          ],
          [
            {
              text: '💳 Web2 Logins',
              callback_data: new CallbackData<number>(
                CallbackDataKey.web2Logins,
                from.id,
              ).toJSON(),
            },
          ],
          [
            {
              text: '👝 Defi Wallets',
              callback_data: new CallbackData<number>(
                CallbackDataKey.defiWallets,
                from.id,
              ).toJSON(),
            },
          ],
          [
            {
              text: '📝 Auto Fill',
              callback_data: new CallbackData<number>(
                CallbackDataKey.autoFill,
                from.id,
              ).toJSON(),
            },
          ],
          [
            {
              text: '👮 Password Health',
              callback_data: new CallbackData<number>(
                CallbackDataKey.passwordHealth,
                from.id,
              ).toJSON(),
            },
          ],
          [
            {
              text: '👮 Wallet Health',
              callback_data: new CallbackData<number>(
                CallbackDataKey.walletHealth,
                from.id,
              ).toJSON(),
            },
          ],
          [
            {
              text: 'ℹ️ About',
              callback_data: new CallbackData<number>(
                CallbackDataKey.about,
                from.id,
              ).toJSON(),
            },
          ],
          this.helperService.buildBacKAndCloseButtons(backTo),
        ],
      },
    };
  }

  public async onMenu(
    @Ctx() ctx,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      const { from } = ctx;

      const reply = this.helperService.buildLinesMessage([
        `🌟 Welcome <b>@${from.username}</b> to HashieldAI! 🌟\n`,
        `Your ultimate Telegram wallet bot, designed for speed, privacy, and seamless transactions! 🚀\n`,
        `<b>Key Features:</b>\n`,
        `⚡️Lightning Fast Transactions : Experience the quickest way to manage your crypto.`,
        `🛡Account Abstraction : Enjoy simplified wallet management without compromising security.`,
        `🔒Privacy Trading : Trade confidently with advanced privacy features to protect your assets.\n`,
        `<b>Getting Started:</b>\n`,
        `1. Create Your Wallet: Just follow the prompts to set up your secure wallet.`,
        `2. Deposit Funds: Easily add crypto to your wallet for quick access.`,
        `3. Start Trading: Explore our trading options with enhanced privacy!\n`,
        `Let’s make your crypto journey smooth and secure! 🌐💰\n`,
      ]);

      await this.helperService.editOrSendMessage(
        ctx,
        reply,
        this.buildMenuOptions(from, backTo),
        backFrom,
      );

      this.authService.onEnterAccessToken(ctx);
    } catch (error) {
      CommonLogger.instance.error(`onMenu error ${error?.message}`);
    }
  }
}
