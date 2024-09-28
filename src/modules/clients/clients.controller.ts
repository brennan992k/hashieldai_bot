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
import { ClientsService } from './clients.service';
import { IFingerprint } from 'nestjs-fingerprint';
import { Client } from './schemas/client.schema';
import { TokensResponse } from './responses/tokens.response';
import { AuthLocalGuard } from './guards/auth-local.guard';
import { AuthDto } from './dto/auth.dto';

@Controller('clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Post('auth')
  @HttpCode(200)
  @UseGuards(AuthLocalGuard)
  async login(
    @Req() req: { Client: Client },
    @Body() body: AuthDto,
    fingerprint: IFingerprint,
  ): Promise<TokensResponse> {
    return this.service.auth(body, fingerprint);
  }
}
