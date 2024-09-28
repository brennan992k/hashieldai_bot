import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ClientDocument = HydratedDocument<Client>;

@Schema()
export class Client {
  _id: Types.ObjectId;

  @Prop()
  address: string;

  @Prop()
  token: string;

  @Prop()
  expiredAt: number;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
