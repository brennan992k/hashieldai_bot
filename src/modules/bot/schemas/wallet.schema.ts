import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Web3Address } from 'src/app.type';

export type WalletDocument = HydratedDocument<Wallet>;

@Schema()
export class Wallet {
  _id: Types.ObjectId;

  @Prop()
  telegramUserId: number;

  @Prop({
    default: 'Unknown',
  })
  name: string;

  @Prop()
  chainId: number;

  @Prop()
  address: Web3Address;

  @Prop()
  privateKey: string;

  @Prop({
    default: false,
  })
  isDefault: boolean;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
