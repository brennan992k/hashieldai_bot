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
export class BotWeb2LoginsService {
  constructor(
    @InjectBot()
    protected readonly bot: Telegraf<Scenes.SceneContext>,
    protected readonly configService: ConfigService,
    protected readonly authService: BotAuthService,
    protected readonly helperService: BotHelperService,
    protected readonly service: BotService,
  ) {}
  private buildTradingOptions(from: User, backTo?: CallbackDataKey) {
    return {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Add New',
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.addNewCredential,
                CallbackDataKey.web2Logins,
              ).toJSON(),
            },
            {
              text: 'Refresh',
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.refreshWeb2Logins,
                CallbackDataKey.web2Logins,
              ).toJSON(),
            },
          ],
          this.helperService.buildBacKAndCloseButtons(backTo),
        ],
      },
    };
  }

  public async onWeb2Logins(
    @Ctx() ctx: Context,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      if (await this.authService.onEnterAccessToken(ctx)) return;

      const { from } = ctx;

      await this.helperService.editOrSendMessage(
        ctx,
        `<b>💳 Web2 Logins</b>`,
        this.buildTradingOptions(from, backTo),
        backFrom,
      );
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onWeb2Logins error ${error?.message}`);
    }
  }
}
