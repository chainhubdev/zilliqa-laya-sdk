import { Contract, State } from '@zilliqa-js/contract';
import { getAddressFromPrivateKey, verifyPrivateKey } from '@zilliqa-js/crypto';
import { bytes, Long, units } from '@zilliqa-js/util';
import { Zilliqa } from '@zilliqa-js/zilliqa';
const bip39 = require('bip39');
const hdkey = require('hdkey');
import { ErrorCode, ZilLayaError } from './errors';
import { IZilliqaBalanceResult } from './types';

export interface IZilliqaAccount {
  address: string;
  privateKey: string;
}

export class ZilliqaHelper {
  public static createAccount(): [IZilliqaAccount, string] {
    const mnemonic = bip39.generateMnemonic();
    const privateKey = ZilliqaHelper.mnemonicToPrivateKey(mnemonic);
    const address = getAddressFromPrivateKey(privateKey);

    return [{ address, privateKey }, mnemonic];
  }

  public static mnemonicToPrivateKey(mnemonic: string): string {
    const seed = bip39.mnemonicToSeed(mnemonic);
    const hdKey = hdkey.fromMasterSeed(seed);
    const childKey = hdKey.derive(`m/44'/8888'/0'/0/0`);
    const privateKey = childKey.privateKey.toString('hex');

    return privateKey;
  }

  public static importAccountFromPrivateKey(privateKey: string): IZilliqaAccount {
    if (!verifyPrivateKey(privateKey)) {
      const message: string = 'Illegal private key.';
      throw new ZilLayaError(message, ErrorCode.ILLEGAL_PRIVATE_KEY);
    }

    const address = getAddressFromPrivateKey(privateKey);
    return { address, privateKey };
  }

  public static importAccountFromMnemonic(mnemonic: string): IZilliqaAccount {
    const privateKey = this.mnemonicToPrivateKey(mnemonic);
    if (!verifyPrivateKey(privateKey)) {
      const message: string = 'Illegal mnemonic words.';
      throw new ZilLayaError(message, ErrorCode.ILLEGAL_PRIVATE_KEY);
    }

    const address = getAddressFromPrivateKey(privateKey);
    return { address, privateKey };
  }

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

  public static async getNetworkId(client: Zilliqa): Promise<string> {
    const response = await client.network.GetNetworkId();
    return new Promise<string>(resolve => {
      const id = response.result || '';
      resolve(id);
    });
  }

  public static getZilliqaVersion(chainID: number, msgVersion = 1): number {
    return bytes.pack(chainID, msgVersion);
  }

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

  public static getContractAtAddress(client: Zilliqa, address: string): Contract {
    return client.contracts.at(address);
  }

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

  public static async getContractState(contract: Contract): Promise<State> {
    return contract.getState();
  }
}
