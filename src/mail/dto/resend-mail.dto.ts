import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ResendMailDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  type: string;
}