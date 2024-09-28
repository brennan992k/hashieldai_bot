/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, InjectBot } from 'nestjs-telegraf';
import { CommonLogger } from 'src/common/logger';
import { Context, Scenes, Telegraf } from 'telegraf';
import { BotService } from './bot.service';
import { BotAuthService } from './bot.auth.service';

@Injectable()
export class BotPollService {
  constructor(
    @InjectBot()
    protected readonly bot: Telegraf<Scenes.SceneContext>,
    protected readonly configService: ConfigService,
    protected readonly authService: BotAuthService,
    protected readonly service: BotService,
  ) {}

  public async sendPoll(@Ctx() ctx: Context) {
    try {
      // const question = "What's your favorite programming language?";
      // const options = ['Python', 'JavaScript', 'Java', 'C++', 'C#];
      // await this.service.replyWithPoll(ctx, question, options, {
      //   is_anonymous: true,
      //   allows_multiple_answers: true,
      // });
    } catch (error) {
      CommonLogger.instance.error(`sendPoll error ${error?.message}`);
    }
  }

  public async onPollAnswer(@Ctx() ctx: Context) {
    try {
      // const answer = ctx.pollAnswer;
      // const userId = answer.user.id;
      // const pollId = answer.poll_id;
      // const optionIds = answer.option_ids;
      // await this.service.reply(
      //   ctx,
      //   `Thank you for voting! You selected option ${optionIds}.`,
      // );
    } catch (error) {
      CommonLogger.instance.error(`onPollAnswer error ${error?.message}`);
    }
  }
}
