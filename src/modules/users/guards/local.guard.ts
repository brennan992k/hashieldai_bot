import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LOCAL_GUARD } from '../strategies/local.strategy';

@Injectable()
export class LocalGuard extends AuthGuard(LOCAL_GUARD) {}
