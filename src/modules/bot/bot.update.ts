/* eslint-disable @typescript-eslint/no-unused-vars */
import { Update, Start, Ctx, Message, Command, On } from 'nestjs-telegraf';
import { BotService } from './bot.service';
import { BotWalletsService } from './bot.wallets.service';
import { BotMenuService } from './bot.menu.service';
import { BotCallbackService } from './bot.callback.service';
import { BotMessagesService } from './bot.message.service';
import { BotPollService } from './bot.poll.service';
import { CommonLogger } from 'src/common/logger';
import { BotAboutService } from './bot.about.service';
import { BotWeb2LoginsService } from './bot.web2-logins.service';

@Update()
export class BotUpdate {
  constructor(
    protected readonly service: BotService,
    protected readonly callbackService: BotCallbackService,
    protected readonly menuService: BotMenuService,
    protected readonly walletsService: BotWalletsService,
    protected readonly web2LoginsService: BotWeb2LoginsService,
    protected readonly faqService: BotAboutService,
    protected readonly messagesService: BotMessagesService,
    protected readonly pollService: BotPollService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx) {
    this.onMenu(ctx);
  }

  @Command('menu')
  async onMenu(@Ctx() ctx) {
    this.menuService.onMenu(ctx);
  }

  @Command('wallets')
  async onWallets(@Ctx() ctx) {
    this.walletsService.onWallets(ctx);
  }

  @Command('web2logins')
  async onWeb2Logins(@Ctx() ctx) {
    this.web2LoginsService.onWeb2Logins(ctx);
  }

  @Command('defiwallets')
  async onDefiWallets(@Ctx() ctx) {
    // this.tradingService.onTrading(ctx);
  }

  @Command('autoFill')
  async onAutoFill(@Ctx() ctx) {
    // this.tradingService.onTrading(ctx);
  }

  @Command('passwordhealth')
  async onPasswordHealth(@Ctx() ctx) {
    // this.tradingService.onTrading(ctx);
  }

  @Command('wallethealth')
  async onWalletHealth(@Ctx() ctx) {
    // this.tradingService.onTrading(ctx);
  }

  @Command('about')
  async onAbout(@Ctx() ctx) {
    this.faqService.onAbout(ctx);
  }

  @On('callback_query')
  async onCallbackQuery(@Ctx() ctx) {
    this.callbackService.onCallbackQuery(ctx);
  }

  @On('message')
  async onMessage(@Ctx() ctx, @Message() message) {
    this.messagesService.onMessage(ctx, message);
  }

  @Command('poll')
  async onPoll(@Ctx() ctx) {
    this.pollService.sendPoll(ctx);
  }

  @On('poll_answer')
  async onPollAnswer(@Ctx() ctx) {
    this.pollService.onPollAnswer(ctx);
  }

  @On('animation')
  async onAnimation(@Ctx() ctx) {
    CommonLogger.instance.debug('On animation event');
  }

  @On('audio')
  async onAudio(@Ctx() ctx) {
    CommonLogger.instance.debug('On audio event');
  }

  @On('boost_added')
  async onBoostAdded(@Ctx() ctx) {
    CommonLogger.instance.debug('On boost added event');
  }

  @On('channel_chat_created')
  async onChanelChatCreated(@Ctx() ctx) {
    CommonLogger.instance.debug('On chanel chat created event');
  }

  @On('channel_post')
  async onChanelPost(@Ctx() ctx) {
    CommonLogger.instance.debug('On chanel post event');
  }

  @On('chat_boost')
  async onChatBoost(@Ctx() ctx) {
    CommonLogger.instance.debug('On chat boost event');
  }

  @On('chat_join_request')
  async onChatJoinRequest(@Ctx() ctx) {
    CommonLogger.instance.debug('On chat join request event');
  }

  @On('chat_member')
  async onChatMember(@Ctx() ctx) {
    CommonLogger.instance.debug('On chat member event');
  }

  @On('chat_shared')
  async onChatShared(@Ctx() ctx) {
    CommonLogger.instance.debug('On chat shared event');
  }

  @On('chosen_inline_result')
  async onChoseInlineResult(@Ctx() ctx) {
    CommonLogger.instance.debug('On chosen inline result event');
  }

  @On('connected_website')
  async onConnectedWebsite(@Ctx() ctx) {
    CommonLogger.instance.debug('On connected website event');
  }

  @On('contact')
  async onContact(@Ctx() ctx) {
    CommonLogger.instance.debug('On contact event');
  }

  @On('delete_chat_photo')
  async onDeleteChatPhoto(@Ctx() ctx) {
    CommonLogger.instance.debug('On delete chat photo event');
  }

  @On('dice')
  async onDice(@Ctx() ctx) {
    CommonLogger.instance.debug('On dice event');
  }

  @On('document')
  async onDocument(@Ctx() ctx) {
    CommonLogger.instance.debug('On document event');
  }

  @On('edited_channel_post')
  async onEditedChanelPost(@Ctx() ctx) {
    CommonLogger.instance.debug('On edited chanel post event');
  }

  @On('edited_message')
  async onEditedMessage(@Ctx() ctx) {
    CommonLogger.instance.debug('On edited message event');
  }

  @On('forum_topic_closed')
  async onForumTopicClosed(@Ctx() ctx) {
    CommonLogger.instance.debug('On forum topic closed event');
  }

  @On('forum_topic_created')
  async onForumTopicCreated(@Ctx() ctx) {
    CommonLogger.instance.debug('On forum topic created event');
  }

  @On('forum_topic_edited')
  async onForumTopicEdited(@Ctx() ctx) {
    CommonLogger.instance.debug('On forum topic edited event');
  }

  @On('forum_topic_reopened')
  async onForumTopicReopened(@Ctx() ctx) {
    CommonLogger.instance.debug('On forum topic reopened event');
  }

  @On('forward_date')
  async onForwardDate(@Ctx() ctx) {
    CommonLogger.instance.debug('On forward date event');
  }

  @On('game')
  async onGame(@Ctx() ctx) {
    CommonLogger.instance.debug('On game event');
  }

  @On('general_forum_topic_hidden')
  async onGeneralForumTopicHidden(@Ctx() ctx) {
    CommonLogger.instance.debug('On general forum topic hidden event');
  }

  @On('general_forum_topic_unhidden')
  async onGeneralForumTopicUnhidden(@Ctx() ctx) {
    CommonLogger.instance.debug('On general form topic unhidden event');
  }

  @On('giveaway')
  async onGiveaway(@Ctx() ctx) {
    CommonLogger.instance.debug('On giveaway event');
  }

  @On('giveaway_completed')
  async onGiveawayCompleted(@Ctx() ctx) {
    CommonLogger.instance.debug('On giveaway completed event');
  }

  @On('giveaway_created')
  async onGiveawayCreated(@Ctx() ctx) {
    CommonLogger.instance.debug('On giveaway created event');
  }

  @On('giveaway_winners')
  async onGiveAwayWinners(@Ctx() ctx) {
    CommonLogger.instance.debug('On giveaway winners event');
  }

  @On('group_chat_created')
  async onGroupChatCreated(@Ctx() ctx) {
    CommonLogger.instance.debug('On group chat created event');
  }

  @On('has_media_spoiler')
  async onHasMediaSpoiler(@Ctx() ctx) {
    CommonLogger.instance.debug('On has media spoiler event');
  }

  @On('invoice')
  async onInvoice(@Ctx() ctx) {
    CommonLogger.instance.debug('On invoice event');
  }

  @On('left_chat_member')
  async onLeftChatMember(@Ctx() ctx) {
    CommonLogger.instance.debug('On left chat member event');
  }

  @On('location')
  async onLocation(@Ctx() ctx) {
    CommonLogger.instance.debug('On location event');
  }

  @On('message_auto_delete_timer_changed')
  async onMessageAutoDeleteTimerChanged(@Ctx() ctx) {
    CommonLogger.instance.debug('On message auto delete timer changed event');
  }

  @On('message_reaction')
  async onMessageReaction(@Ctx() ctx) {
    CommonLogger.instance.debug('On message reaction  event');
  }

  @On('message_reaction_count')
  async onMessageReactionCount(@Ctx() ctx) {
    CommonLogger.instance.debug('On message reaction count event');
  }

  @On('migrate_from_chat_id')
  async onMigrateFromChatId(@Ctx() ctx) {
    CommonLogger.instance.debug('On migrate from chat id event');
  }

  @On('my_chat_member')
  async onMyChatMember(@Ctx() ctx) {
    CommonLogger.instance.debug('On my chat member event');
  }

  @On('new_chat_members')
  async onMyChatMembers(@Ctx() ctx) {
    CommonLogger.instance.debug('On my chat members event');
  }

  @On('new_chat_photo')
  async onNewChatPhoto(@Ctx() ctx) {
    CommonLogger.instance.debug('On new chat photo event');
  }

  @On('new_chat_title')
  async onNewChatTitle(@Ctx() ctx) {
    CommonLogger.instance.debug('On new chat title event');
  }

  @On('passport_data')
  async onPassportData(@Ctx() ctx) {
    CommonLogger.instance.debug('On passport data event');
  }

  @On('photo')
  async onPhoto(@Ctx() ctx) {
    CommonLogger.instance.debug('On photo event');
  }

  @On('pinned_message')
  async onPinnedMessage(@Ctx() ctx) {
    CommonLogger.instance.debug('On pinned message event');
  }

  @On('pre_checkout_query')
  async onPreCheckoutQuery(@Ctx() ctx) {
    CommonLogger.instance.debug('On pre checkout query event');
  }

  @On('proximity_alert_triggered')
  async onProximityAlertTriggered(@Ctx() ctx) {
    CommonLogger.instance.debug('On proximity alert triggered event');
  }

  @On('removed_chat_boost')
  async onRemovedChatBoost(@Ctx() ctx) {
    CommonLogger.instance.debug('On removed chat boost event');
  }

  @On('shipping_query')
  async onShippingQuery(@Ctx() ctx) {
    CommonLogger.instance.debug('On shipping query event');
  }

  @On('sticker')
  async onSticker(@Ctx() ctx) {
    CommonLogger.instance.debug('On sticker event');
  }

  @On('story')
  async onStory(@Ctx() ctx) {
    CommonLogger.instance.debug('On story event');
  }

  @On('successful_payment')
  async onSuccessfulPayment(@Ctx() ctx) {
    CommonLogger.instance.debug('On successful payment event');
  }

  @On('supergroup_chat_created')
  async onSuperGroupChatCreated(@Ctx() ctx) {
    CommonLogger.instance.debug('On super group chat created event');
  }

  @On('text')
  async onText(@Ctx() ctx) {
    CommonLogger.instance.debug('On text event');
  }

  @On('users_shared')
  async onUserShared(@Ctx() ctx) {
    CommonLogger.instance.debug('On user shared event');
  }

  @On('venue')
  async onVenue(@Ctx() ctx) {
    CommonLogger.instance.debug('On venue event');
  }

  @On('video')
  async onVideo(@Ctx() ctx) {
    CommonLogger.instance.debug('On video event');
  }

  @On('video_chat_ended')
  async onVideoChatEnded(@Ctx() ctx) {
    CommonLogger.instance.debug('On video chat ended event');
  }

  @On('video_chat_participants_invited')
  async onVideoChatParticipantsInvited(@Ctx() ctx) {
    CommonLogger.instance.debug('On video chat participants invited event');
  }

  @On('video_chat_scheduled')
  async onVideoChatScheduled(@Ctx() ctx) {
    CommonLogger.instance.debug('On video chat scheduled event');
  }

  @On('video_chat_started')
  async onVideoChatStarted(@Ctx() ctx) {
    CommonLogger.instance.debug('On video chat started event');
  }

  @On('video_note')
  async onVideoNote(@Ctx() ctx) {
    CommonLogger.instance.debug('On video note event');
  }

  @On('voice')
  async onVoice(@Ctx() ctx) {
    CommonLogger.instance.debug('On voice event');
  }

  @On('web_app_data')
  async onWebAppData(@Ctx() ctx) {
    CommonLogger.instance.debug('On web app data event');
  }

  @On('write_access_allowed')
  async onWriteAccessAllowed(@Ctx() ctx) {
    CommonLogger.instance.debug('On write access allowed event');
  }
}
