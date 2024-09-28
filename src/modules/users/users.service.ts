// auth.service.ts
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ProfileResponse } from './responses/profile.response';
import { CommonLogger } from 'src/common/logger';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ParamDto } from './dto/param.dto';
import { Password } from 'src/common/utils/password';
import { JwtService } from '@nestjs/jwt';
import { TokensResponse } from './responses/tokens.response';
import { x64 } from 'murmurhash3js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
    protected readonly configService: ConfigService,
  ) {}

  public async register(
    body: RegisterDto,
    // fingerprint: IFingerprint,
  ): Promise<TokensResponse> {
    try {
      if (await this.userModel.findOne({ email: body.email }).exec()) {
        throw new BadRequestException('User is already existing.');
      }

      const hashedPassword = await Password.instance.hash(
        `${body.email}_${body.password}`,
        body.email,
        body.password,
      );

      const user = await this.userModel.create({
        email: body.email,
        password: hashedPassword,
        token: x64.hash128(
          JSON.stringify({
            email: body.email,
            password: hashedPassword,
          }),
        ),
      });

      if (!user) throw new BadRequestException('Register failed.');

      return this.login(user);
    } catch (error) {
      CommonLogger.instance.error(`register error ${error?.message}`);

      return {
        status: false,
        error: {
          message: error?.message,
        },
      };
    }
  }

  public async login(user: User): Promise<TokensResponse> {
    try {
      const accessExpiresIn = parseInt(this.configService.get('jwt.expiresIn'));
      const refreshExpiresIn = accessExpiresIn * 1.5;

      return {
        status: true,
        data: {
          accessToken: this.jwtService.sign(
            {
              _id: user._id.toString(),
              email: user.email,
            },
            {
              secret: this.configService.get('jwt.secret'),
              expiresIn: accessExpiresIn,
            },
          ),
          accessExpiredAt: new Date().getTime() + accessExpiresIn * 1000,
          accessExpiredIn: accessExpiresIn * 1000,
          refreshToken: this.jwtService.sign(
            {
              _id: user._id.toString(),
              email: user.email,
            },
            {
              secret: this.configService.get('jwt.secret'),
              expiresIn: refreshExpiresIn,
            },
          ),
          refreshExpiredAt: new Date().getTime() + refreshExpiresIn * 1000,
          refreshExpiredIn: refreshExpiresIn * 1000,
        },
      };
    } catch (error) {
      CommonLogger.instance.error(`login error ${error?.message}`);

      return {
        status: false,
        error: {
          message: error?.message,
        },
      };
    }
  }

  async profile(param: ParamDto): Promise<ProfileResponse> {
    try {
      const user = await this.userModel.findOne({ _id: param.id }).exec();

      if (!user) throw new BadRequestException('User not found.');

      return {
        status: true,
        data: {
          _id: user._id.toString(),
          email: user.email,
          token: user.token,
        },
      };
    } catch (error) {
      CommonLogger.instance.error(`profile error ${error?.message}`);

      return {
        status: false,
        error: {
          message: error?.message,
        },
      };
    }
  }

  public async validateLogin(
    body: LoginDto,
    // fingerprint: IFingerprint,
  ): Promise<User> {
    try {
      const user = await this.userModel.findOne({ email: body.email }).exec();

      if (
        !user ||
        !(await Password.instance.compare(
          `${user.email}_${user.password}`,
          user.email,
          body.password,
          user.password,
        ))
      ) {
        throw new BadRequestException('Email or password is incorrect.');
      }

      return user;
    } catch (error) {
      CommonLogger.instance.error(`validateLogin error ${error?.message}`);

      throw error;
    }
  }

  public async validateAccessToken(accessToken: string): Promise<User> {
    try {
      const payload = this.jwtService.verify(accessToken, {
        ignoreExpiration: false,
        secret: this.configService.get('jwt.secret'),
      });

      if (!payload) {
        throw new UnauthorizedException('Token is invalid or expired.');
      }

      const user = await this.userModel
        .findOne({
          _id: payload._id,
          email: payload.email,
        })
        .exec();

      if (!user) {
        throw new UnauthorizedException('Token is invalid or expired.');
      }

      return user;
    } catch (error) {
      CommonLogger.instance.error(
        `validateAccessToken error ${error?.message}`,
      );
      throw error;
    }
  }

  public async validateRefreshToken(refreshToken: string): Promise<User> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        ignoreExpiration: false,
        secret: this.configService.get('jwt.secret'),
      });

      if (!payload) {
        throw new BadRequestException('Token is invalid or expired.');
      }

      const user = await this.userModel
        .findOne({
          _id: payload._id,
          email: payload.email,
        })
        .exec();

      if (!user) {
        throw new BadRequestException('Token is invalid or expired.');
      }

      return user;
    } catch (error) {
      CommonLogger.instance.error(
        `validateRefreshToken error ${error?.message}`,
      );
      throw error;
    }
  }

  public async validateToken(token: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({ token }).exec();

      if (!user) {
        throw new UnauthorizedException('Token is invalid or expired.');
      }

      return user;
    } catch (error) {
      CommonLogger.instance.error(`validateToken error ${error?.message}`);
      throw error;
    }
  }
}
