import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { genSaltSync, hashSync } from 'bcryptjs';
import { Model } from 'mongoose';

@Injectable()
export class DatabasesService implements OnModuleInit {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    const isInit = this.configService.get<string>('SHOULD_INIT');
    if (Boolean(isInit)) {
      const countUser = await this.userModel.countDocuments();
      if (countUser === 0) {
        await this.userModel.insertMany([
          {
            name: 'Admin',
            email: 'admin@gmail.com',
            password: hashSync('123456', genSaltSync(10)),
            role: 'ADMIN',
            isActive: true,
            avatar: 'avatar-default.png',
          },
          {
            name: 'User',
            email: 'user@gmail.com',
            password: hashSync('123456', genSaltSync(10)),
            role: 'USER',
            isActive: true,
            avatar: 'avatar-default.png',
          },
        ]);
      }
    }
  }
}
