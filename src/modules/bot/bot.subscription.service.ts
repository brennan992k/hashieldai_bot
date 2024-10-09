/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, InjectBot } from 'nestjs-telegraf';
import { Context, Scenes, Telegraf } from 'telegraf';
import { BotService } from './bot.service';
import { BotAuthService } from './bot.auth.service';
import { BotHelperService } from './bot.helper.service';
import { BotWalletsService } from './bot.wallets.service';
import { CommonLogger } from 'src/common/logger';
import { Plan, SubscriptionData } from 'src/contracts/type';
import { ChainData, ChainId, Web3Address } from 'src/app.type';
import { chains } from 'src/data/chains';
import { decryptData, withoutDecimals } from 'src/common/utils/web3';
import { SubscriptionContract } from 'src/contracts/subscription.contract';
import { ethers } from 'ethers';
import { CommonCache } from 'src/common/cache';

@Injectable()
export class BotSubscriptionService {
  constructor(
    @InjectBot()
    protected readonly bot: Telegraf<Scenes.SceneContext>,
    protected readonly configService: ConfigService,
    protected readonly helperService: BotHelperService,
    protected readonly authService: BotAuthService,
    protected readonly walletsService: BotWalletsService,
    protected readonly service: BotService,
  ) {}

  private _cacheKeyPrefix = 'SUBSCRIPTION';

  private _buildCacheKey(walletAddress: Web3Address) {
    return `${this._cacheKeyPrefix}_${walletAddress}`;
  }

  public async onSubscription(
    @Ctx() ctx: Context,
    plan: Plan,
  ): Promise<boolean> {
    try {
      if (await this.isSubscribed(ctx, plan)) return false;

      const reply = this.helperService.buildLinesMessage([
        `You need to <a href="${this.service.website.subscriptionUrl}">subscribe</a> a plan to use this feature.`,
      ]);

      this.service.reply(ctx, reply, {
        reply_markup: {
          force_reply: true,
        },
      });

      return true;
    } catch (error) {
      CommonLogger.instance.error(`onSubscription error ${error?.message}`);
      return false;
    }
  }

  public async isSubscribed(@Ctx() ctx, plan: Plan) {
    try {
      const subscription = await this.getSubscription(ctx);

      const isStillExpired =
        withoutDecimals(subscription.expiredTime, 0) >=
        new Date().getTime() / 1000;

      return isStillExpired && plan <= subscription.plan;
    } catch (error) {
      CommonLogger.instance.error(`isSubscribed error ${error?.message}`);
      return false;
    }
  }

  private async getSubscription(
    @Ctx() ctx,
    sync = true,
  ): Promise<SubscriptionData> {
    const wallet = await this.walletsService.getDefaultWallet(ctx);
    if (!wallet) return;

    let subscription = CommonCache.instance.get(
      this._buildCacheKey(wallet.address),
    );

    if (sync || !subscription) {
      subscription = await (async () => {
        try {
          const chain: ChainData = chains[wallet.chainId];
          const securityKey = this.configService.get('securityKey');
          const privateKey = decryptData(
            wallet.privateKey,
            `${securityKey}_${wallet.address}_${wallet.telegramUserId}`,
          );
          console.log(privateKey, chain);
          const contract = new SubscriptionContract(
            wallet.chainId,
            new ethers.Wallet(privateKey, chain.rpcProvider),
          );

          return contract.getSubscription(wallet.address);
        } catch (error) {
          CommonLogger.instance.error(`getSubscription ${error?.message}`);
          return {
            plan: Plan.Basic,
            expiredTime: BigInt(0),
          };
        }
      })();
    }

    CommonLogger.instance.log(subscription);

    CommonCache.instance.set(this._buildCacheKey(wallet.address), subscription);

    return subscription;
  }
}
