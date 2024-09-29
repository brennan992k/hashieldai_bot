/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, InjectBot, Message } from 'nestjs-telegraf';
import { CommonLogger } from 'src/common/logger';
import { Context, Scenes, Telegraf } from 'telegraf';
import { BotService } from './bot.service';
import { BotAuthService } from './bot.auth.service';
import { CallbackData, CallbackDataKey, JobAction, JobStatus } from './types';
import { BotHelperService } from './bot.helper.service';
import { BotWalletsService } from './bot.wallets.service';
import {
  DefiWallet,
  DefiWalletParams,
  HashieldAIRepository,
  Wallet,
} from 'src/repositories/hashield-ai.repository';
import { ChainId, Web3Address } from 'src/app.type';
import { CommonCache } from 'src/common/cache';
import { ethers } from 'ethers';
import { chains } from 'src/data/chains';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from './schemas/job.schema';
import { isEmpty } from 'class-validator';
import { XLSXUtils } from 'src/common/utils/xlsx';
import { validator } from 'src/common/utils/validator';

type EnterWalletOfDefiWalletNameJobParams = {
  deleteMessageId: number;
  editMessageId: number;
  defiWalletId: string;
  walletIndex: number;
};

type EnterDefiWalletOrganizationJobParams = {
  deleteMessageId: number;
  editMessageId: number;
  defiWalletId: string;
};

type ImportDefiWalletJobParams = {
  deleteMessageId: number;
  editMessageId: number;
};

@Injectable()
export class BotDefiWalletsService {
  constructor(
    @InjectBot()
    protected readonly bot: Telegraf<Scenes.SceneContext>,
    @InjectModel(Job.name)
    protected readonly jobModel: Model<Job>,
    protected readonly configService: ConfigService,
    protected readonly walletsService: BotWalletsService,
    protected readonly authService: BotAuthService,
    protected readonly helperService: BotHelperService,
    protected readonly service: BotService,
  ) {}

  private _cacheKeyPrefix = 'DEFI_WALLETS';
  private _buildCacheKey(walletAddress: Web3Address) {
    return `${this._cacheKeyPrefix}_${walletAddress}`;
  }
  private _templateHeader = [
    { title: 'Organization', key: 'organization' },
    { title: 'Seed Phrase', key: 'seedPhrase' },
    { title: 'Wallet 1', key: 'wallet1' },
    { title: 'Wallet 2', key: 'wallet2' },
    { title: 'Wallet 3', key: 'wallet3' },
  ];
  private _templateData = [
    {
      organization: 'Your organization',
      seedPhrase:
        'apple, orange, banana, grape, lemon, cherry, peach, mango, plum, kiwi, raspberry, watermelon',
      wallet1:
        'Example Wallet 1 Name,0x4c0883a69102937d62394728a8c0d8f1b7c8312b7d39b9b6d0aa9151c147e91e',
      wallet2:
        'Example Wallet 2 Name,0x4c0883a69102937d62394728a8c0d8f1b7c8312b7d39b9b6d0aa9151c147e91d',
      wallet3:
        'Example Wallet 3 Name,0x4c0883a69102937d62394728a8c0d8f1b7c8312b7d39b9b6d0aa9151c147e91f',
    },
  ];

  public async onDeleteWalletOfDefiWallet(
    @Ctx() ctx: Context,
    defiWalletId: string,
    walletIndex: number,
    backFrom: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      const defiWallet = await this.getDefiWallet(ctx, defiWalletId);

      if (!defiWallet) {
        throw new BadRequestException('The defi wallet is not found.');
      }

      const isDeleted = await this.updateDefiWallet(ctx, defiWalletId, {
        ...defiWallet,
        wallets: defiWallet.wallets.reduce(
          (list, { wallet_name, private_key }, index) => {
            if (index != walletIndex) {
              list.push({
                wallet_name,
                private_key:
                  HashieldAIRepository.instance.decryptData(private_key),
              });
            }
            return list;
          },
          [],
        ),
      });

      if (!isDeleted) {
        throw new InternalServerErrorException('Can not delete the wallet.');
      }

      await this.onSelectDefiWallet(ctx, defiWalletId, backFrom, backTo);

      this.service.shortReply(ctx, `💚 Deleted successfully.`);
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onDeleteWalletOfDefiWallet error ${error?.message}`,
      );
    }
  }

  public async onRefreshWalletOfDefiWallet(
    @Ctx() ctx: Context,
    defiWalletId: string,
    walletIndex: number,
    refreshFrom: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      await this.onSelectWalletOfDefiWallet(
        ctx,
        defiWalletId,
        walletIndex,
        refreshFrom,
        backTo,
      );

      this.service.shortReply(ctx, `💚 Refreshed successfully.`);
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onRefreshWalletOfDefiWallet error ${error?.message}`,
      );
    }
  }

  public async onEnteredWalletOfDefiWalletName(
    @Ctx() ctx: Context,
    @Message() message,
    job: Job,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ): Promise<JobStatus> {
    const { chat } = ctx;
    try {
      const { deleteMessageId, editMessageId, defiWalletId, walletIndex } =
        JSON.parse(job.params) as EnterWalletOfDefiWalletNameJobParams;

      const defiWallet = await this.getDefiWallet(ctx, defiWalletId);
      if (!defiWallet) {
        throw new BadRequestException('The defi wallet is not found.');
      }

      if (message.from.id != job.telegramUserId) {
        throw new BadRequestException(
          'Account telegram is not compare with owner message.',
        );
      }

      if (!message.text || isEmpty(message.text)) {
        throw new BadRequestException('The wallet name is invalid.');
      }

      const isUpdated = await this.updateDefiWallet(ctx, defiWalletId, {
        ...defiWallet,
        wallets: defiWallet.wallets.map((wallet, index) => ({
          private_key: HashieldAIRepository.instance.decryptData(
            wallet.private_key,
          ),
          wallet_name: index == walletIndex ? message.text : wallet.wallet_name,
        })),
      });

      if (!isUpdated) {
        throw new InternalServerErrorException('Can not update the wallet.');
      }

      const wallet = defiWallet.wallets[walletIndex];

      if (!wallet) {
        throw new BadRequestException('The wallet is not found.');
      }

      const reply = this.buildSelectWalletOfDefiWalletMessage(wallet);

      await this.service.editMessage(
        ctx,
        chat.id,
        editMessageId,
        reply,
        this.buildSelectWalletOfDefiWalletOptions(
          ctx,
          defiWallet,
          walletIndex,
          backTo,
        ),
      );

      this.service.deleteMessage(ctx, chat.id, deleteMessageId);

      return JobStatus.done;
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onEnteredWalletOfDefiWalletName error ${error.message}`,
      );

      return JobStatus.inProcess;
    } finally {
      this.service.deleteMessage(ctx, chat.id, message.message_id);
    }
  }

  public async onEnterWalletOfDefiWalletName(
    @Ctx() ctx,
    defiWalletId: string,
    walletIndex: number,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      const { from, update } = ctx;
      const { message: editMessage } = update.callback_query;

      const deleteMessage = await this.service.reply(
        ctx,
        `Reply to this message with your desired organization`,
        {
          reply_markup: {
            force_reply: true,
          },
        },
      );

      const params: EnterWalletOfDefiWalletNameJobParams = {
        deleteMessageId: deleteMessage.message_id,
        editMessageId: editMessage.message_id,
        defiWalletId,
        walletIndex,
      };

      const job = await this.jobModel.create({
        telegramUserId: from.id,
        action: JobAction.enterWalletOfDefiWalletName,
        status: JobStatus.inProcess,
        params: JSON.stringify(params),
        timestamp: new Date().getTime(),
      });

      CommonLogger.instance.debug(
        `onEnterWalletOfDefiWalletName ${JSON.stringify(job)}`,
      );

      if (!job) {
        throw new InternalServerErrorException('Cant not create job.');
      }
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onEnterWalletOfDefiWalletName error ${error?.message}`,
      );
    }
  }

  private buildSelectWalletOfDefiWalletOptions(
    @Ctx() ctx: Context,
    defiWallet: DefiWallet,
    walletIndex: number,
    backTo?: CallbackDataKey,
  ) {
    return {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '✏️ Name',
              callback_data: new CallbackData<string>(
                CallbackDataKey.editWalletOfDefiWallet,
                `${defiWallet._id}_${walletIndex}`,
              ).toJSON(),
            },
          ],
          [
            {
              text: '🗑 Delete',
              callback_data: new CallbackData<string>(
                CallbackDataKey.deleteWalletOfDefiWallet,
                `${defiWallet._id}_${walletIndex}`,
              ).toJSON(),
            },
            {
              text: '🔄 Refresh',
              callback_data: new CallbackData<string>(
                CallbackDataKey.refreshWalletOfDefiWallet,
                `${defiWallet._id}_${walletIndex}`,
              ).toJSON(),
            },
          ],
          this.helperService.buildBacKAndCloseButtons(backTo, defiWallet._id),
        ],
      },
    };
  }

  private buildSelectWalletOfDefiWalletMessage(wallet: Wallet) {
    const privateKey = HashieldAIRepository.instance.decryptData(
      wallet.private_key,
    );

    const chain = chains[ChainId.Ethereum];
    const web3Wallet = new ethers.Wallet(privateKey);
    const reply = this.helperService.buildLinesMessage([
      `<b>💰Wallets - ${wallet.wallet_name}</b>`,
      `<b>Address:</b> <code>${web3Wallet.address}</code>`,
      `<b>Private Key:</b> <code>${web3Wallet.privateKey}</code>`,
      `<a href="${chain.explorer.root}${chain.explorer.address}${web3Wallet.address}">View on ${chain.explorer.name}</a>`,
    ]);

    return reply;
  }

  public async onSelectWalletOfDefiWallet(
    @Ctx() ctx: Context,
    defiWalletId: string,
    walletIndex: number,
    backFrom: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      const defiWallet = await this.getDefiWallet(ctx, defiWalletId);

      if (!defiWallet) {
        throw new BadRequestException('The defi wallet is not found.');
      }

      const wallet = defiWallet.wallets[walletIndex];

      if (!wallet) {
        throw new BadRequestException('The wallet is not found.');
      }

      const reply = this.buildSelectWalletOfDefiWalletMessage(wallet);

      await this.helperService.editOrSendMessage(
        ctx,
        reply,
        this.buildSelectWalletOfDefiWalletOptions(
          ctx,
          defiWallet,
          walletIndex,
          backTo,
        ),
        backFrom,
      );
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onSelectWalletOfDefiWallet error ${error?.message}`,
      );
    }
  }

  public async onDeleteDefiWallet(
    @Ctx() ctx: Context,
    defiWalletId: string,
    backFrom: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      const defiWallet = await this.getDefiWallet(ctx, defiWalletId);

      if (!defiWallet) {
        throw new BadRequestException('The defi wallet is not found.');
      }

      const isDeleted = await this.deleteDefiWallet(ctx, defiWalletId);

      if (!isDeleted) {
        throw new InternalServerErrorException(
          'Can not delete the defi wallet.',
        );
      }

      await this.onDefiWallets(ctx, backFrom, backTo);

      this.service.shortReply(ctx, `💚 Deleted successfully.`);
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onDeleteDefiWallet error ${error?.message}`);
    }
  }

  public async onRefreshDefiWallet(
    @Ctx() ctx: Context,
    defiWalletId: string,
    refreshFrom: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      await this.onSelectDefiWallet(ctx, defiWalletId, refreshFrom, backTo);

      this.service.shortReply(ctx, `💚 Refreshed successfully.`);
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onRefreshDefiWallet error ${error?.message}`,
      );
    }
  }

  public async onEnteredDefiWalletOrganization(
    @Ctx() ctx: Context,
    @Message() message,
    job: Job,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ): Promise<JobStatus> {
    const { chat } = ctx;
    try {
      const { deleteMessageId, editMessageId, defiWalletId } = JSON.parse(
        job.params,
      ) as EnterDefiWalletOrganizationJobParams;

      const defiWallet = await this.getDefiWallet(ctx, defiWalletId);

      if (!defiWallet) {
        throw new BadRequestException('The defi wallet is not found.');
      }

      if (message.from.id != job.telegramUserId) {
        throw new BadRequestException(
          'Account telegram is not compare with owner message.',
        );
      }

      if (!message.text || isEmpty(message.text)) {
        throw new BadRequestException('The organization is invalid.');
      }

      const isUpdated = await this.updateDefiWallet(ctx, defiWalletId, {
        ...defiWallet,
        wallets: defiWallet.wallets.map(({ wallet_name, private_key }) => ({
          wallet_name,
          private_key: HashieldAIRepository.instance.decryptData(private_key),
        })),
        organization: message.text,
      });

      if (!isUpdated) {
        throw new InternalServerErrorException(
          'Can not update the defi wallet.',
        );
      }

      const reply = this.helperService.buildLinesMessage([
        `<b>👝 Defi Wallets - ${defiWallet.organization}</b>`,
      ]);

      await this.service.editMessage(
        ctx,
        chat.id,
        editMessageId,
        reply,
        this.buildSelectDefiWalletOptions(ctx, defiWallet, backTo),
      );

      this.service.deleteMessage(ctx, chat.id, deleteMessageId);

      return JobStatus.done;
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onEnteredDefiWalletOrganization error ${error.message}`,
      );

      return JobStatus.inProcess;
    } finally {
      this.service.deleteMessage(ctx, chat.id, message.message_id);
    }
  }

  public async onEnterDefiWalletOrganization(
    @Ctx() ctx,
    defiWalletId: string,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      const { from, update } = ctx;
      const { message: editMessage } = update.callback_query;

      const deleteMessage = await this.service.reply(
        ctx,
        `Reply to this message with your desired organization`,
        {
          reply_markup: {
            force_reply: true,
          },
        },
      );

      const params: EnterDefiWalletOrganizationJobParams = {
        deleteMessageId: deleteMessage.message_id,
        editMessageId: editMessage.message_id,
        defiWalletId,
      };

      const job = await this.jobModel.create({
        telegramUserId: from.id,
        action: JobAction.enterDefiWalletOrganization,
        status: JobStatus.inProcess,
        params: JSON.stringify(params),
        timestamp: new Date().getTime(),
      });

      CommonLogger.instance.debug(
        `onEnterDefiWalletOrganization ${JSON.stringify(job)}`,
      );

      if (!job) {
        throw new InternalServerErrorException('Cant not create job.');
      }
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onEnterDefiWalletOrganization error ${error?.message}`,
      );
    }
  }

  private buildSelectDefiWalletOptions(
    @Ctx() ctx: Context,
    defiWallet: DefiWallet,
    backTo?: CallbackDataKey,
  ) {
    return {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          ...defiWallet.wallets.map((wallet, index) => {
            return [
              {
                text: `Wallet ${index + 1}: ${wallet.wallet_name}`,
                callback_data: new CallbackData<string>(
                  CallbackDataKey.selectWalletOfDefiWallet,
                  `${defiWallet._id}_${index}`,
                ).toJSON(),
              },
            ];
          }),
          [
            {
              text: '✏️ Organization',
              callback_data: new CallbackData<string>(
                CallbackDataKey.editDefiWallet,
                `${defiWallet._id.toString()}`,
              ).toJSON(),
            },
          ],
          [
            {
              text: '🗑 Delete',
              callback_data: new CallbackData<string>(
                CallbackDataKey.deleteDefiWallet,
                `${defiWallet._id.toString()}`,
              ).toJSON(),
            },
            {
              text: '🔄 Refresh',
              callback_data: new CallbackData<string>(
                CallbackDataKey.refreshDefiWallet,
                `${defiWallet._id.toString()}`,
              ).toJSON(),
            },
          ],
          this.helperService.buildBacKAndCloseButtons(backTo),
        ],
      },
    };
  }

  public async onSelectDefiWallet(
    @Ctx() ctx: Context,
    defiWalletId: string,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      const defiWallet = await this.getDefiWallet(ctx, defiWalletId);

      if (!defiWallet) {
        throw new BadRequestException('The defi wallet is not found.');
      }

      const reply = this.helperService.buildLinesMessage([
        `<b>👝 Defi Wallets - ${defiWallet.organization}</b>`,
      ]);

      await this.helperService.editOrSendMessage(
        ctx,
        reply,
        this.buildSelectDefiWalletOptions(ctx, defiWallet, backTo),
        backFrom,
      );
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onSelectDefiWallet error ${error?.message}`);
    }
  }

  public async onRefreshDefiWallets(
    @Ctx() ctx: Context,
    refreshFrom: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      await this.onDefiWallets(ctx, refreshFrom, backTo);

      this.service.shortReply(ctx, `💚 Refreshed successfully.`);
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onRefreshDefiWallets error ${error?.message}`,
      );
    }
  }

  public async onImportedDefiWallets(
    @Ctx() ctx,
    @Message() message,
    job: Job,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ): Promise<JobStatus> {
    const { chat } = ctx;
    try {
      const fileId = message.document.file_id;

      const { deleteMessageId, editMessageId } = JSON.parse(
        job.params,
      ) as ImportDefiWalletJobParams;

      if (message.from.id != job.telegramUserId) {
        throw new BadRequestException(
          'Account telegram is not compare with owner message.',
        );
      }

      const file = await this.service.getFileLink(ctx, fileId);
      const rawData = await XLSXUtils.instance.readFileFromURL(file.href);
      const params: Array<DefiWalletParams> = rawData.map<DefiWalletParams>(
        (itemD: any) => {
          const walletHs = Object.keys(itemD).filter((h) =>
            h.startsWith('Wallet'),
          );
          return {
            organization: itemD['Organization'],
            seed_phrase: itemD['Seed Phrase'],
            wallets: walletHs.reduce(
              (
                list: Array<{ wallet_name: string; private_key: string }>,
                item,
              ) => {
                const [wallet_name, private_key] = itemD[item].split(',');
                list.push({
                  wallet_name,
                  private_key,
                });
                return list;
              },
              [],
            ),
          };
        },
      );

      const isCreated = await this.createDefiWallets(ctx, params);

      if (!isCreated) {
        throw new InternalServerErrorException(
          'Can not import the defi wallets.',
        );
      }

      const defiWallets = await this.getDefiWallets(ctx);

      const reply = this.helperService.buildLinesMessage([
        `<b>👝 Defi Wallets</b>`,
      ]);

      this.service.editMessage(
        ctx,
        chat.id,
        editMessageId,
        reply,
        this.buildDefiWalletsOptions(ctx, defiWallets, backTo),
      );

      this.service.deleteMessage(ctx, chat.id, deleteMessageId);

      return JobStatus.done;
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onEnteredWalletOfDefiWalletName error ${error.message}`,
      );

      return JobStatus.inProcess;
    } finally {
      this.service.deleteMessage(ctx, chat.id, message.message_id);
    }
  }

  public async onImportDefiWallets(
    @Ctx() ctx,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      const { from, update } = ctx;
      const { message: editMessage } = update.callback_query;

      const deleteMessage = await this.service.reply(
        ctx,
        `Reply to this message with your file`,
        {
          reply_markup: {
            force_reply: true,
          },
        },
      );

      const params: ImportDefiWalletJobParams = {
        deleteMessageId: deleteMessage.message_id,
        editMessageId: editMessage.message_id,
      };

      const job = await this.jobModel.create({
        telegramUserId: from.id,
        action: JobAction.importDefiWallets,
        status: JobStatus.inProcess,
        params: JSON.stringify(params),
        timestamp: new Date().getTime(),
      });

      CommonLogger.instance.debug(`onImportDefiWallets ${JSON.stringify(job)}`);

      if (!job) {
        throw new InternalServerErrorException('Cant not create job.');
      }
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onImportDefiWallets error ${error?.message}`,
      );
    }
  }

  public async onTemplateDefiWallets(
    @Ctx() ctx,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      const documentPath = await XLSXUtils.instance.createFile(
        'defi-wallets-template',
        this._templateHeader,
        this._templateData,
      );

      await this.service.sendDocument(ctx, {
        source: documentPath,
      });
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onTemplateDefiWallets error ${error?.message}`,
      );
    }
  }

  private buildDefiWalletsOptions(
    @Ctx() ctx: Context,
    defiWallets: Array<DefiWallet>,
    backTo?: CallbackDataKey,
  ) {
    return {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          ...defiWallets.map((defiWallet) => {
            return [
              {
                text: `${defiWallet.isProtect ? '🔒' : '🔗'} Organization: ${
                  defiWallet.organization
                }`,
                callback_data: new CallbackData<string>(
                  CallbackDataKey.selectDefiWallet,
                  `${defiWallet._id}`,
                ).toJSON(),
              },
            ];
          }),
          [
            {
              text: 'Template',
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.templateDefiWallets,
                CallbackDataKey.defiWallets,
              ).toJSON(),
            },
            {
              text: 'Import',
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.importDefiWallets,
                CallbackDataKey.defiWallets,
              ).toJSON(),
            },
          ],
          [
            {
              text: 'Refresh',
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.refreshDefiWallets,
                CallbackDataKey.defiWallets,
              ).toJSON(),
            },
          ],
          this.helperService.buildBacKAndCloseButtons(backTo),
        ],
      },
    };
  }

  public async onDefiWallets(
    @Ctx() ctx: Context,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      if (await this.authService.onEnterAccessToken(ctx)) return;

      const defiWallets = await this.getDefiWallets(ctx);

      const reply = this.helperService.buildLinesMessage([
        `<b>👝 Defi Wallets</b>`,
      ]);

      await this.helperService.editOrSendMessage(
        ctx,
        reply,
        this.buildDefiWalletsOptions(ctx, defiWallets, backTo),
        backFrom,
      );
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onDefiWallets error ${error?.message}`);
    }
  }

  private async getDefiWallets(
    @Ctx() ctx: Context,
    sync = false,
  ): Promise<Array<DefiWallet>> {
    const wallet = await this.walletsService.getDefaultWallet(ctx);

    if (!wallet) {
      throw new BadRequestException(
        'Please connect/generate wallet to continue.',
      );
    }

    let defiWallets = CommonCache.instance.get(
      this._buildCacheKey(wallet.address),
    );

    if (sync || !defiWallets) {
      defiWallets = await HashieldAIRepository.instance.getDefiWallets(
        wallet.address,
      );
    }

    CommonLogger.instance.log(defiWallets);

    CommonCache.instance.set(this._buildCacheKey(wallet.address), defiWallets);

    return defiWallets;
  }

  private async createDefiWallets(
    @Ctx() ctx: Context,
    params: Array<DefiWalletParams>,
  ): Promise<boolean> {
    const wallet = await this.walletsService.getDefaultWallet(ctx);

    if (!wallet) {
      throw new BadRequestException(
        'Please connect/generate wallet to continue.',
      );
    }

    if (
      params.some(({ organization, wallets }) => {
        return (
          !organization ||
          wallets.some(
            ({ wallet_name, private_key }) =>
              !wallet_name || !validator.isWalletPrivateKey(private_key),
          )
        );
      })
    ) {
      throw new BadRequestException('Defi wallets data is invalid.');
    }

    const isCreated = await HashieldAIRepository.instance.createDefiWallets(
      wallet.address,
      params,
    );

    if (isCreated) {
      this.getDefiWallets(ctx, true);
    }

    return isCreated;
  }

  private async getDefiWallet(
    @Ctx() ctx: Context,
    defiWalletId: string,
  ): Promise<DefiWallet> {
    const defiwallets = await this.getDefiWallets(ctx);

    return defiwallets.find(({ _id }) => _id == defiWalletId);
  }

  private async deleteDefiWallet(
    @Ctx() ctx: Context,
    defiWalletId: string,
  ): Promise<boolean> {
    const wallet = await this.walletsService.getDefaultWallet(ctx);

    if (!wallet) {
      throw new BadRequestException(
        'Please connect/generate wallet to continue.',
      );
    }

    const isDeleted = await HashieldAIRepository.instance.deleteDefiWallets(
      wallet.address,
      [defiWalletId],
    );

    if (isDeleted) await this.getDefiWallets(ctx, true);

    return isDeleted;
  }

  private async updateDefiWallet(
    @Ctx() ctx: Context,
    defiWalletId: string,
    params: DefiWalletParams,
  ) {
    const wallet = await this.walletsService.getDefaultWallet(ctx);

    if (!wallet) {
      throw new BadRequestException(
        'Please connect/generate wallet to continue.',
      );
    }

    if (
      (params.organization != undefined && !params.organization) ||
      (params.wallets != undefined &&
        params.wallets.some(
          ({ wallet_name, private_key }) =>
            !wallet_name || !validator.isWalletPrivateKey(private_key),
        ))
    ) {
      throw new BadRequestException('Defi wallet data is invalid.');
    }

    const isUpdated = await HashieldAIRepository.instance.updateDefiWallet(
      wallet.address,
      defiWalletId,
      params,
    );

    if (isUpdated) await this.getDefiWallets(ctx, true);

    return isUpdated;
  }
}
