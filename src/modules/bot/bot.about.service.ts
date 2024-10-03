/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, InjectBot } from 'nestjs-telegraf';
import { CommonLogger } from 'src/common/logger';
import { Scenes, Telegraf } from 'telegraf';
import { BotService } from './bot.service';
import { BotAuthService } from './bot.auth.service';
import { User } from 'telegraf/typings/core/types/typegram';
import { BotHelperService } from './bot.helper.service';
import { CallbackDataKey } from './types';

@Injectable()
export class BotAboutService {
  constructor(
    @InjectBot()
    protected readonly bot: Telegraf<Scenes.SceneContext>,
    protected readonly configService: ConfigService,
    protected readonly helperService: BotHelperService,
    protected readonly authService: BotAuthService,
    protected readonly service: BotService,
  ) {}

  private _socials = [
    {
      title: 'Website',
      link: 'https://hashieldai.com',
    },
    {
      title: 'Whitepaper',
      link: 'https://docs.hashieldai.com',
    },
    {
      title: 'Telegram',
      link: 'https://t.me/HashieldAI_Portal',
    },
    {
      title: 'X',
      link: 'https://x.com/HashieldAI',
    },
  ];

  private buildFAQOptions(from: User, backTo?: CallbackDataKey) {
    return {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [this.helperService.buildBacKAndCloseButtons(backTo)],
      },
    };
  }

  public async onAbout(
    @Ctx() ctx,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      const { from } = ctx;

      const reply = this.helperService.buildLinesMessage([
        `<b>ℹ️ About HashieldAI</b>\n`,
        'Control your access. Secure your passwords. Defend your data.\n',
        ...this._socials.map(
          (item, index) =>
            `<b>${item.title}</b>: <a href="${item.link}">${item.link}</a>`,
        ),
      ]);

      await this.helperService.editOrSendMessage(
        ctx,
        reply,
        this.buildFAQOptions(from, backTo),
        backFrom,
      );
    } catch (error) {
      CommonLogger.instance.error(`onFAQ error ${error?.message}`);
    }
  }
}
