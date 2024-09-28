import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_REFRESH_TOKEN_GUARD } from '../guards/jwt-refresh.guard';
import { UsersService } from '../users.service';
import { User } from '../schemas/user.schema';

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  JWT_REFRESH_TOKEN_GUARD,
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly service: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('jwt.secret'),
      passReqToCallback: true,
    });
  }

  async validate(request: Request): Promise<User> {
    return this.service.validateRefreshToken(
      ExtractJwt.fromAuthHeaderAsBearerToken()(request),
    );
  }
}
