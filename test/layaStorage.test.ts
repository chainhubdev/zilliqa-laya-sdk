import { LayaStorage } from '../src/layaStorage';
import { ErrorCode } from '../src/errors';
import { ZilliqaHelper } from '../src/zilliqaHelper';

test('set and validate password', () => {
  const layaStorage = new LayaStorage();
  layaStorage.setPasswordHash('n12dwg');
  expect(layaStorage.validatePassword('n12dwg')).toBe(true);
});

test('throw exception when set illegal password', () => {
  const layaStorage = new LayaStorage();
  try {
    layaStorage.setPasswordHash('123');
    expect(true).toBe(false);
  } catch (e) {
    expect(e.code).toBe(ErrorCode.ILLEGAL_PASSWORD);
  }

  try {
    layaStorage.setPasswordHash('123456789012345678901');
    expect(true).toBe(false);
  } catch (e) {
    expect(e.code).toBe(ErrorCode.ILLEGAL_PASSWORD);
  }
});

test('load and save account', () => {
  const url = 'https://dev-api.zilliqa.com';

  const layaStorage = new LayaStorage();
  const accounts1 = layaStorage.loadAccounts(url);
  expect(accounts1.length).toBe(0);

  const account1 = ZilliqaHelper.createAccount()[0];
  accounts1.push(account1);
  layaStorage.saveAccounts(accounts1, url);

  const accounts2 = layaStorage.loadAccounts(url);
  expect(accounts2.length).toBe(1);
  expect(accounts2[0].address).toBe(account1.address);

  const account2 = ZilliqaHelper.createAccount()[0];
  accounts2.push(account2);
  layaStorage.saveAccounts(accounts2, url);

  const accounts3 = layaStorage.loadAccounts(url);
  expect(accounts3.length).toBe(2);
  expect(accounts3[1].address).toBe(account2.address);
});
