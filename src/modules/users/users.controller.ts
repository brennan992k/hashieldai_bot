/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Fingerprint, IFingerprint } from 'nestjs-fingerprint';
import { ProfileResponse } from './responses/profile.response';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtGuard } from './guards/jwt.guard';
import { User } from './schemas/user.schema';
import { TokensResponse } from './responses/tokens.response';
import { LocalGuard } from './guards/local.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@Controller('accounts')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post('register')
  @HttpCode(201)
  async register(
    @Fingerprint() fingerprint: IFingerprint,
    @Body() body: RegisterDto,
  ): Promise<TokensResponse> {
    return this.service.register(body);
  }

  @Post('login')
  @HttpCode(200)
  @UseGuards(LocalGuard)
  async login(
    @Req() req: { user: User },
    @Body() body: LoginDto,
  ): Promise<TokensResponse> {
    return this.service.login(req.user);
  }

  @Get('me')
  @HttpCode(200)
  @UseGuards(JwtGuard)
  async get(@Req() req: { user: User }): Promise<ProfileResponse> {
    return this.service.profile({ id: req.user._id.toString() });
  }

  @Get('refresh-token')
  @HttpCode(200)
  @UseGuards(JwtRefreshGuard)
  async refreshToken(@Req() req: { user: User }): Promise<TokensResponse> {
    return this.service.login(req.user);
  }
}
