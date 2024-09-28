/* eslint-disable @typescript-eslint/no-unused-vars */
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Ctx, InjectBot } from 'nestjs-telegraf';
import { Scenes, Telegraf } from 'telegraf';
import { CallbackData, CallbackDataKey } from './types';
import { BotService } from './bot.service';

@Injectable()
export class BotHelperService {
  constructor(
    @InjectBot()
    protected readonly bot: Telegraf<Scenes.SceneContext>,
    @Inject(forwardRef(() => BotService))
    protected readonly service: BotService,
  ) {}

  public buildBacKAndCloseButtons(backTo?: CallbackDataKey) {
    let buttons = [
      {
        text: '❌ Close',
        callback_data: new CallbackData<any>(
          CallbackDataKey.close,
          null,
        ).toJSON(),
      },
    ];

    if (backTo) {
      buttons = [
        {
          text: '⬅️ Back',
          callback_data: new CallbackData<string>(
            CallbackDataKey.back,
            backTo,
          ).toJSON(),
        },
        ...buttons,
      ];
    }

    return buttons;
  }

  public async editOrSendMessage(
    @Ctx() ctx,
    reply,
    options,
    backFrom?: CallbackDataKey,
  ) {
    const { chat, update } = ctx;

    if (backFrom && update) {
      const {
        callback_query: { message },
      } = update;

      await this.service.editMessage(
        ctx,
        chat.id,
        message.message_id,
        reply,
        options,
      );

      return message;
    } else {
      return await this.service.reply(ctx, reply, options);
    }
  }

  public buildLinesMessage(lines: Array<string>) {
    return lines.reduce(
      (message, line, index) => (message += `${index == 0 ? '' : '\n'}${line}`),
      '',
    );
  }
}
