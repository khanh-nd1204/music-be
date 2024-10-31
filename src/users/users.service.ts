import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { compareSync, genSaltSync, hashSync } from 'bcryptjs';
import { IUser } from './users.interface';
import aqp from 'api-query-params';
import mongoose, { Model } from 'mongoose';
import { ChangeUserDto } from './dto/change-user.dto';
import dayjs from 'dayjs';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { ActivateUserDto } from './dto/activate-user.dto';
import { ResetUserDto } from './dto/reset-user.dto';
import { ResendMailDto } from '../mail/dto/resend-mail.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private mailService: MailService,
    private configService: ConfigService,
    ) {}

  async create(createUserDto: CreateUserDto, user: IUser) {
    const isExist = await this.userModel.findOne({ email: createUserDto.email });
    if (isExist) {
      throw new BadRequestException('Email already exists!');
    }
    createUserDto.password = hashSync(createUserDto.password, genSaltSync(10));
    const createdBy = { _id: user._id, email: user.email };
    return await this.userModel.create({
      ...createUserDto,
      role: 'USER',
      isActive: true,
      avatar: 'avatar-default.png',
      createdBy,
    });
  }

  async bulk(listCreateUserDto: CreateUserDto[], user: IUser) {
    const seenEmails = new Set();
    const uniqueList = listCreateUserDto.filter((item) => {
      if (seenEmails.has(item.email)) {
        return false;
      } else {
        seenEmails.add(item.email);
        return true;
      }
    });

    const createdBy = { _id: user._id, email: user.email };
    const list = await Promise.all(
      uniqueList.map(async (item) => {
        item.password = hashSync(item.password, genSaltSync(10));
        const isExist = await this.userModel.findOne({
          email: item.email,
        });
        if (!isExist) {
          return {
            ...item,
            role: 'USER',
            isActive: true,
            avatar: 'avatar-default.png',
            createdBy,
          };
        }
        return null;
      }),
    );

    const filteredList = list.filter((item) => item !== null);

    const result = await this.userModel.insertMany(filteredList);
    return {
      success: result.length,
      fail: listCreateUserDto.length - result.length,
    };
  }

  async register(createUserDto: CreateUserDto) {
    const isExist = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (isExist) {
      throw new BadRequestException('Email already exists!');
    }
    createUserDto.password = hashSync(createUserDto.password, genSaltSync(10));
    const otp = Math.floor(100000 + Math.random() * 900000);
    const result = await this.userModel.create({
      ...createUserDto,
      role: 'USER',
      isActive: false,
      avatar: 'avatar-default.png',
      otp,
      otpExpired: dayjs().add(this.configService.get<number>('MAIL_EXPIRED'), 'minutes')
    });
    this.mailService.sendMail(createUserDto.email, createUserDto.name, otp, 'activate');
    return result;
  }

  async activate(activateUserDto: ActivateUserDto) {
    const user = await this.userModel.findOne({ email: activateUserDto.email });
    if (!user) {
      throw new NotFoundException('User not found!');
    }
    if (user.isActive) {
      throw new BadRequestException('Account has already been activated!');
    }
    if (user.otp !== activateUserDto.otp) {
      throw new BadRequestException('Invalid OTP!');
    }
    const activatedAt = new Date();
    if (activatedAt > user.otpExpired) {
      throw new BadRequestException('OTP has expired!');
    }

    const result = await this.userModel.updateOne(
      { email: activateUserDto.email },
      { isActive: true, updatedAt: activatedAt }
    );
    if (result.modifiedCount === 0) {
      throw new NotFoundException('Account activation failed!');
    }
    return result;
  }

  async resendMail(resendMailDto: ResendMailDto) {
    const user = await this.userModel.findOne({ email: resendMailDto.email });
    if (!user) {
      throw new BadRequestException('User not found!')
    }

    if (resendMailDto.type === 'activate' && user.isActive) {
      throw new BadRequestException('Account has already been activated!');
    }

    if (resendMailDto.type === 'password' && !user.isActive) {
      throw new BadRequestException('Account has not been activated!');
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const result = await this.userModel.updateOne(
      { email: resendMailDto.email },
      { otp, otpExpired: dayjs().add(this.configService.get<number>('MAIL_EXPIRED'), 'minutes') },
    );
    this.mailService.sendMail(user.email, user.name, otp, resendMailDto.type);
    return result;
  }

  async resetPassword(resetUserDto: ResetUserDto) {
    const user = await this.userModel.findOne({ email: resetUserDto.email });
    if (!user) {
      throw new BadRequestException('User not found!')
    }
    if (!user.isActive) {
      throw new BadRequestException('Account has not been activated!');
    }
    if (user.otp !== resetUserDto.otp) {
      throw new BadRequestException('Invalid OTP!');
    }
    const updatedAt = new Date();
    if (updatedAt > user.otpExpired) {
      throw new BadRequestException('OTP has expired!');
    }

    resetUserDto.newPassword = hashSync(resetUserDto.newPassword, genSaltSync(10));
    const result = await this.userModel.updateOne(
      { email: resetUserDto.email },
      { password: resetUserDto.newPassword, updatedAt: updatedAt },
    );
    if (result.matchedCount === 0) {
      throw new NotFoundException('User not found!');
    }
    if (result.modifiedCount === 0) {
      throw new NotFoundException('No password were modified!');
    }
    return result;
  }

  async findAll(query: string) {
    const { filter, sort, population } = aqp(query);
    const { current, pageSize } = filter;
    if (!current || !pageSize) {
      throw new BadRequestException('Missing current page and page size!');
    }
    delete filter.current;
    delete filter.pageSize;

    const skip = (current - 1) * pageSize;
    const total = await this.userModel.countDocuments(filter);
    const pages = Math.ceil(total / pageSize);

    const data = await this.userModel
      .find(filter)
      .skip(skip)
      .limit(pageSize)
      .sort(sort as any)
      .select(['-password', '-refreshToken'])
      .populate(population)
      .exec();

    return {
      meta: { current, pageSize, pages, total },
      data,
    };
  }

  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID!');
    }
    const result = await this.userModel
      .findOne({ _id: id })
      .select('-password');
    if (!result) {
      throw new NotFoundException('User not found!');
    }
    return result;
  }

  async findOneByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  isValidPassword(password: string, hash: string) {
    return compareSync(password, hash);
  }

  async update(updateUserDto: UpdateUserDto, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(updateUserDto._id)) {
      throw new BadRequestException('Invalid user ID!');
    }
    const updatedBy = { _id: user._id, email: user.email };
    const result = await this.userModel.updateOne(
      { _id: updateUserDto._id },
      { ...updateUserDto, updatedBy },
    );
    if (result.matchedCount === 0) {
      throw new NotFoundException('User not found!');
    }
    if (result.modifiedCount === 0) {
      throw new NotFoundException('No user were modified!');
    }
    return result;
  }

  async remove(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID!');
    }

    const foundUser = await this.userModel.findOne({ _id: id });
    if (foundUser && foundUser.email === 'admin@gmail.com') {
      throw new BadRequestException('Cannot delete admin account!');
    }

    const result = await this.userModel.deleteOne({ _id: id });
    if (result.deletedCount === 0 || !result.acknowledged) {
      throw new NotFoundException('User deletion failed!');
    }
    return result;
  }

  async updateRefreshToken(id: string, refreshToken: string) {
    await this.userModel.updateOne({ _id: id }, { refreshToken });
  }

  async findOneByToken(refreshToken: string) {
    return this.userModel.findOne({ refreshToken });
  }

  async changePassword(changeUserDto: ChangeUserDto) {
    if (!mongoose.Types.ObjectId.isValid(changeUserDto._id)) {
      throw new BadRequestException('Invalid user ID!');
    }
    const user = await this.userModel.findOne({ _id: changeUserDto._id });
    if (user) {
      const isValid = this.isValidPassword(changeUserDto.oldPassword, user.password);
      if (!isValid) {
        throw new BadRequestException('Invalid password!');
      } else {
        changeUserDto.newPassword = hashSync(changeUserDto.newPassword, genSaltSync(10));
        const result = await this.userModel.updateOne(
          { _id: changeUserDto._id },
          { password: changeUserDto.newPassword, updatedAt: new Date() },
        );
        if (result.matchedCount === 0) {
          throw new NotFoundException('User not found!');
        }
        if (result.modifiedCount === 0) {
          throw new NotFoundException('No password were modified!');
        }
        return result;
      }
    } else {
      throw new NotFoundException('User not found!');
    }
  }
}
