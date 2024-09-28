import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class Password {
  constructor() {
    if (!Password._instance) {
      Password._instance = this;
    }
    return Password._instance;
  }

  private static _instance: Password;

  public static get instance(): Password {
    if (!Password._instance) Password._instance = new Password();
    return Password._instance;
  }

  private _encrypt(id: string, email: string, password: string): string {
    const hmac = createHmac('sha256', id);
    hmac.update(email);
    hmac.update(password);
    return hmac.digest('hex');
  }

  public async hash(
    id: string,
    email: string,
    password: string,
  ): Promise<string> {
    const encrypted_password = this._encrypt(id, email, password);
    return await bcrypt.hash(encrypted_password, await bcrypt.genSalt());
  }

  public async compare(
    id: string,
    email: string,
    password: string,
    hashed_password: string,
  ): Promise<boolean> {
    return await bcrypt.compare(
      this._encrypt(id, email, password),
      hashed_password,
    );
  }
}
