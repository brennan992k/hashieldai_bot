export enum AppMode {
  production = 'production',
  development = 'development',
}

export enum AuthType {
  client = 'client',
  user = 'user',
}

export class Configuration {
  name: string;
  mode: AppMode;
  port: number;
  version: {
    code: number;
    name: string;
    path: string;
  };
  timezone: string;
  mongoose: {
    url: string;
  };
  redis: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: number;
  };
  session: {
    secret: string;
    maximumActive: number;
  };
  response: {
    hashed: boolean;
    secret: string;
  };
  telegram: {
    botName: string;
    botUser: string;
  };
  website: {
    url: string;
    docsUrl: string;
    authUrl: string;
    telegramBot: string;
  };
  auth: {
    type: AuthType;
  };
  securityKey: string;
}

export const configuration = (): Configuration => {
  return {
    name: process.env.NAME || 'Mirror Trading Bot',
    mode: (process.env.MODE as AppMode) || AppMode.production,
    port: parseInt(process.env.PORT) || 3000,
    version: {
      code: parseInt(process.env.VERSION_CODE) ?? 1,
      name: process.env.VERSION_NAME ?? '1.0.0',
      path: process.env.VERSION_PATH ?? 'v1',
    },
    timezone:
      (process.env.TIMEZONE ||
        Intl.DateTimeFormat().resolvedOptions().timeZone) ??
      'UTC',
    mongoose: {
      url: process.env.MONGOOSE_URL || 'mongodb+srv://',
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://',
    },
    jwt: {
      secret: process.env.JWT_SECRET || '',
      expiresIn: parseInt(process.env.JWT_EXPIRES_IN) || 24 * 60 * 60, /// 1 day
    },
    session: {
      secret: process.env.SESSION_SECRET ?? '',
      maximumActive: parseInt(process.env.SESSION_MAXIMUM_ACTIVE) ?? 3,
    },
    response: {
      hashed: process.env.RESPONSE_HASHED == 'true' || false,
      secret: process.env.RESPONSE_SECRET ?? '',
    },
    telegram: {
      botName: process.env.TELEGRAM_BOT_NAME ?? '',
      botUser: process.env.TELEGRAM_BOT_TOKEN ?? '',
    },
    website: {
      url: process.env.WEBSITE_URL ?? '',
      docsUrl: process.env.WEBSITE_DOCS_URL ?? '',
      authUrl: process.env.WEBSITE_AUTH_URL ?? '',
      telegramBot: process.env.WEBSITE_TELEGRAM_BOT ?? '',
    },
    auth: {
      type: (process.env.AUTH_TYPE as AuthType) ?? AuthType.client,
    },
    securityKey: process.env.SECURITY_KEY,
  };
};
