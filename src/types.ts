/**
 * Zilliqa Network
 *
 * Zilliqa Network enums
 *
 */
export enum ZilliqaNet {
  MAIN,
  TEST,
}

/**
 * Zilliqa address and mnemonic words
 *
 */
export interface IAddressWithMnemonic {
  address: string;
  mnemonic: string;
}

/**
 * Balance and current nonce for a zilliqa address
 *
 */
export interface IZilliqaBalanceResult {
  balance: string;
  nonce: string;
}
