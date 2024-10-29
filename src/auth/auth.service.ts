import { ForbiddenException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { IUser } from '../users/users.interface';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import { Response } from 'express';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(username);
    if (user) {
      const isValid = this.usersService.isValidPassword(password, user.password);
      if (isValid) return user;
    }
    return null;
  }

  async generateTokens(payload: any) {
    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRE'),
    });

    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRE'),
    });

    return { access_token, refresh_token };
  }

  delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async login(user: IUser, response: Response) {
    const { _id, name, email, role, avatar } = user;
    const payload = { sub: 'token', iss: 'server', _id, name, email, role, avatar };
    const { access_token, refresh_token } = await this.generateTokens(payload);

    await this.usersService.updateRefreshToken(_id, refresh_token);

    response.clearCookie('refresh_token');
    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')),
    });

    await this.delay(2000);
    return {
      access_token,
      user: { _id, name, email, role, avatar },
    };
  }

  async register(createUserDto: CreateUserDto) {
    return await this.usersService.register(createUserDto);
  }

  async refreshToken(refreshToken: string, response: Response) {
    try {
      this.verifyRefreshToken(refreshToken);
      const user = await this.usersService.findOneByToken(refreshToken);
      if (user) {
        const userData: IUser = {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        };
        return await this.login(userData, response);
      } else {
        throw new ForbiddenException('Invalid refresh token!');
      }
    } catch (error) {
      throw new ForbiddenException('Invalid refresh token!');
    }
  }

  verifyRefreshToken(token: string) {
    try {
      this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      throw new ForbiddenException('Invalid refresh token!');
    }
  }

  async logout(user: IUser, response: Response) {
    response.clearCookie('refresh_token');
    await this.usersService.updateRefreshToken(user._id, null);
    await this.delay(2000);
    return null;
  }
}
