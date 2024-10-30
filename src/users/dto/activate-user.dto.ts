import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class ActivateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNumber()
  @IsNotEmpty()
  otp: number;
}