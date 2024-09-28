// charles-detection.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class CharlesDetectionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request && request.headers && request.headers['x-charles-proxy']) {
      return new Observable(); // Return an empty observable
    }

    return next.handle();
  }
}
