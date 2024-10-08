/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, InjectBot, Message } from 'nestjs-telegraf';
import { CommonLogger } from 'src/common/logger';
import { Context, Scenes, Telegraf } from 'telegraf';
import { BotService } from './bot.service';
import { User } from 'telegraf/typings/core/types/typegram';
import { CallbackData, CallbackDataKey, JobAction, JobStatus } from './types';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet } from './schemas/wallet.schema';
import { Job } from './schemas/job.schema';
import { isEmpty } from 'class-validator';
import { ethers } from 'ethers';
import { BotAuthService } from './bot.auth.service';
import {
  decryptData,
  encryptData,
  shortenWalletAddress,
} from 'src/common/utils/web3';
import { ChainData, ChainId } from 'src/app.type';
import { chains } from 'src/data/chains';
import { BotHelperService } from './bot.helper.service';

type EnterWalletNameJobParams = {
  deleteMessageId: number;
  editMessageId: number;
  chainId: ChainId;
  isConnect: boolean;
};

type EnterWalletPrivateKeyJobParams = {
  deleteMessageId: number;
  editMessageId: number;
  chainId: ChainId;
  walletName: string;
};

@Injectable()
export class BotWalletsService {
  constructor(
    @InjectBot()
    protected readonly bot: Telegraf<Scenes.SceneContext>,
    @InjectModel(Wallet.name)
    protected readonly walletModel: Model<Wallet>,
    @InjectModel(Job.name)
    protected readonly jobModel: Model<Job>,
    @Inject(forwardRef(() => BotAuthService))
    protected readonly authService: BotAuthService,
    protected readonly configService: ConfigService,
    protected readonly helperService: BotHelperService,
    protected readonly service: BotService,
  ) {}

  public async onEnteredWalletPrivateKey(
    @Ctx() ctx: Context,
    @Message() message,
    job: Job,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ): Promise<JobStatus> {
    const { chat } = ctx;
    try {
      const { editMessageId, deleteMessageId, chainId, walletName } =
        JSON.parse(job.params) as EnterWalletPrivateKeyJobParams;
      const chain: ChainData = chains[chainId];

      if (!chain) {
        throw new BadRequestException('The chain is not support.');
      }

      if (!message.text || isEmpty(message.text)) {
        throw new BadRequestException('Private key is invalid.');
      }

      const _wallet = new ethers.Wallet(message.text, chain.rpcProvider);
      if (!_wallet) {
        throw new BadRequestException('Private key is invalid.');
      }

      const securityKey = this.configService.get('securityKey');

      const wallet = await this.createWallet({
        telegramUserId: job.telegramUserId,
        chainId,
        name: walletName,
        address: _wallet.address,
        privateKey: encryptData(
          _wallet.privateKey,
          `${securityKey}_${_wallet.address}_${job.telegramUserId}`,
        ),
      });

      if (!wallet) {
        throw new InternalServerErrorException('Can not create wallet.');
      }

      this.onCreatedWallet(ctx, editMessageId, wallet, backFrom, backTo);

      this.service.deleteMessage(ctx, chat.id, deleteMessageId);

      return JobStatus.done;
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onEnteredWalletPrivateKey error ${error.message}`,
      );

      return JobStatus.inProcess;
    } finally {
      this.service.deleteMessage(ctx, chat.id, message.message_id);
    }
  }

  public async onCreatedWallet(
    @Ctx() ctx: Context,
    editMessageId: number,
    wallet: Wallet,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      const { chat } = ctx;
      const securityKey = this.configService.get('securityKey');
      const walletPrivateKey = decryptData(
        wallet.privateKey,
        `${securityKey}_${wallet.address}_${wallet.telegramUserId}`,
      );

      const balance = await this.getBalance(wallet);

      const chain: ChainData = chains[wallet.chainId];

      await this.service.editMessage(
        ctx,
        chat.id,
        editMessageId,
        this.helperService.buildLinesMessage([
          `<b>💚 Wallet Created Successfully</b>\n`,
          `<b>Name:</b> ${wallet.name}`,
          `<b>Balance:</b> ${balance} ${chain.native.symbol}`,
          `<b>Address:</b> <code>${wallet.address}</code>`,
          `<b>Private Key:</b> <code>${walletPrivateKey}</code>`,
          `<a href="${chain.explorer.root}${chain.explorer.address}${wallet.address}">View on ${chain.explorer.name}</a>\n`,
          `<b>⚠️ Warning:</b>\n`,
          '<i>SAVE YOUR PRIVATE KEY.</i>',
          '<i>IF YOU WILL DELETE THIS MESSAGE, WE WILL NOT SHOW YOUR YOUR PRIVATE KEY AGAIN.</i>',
          '<i>YOU CAN PRESS REFRESH BUTTON TO HIDE PRIVATE KEY.</i>',
        ]),
        this.buildSelectWalletOptions(ctx, wallet, backTo),
      );
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onCreatedWallet error ${error?.message}`);
    }
  }

  private async onEnterWalletPrivateKey(
    @Ctx() ctx,
    chainId: ChainId,
    editMessageId,
    walletName: string,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      CommonLogger.instance.debug(`onEnterWalletPrivateKey chainId ${chainId}`);

      const { from } = ctx;
      const deleteMessage = await this.service.reply(
        ctx,
        `Reply to this message with your desired private key`,
        {
          reply_markup: {
            force_reply: true,
          },
        },
      );

      const params: EnterWalletPrivateKeyJobParams = {
        deleteMessageId: deleteMessage.message_id,
        editMessageId,
        chainId,
        walletName,
      };

      const job = await this.jobModel.create({
        telegramUserId: from.id,
        action: JobAction.enterWalletPrivateKey,
        status: JobStatus.inProcess,
        params: JSON.stringify(params),
        timestamp: new Date().getTime(),
      });

      CommonLogger.instance.debug(
        `onEnterWalletPrivateKey ${JSON.stringify(job)}`,
      );

      if (!job) {
        throw new InternalServerErrorException('Cant not create the job.');
      }
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onEnterWalletPrivateKey error ${error?.message}`,
      );
    }
  }

  public async onEnteredWalletName(
    @Ctx() ctx: Context,
    @Message() message,
    job: Job,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ): Promise<JobStatus> {
    const { chat } = ctx;
    try {
      const { deleteMessageId, editMessageId, chainId, isConnect } = JSON.parse(
        job.params,
      ) as EnterWalletNameJobParams;
      const chain: ChainData = chains[chainId];

      if (!chain) {
        throw new BadRequestException('The chain is not support.');
      }

      if (!message.text || isEmpty(message.text)) {
        throw new BadRequestException('The wallet name is invalid.');
      }

      if (isConnect) {
        await this.onEnterWalletPrivateKey(
          ctx,
          chainId,
          editMessageId,
          message.text,
        );
      } else {
        const _wallet = ethers.Wallet.createRandom(chain.rpcProvider);

        CommonLogger.instance.debug(
          `onEnteredWalletName ${JSON.stringify(_wallet)}`,
        );

        const securityKey = this.configService.get('securityKey');

        const wallet = await this.createWallet({
          telegramUserId: job.telegramUserId,
          chainId,
          name: message.text,
          address: _wallet.address,
          privateKey: encryptData(
            _wallet.privateKey,
            `${securityKey}_${_wallet.address}_${job.telegramUserId}`,
          ),
        });

        if (!wallet) {
          throw new InternalServerErrorException('Can not create the wallet.');
        }

        this.onCreatedWallet(ctx, editMessageId, wallet, backFrom, backTo);
      }

      this.service.deleteMessage(ctx, chat.id, deleteMessageId);

      return JobStatus.done;
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onEnteredWalletName error ${error.message}`);

      return JobStatus.inProcess;
    } finally {
      this.service.deleteMessage(ctx, chat.id, message.message_id);
    }
  }

  private async onEnterWalletName(
    @Ctx() ctx,
    chainId: ChainId,
    isConnect: boolean,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      CommonLogger.instance.debug(`onEnterWalletName chainId ${chainId}`);

      const { from, update } = ctx;
      const { message: editMessage } = update.callback_query;

      const deleteMessage = await this.service.reply(
        ctx,
        `Reply to this message with your desired wallet name`,
        {
          reply_markup: {
            force_reply: true,
          },
        },
      );

      const params: EnterWalletNameJobParams = {
        deleteMessageId: deleteMessage.message_id,
        editMessageId: editMessage.message_id,
        chainId,
        isConnect,
      };

      const job = await this.jobModel.create({
        telegramUserId: from.id,
        action: JobAction.enterWalletName,
        status: JobStatus.inProcess,
        params: JSON.stringify(params),
        timestamp: new Date().getTime(),
      });

      CommonLogger.instance.debug(`onEnterWalletName ${JSON.stringify(job)}`);

      if (!job) {
        throw new InternalServerErrorException('Cant not create job.');
      }
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onEnterWalletName error ${error?.message}`);
    }
  }

  public async onGenerateWallet(
    @Ctx() ctx: Context,
    chainId: ChainId,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    this.onEnterWalletName(ctx, chainId, false, backFrom, backTo);
  }

  public async onConnectWallet(
    @Ctx() ctx: Context,
    chainId: ChainId,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    this.onEnterWalletName(ctx, chainId, true, backFrom, backTo);
  }

  private buildGenerateWalletOptionsWith(
    from: User,
    chainId: ChainId,
    backTo?: CallbackDataKey,
  ) {
    return {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🔗 Connect wallet',
              callback_data: new CallbackData<ChainId>(
                CallbackDataKey.connectWallet,
                chainId,
              ).toJSON(),
            },
            {
              text: '🤖 Generate wallet',
              callback_data: new CallbackData<ChainId>(
                CallbackDataKey.generateWallet,
                chainId,
              ).toJSON(),
            },
          ],
          this.helperService.buildBacKAndCloseButtons(backTo),
        ],
      },
    };
  }

  public async onCreateWallet(
    @Ctx() ctx: Context,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      const { from } = ctx;
      const reply = this.helperService.buildLinesMessage([
        `<b>💰Wallets - Create Wallet</b>`,
      ]);
      const chainId = ChainId.Ethereum;
      await this.helperService.editOrSendMessage(
        ctx,
        reply,
        this.buildGenerateWalletOptionsWith(from, chainId, backTo),
        backFrom,
      );
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onWalletWith error ${error?.message}`);
    }
  }

  public async onDeleteWallet(
    @Ctx() ctx: Context,
    walletId: string,
    backFrom: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    const { from } = ctx;
    try {
      const wallet = await this.walletModel
        .findOne({
          _id: walletId,
          telegramUserId: from.id,
        })
        .exec();

      if (!wallet) {
        throw new InternalServerErrorException('The wallet is not found.');
      }

      const total = await this.walletModel
        .countDocuments({
          telegramUserId: from.id,
        })
        .exec();

      if (wallet.isDefault && total > 1) {
        throw new BadRequestException('The wallet is using.');
      }

      const { deletedCount } = await this.walletModel
        .deleteOne({
          _id: walletId,
          telegramUserId: from.id,
        })
        .exec();

      if (deletedCount < 1) {
        throw new InternalServerErrorException('Can not delete the wallet.');
      }

      this.onWallets(ctx, backFrom);

      this.service.shortReply(ctx, `💚 Deleted successfully.`);
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onDeleteWallet error ${error?.message}`);
    }
  }

  public async onRefreshWallet(
    @Ctx() ctx: Context,
    walletId: string,
    refreshFrom: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      this.onSelectWallet(ctx, walletId, refreshFrom, backTo);

      this.service.shortReply(ctx, `💚 Refreshed successfully.`);
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onRefreshWallet error ${error?.message}`);
    }
  }

  public async onSetWalletDefault(
    @Ctx() ctx: Context,
    walletId: string,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      const wallet = await this.walletModel.findOne({ _id: walletId }).exec();

      if (!wallet) {
        throw new BadRequestException('Wallet is not found.');
      }

      const isSetDefault = await this.setDefaultWallet(wallet);

      if (!isSetDefault) return;

      this.onWallets(ctx, backFrom, backTo);

      this.service.shortReply(ctx, '💚 The wallet is used successfully.');
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onSetWalletDefault error ${error?.message}`);
    }
  }

  public async setDefaultWallet(wallet: Wallet): Promise<boolean> {
    try {
      const { modifiedCount: modifiedCount1 } = await this.walletModel
        .updateMany(
          {
            telegramUserId: wallet.telegramUserId,
          },
          { isDefault: false },
        )
        .exec();
      if (modifiedCount1 < 1) return false;

      const { modifiedCount: modifiedCount2 } = await this.walletModel
        .updateOne(
          {
            _id: wallet._id,
          },
          { isDefault: true },
        )
        .exec();

      return modifiedCount2 > 0;
    } catch (error) {
      CommonLogger.instance.error(`setDefaultWallet error ${error?.message}`);
      return false;
    }
  }

  private buildSelectWalletOptions(
    @Ctx() ctx: Context,
    wallet: Wallet,
    backTo?: CallbackDataKey,
  ) {
    let inline_keyboard = [
      [
        {
          text: '🗑 Delete',
          callback_data: new CallbackData<string>(
            CallbackDataKey.deleteWallet,
            `${wallet._id.toString()}`,
          ).toJSON(),
        },
        {
          text: '🔄 Refresh',
          callback_data: new CallbackData<string>(
            CallbackDataKey.refreshWallet,
            `${wallet._id.toString()}`,
          ).toJSON(),
        },
      ],
      this.helperService.buildBacKAndCloseButtons(
        backTo,
        wallet._id.toString(),
      ),
    ];

    if (!wallet.isDefault) {
      inline_keyboard = [
        [
          {
            text: 'Use wallet',
            callback_data: new CallbackData<string>(
              CallbackDataKey.setWalletDefault,
              `${wallet._id.toString()}`,
            ).toJSON(),
          },
        ],
        ...inline_keyboard,
      ];
    }
    return {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard,
      },
    };
  }

  public async onSelectWallet(
    @Ctx() ctx: Context,
    walletId: string,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      const wallet = await this.walletModel.findOne({ _id: walletId }).exec();

      if (!wallet) {
        throw new BadRequestException('Wallet is not found.');
      }

      const balance = await this.getBalance(wallet);

      const chain: ChainData = chains[wallet.chainId];

      const reply = this.helperService.buildLinesMessage([
        `<b>💰Wallets - ${wallet.name}</b>`,
        `<b>Balance:</b> ${balance} ${chain.native.symbol}`,
        `<b>Withdraw Gas Cost:</b> ${balance} ${chain.native.symbol}`,
        `<b>Balance Available to Withdraw:</b> -0.00121 ${chain.native.symbol}`,
        `<b>Address:</b> <code>${wallet.address}</code>`,
        `<a href="${chain.explorer.root}${chain.explorer.address}${wallet.address}">View on ${chain.explorer.name}</a>`,
      ]);

      await this.helperService.editOrSendMessage(
        ctx,
        reply,
        this.buildSelectWalletOptions(ctx, wallet, backTo),
        backFrom,
      );
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onSelectWallet error ${error?.message}`);
    }
  }

  private buildWalletsOptions(
    @Ctx() ctx: Context,
    wallets: Wallet[],
    balances: Record<string, number>,
    backTo?: CallbackDataKey,
  ) {
    return {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          ...wallets.map((wallet) => {
            const chain: ChainData = chains[wallet.chainId];
            return [
              {
                text: `${wallet.isDefault ? '✅' : ''} ${wallet.name} (${
                  wallet.address
                    ? shortenWalletAddress(wallet.address)
                    : 'Unknown'
                }) - balance: ${balances[wallet.address]} ${
                  chain.native.symbol
                }`,
                callback_data: new CallbackData<string>(
                  CallbackDataKey.selectWallet,
                  `${wallet._id}`,
                ).toJSON(),
              },
            ];
          }),
          [
            {
              text: '➕ Create wallet',
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.createWallet,
                CallbackDataKey.wallets,
              ).toJSON(),
            },
            {
              text: '🔄 Refresh',
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.refreshWallets,
                CallbackDataKey.wallets,
              ).toJSON(),
            },
          ],
          this.helperService.buildBacKAndCloseButtons(backTo),
        ],
      },
    };
  }

  public async onRefreshWallets(
    @Ctx() ctx: Context,
    refreshFrom: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      this.onWallets(ctx, refreshFrom, backTo);

      this.service.shortReply(ctx, `💚 Refreshed successfully.`);
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onRefreshWallets error ${error?.message}`);
    }
  }

  public async onWallets(
    @Ctx() ctx: Context,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      if (await this.authService.onEnterAccessToken(ctx)) return;

      const wallets = await this.getWallets(ctx);

      const balances = await this.getBalances(wallets);

      await this.helperService.editOrSendMessage(
        ctx,
        `<b>💰Wallets - You have ${
          wallets.length < 2
            ? `${wallets.length} wallet`
            : `${wallets.length} wallets`
        }</b>`,
        this.buildWalletsOptions(ctx, wallets, balances, backTo),
        backFrom,
      );
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onWallets error ${error?.message}`);
    }
  }

  public async getDefaultWallet(@Ctx() ctx: Context) {
    try {
      const { chat, from } = ctx;
      return await this.walletModel.findOne({
        telegramUserId: from.id,
        isDefault: true,
      });
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`getDefaultWallet error ${error?.message}`);
      return;
    }
  }

  public async getWallets(@Ctx() ctx: Context) {
    try {
      const { from } = ctx;
      return await this.walletModel.find({ telegramUserId: from.id });
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`getWallets error ${error?.message}`);
      return [];
    }
  }

  private async createWallet(data: {
    telegramUserId: number;
    chainId: number;
    name: string;
    address: string;
    privateKey: string;
  }): Promise<Wallet> {
    const { telegramUserId, chainId, name, address } = data;

    const existingWallet = await this.walletModel
      .findOne({
        telegramUserId,
        chainId,
        address,
      })
      .exec();

    if (!!existingWallet) {
      const { modifiedCount } = await this.walletModel
        .updateOne({ _id: existingWallet._id }, { name })
        .exec();

      if (modifiedCount > 0) return { ...existingWallet, name };

      return existingWallet;
    }

    const defaultWallet = await this.walletModel
      .findOne({
        telegramUserId: data.telegramUserId,
        isDefault: true,
      })
      .exec();

    return await this.walletModel.create(
      !defaultWallet
        ? {
            ...data,
            isDefault: true,
          }
        : data,
    );
  }

  public async getBalances(wallets: Wallet[]): Promise<Record<string, number>> {
    let balances = Array(wallets.length).map(() => 0);

    try {
      balances = await Promise.all(wallets.map((_) => this.getBalance(_)));
    } catch (error) {
      CommonLogger.instance.error(`getBalances error ${error?.message}`);
    }

    return wallets.reduce<Record<string, number>>((_, item, index) => {
      _[item.address] = balances[index];
      return _;
    }, {});
  }

  public async getBalance(wallet: Wallet): Promise<number> {
    try {
      const chain: ChainData = chains[wallet.chainId];

      if (!chain) throw new BadRequestException('The chain is not supported.');

      const _ = await chain.rpcProvider.getBalance(wallet.address);
      return parseFloat(
        ethers.formatUnits(_, chain.native.decimals).slice(0, 9),
      );
    } catch (error) {
      CommonLogger.instance.error(`getBalance error ${error?.message}`);
    }

    return 0;
  }
}
