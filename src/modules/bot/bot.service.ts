/* eslint-disable @typescript-eslint/no-unused-vars */
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, InjectBot, Message } from 'nestjs-telegraf';
// import { CommonLogger } from 'src/common/logger';
import { Context, Scenes, Telegraf } from 'telegraf';
import { BotAuthService } from './bot.auth.service';
import { ExtraDocument, ExtraPoll } from 'telegraf/typings/telegram-types';
import { CommonLogger } from 'src/common/logger';
import { File, InputFile } from 'telegraf/typings/core/types/typegram';

@Injectable()
export class BotService {
  constructor(
    @InjectBot()
    protected readonly bot: Telegraf<Scenes.SceneContext>,
    protected readonly configService: ConfigService,
    @Inject(forwardRef(() => BotAuthService))
    protected readonly authService: BotAuthService,
  ) {
    this.website = this.configService.get('website');
    this.botInfo = this.configService.get('telegram');
  }

  public readonly botInfo: {
    botName: string;
    botUser: string;
  };

  public readonly website: {
    url: string;
    docsUrl: string;
    authUrl: string;
    subscriptionUrl: string;
    telegramBot: string;
  };

  public async sendDocument(
    @Ctx() ctx: Context,
    document: string | InputFile,
    extra?: ExtraDocument,
  ) {
    try {
      return await ctx.sendDocument(document, { parse_mode: 'HTML', ...extra });
    } catch (error) {
      // CommonLogger.instance.error(
      //   `sendDocument error ${this._extractErrorMessage(error)}`,
      // );
    }
  }

  public async getFile(@Ctx() ctx: Context, fileId: string) {
    try {
      return await ctx.telegram.getFile(fileId);
    } catch (error) {
      // CommonLogger.instance.error(
      //   `getFile error ${this._extractErrorMessage(error)}`,
      // );
    }
  }

  public async getFileLink(@Ctx() ctx: Context, fileId: string | File) {
    try {
      return await ctx.telegram.getFileLink(fileId);
    } catch (error) {
      // CommonLogger.instance.error(
      //   `getFileLink error ${this._extractErrorMessage(error)}`,
      // );
    }
  }

  public async onClose(@Ctx() ctx: Context, @Message() message) {
    try {
      await this.deleteMessage(ctx, message.chat.id, message.message_id);
    } catch (error) {
      CommonLogger.instance.error(
        `onClose error ${this._extractErrorMessage(error)}`,
      );
    }
  }

  public async replyWithPoll(
    ctx,
    poll: string,
    options: readonly string[],
    extra?: ExtraPoll,
  ) {
    try {
      return await ctx.replyWithPoll(poll, options, extra);
    } catch (error) {
      // CommonLogger.instance.error(
      //   `replyWithPoll error ${this._extractErrorMessage(error)}`,
      // );
    }
  }

  public async reply(@Ctx() ctx: Context, reply: string, options = {}) {
    try {
      return await ctx.reply(reply, {
        parse_mode: 'HTML',
        ...options,
      });
    } catch (error) {
      // CommonLogger.instance.error(
      //   `shortReply error ${this._extractErrorMessage(error)}`,
      // );
    }
  }

  public async warningReply(
    @Ctx() ctx: Context,
    reply: string,
    time = 3000,
    options = {},
  ) {
    this.shortReply(ctx, `⚠️ ${reply}`, time, options);
  }

  public async shortReply(
    @Ctx() ctx: Context,
    reply: string,
    time = 3000,
    options = {},
  ) {
    try {
      const warningMessage = await ctx.reply(reply, {
        parse_mode: 'HTML',
        ...options,
      });
      const timer = setTimeout(() => {
        this.deleteMessage(
          ctx,
          warningMessage.chat.id,
          warningMessage.message_id,
        );
        clearTimeout(timer);
      }, time);

      return warningMessage;
    } catch (error) {
      // CommonLogger.instance.error(
      //   `shortReply error ${this._extractErrorMessage(error)}`,
      // );
    }
  }

  public async editMessage(
    @Ctx() ctx,
    chatId: number,
    messageId: number,
    reply: string,
    options = {},
  ) {
    try {
      return await ctx.telegram.editMessageText(
        chatId,
        messageId,
        messageId,
        reply,
        {
          parse_mode: 'HTML',
          ...options,
        },
      );
    } catch (error) {
      // CommonLogger.instance.error(
      //   `editMessage error ${this._extractErrorMessage(error)}`,
      // );
    }
  }

  public async deleteMessage(
    @Ctx() ctx: Context,
    chatId: number,
    messageId: number,
  ) {
    try {
      if (!chatId || !messageId) return;
      return await ctx.tg.deleteMessage(chatId, messageId);
    } catch (error) {
      // CommonLogger.instance.error(
      //   `deleteMessage error ${this._extractErrorMessage(error)}`,
      // );
    }
  }

  public async deleteMessages(
    @Ctx() ctx: Context,
    chatId: number,
    messageIds: Array<number>,
  ) {
    try {
      if (!chatId || messageIds.length < 1) return;
      return await Promise.all(
        messageIds.map((messageId) => ctx.tg.deleteMessage(chatId, messageId)),
      );
    } catch (error) {
      // CommonLogger.instance.error(
      //   `deleteMessages error ${this._extractErrorMessage(error)}`,
      // );
    }
  }

  protected _extractErrorMessage(error): string {
    let errorMessage = '⚠️ ';
    if (
      error.response &&
      error.response.data &&
      error.response.data.description
    ) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      errorMessage += error.response.data.description;
    } else if (
      error.response &&
      error.response.data &&
      error.response.data.message
    ) {
      errorMessage += error.response.data.message;
    } else if (error.info && error.info.error && error.info.error.message) {
      // Something happened in setting up the request that triggered an Error
      errorMessage += error.info.error.message;
    } else if (
      error.response &&
      error.response.data &&
      error.response.data.validationErrors &&
      error.response.data.validationErrors.length > 0
    ) {
      errorMessage += error.response.data.validationErrors[0]['reason'];
    } else if (
      error.response &&
      error.response.data &&
      error.response.data.reason
    ) {
      errorMessage += error.response.data.reason;
    } else {
      errorMessage += error.message;
    }

    return errorMessage;
  }
}
