import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { ConfigModule } from '@nestjs/config';
import { BotService } from './bot.service';
import { BotWalletsService } from './bot.wallets.service';
import { BotAuthService } from './bot.auth.service';
import { BotMenuService } from './bot.menu.service';
import { BotCallbackService } from './bot.callback.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './schemas/wallet.schema';
import { BotMessagesService } from './bot.message.service';
import { Job, JobSchema } from './schemas/job.schema';
import { UserBot, UserBotSchema } from './schemas/user-bot.schema';
import { UsersModule } from '../users/users.module';
import { BotTokensService } from './bot.tokens.service';
import { ClientsModule } from '../clients/clients.module';
import { BotPollService } from './bot.poll.service';
import { BotAboutService } from './bot.about.service';
import { BotBackService } from './bot.back.service';
import { BotHelperService } from './bot.helper.service';
import { BotWeb2LoginsService } from './bot.web2-logins.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserBot.name, schema: UserBotSchema },
      { name: Job.name, schema: JobSchema },
      { name: Wallet.name, schema: WalletSchema },
    ]),
    ConfigModule,
    UsersModule,
    ClientsModule,
  ],
  providers: [
    BotService,
    BotHelperService,
    BotCallbackService,
    BotBackService,
    BotMessagesService,
    BotAuthService,
    BotMenuService,
    BotAboutService,
    BotWalletsService,
    BotWeb2LoginsService,
    BotTokensService,
    BotPollService,
    BotUpdate,
  ],
  exports: [
    BotService,
    BotHelperService,
    BotCallbackService,
    BotBackService,
    BotMessagesService,
    BotAuthService,
    BotMenuService,
    BotAboutService,
    BotWalletsService,
    BotWeb2LoginsService,
    BotTokensService,
    BotPollService,
  ],
})
export class BotModule {}
