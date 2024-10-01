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
} from 'src/repositories/hashield-ai.repository';
import { Web3Address } from 'src/app.type';
import { CommonCache } from 'src/common/cache';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from './schemas/job.schema';
import { XLSXUtils } from 'src/common/utils/xlsx';
import { getWebsiteInfo } from 'src/common/utils/website';
import { isEmpty } from 'class-validator';
import { validator } from 'src/common/utils/validator';

type ImportCredentialsJobParams = {
  deleteMessageId: number;
  editMessageId: number;
};

type UpdateCredentialJobParams = {
  deleteMessageId: number;
  editMessageId: number;
  credentialId: string;
  type: CallbackDataKey;
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

      this.onWeb2Logins(ctx, backFrom);

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
      this.onSelectCredential(ctx, credentialId, refreshFrom, backTo);

      this.service.shortReply(ctx, `💚 Refreshed successfully.`);
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onRefreshCredential error ${error?.message}`,
      );
    }
  }

  public async onEnteredToUpdateCredential(
    @Ctx() ctx: Context,
    @Message() message,
    job: Job,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ): Promise<JobStatus> {
    const { chat } = ctx;
    try {
      const { deleteMessageId, editMessageId, credentialId, type } = JSON.parse(
        job.params,
      ) as UpdateCredentialJobParams;

      const credential = await this.getCredential(ctx, credentialId);

      if (!credential) {
        throw new BadRequestException('The credential is not found.');
      }

      let error: string;
      let body: CredentialParams = { ...credential };
      switch (type) {
        case CallbackDataKey.updateCredentialWebsites:
          const websites = message.text.split(',').map((_) => _?.trim());
          const isInValid = websites.some(
            (website) =>
              !validator.isURL(website) && !validator.isDomain(website),
          );
          if (isInValid) {
            error = 'Websites are invalid.';
          } else {
            body = {
              ...body,
              url: websites,
            };
          }
          break;
        case CallbackDataKey.updateCredentialUsername:
          if (!validator.isUsername(message.text)) {
            error = 'Username is invalid.';
          } else {
            body = {
              ...body,
              username: message.text,
            };
          }
          break;
        case CallbackDataKey.updateCredentialEmail:
          if (!validator.isEmail(message.text)) {
            error = 'Email is invalid.';
          } else {
            body = {
              ...body,
              email: message.text,
            };
          }
          break;
        case CallbackDataKey.updateCredentialPassword:
          if (isEmpty(message.text)) {
            error = 'Password is invalid.';
          } else {
            body = {
              ...body,
              password: message.text,
            };
          }
          break;
        default:
          break;
      }

      if (error) {
        throw new BadRequestException(error);
      }

      const isUpdated = await this.updateCredential(ctx, credentialId, body);

      if (!isUpdated) {
        throw new InternalServerErrorException(
          'Can not update the credential.',
        );
      }

      const newCredential = { ...credential, ...body };
      const info = getWebsiteInfo(newCredential.url[0]);

      const reply = this.helperService.buildLinesMessage([
        `<b>💳 Web2 Logins - ${info.name}</b> (<a href="${info.url}">Open Link</a>)\n`,
      ]);

      await this.service.editMessage(
        ctx,
        chat.id,
        editMessageId,
        reply,
        this.buildSelectCredentialOptions(ctx, newCredential, backTo),
      );

      this.service.deleteMessage(ctx, chat.id, deleteMessageId);

      return JobStatus.done;
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onEnteredToUpdateCredential error ${error.message}`,
      );

      return JobStatus.inProcess;
    } finally {
      this.service.deleteMessage(ctx, chat.id, message.message_id);
    }
  }

  public async onUpdateCredential(
    @Ctx() ctx,
    credentialId: string,
    type: CallbackDataKey,
    val?: string | number,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      const { from, update } = ctx;
      const { message: editMessage } = update.callback_query;

      const credential = await this.getCredential(ctx, credentialId);

      if (!credential) {
        throw new BadRequestException('The credential is not found.');
      }

      switch (type) {
        case CallbackDataKey.updateCredentialAutoLogin:
        case CallbackDataKey.updateCredentialAutoFill:
        case CallbackDataKey.updateCredentialProtectItem:
          let body = { ...credential };
          switch (type) {
            case CallbackDataKey.updateCredentialAutoLogin:
              body = { ...body, autoLogin: !credential.autoLogin };
              break;
            case CallbackDataKey.updateCredentialAutoFill:
              body = { ...body, autoFill: !credential.autoFill };
              break;
            case CallbackDataKey.updateCredentialProtectItem:
              body = { ...body, isProtect: !credential.isProtect };
              break;
            default:
              break;
          }
          const isUpdated = await this.updateCredential(
            ctx,
            credentialId,
            body,
          );

          if (!isUpdated) {
            throw new InternalServerErrorException(
              'Can not update the credential.',
            );
          }

          this.onSelectCredential(ctx, credentialId, backFrom, backTo);
          break;

        default:
          const reply = (() => {
            switch (type) {
              case CallbackDataKey.updateCredentialWebsites:
                return this.helperService.buildLinesMessage([
                  'Reply to this message with your desired new websites, separated by ","',
                  `Example: <code>google.com, apple.com, amazon.com</code>`,
                ]);
              case CallbackDataKey.updateCredentialUsername:
                return 'Reply to this message with your desired new username';
              case CallbackDataKey.updateCredentialEmail:
                return 'Reply to this message with your desired new email';
              case CallbackDataKey.updateCredentialPassword:
                return 'Reply to this message with your desired new password';
              default:
                break;
            }
          })();

          const deleteMessage = await this.service.reply(ctx, reply, {
            reply_markup: {
              force_reply: true,
            },
          });

          const params: UpdateCredentialJobParams = {
            deleteMessageId: deleteMessage.message_id,
            editMessageId: editMessage.message_id,
            credentialId,
            type,
          };

          const job = await this.jobModel.create({
            telegramUserId: from.id,
            action: JobAction.updateCredential,
            status: JobStatus.inProcess,
            params: JSON.stringify(params),
            timestamp: new Date().getTime(),
          });

          CommonLogger.instance.debug(
            `onUpdateCredential ${JSON.stringify(job)}`,
          );

          if (!job) {
            throw new InternalServerErrorException('Cant not create the job.');
          }
          break;
      }
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onUpdateCredential error ${error?.message}`);
    }
  }

  private buildSelectCredentialOptions(
    @Ctx() ctx: Context,
    credential: Credential,
    backTo?: CallbackDataKey,
  ) {
    const info = getWebsiteInfo(credential.url[0]);

    return {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `✏️ Websites: ${info.url ? info.url : '--'}`,
              callback_data: new CallbackData<string>(
                CallbackDataKey.updateCredentialWebsites,
                `${credential._id}`,
              ).toJSON(),
            },
          ],
          [
            {
              text: `✏️ Username: ${
                credential.username ? credential.username : '--'
              }`,
              callback_data: new CallbackData<string>(
                CallbackDataKey.updateCredentialUsername,
                `${credential._id}`,
              ).toJSON(),
            },
          ],
          [
            {
              text: `✏️ Email: ${credential.email ? credential.email : '--'}`,
              callback_data: new CallbackData<string>(
                CallbackDataKey.updateCredentialEmail,
                `${credential._id}`,
              ).toJSON(),
            },
          ],
          [
            {
              text: `✏️ Password: ${
                credential.password ? credential.password : '--'
              }`,
              callback_data: new CallbackData<string>(
                CallbackDataKey.updateCredentialPassword,
                `${credential._id}`,
              ).toJSON(),
            },
          ],
          [
            {
              text: `${credential.autoLogin ? '🟢' : '🔴'} Auto Login`,
              callback_data: new CallbackData<string>(
                CallbackDataKey.updateCredentialAutoLogin,
                `${credential._id}`,
              ).toJSON(),
            },
          ],
          [
            {
              text: `${credential.autoFill ? '🟢' : '🔴'} Auto Fill`,
              callback_data: new CallbackData<string>(
                CallbackDataKey.updateCredentialAutoFill,
                `${credential._id}`,
              ).toJSON(),
            },
          ],
          [
            {
              text: `${credential.isProtect ? '🟢' : '🔴'} Protect Item`,
              callback_data: new CallbackData<string>(
                CallbackDataKey.updateCredentialProtectItem,
                `${credential._id}`,
              ).toJSON(),
            },
          ],
          [
            {
              text: '🗑 Delete',
              callback_data: new CallbackData<string>(
                CallbackDataKey.deleteCredential,
                `${credential._id}`,
              ).toJSON(),
            },
            {
              text: '🔄 Refresh',
              callback_data: new CallbackData<string>(
                CallbackDataKey.refreshCredential,
                `${credential._id}`,
              ).toJSON(),
            },
          ],
          this.helperService.buildBacKAndCloseButtons(backTo, credential._id),
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
        `<b>💳 Web2 Logins - ${info.name}</b> (<a href="${info.url}">Open Link</a>)\n`,
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
      this.onWeb2Logins(ctx, refreshFrom, backTo);

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
    sync = true,
  ): Promise<JobStatus> {
    const { chat } = ctx;
    try {
      const fileId = message.document.file_id;

      const { deleteMessageId, editMessageId } = JSON.parse(
        job.params,
      ) as ImportCredentialsJobParams;

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
                  obj['url'] = obj[itemH.key].split(',').map((_) => _?.trim());
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
        throw new InternalServerErrorException('Can not import credentials.');
      }

      const credentials = await this.getCredentials(ctx, sync);

      const reply = this.helperService.buildLinesMessage([
        `<b>💳 Web2 Logins</b>`,
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
        `onImportedCredentials error ${error.message}`,
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
        throw new InternalServerErrorException('Cant not create the job.');
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
      const source = await XLSXUtils.instance.createFile(
        'credentials-template',
        this._templateHeader,
        this._templateData,
      );

      const reply = this.helperService.buildLinesMessage([
        `<b>Instruction for Completing the Form:</b>\n`,
        `<b>1.Websites:</b> You can enter one or more websites in the provided column. If there are multiple websites, separate them with a comma (e.g., example.com, example1.ca).\n`,
        `<b>2.Auto Login, AutoFill, Protect Items:</b> These columns are used to indicate if specific features are enabled or disabled for each entry.\n`,
        `Use 0 to represent No (the feature is not enabled).`,
        `Use 1 to represent Yes (the feature is enabled).\n`,
        `<b>Please ensure all required fields are filled out accurately to facilitate seamless usage of your saved credentials.</b>`,
      ]);

      this.service.reply(ctx, reply);
      this.service.sendDocument(ctx, {
        source,
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
                text: `${info.name} - Last used: --`,
                callback_data: new CallbackData<string>(
                  CallbackDataKey.selectCredential,
                  `${credential._id}`,
                ).toJSON(),
              },
            ];
          }),
          [
            {
              text: 'Download Template',
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.templateCredentials,
                CallbackDataKey.web2Logins,
              ).toJSON(),
            },
            {
              text: 'Import Data',
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
    sync = false,
  ) {
    try {
      if (await this.authService.onEnterAccessToken(ctx)) return;

      const credentials = await this.getCredentials(ctx, sync);

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

      CommonLogger.instance.error(`onWeb2Logins error ${error?.message}`);
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
    sync = false,
  ): Promise<Credential> {
    const credentials = await this.getCredentials(ctx, sync);

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

    const isUpdated = await HashieldAIRepository.instance.updateCredential(
      wallet.address,
      credentialId,
      params,
    );

    if (isUpdated) await this.getCredentials(ctx, true);

    return isUpdated;
  }
}
