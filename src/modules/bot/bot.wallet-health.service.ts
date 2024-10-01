/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, InjectBot } from 'nestjs-telegraf';
import { CommonLogger } from 'src/common/logger';
import { Context, Scenes, Telegraf } from 'telegraf';
import { BotService } from './bot.service';
import { BotAuthService } from './bot.auth.service';
import { CallbackData, CallbackDataKey } from './types';
import { User } from 'telegraf/typings/core/types/typegram';
import { BotHelperService } from './bot.helper.service';

@Injectable()
export class BotWalletHealthService {
  constructor(
    @InjectBot()
    protected readonly bot: Telegraf<Scenes.SceneContext>,
    protected readonly configService: ConfigService,
    protected readonly authService: BotAuthService,
    protected readonly helperService: BotHelperService,
    protected readonly service: BotService,
  ) {}
  private buildWalletHealthOptions(from: User, backTo?: CallbackDataKey) {
    return {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🔄 Refresh',
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.refreshAutoFill,
                CallbackDataKey.autoFill,
              ).toJSON(),
            },
          ],
          this.helperService.buildBacKAndCloseButtons(backTo),
        ],
      },
    };
  }

  public async onWalletHealth(
    @Ctx() ctx: Context,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      this.service.reply(ctx, 'Coming soon...');
      return;

      if (await this.authService.onEnterAccessToken(ctx)) return;

      const { from } = ctx;

      await this.helperService.editOrSendMessage(
        ctx,
        `<b>💳 Web2 Logins</b>`,
        this.buildWalletHealthOptions(from, backTo),
        backFrom,
      );
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onAutoFill error ${error?.message}`);
    }
  }
}
