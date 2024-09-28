import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { JobAction, JobStatus } from '../types';

export type JobDocument = HydratedDocument<Job>;

@Schema()
export class Job {
  _id: Types.ObjectId;

  @Prop()
  telegramUserId: number;

  @Prop()
  action: JobAction;

  @Prop()
  status: JobStatus;

  @Prop()
  params: string;

  @Prop()
  timestamp: number;
}

export const JobSchema = SchemaFactory.createForClass(Job);
