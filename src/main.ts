import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { CommonLogger } from './common/logger';
import { AppMode } from './configuration/configuration';
import { getBotToken } from 'nestjs-telegraf';
import { session } from 'telegraf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:
      AppModule.mode == AppMode.production
        ? []
        : ['warn', 'error', 'debug', 'log', 'verbose'],
  });

  app.enableCors();

  app.useWebSocketAdapter(new IoAdapter(app));

  const global_prefix = `/api/${AppModule.version_path}`;
  app.setGlobalPrefix(global_prefix);

  const bot = app.get(getBotToken());
  bot.use(session());

  bot.catch((error) => {
    CommonLogger.instance.log(`error ${error?.message}`);
  });

  await app.listen(AppModule.port || 3000);

  // Log current url of app
  let base_url = app.getHttpServer().address().address;
  if (base_url === '0.0.0.0' || base_url === '::') {
    base_url = 'localhost';
  }

  CommonLogger.instance.log(
    `Listening to http://${base_url}:${AppModule.port}${global_prefix}`,
  );
}

bootstrap();
