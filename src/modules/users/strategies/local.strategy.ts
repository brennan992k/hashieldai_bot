import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { User } from '../schemas/user.schema';
import { UsersService } from '../users.service';

export const LOCAL_GUARD = 'local';
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, LOCAL_GUARD) {
  constructor(private readonly service: UsersService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  async validate(email: string, password: string): Promise<User> {
    return this.service.validateLogin({ email, password });
  }
}
