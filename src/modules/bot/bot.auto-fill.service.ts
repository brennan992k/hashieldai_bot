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
  Gender,
  HashieldAIRepository,
  Profile,
  ProfileParams,
} from 'src/repositories/hashield-ai.repository';
import { Web3Address } from 'src/app.type';
import { CommonCache } from 'src/common/cache';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from './schemas/job.schema';
import { isEmpty, isNumberString, isString } from 'class-validator';
import { validator } from 'src/common/utils/validator';

type UpdateProfileJobParams = {
  deleteMessageId: number;
  editMessageId: number;
  type: CallbackDataKey;
  cardIndex?: number;
};

@Injectable()
export class BotAutoFillService {
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

  private _cacheKeyPrefix = 'AUTO_FILL';

  private _buildCacheKey(walletAddress: Web3Address) {
    return `${this._cacheKeyPrefix}_${walletAddress}`;
  }

  public async onDeleteCardOfProfile(
    @Ctx() ctx: Context,
    cardIndex: number,
    backFrom: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      const profile = await this.getProfile(ctx);

      if (!profile) {
        throw new BadRequestException('The profile is not found.');
      }

      const isDeleted = await this.updateProfile(ctx, {
        ...profile,
        cards: profile.cards.filter((_, index) => cardIndex != index),
      });

      if (!isDeleted) {
        throw new InternalServerErrorException('Can not delete the card.');
      }

      this.onProfileCards(ctx, backTo);

      this.service.shortReply(ctx, `💚 Deleted successfully.`);
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onDeleteCardOfProfile error ${error?.message}`,
      );
    }
  }

  public async onRefreshCardOfProfile(
    @Ctx() ctx: Context,
    cardIndex: number,
    refreshFrom: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      this.onSelectCardOfProfile(ctx, cardIndex, refreshFrom, backTo, true);

      this.service.shortReply(ctx, `💚 Refreshed successfully.`);
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onRefreshCardOfProfile error ${error?.message}`,
      );
    }
  }

  private buildSelectCardOfProfileOptions(
    @Ctx() ctx: Context,
    profile: Profile,
    cardIndex: number,
    backTo?: CallbackDataKey,
  ) {
    const card = profile.cards[cardIndex];

    return {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `✏️ Card Number: ${
                card.card_number ? card.card_number : '--'
              }`,
              callback_data: new CallbackData<string>(
                CallbackDataKey.updateCardNumberOfProfile,
                `${cardIndex}`,
              ).toJSON(),
            },
          ],
          [
            {
              text: `✏️ Exp Date: ${
                card.expire_date ? card.expire_date : '--'
              }`,
              callback_data: new CallbackData<string>(
                CallbackDataKey.updateCardExpDateOfProfile,
                `${cardIndex}`,
              ).toJSON(),
            },
          ],
          [
            {
              text: `✏️ CVC: ${card.cvc ? card.cvc : '--'}`,
              callback_data: new CallbackData<string>(
                CallbackDataKey.updateCardCVCOfProfile,
                `${cardIndex}`,
              ).toJSON(),
            },
          ],
          [
            {
              text: '🗑 Delete',
              callback_data: new CallbackData<string>(
                CallbackDataKey.deleteCardOfProfile,
                `${cardIndex}`,
              ).toJSON(),
            },
            {
              text: '🔄 Refresh',
              callback_data: new CallbackData<string>(
                CallbackDataKey.refreshCardOfProfile,
                `${cardIndex}`,
              ).toJSON(),
            },
          ],
          this.helperService.buildBacKAndCloseButtons(backTo, cardIndex),
        ],
      },
    };
  }

  public async onSelectCardOfProfile(
    @Ctx() ctx: Context,
    cardIndex: number,
    backFrom: CallbackDataKey,
    backTo?: CallbackDataKey,
    sync = false,
  ) {
    try {
      const profile = await this.getProfile(ctx, sync);

      if (!profile) {
        throw new BadRequestException('The profile is not found.');
      }

      const card = profile.cards[cardIndex];

      if (!card) {
        throw new BadRequestException('The card is not found.');
      }

      const reply = this.helperService.buildLinesMessage([
        `<b>📝 Auto Fill - Card ${card.card_number}</b>`,
      ]);

      this.helperService.editOrSendMessage(
        ctx,
        reply,
        this.buildSelectCardOfProfileOptions(ctx, profile, cardIndex, backTo),
        backFrom,
      );
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onSelectCardOfProfile error ${error?.message}`,
      );
    }
  }

  public async onRefreshProfileCards(
    @Ctx() ctx: Context,
    refreshFrom: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      this.onProfileCards(ctx, refreshFrom, backTo, true);

      this.service.shortReply(ctx, `💚 Refreshed successfully.`);
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onRefreshProfileCards error ${error?.message}`,
      );
    }
  }

  public buildProfileCardsOptions(
    @Ctx() ctx: Context,
    profile: Profile,
    backTo?: CallbackDataKey,
  ) {
    return {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          ...profile.cards.map((card, index) => {
            return [
              {
                text: `Card ${index + 1}: ${card.card_number}`,
                callback_data: new CallbackData<string>(
                  CallbackDataKey.selectCardOfProfile,
                  `${index}`,
                ).toJSON(),
              },
            ];
          }),
          [
            {
              text: '➕ Add New Card',
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.updateProfileCards,
                CallbackDataKey.profileCards,
              ).toJSON(),
            },
          ],
          [
            {
              text: '🔄 Refresh',
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.refreshProfileCards,
                CallbackDataKey.refreshProfileCards,
              ).toJSON(),
            },
          ],
          this.helperService.buildBacKAndCloseButtons(backTo),
        ],
      },
    };
  }

  public async onProfileCards(
    @Ctx() ctx: Context,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
    sync = false,
  ) {
    try {
      if (await this.authService.onEnterAccessToken(ctx)) return;

      const profile = await this.getProfile(ctx, sync);

      const reply = this.helperService.buildLinesMessage([
        `<b>📝 Auto Fill - You have ${
          profile.cards.length < 2
            ? `${profile.cards.length} Card`
            : `${profile.cards.length} Cards`
        }</b>`,
      ]);

      this.helperService.editOrSendMessage(
        ctx,
        reply,
        this.buildProfileCardsOptions(ctx, profile, backTo),
        backFrom,
      );
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onAutoFill error ${error?.message}`);
    }
  }

  public async onEnteredToUpdateProfile(
    @Ctx() ctx: Context,
    @Message() message,
    job: Job,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
    sync = false,
  ): Promise<JobStatus> {
    const { chat } = ctx;
    try {
      let { deleteMessageId, editMessageId, type, cardIndex } = JSON.parse(
        job.params,
      ) as UpdateProfileJobParams;

      const profile = await this.getProfile(ctx, sync);

      if (!profile) {
        throw new BadRequestException('The profile is not found.');
      }

      let error: string;
      let body: ProfileParams = {
        ...profile,
      };
      switch (type) {
        case CallbackDataKey.updateProfileFirstName:
          if (isEmpty(message.text)) {
            error = 'The first name is invalid.';
          } else {
            body = {
              ...body,
              profile: {
                ...body.profile,
                first_name: message.text,
              },
            };
          }
          break;
        case CallbackDataKey.updateProfileLastName:
          if (isEmpty(message.text)) {
            error = 'The last name is invalid.';
          } else {
            body = {
              ...body,
              profile: {
                ...body.profile,
                last_name: message.text,
              },
            };
          }
          break;
        case CallbackDataKey.updateProfileDateOfBirth:
          if (!validator.isDateOfBirth(message.text)) {
            error = 'The date of birth is invalid.';
          } else {
            body = {
              ...body,
              profile: {
                ...body.profile,
                birthday: message.text,
              },
            };
          }
          break;
        case CallbackDataKey.updateProfileCity:
          if (isEmpty(message.text)) {
            error = 'The city is invalid.';
          } else {
            body = {
              ...body,
              profile: {
                ...body.profile,
                city: message.text,
              },
            };
          }
          break;
        case CallbackDataKey.updateProfileState:
          if (isEmpty(message.text)) {
            error = 'The state is invalid.';
          } else {
            body = {
              ...body,
              profile: {
                ...body.profile,
                state: message.text,
              },
            };
          }
          break;
        case CallbackDataKey.updateProfilePostcode:
          if (!isNumberString(message.text)) {
            error = 'The postcode is invalid.';
          } else {
            body = {
              ...body,
              profile: {
                ...body.profile,
                post_code: message.text,
              },
            };
          }
          break;
        case CallbackDataKey.updateProfilePhone:
          if (!isNumberString(message.text)) {
            error = 'The phone is invalid.';
          } else {
            body = {
              ...body,
              profile: {
                ...body.profile,
                phone: message.text,
              },
            };
          }
          break;
        case CallbackDataKey.updateProfileCards:
          const [card_number, cvc, expire_date] = message.text
            .split(',')
            .map((_) => _?.trim());
          console.log(
            !isNumberString(card_number),
            isEmpty(cvc),
            !validator.isExpireDate(expire_date),
          );
          if (
            !isNumberString(card_number) ||
            isEmpty(cvc) ||
            !validator.isExpireDate(expire_date)
          ) {
            error = 'The card is invalid.';
          } else {
            body = {
              ...body,
              cards: [
                ...profile.cards,
                {
                  card_number,
                  cvc,
                  expire_date,
                },
              ],
            };
          }
          break;
        case CallbackDataKey.updateCardNumberOfProfile:
          if (!isNumberString(message.text)) {
            error = 'The card number is invalid.';
          } else {
            body = {
              ...body,
              cards: profile.cards.map(
                ({ card_number, cvc, expire_date }, index) => ({
                  card_number: cardIndex == index ? message.text : card_number,
                  cvc,
                  expire_date,
                }),
              ),
            };
          }
          break;
        case CallbackDataKey.updateCardExpDateOfProfile:
          if (isEmpty(message.text)) {
            error = 'The expire date is invalid.';
          } else {
            body = {
              ...body,
              cards: profile.cards.map(
                ({ card_number, cvc, expire_date }, index) => ({
                  card_number,
                  cvc,
                  expire_date: cardIndex == index ? message.text : expire_date,
                }),
              ),
            };
          }
          break;
        case CallbackDataKey.updateCardCVCOfProfile:
          if (!isString(message.text)) {
            error = 'The CVC is invalid.';
          } else {
            body = {
              ...body,
              cards: profile.cards.map(
                ({ card_number, cvc, expire_date }, index) => ({
                  card_number,
                  cvc: cardIndex == index ? message.text : cvc,
                  expire_date,
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

      const isUpdated = await this.updateProfile(ctx, body);

      if (!isUpdated) {
        throw new InternalServerErrorException('Can not update the profile.');
      }

      const newProfile = { ...profile, ...body } as Profile;

      switch (type) {
        case CallbackDataKey.updateCardNumberOfProfile:
        case CallbackDataKey.updateCardExpDateOfProfile:
        case CallbackDataKey.updateCardCVCOfProfile:
        case CallbackDataKey.updateProfileCards:
          if (CallbackDataKey.updateProfileCards) {
            cardIndex = newProfile.cards.length - 1;
          }

          const card = newProfile.cards[cardIndex];
          this.service.editMessage(
            ctx,
            chat.id,
            editMessageId,
            this.helperService.buildLinesMessage([
              `<b>📝 Auto Fill - Card ${card.card_number}</b>`,
            ]),
            this.buildSelectCardOfProfileOptions(
              ctx,
              newProfile,
              cardIndex,
              CallbackDataKey.profileCards,
            ),
          );
          break;
        default:
          this.service.editMessage(
            ctx,
            chat.id,
            editMessageId,
            this.helperService.buildLinesMessage([`<b>📝 Auto Fill</b>`]),
            this.buildProfileOptions(ctx, newProfile, backTo),
          );
          break;
      }

      this.service.deleteMessage(ctx, chat.id, deleteMessageId);

      return JobStatus.done;
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(
        `onEnteredToUpdateProfile error ${error.message}`,
      );

      return JobStatus.inProcess;
    } finally {
      this.service.deleteMessage(ctx, chat.id, message.message_id);
    }
  }

  public async onUpdateProfile(
    @Ctx() ctx,
    type: CallbackDataKey,
    val?: string | number,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
    sync = false,
  ) {
    try {
      const { from, update } = ctx;
      const { message: editMessage } = update.callback_query;

      const profile = await this.getProfile(ctx, sync);

      if (!profile) {
        throw new BadRequestException('The profile is not found.');
      }

      switch (type) {
        case CallbackDataKey.updateProfileGender:
          let body = { ...profile };
          switch (type) {
            case CallbackDataKey.updateProfileGender:
              body = {
                ...body,
                profile: {
                  ...body.profile,
                  gender: val as Gender,
                },
              };
              break;
            default:
              break;
          }

          const isUpdated = await this.updateProfile(ctx, body);

          if (!isUpdated) {
            throw new InternalServerErrorException(
              'Can not update the profile.',
            );
          }

          this.onAutoFill(ctx, backFrom, backTo);
          break;
        default:
          const reply = (() => {
            switch (type) {
              case CallbackDataKey.updateProfileFirstName:
                return `Reply to this message with your desired first name`;
              case CallbackDataKey.updateProfileLastName:
                return `Reply to this message with your desired last name`;
              case CallbackDataKey.updateProfileDateOfBirth:
                return this.helperService.buildLinesMessage([
                  `Reply to this message with your desired date of birth with format: dd/mm/yyyy`,
                  `Example: <code>12/09/2000</code>`,
                ]);
              case CallbackDataKey.updateProfileCity:
                return `Reply to this message with your desired city`;
              case CallbackDataKey.updateProfileState:
                return `Reply to this message with your desired state`;
              case CallbackDataKey.updateProfilePostcode:
                return `Reply to this message with your desired postcode`;
              case CallbackDataKey.updateProfilePhone:
                return `Reply to this message with your desired phone`;
              case CallbackDataKey.updateCardNumberOfProfile:
                return `Reply to this message with your desired card number`;
              case CallbackDataKey.updateCardExpDateOfProfile:
                return this.helperService.buildLinesMessage([
                  `Reply to this message with your desired expire date with format: mm/yy`,
                  `Example: <code>09/25</code>`,
                ]);
              case CallbackDataKey.updateCardCVCOfProfile:
                return `Reply to this message with your desired CVC`;
              case CallbackDataKey.updateProfileCards:
                return this.helperService.buildLinesMessage([
                  `Reply to this message with your desired card number, cvc, expire date and separated by ",".`,
                  `Example: <code>0987654321, 1234456, 09/25</code>`,
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

          const params: UpdateProfileJobParams = {
            deleteMessageId: deleteMessage.message_id,
            editMessageId: editMessage.message_id,
            cardIndex: Number(val),
            type,
          };

          const job = await this.jobModel.create({
            telegramUserId: from.id,
            action: JobAction.updateProfile,
            status: JobStatus.inProcess,
            params: JSON.stringify(params),
            timestamp: new Date().getTime(),
          });

          CommonLogger.instance.debug(`onUpdateProfile ${JSON.stringify(job)}`);

          if (!job) {
            throw new InternalServerErrorException('Cant not create the job.');
          }
          break;
      }
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onUpdateProfile error ${error?.message}`);
    }
  }

  public async onRefreshAutoFill(
    @Ctx() ctx: Context,
    refreshFrom: CallbackDataKey,
    backTo?: CallbackDataKey,
  ) {
    try {
      this.onAutoFill(ctx, refreshFrom, backTo, true);

      this.service.shortReply(ctx, `💚 Refreshed successfully.`);
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onRefreshProfile error ${error?.message}`);
    }
  }

  private buildProfileOptions(
    @Ctx() ctx: Context,
    profile: Profile,
    backTo?: CallbackDataKey,
  ) {
    const genders = [
      {
        value: Gender.male,
        label: 'Male',
      },
      {
        value: Gender.female,
        label: 'Female',
      },
      {
        value: Gender.others,
        label: 'Others',
      },
    ];
    const { profile: profileDetail, cards } = profile;
    return {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `✏️ First Name: ${
                profileDetail.first_name ? profileDetail.first_name : '--'
              }`,
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.updateProfileFirstName,
                CallbackDataKey.autoFill,
              ).toJSON(),
            },
            {
              text: `✏️ Last Name: ${
                profileDetail.last_name ? profileDetail.last_name : '--'
              }`,
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.updateProfileLastName,
                CallbackDataKey.autoFill,
              ).toJSON(),
            },
          ],
          [
            {
              text: `▓▓▓▓▓ Gender ▓▓▓▓▓`,
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.none,
                CallbackDataKey.autoFill,
              ).toJSON(),
            },
          ],
          genders.map((gender) => ({
            text: `${profileDetail.gender == gender.value ? '✅' : ''} ${
              gender.label
            }`,
            callback_data: new CallbackData<Gender>(
              CallbackDataKey.updateProfileGender,
              gender.value,
            ).toJSON(),
          })),
          [
            {
              text: `✏️ Date Of Birth: ${
                profileDetail.birthday ? profileDetail.birthday : '--'
              }`,
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.updateProfileDateOfBirth,
                CallbackDataKey.autoFill,
              ).toJSON(),
            },
          ],
          [
            {
              text: `✏️ City: ${
                profileDetail.city ? profileDetail.city : '--'
              }`,
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.updateProfileCity,
                CallbackDataKey.autoFill,
              ).toJSON(),
            },
            {
              text: `✏️ State: ${
                profileDetail.state ? profileDetail.state : '--'
              }`,
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.updateProfileState,
                CallbackDataKey.autoFill,
              ).toJSON(),
            },
          ],
          [
            {
              text: `✏️ Postcode: ${
                profileDetail.post_code ? profileDetail.post_code : '--'
              }`,
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.updateProfilePostcode,
                CallbackDataKey.autoFill,
              ).toJSON(),
            },
            {
              text: `✏️ Phone: ${
                profileDetail.phone ? profileDetail.phone : '--'
              }`,
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.updateProfilePhone,
                CallbackDataKey.autoFill,
              ).toJSON(),
            },
          ],
          [
            {
              text: `🗃 Cards: ${
                cards.length < 2
                  ? `${cards.length} Card`
                  : `${cards.length} Cards`
              }`,
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.profileCards,
                CallbackDataKey.autoFill,
              ).toJSON(),
            },
          ],
          [
            {
              text: '🔄 Refresh',
              callback_data: new CallbackData<CallbackDataKey>(
                CallbackDataKey.refreshAutoFill,
                CallbackDataKey.autoFill,
              ).toJSON(),
            },
          ],
          this.helperService.buildBacKAndCloseButtons(backTo),
        ],
      },
    };
  }

  public async onAutoFill(
    @Ctx() ctx: Context,
    backFrom?: CallbackDataKey,
    backTo?: CallbackDataKey,
    sync = false,
  ) {
    try {
      if (await this.authService.onEnterAccessToken(ctx)) return;

      const profile = await this.getProfile(ctx, sync);

      const reply = this.helperService.buildLinesMessage([
        `<b>📝 Auto Fill</b>`,
      ]);

      this.helperService.editOrSendMessage(
        ctx,
        reply,
        this.buildProfileOptions(ctx, profile, backTo),
        backFrom,
      );
    } catch (error) {
      this.service.warningReply(ctx, error?.message);

      CommonLogger.instance.error(`onAutoFill error ${error?.message}`);
    }
  }

  private async getProfile(
    @Ctx() ctx: Context,
    sync = false,
  ): Promise<Profile> {
    const wallet = await this.walletsService.getDefaultWallet(ctx);

    if (!wallet) {
      throw new BadRequestException(
        'Please connect/generate wallet to continue.',
      );
    }

    let profile: Profile = CommonCache.instance.get(
      this._buildCacheKey(wallet.address),
    );

    if (sync || !profile) {
      profile = await (async () => {
        try {
          return await HashieldAIRepository.instance.getProfile(wallet.address);
        } catch (error) {
          return {
            _id: undefined,
            owner: wallet.address,
            __v: undefined,
            profile: {
              first_name: undefined,
              last_name: undefined,
              gender: Gender.male,
              birthday: '1/1/1975',
              city: undefined,
              state: undefined,
              post_code: undefined,
              phone: undefined,
            },
            cards: [],
            is_deleted: false,
            createdAt: undefined,
            updatedAt: undefined,
          };
        }
      })();
    }

    CommonLogger.instance.log(profile);

    CommonCache.instance.set(this._buildCacheKey(wallet.address), profile);

    return profile;
  }

  private async updateProfile(@Ctx() ctx: Context, params: ProfileParams) {
    const wallet = await this.walletsService.getDefaultWallet(ctx);

    if (!wallet) {
      throw new BadRequestException(
        'Please connect/generate wallet to continue.',
      );
    }

    const isUpdated = await HashieldAIRepository.instance.updateProfile(
      wallet.address,
      params,
    );

    if (isUpdated) await this.getProfile(ctx, true);

    return isUpdated;
  }
}
