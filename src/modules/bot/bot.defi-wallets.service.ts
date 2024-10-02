/* eslint-disable prefer-const */
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

type UpdateDefiWalletJobParams = {
  deleteMessageIds: Array<number>;
  editMessageId: number;
  defiWalletId: string;
  type: CallbackDataKey;
  walletIndex?: number;
};

type ImportDefiWalletsJobParams = {
  deleteMessageIds: Array<number>;
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
    sync = false,
  ) {
    try {
      const defiWallet = await this.getDefiWallet(ctx, defiWalletId, sync);

      if (!defiWallet) {
        throw new BadRequestException('The defi wallet is not found.');
      }

      const isDeleted = await this.updateDefiWallet(ctx, defiWalletId, {
        ...defiWallet,
        wallets: defiWallet.wallets.filter((_, index) => index != walletIndex),
      });

      if (!isDeleted) {
        throw new InternalServerErrorException('Can not delete the wallet.');
      }

      this.onSelectDefiWallet(ctx, defiWalletId, backFrom, backTo);

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
      this.onSelectWalletOfDefiWallet(
        ctx,
        defiWalletId,
        walletIndex,
        refreshFrom,
        backTo,
        true,
      );

      this.service.shortReply(ctx, `💚 Refreshed successfully.`);
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onRefreshWalletOfDefiWallet error ${error?.message}`,
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
                CallbackDataKey.updateWalletNameOfDefiWallet,
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
    const chain = chains[ChainId.Ethereum];
    const web3Wallet = new ethers.Wallet(wallet.private_key);
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
    sync = false,
  ) {
    try {
      const defiWallet = await this.getDefiWallet(ctx, defiWalletId, sync);

      if (!defiWallet) {
        throw new BadRequestException('The defi wallet is not found.');
      }

      const wallet = defiWallet.wallets[walletIndex];

      if (!wallet) {
        throw new BadRequestException('The wallet is not found.');
      }

      const reply = this.buildSelectWalletOfDefiWalletMessage(wallet);

      this.helperService.editOrSendMessage(
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
    sync = false,
  ) {
    try {
      const defiWallet = await this.getDefiWallet(ctx, defiWalletId, sync);

      if (!defiWallet) {
        throw new BadRequestException('The defi wallet is not found.');
      }

      const isDeleted = await this.deleteDefiWallet(ctx, defiWalletId);

      if (!isDeleted) {
        throw new InternalServerErrorException(
          'Can not delete the defi wallet.',
        );
      }

      this.onDefiWallets(ctx, backFrom, backTo);

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
      this.onSelectDefiWallet(ctx, defiWalletId, refreshFrom, backTo, true);

      this.service.shortReply(ctx, `💚 Refreshed successfully.`);
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onRefreshDefiWallet error ${error?.message}`,
      );
    }
  }

  public async onEnteredToUpdateDefiWallet(
    @Ctx() ctx: Context,
    @Message() message,
    job: Job,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
    sync = false,
  ): Promise<JobStatus> {
    const { chat } = ctx;
    try {
      let { deleteMessageIds, editMessageId, defiWalletId, type, walletIndex } =
        JSON.parse(job.params) as UpdateDefiWalletJobParams;

      const defiWallet = await this.getDefiWallet(ctx, defiWalletId, sync);

      if (!defiWallet) {
        throw new BadRequestException('The defi wallet is not found.');
      }

      let error: string;
      let body: DefiWalletParams = { ...defiWallet };
      switch (type) {
        case CallbackDataKey.updateDefiWalletWallets:
          const [wallet_name, private_key] = message.text
            .split(',')
            .map((_) => _?.trim());
          if (
            isEmpty(wallet_name) ||
            !validator.isWalletPrivateKey(private_key)
          ) {
            error = 'The wallet is invalid.';
          } else {
            body = {
              ...body,
              wallets: [
                ...defiWallet.wallets,
                {
                  wallet_name,
                  private_key,
                },
              ],
            };
          }
          break;
        case CallbackDataKey.updateDefiWalletOrganization:
          if (isEmpty(message.text)) {
            error = 'The organization are invalid.';
          } else {
            body = {
              ...body,
              organization: message.text,
            };
          }
          break;
        case CallbackDataKey.updateDefiWalletSeedPhrase:
          if (isEmpty(message.text)) {
            error = 'The seed phrase is invalid.';
          } else {
            body = {
              ...body,
              seed_phrase: message.text,
            };
          }
          break;
        case CallbackDataKey.updateWalletNameOfDefiWallet:
          if (isEmpty(message.text)) {
            error = 'The wallet name is invalid.';
          } else {
            body = {
              ...body,
              wallets: defiWallet.wallets.map(
                ({ wallet_name, ...rest }, index) => ({
                  ...rest,
                  wallet_name:
                    index == walletIndex ? message.text : wallet_name,
                }),
              ),
            };
          }
          break;
        default:
          break;
      }

      if (error) {
        throw new BadRequestException(error);
      }

      const isUpdated = await this.updateDefiWallet(ctx, defiWalletId, body);

      if (!isUpdated) {
        throw new InternalServerErrorException(
          'Can not update the defi wallet.',
        );
      }

      const newDefiWallet = { ...defiWallet, ...body } as DefiWallet;

      switch (type) {
        case CallbackDataKey.updateWalletNameOfDefiWallet:
        case CallbackDataKey.updateDefiWalletWallets:
          if (CallbackDataKey.updateDefiWalletWallets) {
            walletIndex = newDefiWallet.wallets.length - 1;
          }
          const wallet = newDefiWallet.wallets[walletIndex];
          this.service.editMessage(
            ctx,
            chat.id,
            editMessageId,
            this.buildSelectWalletOfDefiWalletMessage(wallet),
            this.buildSelectWalletOfDefiWalletOptions(
              ctx,
              newDefiWallet,
              walletIndex,
              CallbackDataKey.selectDefiWallet,
            ),
          );
          break;
        default:
          await this.service.editMessage(
            ctx,
            chat.id,
            editMessageId,
            this.helperService.buildLinesMessage([
              `<b>👝 Defi Wallets - ${newDefiWallet.organization}</b>`,
            ]),
            this.buildSelectDefiWalletOptions(ctx, newDefiWallet, backTo),
          );
          break;
      }

      this.service.deleteMessages(ctx, chat.id, deleteMessageIds);

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

  public async onUpdateDefiWallet(
    @Ctx() ctx,
    defiWalletId: string,
    type: CallbackDataKey,
    val?: string | number,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
    sync = false,
  ) {
    try {
      const { from, update } = ctx;
      const { message: editMessage } = update.callback_query;

      const defiWallet = await this.getDefiWallet(ctx, defiWalletId, sync);

      if (!defiWallet) {
        throw new BadRequestException('The defi wallet is not found.');
      }

      switch (type) {
        default:
          const reply = (() => {
            switch (type) {
              case CallbackDataKey.updateDefiWalletOrganization:
                return `Reply to this message with your desired organization`;
              case CallbackDataKey.updateDefiWalletSeedPhrase:
                return `Reply to this message with your desired seed phrase`;
              case CallbackDataKey.updateWalletNameOfDefiWallet:
                return `Reply to this message with your desired wallet name`;
              case CallbackDataKey.updateDefiWalletWallets:
                return this.helperService.buildLinesMessage([
                  `Reply to this message with your desired wallet name, private key and separated by ",".`,
                  `Example: <code>Wallet Name, 0x4c0883a69102937d62394728a8c0d8f1b7c8312b7d39b9b6d0aa9151c147e91f</code>`,
                ]);
              default:
                break;
            }
          })();

          const deleteMessage = await this.service.reply(ctx, reply, {
            reply_markup: {
              force_reply: true,
            },
          });

          const params: UpdateDefiWalletJobParams = {
            deleteMessageIds: [deleteMessage.message_id],
            editMessageId: editMessage.message_id,
            defiWalletId,
            walletIndex: Number(val),
            type,
          };

          const job = await this.jobModel.create({
            telegramUserId: from.id,
            action: JobAction.updateDefiWallet,
            status: JobStatus.inProcess,
            params: JSON.stringify(params),
            timestamp: new Date().getTime(),
          });

          CommonLogger.instance.debug(
            `onUpdateDefiWallet ${JSON.stringify(job)}`,
          );

          if (!job) {
            throw new InternalServerErrorException('Cant not create the job.');
          }
          break;
      }
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onUpdateDefiWallet error ${error?.message}`);
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
                text: `Wallet ${index + 1}: ${
                  wallet.wallet_name ? wallet.wallet_name : '--'
                }`,
                callback_data: new CallbackData<string>(
                  CallbackDataKey.selectWalletOfDefiWallet,
                  `${defiWallet._id}_${index}`,
                ).toJSON(),
              },
            ];
          }),
          [
            {
              text: 'Add New Wallet',
              callback_data: new CallbackData<string>(
                CallbackDataKey.updateDefiWalletWallets,
                `${defiWallet._id}`,
              ).toJSON(),
            },
          ],
          [
            {
              text: `✏️ Organization: ${
                defiWallet.organization ? defiWallet.organization : '--'
              }`,
              callback_data: new CallbackData<string>(
                CallbackDataKey.updateDefiWalletOrganization,
                `${defiWallet._id}`,
              ).toJSON(),
            },
          ],
          [
            {
              text: `✏️ Seed Phrase: ${
                defiWallet.seed_phrase ? defiWallet.seed_phrase : '--'
              }`,
              callback_data: new CallbackData<string>(
                CallbackDataKey.updateDefiWalletSeedPhrase,
                `${defiWallet._id}`,
              ).toJSON(),
            },
          ],
          [
            {
              text: '🗑 Delete',
              callback_data: new CallbackData<string>(
                CallbackDataKey.deleteDefiWallet,
                `${defiWallet._id}`,
              ).toJSON(),
            },
            {
              text: '🔄 Refresh',
              callback_data: new CallbackData<string>(
                CallbackDataKey.refreshDefiWallet,
                `${defiWallet._id}`,
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
    sync = false,
  ) {
    try {
      const defiWallet = await this.getDefiWallet(ctx, defiWalletId, sync);

      if (!defiWallet) {
        throw new BadRequestException('The defi wallet is not found.');
      }

      const reply = this.helperService.buildLinesMessage([
        `<b>👝 Defi Wallets - ${defiWallet.organization}</b>`,
      ]);

      this.helperService.editOrSendMessage(
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
      this.onDefiWallets(ctx, refreshFrom, backTo, true);

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
    sync = true,
  ): Promise<JobStatus> {
    const { chat } = ctx;
    try {
      const fileId = message.document.file_id;

      const { deleteMessageIds, editMessageId } = JSON.parse(
        job.params,
      ) as ImportDefiWalletsJobParams;

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
                const [wallet_name, private_key] = itemD[item]
                  .split(',')
                  .map((_) => _?.trim());
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
        throw new InternalServerErrorException('Can not import defi wallets.');
      }

      const defiWallets = await this.getDefiWallets(ctx, sync);

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

      this.service.deleteMessages(ctx, chat.id, deleteMessageIds);

      return JobStatus.done;
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onImportedDefiWallets error ${error.message}`,
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

      const params: ImportDefiWalletsJobParams = {
        deleteMessageIds: [deleteMessage.message_id],
        editMessageId: editMessage.message_id,
      };

      let job = await this.jobModel
        .findOne({
          telegramUserId: from.id,
          action: JobAction.importDefiWallets,
          status: JobStatus.inProcess,
        })
        .sort({ timestamp: -1 })
        .exec();

      if (job) {
        this.jobModel
          .updateOne(
            { _id: job._id },
            {
              params: JSON.stringify({
                ...params,
                deleteMessageIds: [
                  ...params.deleteMessageIds,
                  ...JSON.parse(job.params).deleteMessageIds,
                ],
              }),
            },
          )
          .exec();
      } else {
        const job = await this.jobModel.create({
          telegramUserId: from.id,
          action: JobAction.importDefiWallets,
          status: JobStatus.inProcess,
          params: JSON.stringify(params),
          timestamp: new Date().getTime(),
        });
      }

      CommonLogger.instance.debug(`onImportDefiWallets ${JSON.stringify(job)}`);

      if (!job) {
        throw new InternalServerErrorException('Cant not create the job.');
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
      const { from, update } = ctx;
      const { message: editMessage } = update.callback_query;

      const source = await XLSXUtils.instance.createFile(
        'defi-wallets-template',
        this._templateHeader,
        this._templateData,
      );

      const reply = this.helperService.buildLinesMessage([
        `<b>Instruction for Completing the Wallet Form:</b>\n`,
        `- You can fill out as many wallets as you want by adding more "Wallet" columns. Each column represents a separate wallet.\n`,
        `- Format for Wallet Columns:\n`,
        `Each wallet column should contain the wallet details in the format: <i>Wallet Name, Private Key</i>.\n`,
        `Ensure each piece of information is separated by a comma, and that the details are complete to avoid issues in accessing the wallets.`,
      ]);

      const deleteMessages = await Promise.all([
        this.service.reply(ctx, reply),
        this.service.sendDocument(ctx, {
          source,
        }),
      ]);

      const params: ImportDefiWalletsJobParams = {
        deleteMessageIds: deleteMessages.map(({ message_id }) => message_id),
        editMessageId: editMessage.message_id,
      };

      const job = await this.jobModel.create({
        telegramUserId: from.id,
        action: JobAction.importDefiWallets,
        status: JobStatus.inProcess,
        params: JSON.stringify(params),
        timestamp: new Date().getTime(),
      });

      CommonLogger.instance.debug(
        `onTemplateDefiWallets ${JSON.stringify(job)}`,
      );

      if (!job) {
        throw new InternalServerErrorException('Cant not create the job.');
      }
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
                  defiWallet.organization ? defiWallet.organization : '--'
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
              text: 'Download Template',
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.templateDefiWallets,
                CallbackDataKey.defiWallets,
              ).toJSON(),
            },
            {
              text: 'Import Data',
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.importDefiWallets,
                CallbackDataKey.defiWallets,
              ).toJSON(),
            },
          ],
          [
            {
              text: '🔄 Refresh',
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
    sync = false,
  ) {
    try {
      if (await this.authService.onEnterAccessToken(ctx)) return;

      const defiWallets = await this.getDefiWallets(ctx, sync);

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
    sync = false,
  ): Promise<DefiWallet> {
    const defiwallets = await this.getDefiWallets(ctx, sync);

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

    const isUpdated = await HashieldAIRepository.instance.updateDefiWallet(
      wallet.address,
      defiWalletId,
      params,
    );

    if (isUpdated) await this.getDefiWallets(ctx, true);

    return isUpdated;
  }
}
