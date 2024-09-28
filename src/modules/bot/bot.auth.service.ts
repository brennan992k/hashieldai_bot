/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, InjectBot, Message } from 'nestjs-telegraf';
import { CommonLogger } from 'src/common/logger';
import { Context, Scenes, Telegraf } from 'telegraf';
import { BotService } from './bot.service';
import { JobAction, JobStatus } from './types';
import { InjectModel } from '@nestjs/mongoose';
import { UserBot } from './schemas/user-bot.schema';
import { Model } from 'mongoose';
import { Job } from './schemas/job.schema';
import { isEmpty } from 'class-validator';
import { UsersService } from '../users/users.service';
import { BotMenuService } from './bot.menu.service';
import { ClientsService } from '../clients/clients.service';
import { AuthType } from 'src/configuration/configuration';
import { User } from '../users/schemas/user.schema';
import { Client } from '../clients/schemas/client.schema';

@Injectable()
export class BotAuthService {
  constructor(
    @InjectBot()
    protected readonly bot: Telegraf<Scenes.SceneContext>,
    @InjectModel(UserBot.name)
    protected readonly userBotModel: Model<UserBot>,
    @InjectModel(Job.name)
    protected readonly jobModel: Model<Job>,
    @Inject(forwardRef(() => BotService))
    protected readonly service: BotService,
    @Inject(forwardRef(() => BotMenuService))
    protected readonly menuService: BotMenuService,
    protected readonly configService: ConfigService,
    protected readonly usersService: UsersService,
    protected readonly clientsService: ClientsService,
  ) {}

  public async onEnteredAccessToken(
    @Ctx() ctx: Context,
    @Message() message,
    job: Job,
  ): Promise<JobStatus> {
    try {
      if (job.action != JobAction.enterUserId) {
        throw new BadRequestException('Job is invalid');
      }

      CommonLogger.instance.debug(
        `onEnteredAccessToken message: ${JSON.stringify(
          message,
        )}, job: ${JSON.stringify(job)}`,
      );

      const [_telegramUserId] = job.params.split('_');
      const telegramUserId = parseInt(_telegramUserId);

      if (telegramUserId != message.from.id) {
        throw new BadRequestException('User do not have permissions.');
      }

      if (isEmpty(message.text)) {
        throw new BadRequestException('Token is invalid.');
      }

      const type = this.configService.get('auth.type') as AuthType;

      let auth: User | Client;

      switch (type) {
        case AuthType.client:
          auth = await this.clientsService.validateToken(message.text);
          break;
        default:
          auth = await this.usersService.validateToken(message.text);
          break;
      }

      if (!auth) {
        throw new BadRequestException('Token is invalid.');
      }

      let botUser = await this.userBotModel
        .findOne({
          userId: auth._id,
          telegramUserId,
        })
        .exec();

      if (!botUser) {
        botUser = await this.userBotModel.create({
          userId: auth._id,
          telegramUserId,
        });
      }

      if (!botUser) {
        throw new BadRequestException('Can not create bot for user.');
      }

      CommonLogger.instance.debug(
        `onEnteredAccessToken ${JSON.stringify(botUser)}`,
      );

      await this.service.shortReply(ctx, `💚 Verified!`);

      return JobStatus.done;
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.debug(
        `onEnteredAccessToken error ${error.message}`,
      );

      return JobStatus.inProcess;
    }
  }

  public async onEnterAccessToken(@Ctx() ctx: Context): Promise<boolean> {
    try {
      if (await this.isAuthenticated(ctx)) return false;

      const { chat, from } = ctx;
      const job = await this.jobModel.create({
        telegramUserId: from.id,
        action: JobAction.enterUserId,
        status: JobStatus.inProcess,
        params: from.id, /// telegramUserId
        timestamp: new Date().getTime(),
      });

      CommonLogger.instance.debug(`onEnterAccessToken ${JSON.stringify(job)}`);

      if (!job) throw new BadRequestException('Cant not create job');

      let reply = `Please enter the token from`;
      reply += ` <a href="${this.service.website.authUrl}">${this.service.website.authUrl}</a>`;

      await this.service.reply(ctx, reply, {
        reply_markup: {
          force_reply: true,
        },
      });

      return true;
    } catch (error) {
      CommonLogger.instance.error(`onEnterAccessToken error ${error?.message}`);
      return false;
    }
  }

  public async isAuthenticated(@Ctx() ctx: Context): Promise<boolean> {
    return true;
    try {
      const { chat, from } = ctx;
      const botUser = await this.userBotModel
        .findOne({ telegramUserId: from.id })
        .exec();

      CommonLogger.instance.debug(`isAuthenticated ${JSON.stringify(botUser)}`);

      return !!botUser;
    } catch (error) {
      CommonLogger.instance.error(`isAuthenticated error ${error?.message}`);
      return false;
    }
  }
}
