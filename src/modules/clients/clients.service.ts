// auth.service.ts
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { CommonLogger } from 'src/common/logger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { AuthDto } from './dto/auth.dto';
import { TokensResponse } from './responses/tokens.response';
import * as ethers from 'ethers';
import { Client } from './schemas/client.schema';
import { IFingerprint } from 'nestjs-fingerprint';
import { x64 } from 'murmurhash3js';
import { validateBody } from 'src/common/utils/validate-body';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name)
    private readonly clientModel: Model<Client>,
    protected readonly configService: ConfigService,
  ) {}

  public async auth(
    body: AuthDto,
    fingerprint: IFingerprint,
  ): Promise<TokensResponse> {
    try {
      await validateBody(body, AuthDto);

      const expiresIn = parseInt(this.configService.get('jwt.expiresIn'));
      const expiredAt = new Date().getTime() + expiresIn * 1000;
      const token = x64.hash128(
        JSON.stringify({
          address: body.address,
          signature: body.signature,
          fingerprint,
          expiredAt,
        }),
      );

      let client = await this.clientModel
        .findOne({ address: body.address })
        .exec();

      if (!client) {
        client = await this.clientModel.create({
          address: body.address,
          token,
          expiredAt,
        });
      } else {
        const { modifiedCount } = await this.clientModel
          .updateOne(
            {
              address: body.address,
            },
            {
              token,
              expiredAt,
            },
          )
          .exec();

        if (modifiedCount < 0) {
          throw new InternalServerErrorException();
        }
      }

      return {
        status: true,
        data: {
          address: client.address,
          token,
          expiredAt,
        },
      };
    } catch (error) {
      CommonLogger.instance.error(`auth error ${error?.message}`);

      return {
        status: false,
        error: {
          message: error?.message,
        },
      };
    }
  }

  public async validateAuth(body: AuthDto): Promise<void> {
    try {
      await validateBody(body, AuthDto);

      const signerAddr = ethers.verifyMessage(
        `Authentication code: ${body.code}@t${body.timestamp}`,
        body.signature,
      );

      if (signerAddr.toLowerCase() != body.address.toLowerCase()) {
        throw new BadRequestException('Unauthenticated');
      }
    } catch (error) {
      CommonLogger.instance.error(`validateAuth error ${error?.message}`);

      throw error;
    }
  }

  public async validateToken(token: string): Promise<Client> {
    try {
      const client = await this.clientModel.findOne({ token }).exec();

      if (!client || client.expiredAt < new Date().getTime()) {
        throw new UnauthorizedException('Token is invalid or expired.');
      }

      return client;
    } catch (error) {
      CommonLogger.instance.error(`validateToken error ${error?.message}`);

      throw error;
    }
  }
}
