import {
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class ChangeUserDto {
  @IsString()
  @IsNotEmpty()
  _id: string;

  @MinLength(6)
  @IsString()
  @IsNotEmpty()
  password: string;

  @MinLength(6)
  @IsString()
  @IsNotEmpty()
  oldPassword: string;
}
