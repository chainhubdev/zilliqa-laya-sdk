import { ZilliqaNet } from '../src/types';
import { ZilliqaLaya } from '../src/zilliqaLaya';

test('constructor with customize url', () => {
  const client = new ZilliqaLaya('http://a.b.com');
  expect(client.netUrl === 'http://a.b.com');
});

test('constructor with main net', () => {
  const client = new ZilliqaLaya(ZilliqaNet.MAIN);
  expect(client.netUrl === 'https://api.zilliqa.com/');
});

test('constructor with test net', () => {
  const client = new ZilliqaLaya(ZilliqaNet.TEST);
  expect(client.netUrl === 'https://dev-api.zilliqa.com');
});

test('create account', () => {
  const client = new ZilliqaLaya(ZilliqaNet.TEST);
  const result = client.createAccount();
  expect(result.address.length).toBeGreaterThan(0);
  expect(result.mnemonic.split(' ').length).toBe(12);
});

test('import mnemonic', () => {
  const client = new ZilliqaLaya(ZilliqaNet.TEST);
  const address = client.importAccountFromMnemonic(
    'master gospel adapt spice attract believe gold buyer title cover people certain');
  expect(address).toBe('5ab56127e83ba6899cc63f7337e085683a7161d5');
});

test('import private key', () => {
  const client = new ZilliqaLaya(ZilliqaNet.TEST);
  const address = client.importAccountFromPrivateKey(
    'f4c43ef478f0f05667f90c10f6d17d61c8a324e0fd5b2db2c67568c070813879');
  expect(address).toBe('236927e3cc95e690872fc30c98123ce6a8368bb5');
});

test('get balance', async () => {
  const client = new ZilliqaLaya(ZilliqaNet.TEST);
  const address = client.importAccountFromPrivateKey(
    'f4c43ef478f0f05667f90c10f6d17d61c8a324e0fd5b2db2c67568c070813879');

  const balanceResult = await client.getBalance(address);
  expect(+balanceResult.balance).toBeGreaterThan(0);
});

test('get network id', async () => {
  const client = new ZilliqaLaya(ZilliqaNet.TEST);
  const networkId = await client.getNetworkId();
  expect(networkId).toBe('333');
});

test('get minimum gas price', async () => {
  const client = new ZilliqaLaya(ZilliqaNet.TEST);
  const price = await client.getMinimumGasPrice();
  expect(+price).toBeGreaterThan(0);
});

test('send token', async () => {
  jest.setTimeout(300000);

  const client = new ZilliqaLaya(ZilliqaNet.TEST);

  const address1 = client.importAccountFromPrivateKey(
    'f4c43ef478f0f05667f90c10f6d17d61c8a324e0fd5b2db2c67568c070813879');

  const result = client.createAccount();
  const address2 = result.address;

  const tx1 = await client.sendToken(address1, address2, '10', '1000', 10);
  expect(tx1.receipt.success).toBe(true);

  const tx2 = await client.sendToken(address2, address1, '1', '1000', 10);
  expect(tx2.receipt.success).toBe(true);
});

test('deploy and call contract', async () => {
  jest.setTimeout(300000);

  const client = new ZilliqaLaya(ZilliqaNet.TEST);

  const address = client.importAccountFromPrivateKey(
    'f4c43ef478f0f05667f90c10f6d17d61c8a324e0fd5b2db2c67568c070813879');

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

  const [tx, contract] = await client.deployContract(address, code, '1000', 100000);
  expect(tx.receipt.success).toBe(true);
  console.log(tx);
  console.log(contract);

  const state = await client.getContractStateAtAddress(contract.address);
  console.log(state);

  const contractTx1 = await client.callContract(
    address,
    contract,
    'setHello',
    [
      {
        vname: 'msg',
        type: 'String',
        value: 'Hello World',
      },
    ],
    '0',
    '1000',
    8000);
  expect(contractTx1.receipt.success).toBe(true);

  const contractTx2 = await client.callContractAtAddress(
    address,
    contract.address,
    'setHello',
    [
      {
        vname: 'msg',
        type: 'String',
        value: 'Hello World',
      },
    ],
    '0',
    '1000',
    8000);
  expect(contractTx2.receipt.success).toBe(true);
});



