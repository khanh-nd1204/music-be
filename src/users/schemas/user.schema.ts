import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ trim: true })
  name: string;

  @Prop({ trim: true })
  email: string;

  @Prop({ trim: true })
  password: string;

  @Prop({ trim: true })
  role: string;

  @Prop({ trim: true })
  refreshToken: string;

  @Prop({ trim: true })
  avatar: string;

  @Prop()
  isActive: boolean;

  @Prop()
  otp: number;

  @Prop()
  otpExpired: Date;

  @Prop({ type: Object })
  createdBy: {
    _id: string;
    email: string;
  };

  @Prop()
  createdAt: Date;

  @Prop({ type: Object })
  updatedBy: {
    _id: string;
    email: string;
  };

  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
