import { Provider } from '@zilliqa-js/core';
import { Contract, State } from '@zilliqa-js/contract';
import { Zilliqa } from '@zilliqa-js/zilliqa';
import { IZilliqaAccount, ZilliqaHelper } from './zilliqaHelper';
import { IAddressWithMnemonic, IZilliqaBalanceResult, ZilliqaNet } from './types';
import { ErrorCode, ZilLayaError } from './errors';
import { LayaStorage } from './layaStorage';

/**
 * ZilliqaLaya
 *
 * Main class to communicate with zilliqa network on Layabox platform.
 *
 */
export class ZilliqaLaya {
  private static MAIN_NET_URL = 'https://api.zilliqa.com/';

  private static TEST_NET_URL = 'https://dev-api.zilliqa.com';

  public readonly netUrl: string;

  public readonly zilliqaClient: Zilliqa;

  private readonly layaStorage: LayaStorage;

  private msgVersion: number | undefined;

  private minimumGasPrice: string | undefined;

  /**
   * constructor
   *
   * Instantiates a ZilliqaLaya instance with providing node url and provider
   *
   * @param {string | ZilliqaNet} Zilliqa network
   * @param {Provider} Zilliqa provider
   *
   */
  constructor(node: string | ZilliqaNet, provider?: Provider) {
    if (typeof node === 'string') {
      this.netUrl = node;
    } else {
      if (node === ZilliqaNet.MAIN) {
        this.netUrl = ZilliqaLaya.MAIN_NET_URL;
      } else {
        this.netUrl = ZilliqaLaya.TEST_NET_URL;
      }
    }

    this.zilliqaClient = new Zilliqa(this.netUrl, provider);
    this.layaStorage = new LayaStorage();

    const accounts = this.layaStorage.loadAccounts(this.netUrl);
    for (const account of accounts) {
      this.zilliqaClient.wallet.addByPrivateKey(account.privateKey);
    }
  }

  /**
   * createAccount
   *
   * Creates new account and returns address with corresponding mnemonic
   *
   * @returns {IAddressWithMnemonic} Address and mnemonic
   */
  public createAccount(): IAddressWithMnemonic {
    const result = ZilliqaHelper.createAccount();
    const account = result[0];
    const mnemonic = result[1];

    if (!this.saveAccount(account)) {
      throw new ZilLayaError('Failed to save account', ErrorCode.UNABLE_TO_SAVE_ACCOUNT);
    }

    return { address: account.address, mnemonic };
  }

  /**
   * importAccountFromPrivateKey
   *
   * Imports existing private key to add account and returns address
   *
   * @param {string} Private key
   *
   * @returns {string} Address
   */
  public importAccountFromPrivateKey(privateKey: string): string {
    const account = ZilliqaHelper.importAccountFromPrivateKey(privateKey);

    if (!this.saveAccount(account)) {
      throw new ZilLayaError('Failed to import account', ErrorCode.UNABLE_TO_SAVE_ACCOUNT);
    }

    return account.address;
  }

  /**
   * importAccountFromMnemonic
   *
   * Imports mnemonic words to add account and returns address
   *
   * @param {string} mnemonic words
   *
   * @returns {string} Address
   */
  public importAccountFromMnemonic(words: string): string {
    const account = ZilliqaHelper.importAccountFromMnemonic(words);

    if (!this.saveAccount(account)) {
      throw new ZilLayaError('Failed to import account', ErrorCode.UNABLE_TO_SAVE_ACCOUNT);
    }

    return account.address;
  }

  /**
   * getAllAddresses
   *
   * Get all addresses of imported or created accounts
   *
   * @returns {string[]} Array of address
   */
  public getAllAddresses(): string[] {
    const accounts = this.layaStorage.loadAccounts(this.netUrl);
    const addresses: string[] = [];
    for (const account of accounts) {
      addresses.push(account.address);
    }

    return addresses;
  }

  /**
   * getMinimumGasPrice
   *
   * Get minimum gas price of current network
   *
   * @returns {string} Gas price
   */
  public async getMinimumGasPrice(): Promise<string> {
    if (!this.minimumGasPrice) {
      this.minimumGasPrice = await ZilliqaHelper.getMinimumGasPrice(this.zilliqaClient);
    }

    return this.minimumGasPrice;
  }

  /**
   * getNetworkId
   *
   * Get ID of current network
   *
   * @returns {string} Network ID
   */
  public async getNetworkId(): Promise<string> {
    return ZilliqaHelper.getNetworkId(this.zilliqaClient);
  }

  /**
   * getBalance
   *
   * Get balance of given address
   *
   * @param {string} Address
   *
   * @returns {IZilliqaBalanceResult} Balance and nonce
   */
  public async getBalance(address: string): Promise<IZilliqaBalanceResult> {
    return ZilliqaHelper.getBalance(this.zilliqaClient, address);
  }

  /**
   * sendToken
   *
   * Sends zilliqa token from one address to another address
   *
   * @param {string} From address
   * @param {string} To address
   * @param {string} Token amount
   * @param {string} Gas price, if not provided using minimum
   * @param {number} Gas limit
   *
   * @returns {any} Zilliqa transaction if no exception happened
   */
  public async sendToken(
    fromAddr: string,
    toAddr: string,
    amount: string,
    gasPrice?: string,
    gasLimit = 1,
  ): Promise<any> {
    if (!this.setDefaultAddress(fromAddr)) {
      return new Promise<string>(reject => {
        reject('Address not exist in your wallet: ' + fromAddr);
      });
    }

    const msgVersion = await this.getMsgVersion();
    if (!gasPrice) {
      gasPrice = await this.getMinimumGasPrice();
    }

    return ZilliqaHelper.sendToken(this.zilliqaClient, msgVersion, toAddr, amount, gasPrice, gasLimit);
  }

  /**
   * deployContract
   *
   * Deploys a contract on zilliqa network
   *
   * @param {string} From address
   * @param {string} Contract code
   * @param {string} Gas price, if not provided using minimum
   * @param {number} Gas limit
   *
   * @returns {any} Zilliqa transaction and contract if no exception happened
   */
  public async deployContract(fromAddr: string, code: string, gasPrice?: string, gasLimit = 100000): Promise<any> {
    if (!this.setDefaultAddress(fromAddr)) {
      return new Promise<string>(reject => {
        reject('Address not exist in your wallet: ' + fromAddr);
      });
    }

    const msgVersion = await this.getMsgVersion();
    if (!gasPrice) {
      gasPrice = await this.getMinimumGasPrice();
    }

    return ZilliqaHelper.deployContract(this.zilliqaClient, code, fromAddr, msgVersion, gasPrice, gasLimit);
  }

  /**
   * callContract
   *
   * Call a contract on zilliqa network
   *
   * @param {string} From address
   * @param {contract} Contract
   * @param {string} Transition
   * @param {any}    Parameters
   * @param {string} Token amount
   * @param {string} Gas price, if not provided using minimum
   * @param {number} Gas limit
   *
   * @returns {any} Zilliqa transaction if no exception happened
   */
  public async callContract(
    fromAddr: string,
    contract: Contract,
    transition: string,
    args: any,
    amount: string,
    gasPrice?: string,
    gasLimit = 100000,
  ): Promise<any> {
    if (!this.setDefaultAddress(fromAddr)) {
      return new Promise<string>(reject => {
        reject('Address not exist in your wallet: ' + fromAddr);
      });
    }

    const msgVersion = await this.getMsgVersion();
    if (!gasPrice) {
      gasPrice = await this.getMinimumGasPrice();
    }

    return ZilliqaHelper.callContract(contract, transition, args, msgVersion, amount, gasPrice, gasLimit);
  }

  /**
   * callContractAtAddress
   *
   * Call a contract on zilliqa network
   *
   * @param {string} From address
   * @param {string} Contract address
   * @param {string} Transition
   * @param {any}    Parameters
   * @param {string} Token amount
   * @param {string} Gas price, if not provided using minimum
   * @param {number} Gas limit
   *
   * @returns {any} Zilliqa transaction
   */
  public async callContractAtAddress(
    fromAddr: string,
    contractAddr: string,
    transition: string,
    args: any,
    amount: string,
    gasPrice?: string,
    gasLimit = 100000,
  ): Promise<any> {
    const contract = ZilliqaHelper.getContractAtAddress(this.zilliqaClient, contractAddr);
    await ZilliqaHelper.getContractState(contract);
    return this.callContract(fromAddr, contract, transition, args, amount, gasPrice, gasLimit);
  }

  /**
   * getContractStateAtAddress
   *
   * Gets contract state within given address
   *
   * @param {string} Contract address
   *
   * @returns {State} Contract state
   */
  public async getContractStateAtAddress(contractAddr: string): Promise<State> {
    const contract = ZilliqaHelper.getContractAtAddress(this.zilliqaClient, contractAddr);

    return ZilliqaHelper.getContractState(contract);
  }

  /**
   * saveAccount
   *
   * Saves account to storage
   *
   * @param {IZilliqaAccount} Account
   *
   * @returns {boolean} Result of operation
   */
  private saveAccount(account: IZilliqaAccount): boolean {
    const accounts = this.layaStorage.loadAccounts(this.netUrl);
    let isExist = false;
    for (const tmpAccount of accounts) {
      if (tmpAccount.privateKey === account.privateKey) {
        isExist = true;
        break;
      }
    }

    if (isExist) {
      return true;
    }

    accounts.push(account);
    const result = this.layaStorage.saveAccounts(accounts, this.netUrl);
    if (result) {
      this.zilliqaClient.wallet.addByPrivateKey(account.privateKey);
    }

    return result;
  }

  /**
   * setDefaultAddress
   *
   * Sets default account
   *
   * @param {string} Account address
   *
   * @returns {boolean} Result of operation
   */
  private setDefaultAddress(address: string): boolean {
    const addresses = this.getAllAddresses();
    if (addresses.includes(address)) {
      this.zilliqaClient.wallet.setDefault(address);
      return true;
    }

    return false;
  }

  /**
   * getMsgVersion
   *
   * Get message version of current network
   *
   * @returns {number} Message version
   */
  private async getMsgVersion(): Promise<number> {
    if (!this.msgVersion) {
      const chainId = await ZilliqaHelper.getNetworkId(this.zilliqaClient);
      this.msgVersion = ZilliqaHelper.getZilliqaVersion(+chainId);
    }

    return this.msgVersion;
  }
}
