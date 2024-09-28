import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';
import { isObject } from 'class-validator';
import { AppModule } from 'src/app.module';
import { encryptData } from '../utils/web3';

@Injectable()
export class HashResponseInterceptor implements NestInterceptor {
  constructor(private config_service: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((response) => {
        const name = this.config_service.get<string>('name');

        if (isObject(response)) {
          response = {
            ...response,
            system: {
              name,
              mode: AppModule.mode,
              version: {
                code: AppModule.version_code,
                name: AppModule.version_name,
                path: AppModule.version_path,
              },
              timezone: AppModule.timezone,
            },
          };

          const hashed = this.config_service.get<boolean>('response.hashed');
          if (hashed && response['data']) {
            const secret_key =
              this.config_service.get<string>('response.secret');
            const hashed_data = (() => {
              if (typeof response['data'] == 'object') {
                return encryptData(
                  JSON.stringify(response['data']),
                  secret_key,
                );
              } else {
                return encryptData(response['data'], secret_key);
              }
            })();
            response = {
              ...response,
              data: hashed_data,
            };
          }
        }

        return response;
      }),
    );
  }
}
