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
        `Welcome to <b>HASHIELD AI</b>! 🤖🔒\n`,
        `Your personal AI assistant for ultimate security and convenience!\n`,
        `✨ Features:\n`,
        `<b>1. Password Management:</b> Save, auto-fill, and manage your web2 login credentials effortlessly.`,
        `<b>2. Seed Phrase & Private Key Protection:</b> Securely store your seed phrases and private keys with cutting-edge encryption.`,
        `<b>3. Personal Data Vault:</b> Protect your sensitive data in an encrypted environment for peace of mind.\n`,
        `With HASHIELD AI, experience enhanced security and seamless access across all your accounts. Start your journey to a safer digital experience today! 💡🔐\n`,
        `Type /start to begin!\n`,
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
