import { Injectable, ExecutionContext } from '@nestjs/common';
import { ClientsService } from '../clients.service';
import { AuthDto } from '../dto/auth.dto';
import { validateBody } from 'src/common/utils/validate-body';

@Injectable()
export class AuthLocalGuard {
  constructor(protected readonly service: ClientsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: {
      body: AuthDto;
    } = context.switchToHttp().getRequest();

    req.body = await validateBody(req.body, AuthDto, {
      skipMissingProperties: true,
    });

    await this.service.validateAuth(req.body);

    return true;
  }
}
