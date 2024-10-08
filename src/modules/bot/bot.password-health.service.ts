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
import { BotSubscriptionService } from './bot.subscription.service';
import { Plan } from 'src/contracts/type';

@Injectable()
export class BotPasswordHealthService {
  constructor(
    @InjectBot()
    protected readonly bot: Telegraf<Scenes.SceneContext>,
    protected readonly configService: ConfigService,
    protected readonly authService: BotAuthService,
    protected readonly subtionService: BotSubscriptionService,
    protected readonly helperService: BotHelperService,
    protected readonly service: BotService,
  ) {}
  private buildPasswordHealthOptions(from: User, backTo?: CallbackDataKey) {
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

  public async onPasswordHealth(
    @Ctx() ctx: Context,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      if (await this.authService.onEnterAccessToken(ctx)) return;

      if (await this.subtionService.onSubscription(ctx, Plan.Pro)) return;

      this.service.reply(ctx, 'Coming soon...');
      return;

      const { from } = ctx;

      await this.helperService.editOrSendMessage(
        ctx,
        `<b>💳 Web2 Logins</b>`,
        this.buildPasswordHealthOptions(from, backTo),
        backFrom,
      );
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onAutoFill error ${error?.message}`);
    }
  }
}
