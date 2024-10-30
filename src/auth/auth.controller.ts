import {
  Controller,
  Post,
  UseGuards,
  Body,
  Req,
  Res,
  Get,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public, User } from '../decorator/customize';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { Request, Response } from 'express';
import { IUser } from '../users/users.interface';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ActivateUserDto } from '../users/dto/activate-user.dto';
import { ResetUserDto } from '../users/dto/reset-user.dto';
import { ResendMailDto } from '../mail/dto/resend-mail.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(
    @Req() request: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(request.user, response);
    return {
      data: result,
      message: 'Login successfully',
    };
  }

  @Public()
  @Post('/register')
  async register(@Body() createUserDto: CreateUserDto) {
    const result = await this.authService.register(createUserDto);
    return {
      data: { _id: result._id, createdAt: result.createdAt },
      message: 'User registered successfully',
    };
  }

  @Public()
  @Post('/activate')
  async activate(@Body() activateUserDto: ActivateUserDto) {
    const result = await this.authService.activate(activateUserDto);
    return {
      data: result,
      message: 'User activated successfully',
    }
  }

  @Public()
  @Post('/resend-mail')
  async resendMail(@Body() resendMailDto: ResendMailDto) {
    const result = await this.authService.resendMail(resendMailDto);
    return {
      data: result,
      message: 'Resend mail successfully',
    }
  }

  @Public()
  @Post('/reset-password')
  async resetPassword(@Body() resetUserDto: ResetUserDto) {
    const result = await this.authService.resetPassword(resetUserDto);
    return {
      data: result,
      message: 'User reset password successfully',
    }
  }

  @Get('/account')
  async getAccount(@User() user: IUser) {
    return {
      data: user,
      message: 'Get account successfully',
    };
  }

  @Public()
  @Get('/refresh')
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies['refresh_token'];
    if (!refreshToken) {
      throw new ForbiddenException('Refresh token not found!');
    }
    const result = await this.authService.refreshToken(refreshToken, response);
    return {
      data: result,
      message: 'Get account successfully',
    };
  }

  @Post('/logout')
  async logout(
    @User() user: IUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = this.authService.logout(user, response);
    return {
      data: result,
      message: 'Logout successfully',
    };
  }
}
