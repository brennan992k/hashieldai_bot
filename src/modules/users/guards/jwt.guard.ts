import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import * as jwt from 'jsonwebtoken';

const HTTP_STATUS_TOKEN_EXPIRED = 498;
export const JWT_GUARD = 'jwt';

@Injectable()
export class JwtGuard extends AuthGuard(JWT_GUARD) {
  static headerName = 'access-token';

  handleRequest(error, user, info) {
    if (info instanceof jwt.TokenExpiredError) {
      throw new HttpException(
        'Token is invalid or expired',
        HTTP_STATUS_TOKEN_EXPIRED,
      );
    }

    if (error || !user) {
      if (error) throw error;
      throw new UnauthorizedException('Token is invalid or expired');
    }

    return user;
  }
}
