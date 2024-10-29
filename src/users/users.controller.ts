import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles, User } from '../decorator/customize';
import { IUser } from './users.interface';
import { Role } from '../enum/role.enum';
import { ChangeUserDto } from './dto/change-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.Admin)
  async create(@Body() createUserDto: CreateUserDto, @User() user: IUser) {
    const result = await this.usersService.create(createUserDto, user);
    return {
      data: { _id: result._id, createdAt: result.createdAt },
      message: 'User created successfully',
    };
  }

  @Post('bulk')
  @Roles(Role.Admin)
  async createBulk(
    @Body() listCreateUserDto: CreateUserDto[],
    @User() user: IUser,
  ) {
    const result = await this.usersService.bulk(listCreateUserDto, user);
    return {
      data: result,
      message: 'Users created successfully',
    };
  }

  @Get()
  @Roles(Role.Admin)
  async findAll(@Query() query: string) {
    const result = await this.usersService.findAll(query);
    return {
      data: result,
      message: 'Users fetched successfully',
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.usersService.findOne(id);
    return {
      data: result,
      message: 'User fetched successfully',
    };
  }

  @Patch()
  async update(@Body() updateUserDto: UpdateUserDto, @User() user: IUser) {
    const result = await this.usersService.update(updateUserDto, user);
    return {
      data: result,
      message: 'User updated successfully',
    };
  }

  @Delete(':id')
  @Roles(Role.Admin)
  async remove(@Param('id') id: string, @User() user: IUser) {
    const result = await this.usersService.remove(id, user);
    return {
      data: result,
      message: 'User deleted successfully',
    };
  }

  @Post('change-password')
  async changePass(@Body() changeUserDto: ChangeUserDto) {
    const result = await this.usersService.changePassword(changeUserDto);
    return {
      data: result,
      message: 'Password updated successfully',
    };
  }
}
