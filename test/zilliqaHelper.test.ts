import { ZilliqaHelper } from '../src/zilliqaHelper';
import { getAddressFromPrivateKey, verifyPrivateKey } from '@zilliqa-js/crypto';
import { Zilliqa } from '@zilliqa-js/zilliqa';
import * as CP from '@zilliqa-js/crypto';

test('create account', () => {
  const [account, mnemonic] = ZilliqaHelper.createAccount();
  expect(verifyPrivateKey(account.privateKey));
  expect(getAddressFromPrivateKey(account.privateKey) === account.address);
  console.log(account.privateKey);
  console.log(mnemonic);
  expect(mnemonic.split(' ').length).toBe(12);
});

test('never create same account', () => {
  const account1 = ZilliqaHelper.createAccount()[0];
  expect(verifyPrivateKey(account1.privateKey));
  expect(getAddressFromPrivateKey(account1.privateKey) === account1.address);

  const account2 = ZilliqaHelper.createAccount()[0];
  expect(verifyPrivateKey(account2.privateKey));
  expect(getAddressFromPrivateKey(account2.privateKey) === account2.address);

  expect(account1.address != account2.address).toBe(true);
});

test('import mnemonic words', () => {
  const mnemonic = 'circle nurse cage energy dolphin link evil young talk unable strike family';
  const account = ZilliqaHelper.importAccountFromMnemonic(mnemonic);

  const privateKey = '2c2622bb68d83edec8cccc87f16e194f46a34f6fcc8b1f72c728e2e736f6f999';

  expect(account.privateKey).toBe(privateKey);
});

test('import private key', () => {
  const privateKey = '2c2622bb68d83edec8cccc87f16e194f46a34f6fcc8b1f72c728e2e736f6f999';

  const account = ZilliqaHelper.importAccountFromPrivateKey(privateKey);
  expect(account.privateKey).toBe(privateKey);
});

test('get balance', async () => {
  const client = new Zilliqa('https://dev-api.zilliqa.com');
  const address = '573EC96638C8BB1C386394602E1460634F02ADDA';
  const result = await ZilliqaHelper.getBalance(client, address);
  const balance = +result.balance;
  expect(balance).toBeGreaterThan(0);
});

test('get balance with exception', async () => {
  const client = new Zilliqa('https://foo.com');
  try {
    await ZilliqaHelper.getBalance(client, '573EC96638C8BB1C386394602E1460634F02ADDA');
    expect(true).toBe(false);
  } catch (e) {
    expect(true).toBe(true);
  }
});

test('get minimum gas price', async () => {
  const client = new Zilliqa('https://dev-api.zilliqa.com');
  const result = await ZilliqaHelper.getMinimumGasPrice(client);
  expect(+result).toBeGreaterThan(0);
});

test('get minimum gas price with exception', async () => {
  const client = new Zilliqa('https://foo.com');
  try {
    await ZilliqaHelper.getMinimumGasPrice(client);
    expect(true).toBe(false);
  } catch (e) {
    expect(true).toBe(true);
  }
});

test('get network ID', async () => {
  jest.setTimeout(300000);
  const testClient = new Zilliqa('https://dev-api.zilliqa.com');
  const testId = await ZilliqaHelper.getNetworkId(testClient);
  expect(testId).toBe('333');

  const mainClient = new Zilliqa('https://api.zilliqa.com/');
  const mainId = await ZilliqaHelper.getNetworkId(mainClient);
  expect(mainId).toBe('1');
});

test('send token', async () => {
  jest.setTimeout(300000);

  const client = new Zilliqa('https://dev-api.zilliqa.com');
  const privateKey = 'f4c43ef478f0f05667f90c10f6d17d61c8a324e0fd5b2db2c67568c070813879';
  client.wallet.addByPrivateKey(privateKey);

  const address = CP.getAddressFromPrivateKey(privateKey);
  console.log('address: ' + address);

  const result = await ZilliqaHelper.getBalance(client, address);
  console.log('balance: ' + result.balance);
  expect(+result.balance).toBeGreaterThan(1);

  const chainId = await ZilliqaHelper.getNetworkId(client);
  const version = ZilliqaHelper.getZilliqaVersion(+chainId, 1);

  const tx = await ZilliqaHelper.sendToken(client,
    version,
    '573EC96638C8BB1C386394602E1460634F02ADDA',
    '1',
    '1000',
    100);
  expect(tx.receipt.success).toBe(true);

});

test('deploy and call contract', async () => {
  jest.setTimeout(300000);

  const code = `scilla_version 0

    (* HelloWorld contract *)

    import ListUtils

    (***************************************************)
    (*               Associated library                *)
    (***************************************************)
    library HelloWorld

    let not_owner_code = Int32 1
    let set_hello_code = Int32 2

    (***************************************************)
    (*             The contract definition             *)
    (***************************************************)

    contract HelloWorld
    (owner: ByStr20)

    field welcome_msg : String = ""

    transition setHello (msg : String)
      is_owner = builtin eq owner _sender;
      match is_owner with
      | False =>
        e = {_eventname : "setHello()"; code : not_owner_code};
        event e
      | True =>
        welcome_msg := msg;
        e = {_eventname : "setHello()"; code : set_hello_code};
        event e
      end
    end


    transition getHello ()
        r <- welcome_msg;
        e = {_eventname: "getHello()"; msg: r};
        event e
    end`;

  const client = new Zilliqa('https://dev-api.zilliqa.com');
  const privateKey = 'f4c43ef478f0f05667f90c10f6d17d61c8a324e0fd5b2db2c67568c070813879';
  client.wallet.addByPrivateKey(privateKey);
  const address = CP.getAddressFromPrivateKey(privateKey);
  console.log('address: ' + address);

  const chainId = await ZilliqaHelper.getNetworkId(client);
  const version = ZilliqaHelper.getZilliqaVersion(+chainId, 1);

  const [tx, contract] = await ZilliqaHelper.deployContract(
    client,
    code,
    address,
    version,
    '1000',
    10000);
  expect(tx.receipt.success).toBe(true);

  const state = await ZilliqaHelper.getContractState(contract);
  console.log(state);

  const callTx = await ZilliqaHelper.callContract(
    contract,
    'setHello',
    [
      {
        vname: 'msg',
        type: 'String',
        value: 'Hello World',
      },
    ],
    version,
    '0',
    '1000',
    8000);
  console.log(callTx);
  expect(callTx.receipt.success).toBe(true);

});

test('get contract at address', async () => {
  jest.setTimeout(300000);

  const client = new Zilliqa('https://dev-api.zilliqa.com');
  const privateKey = 'f4c43ef478f0f05667f90c10f6d17d61c8a324e0fd5b2db2c67568c070813879';
  client.wallet.addByPrivateKey(privateKey);

  const contractAddress = '9eAeE5805CEE61d131040877ddb15f2E01613D2f';
  const contract = ZilliqaHelper.getContractAtAddress(client, contractAddress);

  const state = await ZilliqaHelper.getContractState(contract);
  console.log(state);

  const chainId = await ZilliqaHelper.getNetworkId(client);
  const version = ZilliqaHelper.getZilliqaVersion(+chainId, 1);

  const callTx = await ZilliqaHelper.callContract(
    contract,
    'setHello',
    [
      {
        vname: 'msg',
        type: 'String',
        value: 'Hello World',
      },
    ],
    version,
    '0',
    '1000',
    8000);
  console.log(callTx);
  expect(callTx.receipt.success).toBe(true);
});
