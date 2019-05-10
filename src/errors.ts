/**
 * Error code
 *
 * Error code enums
 *
 */
export const enum ErrorCode {
  // Illegal private key error
  ILLEGAL_PRIVATE_KEY = 'ILLEGAL_PRIVATE_KEY',

  // Unable to save account
  UNABLE_TO_SAVE_ACCOUNT = 'UNABLE_TO_SAVE_ACCOUNT',

  // Illegal password
  ILLEGAL_PASSWORD = 'ILLEGAL_PASSWORD',
}

/**
 * ZilLayaError
 *
 * Custom error for use with Zilliqa Laya Sdk.
 *
 * @extends {Error}
 */
export class ZilLayaError extends Error {
  public code: ErrorCode;

  constructor(message: string, code: ErrorCode) {
    super(message);
    this.code = code;
  }
}
