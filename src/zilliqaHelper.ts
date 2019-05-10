import { Contract, State } from '@zilliqa-js/contract';
import { getAddressFromPrivateKey, verifyPrivateKey } from '@zilliqa-js/crypto';
import { bytes, Long, units } from '@zilliqa-js/util';
import { Zilliqa } from '@zilliqa-js/zilliqa';
const bip39 = require('bip39');
const hdkey = require('hdkey');
import { ErrorCode, ZilLayaError } from './errors';
import { IZilliqaBalanceResult } from './types';

/**
 * IZilliqaAccount
 *
 * Zilliqa account structure
 *
 */
export interface IZilliqaAccount {
  address: string;
  privateKey: string;
}

/**
 * ZilliqaHelper
 *
 * Helper class to communicate with zilliqa network.
 *
 */
export class ZilliqaHelper {

  /**
   * createAccount
   *
   * Creates new account and returns account with corresponding mnemonic
   *
   * @returns {[IZilliqaAccount, string]} Account and mnemonic
   */
  public static createAccount(): [IZilliqaAccount, string] {
    const mnemonic = bip39.generateMnemonic();
    const privateKey = ZilliqaHelper.mnemonicToPrivateKey(mnemonic);
    const address = getAddressFromPrivateKey(privateKey);

    return [{ address, privateKey }, mnemonic];
  }

  /**
   * mnemonicToPrivateKey
   *
   * Transfer mnemonic words to private key
   *
   * @param {string} Mnemonic words
   *
   * @returns {string} private key
   */
  public static mnemonicToPrivateKey(mnemonic: string): string {
    const seed = bip39.mnemonicToSeed(mnemonic);
    const hdKey = hdkey.fromMasterSeed(seed);
    const childKey = hdKey.derive(`m/44'/8888'/0'/0/0`);
    const privateKey = childKey.privateKey.toString('hex');

    return privateKey;
  }

  /**
   * mnemonicToPrivateKey
   *
   * Transfer mnemonic words to private key
   *
   * @param {string} Mnemonic words
   *
   * @returns {string} private key
   */
  public static importAccountFromPrivateKey(privateKey: string): IZilliqaAccount {
    if (!verifyPrivateKey(privateKey)) {
      const message: string = 'Illegal private key.';
      throw new ZilLayaError(message, ErrorCode.ILLEGAL_PRIVATE_KEY);
    }

    const address = getAddressFromPrivateKey(privateKey);
    return { address, privateKey };
  }

  /**
   * importAccountFromMnemonic
   *
   * Import acccount from mnemonic words
   *
   * @param {string} Mnemonic words
   *
   * @returns {IZilliqaAccount} Account
   */
  public static importAccountFromMnemonic(mnemonic: string): IZilliqaAccount {
    const privateKey = this.mnemonicToPrivateKey(mnemonic);
    if (!verifyPrivateKey(privateKey)) {
      const message: string = 'Illegal mnemonic words.';
      throw new ZilLayaError(message, ErrorCode.ILLEGAL_PRIVATE_KEY);
    }

    const address = getAddressFromPrivateKey(privateKey);
    return { address, privateKey };
  }

  /**
   * getBalance
   *
   * Get balance of providing address
   *
   * @param {Zilliqa} Native zilliqa client
   * @param {string} address
   *
   * @returns {Promise<any>} Balance
   */
  public static async getBalance(client: Zilliqa, address: string): Promise<any> {
    const response = await client.blockchain.getBalance(address);
    if (response.error) {
      return new Promise<string>(reject => {
        reject(response.error.message);
      });
    } else {
      return new Promise<IZilliqaBalanceResult>(resolve => {
        resolve(response.result);
      });
    }
  }

  /**
   * getMinimumGasPrice
   *
   * Get minimum gas price
   *
   * @param {Zilliqa} Native zilliqa client
   *
   * @returns {Promise<string>} Gas price
   */
  public static async getMinimumGasPrice(client: Zilliqa): Promise<string> {
    const response = await client.blockchain.getMinimumGasPrice();
    if (response.error) {
      return new Promise<string>(reject => {
        reject(response.error.message);
      });
    } else {
      return new Promise<string>(resolve => {
        resolve(response.result);
      });
    }
  }

  /**
   * getNetworkId
   *
   * Get network id
   *
   * @param {Zilliqa} Native zilliqa client
   *
   * @returns {Promise<string>} Network id
   */
  public static async getNetworkId(client: Zilliqa): Promise<string> {
    const response = await client.network.GetNetworkId();
    return new Promise<string>(resolve => {
      const id = response.result || '';
      resolve(id);
    });
  }

  /**
   * getZilliqaVersion
   *
   * Get zilliqa message version
   *
   * @param {number} Zilliqa network chain id
   * @param {number} Message version
   *
   * @returns {number} Zilliqa message version
   */
  public static getZilliqaVersion(chainID: number, msgVersion = 1): number {
    return bytes.pack(chainID, msgVersion);
  }

  /**
   * sendToken
   *
   * Sends token
   *
   * @param {Zilliqa} Native zilliqa client
   * @param {number} Zilliqa message version
   * @param {string} Destination address
   * @param {string} Token amount
   * @param {string} Gas price
   * @param {number} Gas limit
   *
   * @returns {Promise<any>} Zilliqa transaction
   */
  public static async sendToken(
    client: Zilliqa,
    version: number,
    toAddr: string,
    amount: string,
    gasPrice: string,
    gasLimit: number,
  ): Promise<any> {
    const tx = await client.blockchain.createTransaction(
      client.transactions.new({
        toAddr,
        version,
        amount: units.toQa(amount, units.Units.Zil),
        gasPrice: units.toQa(gasPrice, units.Units.Li),
        gasLimit: Long.fromNumber(gasLimit),
      }),
    );

    if (tx.isRejected()) {
      return new Promise<string>(reject => {
        reject('Transaction failed, you may need to adjust the gas price.');
      });
    } else {
      return tx;
    }
  }

  /**
   * deployContract
   *
   * Deploys contract on zilliqa network
   *
   * @param {Zilliqa} Native zilliqa client
   * @param {string} Contract code
   * @param {string} Contract owner
   * @param {number} Zilliqa message version
   * @param {string} Gas price
   * @param {number} Gas limit
   *
   * @returns {Promise<any>} Zilliqa transaction
   */
  public static async deployContract(
    client: Zilliqa,
    code: string,
    owner: string,
    version: number,
    gasPrice: string,
    gasLimit: number,
  ): Promise<any> {
    const init = [
      {
        type: 'Uint32',
        value: '0',
        vname: '_scilla_version',
      },
      {
        type: 'ByStr20',
        value: '0x' + owner.toLowerCase(),
        vname: 'owner',
      },
    ];

    const contract = client.contracts.new(code, init);
    const [tx, deployedContract] = await contract.deploy({
      version,
      gasPrice: units.toQa(gasPrice, units.Units.Li),
      gasLimit: Long.fromNumber(gasLimit),
    });

    if (tx.isRejected()) {
      return new Promise<string>(reject => {
        reject('Transaction failed, you may need to adjust the gas price or check code.');
      });
    } else {
      return [tx, deployedContract];
    }
  }

  /**
   * getContractAtAddress
   *
   * Create contract instance at providing address
   *
   * @param {Zilliqa} Native zilliqa client
   * @param {string} Contract address
   *
   * @returns {Contract} Zilliqa contract
   */
  public static getContractAtAddress(client: Zilliqa, address: string): Contract {
    return client.contracts.at(address);
  }

  /**
   * callContract
   *
   * Calls zilliqa contract
   *
   * @param {Zilliqa} Native zilliqa client
   * @param {string} Contract transition
   * @param {any} Contract parameters
   * @param {number} Zilliqa message version
   * @param {string} Token amount
   * @param {string} Gas price
   * @param {number} Gas limit
   *
   * @returns {Promise<any>} Zilliqa transaction
   */
  public static async callContract(
    contract: Contract,
    transition: string,
    args: any,
    version: number,
    amount: string,
    gasPrice: string,
    gasLimit: number,
  ): Promise<any> {
    const tx = await contract.call(transition, args, {
      version,
      amount: units.toQa(amount, units.Units.Zil),
      gasPrice: units.toQa(gasPrice, units.Units.Li),
      gasLimit: Long.fromNumber(gasLimit),
    });
    if (tx.isRejected()) {
      return new Promise<string>(reject => {
        reject('Transaction failed, you may need to adjust the gas price.');
      });
    } else {
      return tx;
    }
  }

  /**
   * getContractState
   *
   * Get state of providing zilliqa contract
   *
   * @param {Contract} Zilliqa contract
   *
   * @returns {Promise<State>} State of zilliqa contract
   */
  public static async getContractState(contract: Contract): Promise<State> {
    return contract.getState();
  }
}
