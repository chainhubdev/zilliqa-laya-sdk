import * as CryptoJS from 'crypto-js';
const SHA512 = require('crypto-js/sha512');
import { ErrorCode, ZilLayaError } from './errors';
import { IZilliqaAccount } from './zilliqaHelper';

export class LayaStorage {
  private static WALLET_PREFIX = 'zilliqa_laya_wallet_';

  private static KEY_SALT = 'salt';

  private static KEY_PASSWORD_HASH = 'password_hash';

  private readonly walletPrefix: string;
  private readonly storage: any;

  constructor(walletPrefix: string = LayaStorage.WALLET_PREFIX) {
    this.walletPrefix = walletPrefix;
    this.storage = localStorage;
  }

  public setPasswordHash(password: string) {
    if (password.length < 4 || password.length > 20) {
      const message: string = 'Length of password should between 4 and 20.';
      throw new ZilLayaError(message, ErrorCode.ILLEGAL_PASSWORD);
    }

    const salt: string = this.getOrCreateSalt();
    const passwordSHA512 = SHA512(password, salt).toString();
    const key: string = this.walletPrefix + LayaStorage.KEY_PASSWORD_HASH;
    this.storage.setItem(key, passwordSHA512);
  }

  public validatePassword(password: string): boolean {
    const salt: string = this.getOrCreateSalt();
    const passwordSHA512 = SHA512(password, salt).toString();

    const key: string = this.walletPrefix + LayaStorage.KEY_PASSWORD_HASH;
    const storedHash = this.storage.getItem(key);

    return passwordSHA512 === storedHash;
  }

  public loadAccounts(node: string): IZilliqaAccount[] {
    try {
      const accountsStr = localStorage.getItem(LayaStorage.WALLET_PREFIX + node);
      if (accountsStr) {
        const accounts: IZilliqaAccount[] = JSON.parse(accountsStr);
        return accounts;
      } else {
        return [];
      }
    } catch (err) {
      throw err;
    }
  }

  public saveAccounts(accounts: IZilliqaAccount[], node: string): boolean {
    try {
      const accountsStr = JSON.stringify(accounts);
      localStorage.setItem(LayaStorage.WALLET_PREFIX + node, accountsStr);
      return true;
    } catch (err) {
      throw err;
    }
  }

  private getOrCreateSalt(): string {
    const key: string = this.walletPrefix + LayaStorage.KEY_SALT;
    const salt = this.storage.getItem(key);
    if (salt) {
      return salt;
    } else {
      const newSalt = CryptoJS.lib.WordArray.random(32).toString();
      this.storage.setItem(key, newSalt);
      return newSalt;
    }
  }
}
