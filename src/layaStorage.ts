import * as CryptoJS from 'crypto-js';
const SHA512 = require('crypto-js/sha512');
import { ErrorCode, ZilLayaError } from './errors';
import { IZilliqaAccount } from './zilliqaHelper';

/**
 * LayaStorage
 *
 * Storage class to save zilliqa private key on Laya platform.
 *
 */
export class LayaStorage {
  private static WALLET_PREFIX = 'zilliqa_laya_wallet_';

  private static KEY_SALT = 'salt';

  private static KEY_PASSWORD_HASH = 'password_hash';

  private readonly walletPrefix: string;
  private readonly storage: any;

  /**
   * constructor
   *
   * Instantiates a LayaStorage instance with providing wallet prefix
   *
   * @param {string} Wallet prefix
   *
   */
  constructor(walletPrefix: string = LayaStorage.WALLET_PREFIX) {
    this.walletPrefix = walletPrefix;
    this.storage = localStorage;
  }

  /**
   * setPasswordHash
   *
   * Save hashed password in local storage
   *
   * @param {string} Password
   *
   */
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

  /**
   * validatePassword
   *
   * Validates providing password
   *
   * @param {string} Password
   *
   * @returns {boolean} Whether equals to saved password
   */
  public validatePassword(password: string): boolean {
    const salt: string = this.getOrCreateSalt();
    const passwordSHA512 = SHA512(password, salt).toString();

    const key: string = this.walletPrefix + LayaStorage.KEY_PASSWORD_HASH;
    const storedHash = this.storage.getItem(key);

    return passwordSHA512 === storedHash;
  }

  /**
   * loadAccounts
   *
   * Loads all accounts that saved in local storage
   *
   * @returns {IZilliqaAccount[]} Account list
   */
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

  /**
   * saveAccounts
   *
   * Saves account list to local storage
   *
   * @param {IZilliqaAccount[]} Account list
   * @param {string} Zilliqa node
   *
   * @returns {boolean} Successful saved or not
   */
  public saveAccounts(accounts: IZilliqaAccount[], node: string): boolean {
    try {
      const accountsStr = JSON.stringify(accounts);
      localStorage.setItem(LayaStorage.WALLET_PREFIX + node, accountsStr);
      return true;
    } catch (err) {
      throw err;
    }
  }

  /**
   * getOrCreateSalt
   *
   * Get password salt. If not exist, create it.
   *
   * @returns {string} Password salt
   */
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
