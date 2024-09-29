/* eslint-disable @typescript-eslint/no-unused-vars */
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Ctx, InjectBot } from 'nestjs-telegraf';
import { Scenes, Telegraf } from 'telegraf';
import { CallbackData, CallbackDataKey } from './types';
import { BotService } from './bot.service';
import { CommonLogger } from 'src/common/logger';

@Injectable()
export class BotHelperService {
  constructor(
    @InjectBot()
    protected readonly bot: Telegraf<Scenes.SceneContext>,
    @Inject(forwardRef(() => BotService))
    protected readonly service: BotService,
  ) {}

  public buildTable(headers: string[], data: any[][]) {
    // Create an HTML table string inside <pre> tags
    let table = '';

    // Add headers
    if (headers.length > 0) {
      table +=
        headers.map((header) => this.padCell(header, 10)).join(' | ') + '\n';
      table += headers.map(() => '----------').join(' | ') + '\n'; // Separator
    }

    // Add data rows
    data.forEach((row) => {
      table +=
        row
          .map((cell, index) => this.padCell(cell, index === 0 ? 10 : 3))
          .join(' | ') + '\n';
    });

    table += '';
    return table;
  }

  // Helper method to pad cells for alignment
  private padCell(cell: string, length: number): string {
    // Ensure length is a non-negative integer
    if (typeof length !== 'number' || length < 0 || !isFinite(length)) {
      CommonLogger.instance.warn(`Invalid length value: ${length}`); // Log for debugging
      return cell; // Return the original cell if the length is invalid
    }

    // Return the padded cell
    return cell + ' '.repeat(Math.max(0, length - this.stripHtml(cell).length));
  }

  private stripHtml(html: string): string {
    // Use a regular expression to match and remove HTML tags
    return html.replace(/<[^>]*>/g, '').trim();
  }

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
