/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, InjectBot, Message } from 'nestjs-telegraf';
import { CommonLogger } from 'src/common/logger';
import { Context, Scenes, Telegraf } from 'telegraf';
import { BotService } from './bot.service';
import { CallbackDataKey, JobAction, JobStatus } from './types';
import { InjectModel } from '@nestjs/mongoose';
import { Job } from './schemas/job.schema';
import { Model } from 'mongoose';
import { BotWalletsService } from './bot.wallets.service';
import { Message as IMessage } from 'telegraf/typings/core/types/typegram';
import { BotAuthService } from './bot.auth.service';
import { BotTokensService } from './bot.tokens.service';
import { BotWeb2LoginsService } from './bot.web2-logins.service';
import { BotDefiWalletsService } from './bot.defi-wallets.service';
import { BotAutoFillService } from './bot.auto-fill.service';
import { BotPasswordHealthService } from './bot.password-health.service';
import { BotWalletHealthService } from './bot.wallet-health.service';

@Injectable()
export class BotMessagesService {
  constructor(
    @InjectBot()
    protected readonly bot: Telegraf<Scenes.SceneContext>,
    @InjectModel(Job.name)
    protected readonly jobModel: Model<Job>,
    protected readonly configService: ConfigService,
    protected readonly service: BotService,
    protected readonly walletsService: BotWalletsService,
    protected readonly authService: BotAuthService,
    protected readonly web2LoginsService: BotWeb2LoginsService,
    protected readonly defiWalletsService: BotDefiWalletsService,
    protected readonly autoFillService: BotAutoFillService,
    protected readonly passwordHealthService: BotPasswordHealthService,
    protected readonly walletHealthService: BotWalletHealthService,
    protected readonly tokensService: BotTokensService,
  ) {}

  public async onMessage(@Ctx() ctx: Context, @Message() message: IMessage) {
    try {
      let status: JobStatus;

      const telegramUserId = message.from.id;

      const lastJob = await this.jobModel
        .findOne({ telegramUserId, status: JobStatus.inProcess })
        .sort({ timestamp: -1 })
        .exec();

      const timestamp = new Date().getTime();

      if (
        lastJob &&
        lastJob.timestamp + 1 * 60 * 30 * 1000 > timestamp /// only validate in 30 minutes
      ) {
        switch (lastJob.action) {
          case JobAction.enterUserId:
            status = await this.authService.onEnteredAccessToken(
              ctx,
              message,
              lastJob,
            );
            break;
          case JobAction.enterWalletName:
            status = await this.walletsService.onEnteredWalletName(
              ctx,
              message,
              lastJob,
              CallbackDataKey.wallets,
              CallbackDataKey.wallets,
            );
            break;
          case JobAction.enterWalletPrivateKey:
            status = await this.walletsService.onEnteredWalletPrivateKey(
              ctx,
              message,
              lastJob,
              CallbackDataKey.wallets,
              CallbackDataKey.wallets,
            );
            break;
          case JobAction.importDefiWallets:
            status = await this.defiWalletsService.onImportedDefiWallets(
              ctx,
              message,
              lastJob,
              CallbackDataKey.defiWallets,
              CallbackDataKey.defiWallets,
            );
            break;
          case JobAction.updateDefiWallet:
            status = await this.defiWalletsService.onEnteredUpdateDefiWallet(
              ctx,
              message,
              lastJob,
              CallbackDataKey.selectDefiWallet,
              CallbackDataKey.defiWallets,
            );
            break;
          case JobAction.importCredentials:
            status = await this.web2LoginsService.onImportedCredentials(
              ctx,
              message,
              lastJob,
              CallbackDataKey.web2Logins,
              CallbackDataKey.web2Logins,
            );
            break;
          case JobAction.updateCredential:
            status = await this.web2LoginsService.onEnteredToUpdateCredential(
              ctx,
              message,
              lastJob,
              CallbackDataKey.web2Logins,
              CallbackDataKey.web2Logins,
            );
            break;
          default:
            break;
        }

        if (lastJob) {
          if (status && status != JobStatus.inProcess) {
            this.jobModel.updateOne({ _id: lastJob._id }, { status });
          } else if (
            lastJob.timestamp + 1 * 60 * 30 * 1000 < timestamp &&
            lastJob.status == JobStatus.inProcess
          ) {
            this.jobModel.updateOne(
              { _id: lastJob._id },
              { status: JobStatus.cancel },
            );
          }
        }
      } else {
        this.tokensService.onToken(ctx, message);
      }
    } catch (error) {
      CommonLogger.instance.error(`onMessage error ${error?.message}`);
    }
  }
}
