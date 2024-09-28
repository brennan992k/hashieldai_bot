import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export const JWT_REFRESH_TOKEN_GUARD = 'jwt-refresh-token';

@Injectable()
export class JwtRefreshGuard extends AuthGuard(JWT_REFRESH_TOKEN_GUARD) {
  static headerName = 'refresh-token';
}
