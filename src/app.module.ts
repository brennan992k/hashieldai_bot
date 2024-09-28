import { InternalServerErrorException, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestjsFingerprintModule } from 'nestjs-fingerprint';
import { configuration } from './configuration/configuration';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotModule } from './modules/bot/bot.module';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CharlesDetectionInterceptor } from './common/interceptors/charles-detection.interceptor';
import { HashResponseInterceptor } from './common/interceptors/hash-response.interceptor';
import { UsersModule } from './modules/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule } from './modules/clients/clients.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get('jwt.secret'),
          signOptions: {
            expiresIn: configService.get('jwt.expiresIn'),
          },
        };
      },
    }),
    NestjsFingerprintModule.forRoot({
      params: ['headers', 'userAgent', 'ipAddress'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('mongoose.url'),
      }),
    }),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        botName: configService.get('telegram.botName'),
        token: configService.get('telegram.botUser'),
        include: [BotModule],
      }),
    }),
    UsersModule,
    ClientsModule,
    BotModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CharlesDetectionInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HashResponseInterceptor,
    },
  ],
})
export class AppModule {
  public static mode: string;
  public static port: number | string;
  public static session_secret: string;
  public static version_code: string;
  public static version_name: string;
  public static version_path: string;
  public static timezone: string;

  constructor(private readonly config_service: ConfigService) {
    AppModule.port = AppModule.normalizePort(
      this.config_service.get('port') || 3000,
    );
    AppModule.mode = this.config_service.get('mode');
    AppModule.session_secret = this.config_service.get('session.secret');
    AppModule.version_code = this.config_service.get('version.code');
    AppModule.version_name = this.config_service.get('version.name');
    AppModule.version_path = this.config_service.get('version.path');
    AppModule.timezone = this.config_service.get('timezone');
  }

  /**
   * Normalize port or return an error if port is not valid
   * @param val The port to normalize
   */
  private static normalizePort(val: number | string): number | string {
    const port: number = typeof val === 'string' ? parseInt(val, 10) : val;

    if (Number.isNaN(port)) {
      return val;
    }

    if (port >= 0) {
      return port;
    }

    throw new InternalServerErrorException(`Port "${val}" is invalid.`);
  }
}
