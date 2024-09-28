import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserBotDocument = HydratedDocument<UserBot>;

@Schema()
export class UserBot {
  _id: Types.ObjectId;

  @Prop()
  telegramUserId: number;

  @Prop()
  userId: string;
}

export const UserBotSchema = SchemaFactory.createForClass(UserBot);
