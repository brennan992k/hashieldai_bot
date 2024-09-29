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
  Credential,
  CredentialParams,
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
import { getWebsiteInfo } from 'src/common/utils/website';

type ImportCredentialsJobParams = {
  deleteMessageId: number;
  editMessageId: number;
};

@Injectable()
export class BotWeb2LoginsService {
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

  private _cacheKeyPrefix = 'WEB2_LOGINS';

  private _buildCacheKey(walletAddress: Web3Address) {
    return `${this._cacheKeyPrefix}_${walletAddress}`;
  }
  private _templateHeader = [
    { title: 'Websites', key: 'websites' },
    { title: 'Email', key: 'email' },
    { title: 'Username', key: 'username' },
    { title: 'Password', key: 'password' },
    { title: 'Auto Login', key: 'autoLogin' },
    { title: 'AutoFill', key: 'autoFill' },
    { title: 'Protect Item', key: 'isProtect' },
    { title: 'note', key: 'note' },
  ];

  private _templateData = [
    {
      websites: 'example.com,example.ca',
      email: 'example@gmail.com',
      username: '@username',
      password: '@123456789##',
      autoLogin: 0,
      autoFill: 0,
      isProtect: 0,
      note: 'note...',
    },
    {
      websites: 'example2.com,example.ca',
      email: 'example2@gmail.com',
      username: '@username2',
      password: '@123456789##',
      autoLogin: 0,
      autoFill: 1,
      isProtect: 0,
      note: 'note...',
    },
  ];

  public async onDeleteCredential(
    @Ctx() ctx: Context,
    credentialId: string,
    backFrom: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      const credential = await this.getCredential(ctx, credentialId);

      if (!credential) {
        throw new BadRequestException('The credential is not found.');
      }

      const isDeleted = await this.deleteCredential(ctx, credentialId);

      if (!isDeleted) {
        throw new InternalServerErrorException(
          'Can not delete the credential.',
        );
      }

      await this.onWeb2Logins(ctx, backFrom, backTo);

      this.service.shortReply(ctx, `💚 Deleted successfully.`);
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onDeleteCredential error ${error?.message}`);
    }
  }

  public async onRefreshCredential(
    @Ctx() ctx: Context,
    credentialId: string,
    refreshFrom: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      await this.onSelectCredential(ctx, credentialId, refreshFrom, backTo);

      this.service.shortReply(ctx, `💚 Refreshed successfully.`);
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onRefreshCredential error ${error?.message}`,
      );
    }
  }

  // public async onEnteredCredentialOrganization(
  //   @Ctx() ctx: Context,
  //   @Message() message,
  //   job: Job,
  //   backFrom?: CallbackDataKey,
  //   backTo?: CallbackDataKey,
  // ): Promise<JobStatus> {
  //   const { chat } = ctx;
  //   try {
  //     const { deleteMessageId, editMessageId, credentialId } = JSON.parse(
  //       job.params,
  //     ) as EnterCredentialOrganizationJobParams;

  //     const credential = await this.getCredential(ctx, credentialId);

  //     if (!credential) {
  //       throw new BadRequestException('The credential is not found.');
  //     }

  //     if (message.from.id != job.telegramUserId) {
  //       throw new BadRequestException(
  //         'Account telegram is not compare with owner message.',
  //       );
  //     }

  //     if (!message.text || isEmpty(message.text)) {
  //       throw new BadRequestException('The organization is invalid.');
  //     }

  //     const isUpdated = await this.updateCredential(ctx, credentialId, {
  //       ...credential,
  //       wallets: credential.wallets.map(({ wallet_name, private_key }) => ({
  //         wallet_name,
  //         private_key: HashieldAIRepository.instance.decryptData(private_key),
  //       })),
  //       organization: message.text,
  //     });

  //     if (!isUpdated) {
  //       throw new InternalServerErrorException(
  //         'Can not update the credential.',
  //       );
  //     }

  //     const reply = this.helperService.buildLinesMessage([
  //       `<b>👝 Web2 Logins - ${credential.organization}</b>`,
  //     ]);

  //     await this.service.editMessage(
  //       ctx,
  //       chat.id,
  //       editMessageId,
  //       reply,
  //       this.buildSelectCredentialOptions(ctx, credential, backTo),
  //     );

  //     this.service.deleteMessage(ctx, chat.id, deleteMessageId);

  //     return JobStatus.done;
  //   } catch (error) {
  //     this.service.warningReply(ctx, error?.message);

  //     CommonLogger.instance.error(
  //       `onEnteredCredentialOrganization error ${error.message}`,
  //     );

  //     return JobStatus.inProcess;
  //   } finally {
  //     this.service.deleteMessage(ctx, chat.id, message.message_id);
  //   }
  // }

  // public async onEnterCredentialOrganization(
  //   @Ctx() ctx,
  //   credentialId: string,
  //   backFrom?: CallbackDataKey,
  //   backTo?: CallbackDataKey,
  // ) {
  //   try {
  //     const { from, update } = ctx;
  //     const { message: editMessage } = update.callback_query;

  //     const deleteMessage = await this.service.reply(
  //       ctx,
  //       `Reply to this message with your desired organization`,
  //       {
  //         reply_markup: {
  //           force_reply: true,
  //         },
  //       },
  //     );

  //     const params: EnterCredentialOrganizationJobParams = {
  //       deleteMessageId: deleteMessage.message_id,
  //       editMessageId: editMessage.message_id,
  //       credentialId,
  //     };

  //     const job = await this.jobModel.create({
  //       telegramUserId: from.id,
  //       action: JobAction.enterCredentialOrganization,
  //       status: JobStatus.inProcess,
  //       params: JSON.stringify(params),
  //       timestamp: new Date().getTime(),
  //     });

  //     CommonLogger.instance.debug(
  //       `onEnterCredentialOrganization ${JSON.stringify(job)}`,
  //     );

  //     if (!job) {
  //       throw new InternalServerErrorException('Cant not create job.');
  //     }
  //   } catch (error) {
  //     this.service.warningReply(ctx, error?.message);

  //     CommonLogger.instance.error(
  //       `onEnterCredentialOrganization error ${error?.message}`,
  //     );
  //   }
  // }

  private buildSelectCredentialOptions(
    @Ctx() ctx: Context,
    credential: Credential,
    backTo?: CallbackDataKey,
  ) {
    return {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          // [
          //   {
          //     text: 'Websites',
          //     callback_data: new CallbackData<string>(
          //       CallbackDataKey.editCredentialWebsites,
          //       `${credential._id.toString()}`,
          //     ).toJSON(),
          //   },
          // ],
          [
            {
              text: `Username: ${
                credential.username ? credential.username : '--'
              }`,
              callback_data: new CallbackData<string>(
                CallbackDataKey.editCredentialUsername,
                `${credential._id.toString()}`,
              ).toJSON(),
            },
          ],
          [
            {
              text: `Email: ${credential.email ? credential.email : '--'}`,
              callback_data: new CallbackData<string>(
                CallbackDataKey.editCredentialUsername,
                `${credential._id.toString()}`,
              ).toJSON(),
            },
          ],
          [
            {
              text: `Password: ${HashieldAIRepository.instance.decryptData(
                credential.password,
              )}`,
              callback_data: new CallbackData<string>(
                CallbackDataKey.editCredentialPassword,
                `${credential._id.toString()}`,
              ).toJSON(),
            },
          ],
          [
            {
              text: `${credential.autoLogin ? '🟢' : '🔴'} Auto Login`,
              callback_data: new CallbackData<string>(
                CallbackDataKey.editCredentialAutoLogin,
                `${credential._id.toString()}`,
              ).toJSON(),
            },
          ],
          [
            {
              text: `${credential.autoFill ? '🟢' : '🔴'} Auto Fill`,
              callback_data: new CallbackData<string>(
                CallbackDataKey.editCredentialAutoFill,
                `${credential._id.toString()}`,
              ).toJSON(),
            },
          ],
          [
            {
              text: `${credential.isProtect ? '🟢' : '🔴'} Protect Item`,
              callback_data: new CallbackData<string>(
                CallbackDataKey.editCredentialProtectItem,
                `${credential._id.toString()}`,
              ).toJSON(),
            },
          ],
          [
            {
              text: '🗑 Delete',
              callback_data: new CallbackData<string>(
                CallbackDataKey.deleteCredential,
                `${credential._id.toString()}`,
              ).toJSON(),
            },
            {
              text: '🔄 Refresh',
              callback_data: new CallbackData<string>(
                CallbackDataKey.refreshCredential,
                `${credential._id.toString()}`,
              ).toJSON(),
            },
          ],
          this.helperService.buildBacKAndCloseButtons(backTo),
        ],
      },
    };
  }

  public async onSelectCredential(
    @Ctx() ctx: Context,
    credentialId: string,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      const credential = await this.getCredential(ctx, credentialId);

      if (!credential) {
        throw new BadRequestException('The credential is not found.');
      }

      const info = getWebsiteInfo(credential.url[0]);
      const reply = this.helperService.buildLinesMessage([
        `<b>💳 Web2 Logins - ${info.name}</b>`,
        `<a href="${info.url}">Open Link</a>`,
      ]);

      await this.helperService.editOrSendMessage(
        ctx,
        reply,
        this.buildSelectCredentialOptions(ctx, credential, backTo),
        backFrom,
      );
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onSelectCredential error ${error?.message}`);
    }
  }

  public async onRefreshWeb2Logins(
    @Ctx() ctx: Context,
    refreshFrom: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      await this.onWeb2Logins(ctx, refreshFrom, backTo);

      this.service.shortReply(ctx, `💚 Refreshed successfully.`);
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onRefreshWeb2Logins error ${error?.message}`,
      );
    }
  }

  public async onImportedCredentials(
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
      ) as ImportCredentialsJobParams;

      if (message.from.id != job.telegramUserId) {
        throw new BadRequestException(
          'Account telegram is not compare with owner message.',
        );
      }

      const file = await this.service.getFileLink(ctx, fileId);
      const rawData = await XLSXUtils.instance.readFileFromURL(file.href);
      const params: Array<CredentialParams> = rawData.map<CredentialParams>(
        (itemD: any) => {
          return this._templateHeader.reduce(
            (obj: any, itemH: { key: string; title: string }) => {
              obj[itemH.key] =
                itemD[itemH.title] !== undefined ? itemD[itemH.title] : '';
              switch (itemH.key) {
                case 'websites':
                  obj['url'] = obj[itemH.key].split(',');
                  break;
                case 'autoLogin':
                case 'autoFill':
                case 'isProtect':
                  obj[itemH.key] = obj[itemH.key] == 1;
                  break;
                default:
                  break;
              }
              return obj;
            },
            {},
          );
        },
      );

      const isCreated = await this.createCredentials(ctx, params);

      if (!isCreated) {
        throw new InternalServerErrorException(
          'Can not import the credentials.',
        );
      }

      const credentials = await this.getCredentials(ctx);

      const reply = this.helperService.buildLinesMessage([
        `<b>👝 Defi Wallets</b>`,
      ]);

      this.service.editMessage(
        ctx,
        chat.id,
        editMessageId,
        reply,
        this.buildCredentialsOptions(ctx, credentials, backTo),
      );

      this.service.deleteMessage(ctx, chat.id, deleteMessageId);

      return JobStatus.done;
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onEnteredWalletOfCredentialName error ${error.message}`,
      );

      return JobStatus.inProcess;
    } finally {
      this.service.deleteMessage(ctx, chat.id, message.message_id);
    }
  }

  public async onImportCredentials(
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

      const params: ImportCredentialsJobParams = {
        deleteMessageId: deleteMessage.message_id,
        editMessageId: editMessage.message_id,
      };

      const job = await this.jobModel.create({
        telegramUserId: from.id,
        action: JobAction.importCredentials,
        status: JobStatus.inProcess,
        params: JSON.stringify(params),
        timestamp: new Date().getTime(),
      });

      CommonLogger.instance.debug(`onImportCredentials ${JSON.stringify(job)}`);

      if (!job) {
        throw new InternalServerErrorException('Cant not create job.');
      }
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onImportCredentials error ${error?.message}`,
      );
    }
  }

  public async onTemplateCredentials(
    @Ctx() ctx,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      const documentPath = await XLSXUtils.instance.createFile(
        'credentials-template',
        this._templateHeader,
        this._templateData,
      );

      await this.service.sendDocument(ctx, {
        source: documentPath,
      });
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onTemplateCredentials error ${error?.message}`,
      );
    }
  }

  private buildCredentialsOptions(
    @Ctx() ctx: Context,
    credentials: Array<Credential>,
    backTo?: CallbackDataKey,
  ) {
    return {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          ...credentials.map((credential) => {
            const info = getWebsiteInfo(credential.url[0]);
            return [
              {
                text: `${info.name} - Last used: __`,
                callback_data: new CallbackData<string>(
                  CallbackDataKey.selectCredential,
                  `${credential._id}`,
                ).toJSON(),
              },
            ];
          }),
          [
            {
              text: 'Template',
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.templateCredentials,
                CallbackDataKey.web2Logins,
              ).toJSON(),
            },
            {
              text: 'Import',
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.importCredentials,
                CallbackDataKey.web2Logins,
              ).toJSON(),
            },
          ],
          [
            {
              text: 'Refresh',
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.refreshWeb2Logins,
                CallbackDataKey.web2Logins,
              ).toJSON(),
            },
          ],
          this.helperService.buildBacKAndCloseButtons(backTo),
        ],
      },
    };
  }

  public async onWeb2Logins(
    @Ctx() ctx: Context,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      if (await this.authService.onEnterAccessToken(ctx)) return;

      const credentials = await this.getCredentials(ctx);

      const reply = this.helperService.buildLinesMessage([
        `<b>💳 Web2 Logins</b>`,
      ]);

      await this.helperService.editOrSendMessage(
        ctx,
        reply,
        this.buildCredentialsOptions(ctx, credentials, backTo),
        backFrom,
      );
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onCredentials error ${error?.message}`);
    }
  }

  private async getCredentials(
    @Ctx() ctx: Context,
    sync = false,
  ): Promise<Array<Credential>> {
    const wallet = await this.walletsService.getDefaultWallet(ctx);

    if (!wallet) {
      throw new BadRequestException(
        'Please connect/generate wallet to continue.',
      );
    }

    let credentials = CommonCache.instance.get(
      this._buildCacheKey(wallet.address),
    );

    if (sync || !credentials) {
      credentials = await HashieldAIRepository.instance.getCredentials(
        wallet.address,
      );
    }

    CommonLogger.instance.log(credentials);

    CommonCache.instance.set(this._buildCacheKey(wallet.address), credentials);

    return credentials;
  }

  private async createCredentials(
    @Ctx() ctx: Context,
    params: Array<CredentialParams>,
  ): Promise<boolean> {
    const wallet = await this.walletsService.getDefaultWallet(ctx);

    if (!wallet) {
      throw new BadRequestException(
        'Please connect/generate wallet to continue.',
      );
    }

    // if (
    //   params.some(({ organization, wallets }) => {
    //     return (
    //       !organization ||
    //       wallets.some(
    //         ({ wallet_name, private_key }) =>
    //           !wallet_name || !validator.isWalletPrivateKey(private_key),
    //       )
    //     );
    //   })
    // ) {
    //   throw new BadRequestException('Defi wallets data is invalid.');
    // }

    const isCreated = await HashieldAIRepository.instance.createCredentials(
      wallet.address,
      params,
    );

    if (isCreated) {
      this.getCredentials(ctx, true);
    }

    return isCreated;
  }

  private async getCredential(
    @Ctx() ctx: Context,
    credentialId: string,
  ): Promise<Credential> {
    const credentials = await this.getCredentials(ctx);

    return credentials.find(({ _id }) => _id == credentialId);
  }

  private async deleteCredential(
    @Ctx() ctx: Context,
    credentialId: string,
  ): Promise<boolean> {
    const wallet = await this.walletsService.getDefaultWallet(ctx);

    if (!wallet) {
      throw new BadRequestException(
        'Please connect/generate wallet to continue.',
      );
    }

    const isDeleted = await HashieldAIRepository.instance.deleteCredentials(
      wallet.address,
      [credentialId],
    );

    if (isDeleted) await this.getCredentials(ctx, true);

    return isDeleted;
  }

  private async updateCredential(
    @Ctx() ctx: Context,
    credentialId: string,
    params: CredentialParams,
  ) {
    const wallet = await this.walletsService.getDefaultWallet(ctx);

    if (!wallet) {
      throw new BadRequestException(
        'Please connect/generate wallet to continue.',
      );
    }

    // if (
    //   (params.organization != undefined && !params.organization) ||
    //   (params.wallets != undefined &&
    //     params.wallets.some(
    //       ({ wallet_name, private_key }) =>
    //         !wallet_name || !validator.isWalletPrivateKey(private_key),
    //     ))
    // ) {
    //   throw new BadRequestException('Defi wallet data is invalid.');
    // }

    const isUpdated = await HashieldAIRepository.instance.updateCredential(
      wallet.address,
      credentialId,
      params,
    );

    if (isUpdated) await this.getCredentials(ctx, true);

    return isUpdated;
  }
}
