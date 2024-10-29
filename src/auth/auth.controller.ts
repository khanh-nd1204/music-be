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
import { Request, response, Response } from 'express';
import { IUser } from '../users/users.interface';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async handleLogin(
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
  async handleRegister(@Body() createUserDto: CreateUserDto) {
    const result = await this.authService.register(createUserDto);
    return {
      data: { _id: result._id, createdAt: result.createdAt },
      message: 'User registered successfully',
    };
  }

  @Get('/account')
  async handleGetAccount(@User() user: IUser) {
    return {
      data: user,
      message: 'Get account successfully',
    };
  }

  @Public()
  @Get('/refresh')
  async handleRefreshToken(
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
  async handleLogout(
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
