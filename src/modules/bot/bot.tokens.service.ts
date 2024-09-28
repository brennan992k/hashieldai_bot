/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, InjectBot, Message } from 'nestjs-telegraf';
import { Scenes, Telegraf } from 'telegraf';
import { BotService } from './bot.service';
import { ethers } from 'ethers';
import { CommonLogger } from 'src/common/logger';
import { chains } from 'src/data/chains';
import { ChainId } from 'src/app.type';

@Injectable()
export class BotTokensService {
  constructor(
    @InjectBot()
    protected readonly bot: Telegraf<Scenes.SceneContext>,
    protected readonly configService: ConfigService,
    protected readonly service: BotService,
  ) {}

  async onToken(@Ctx() ctx, @Message() message) {
    try {
      const tokenAddress = message.text?.trim().toLowerCase();
      const ChainData = chains[ChainId.Arbitrum];
      const token = chains[ChainId.Arbitrum].tokens[tokenAddress];

      if (!ethers.isAddress(tokenAddress) || !token) return;

      let reply = `<b>🔎  <a href="${ChainData.chart}${token.address}">${token.name} (${token.symbol}) 📈</a> 🔍</b>`;
      reply += `\n<b>CA:</b> <code>${token.address}</code>`;
      reply += `\n<b>Supply:</b> -- ⬩ <b>Decimals:</b> ${token.decimals}`;

      await this.service.reply(ctx, message);
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onToken ${error?.message}`);
    }
  }
}
