# zilliqa-laya-sdk
Javascript library for developing within Zilliqa blockchain on Layabox platform.

# Installation

## npm style
`npm i -S zilliqa-laya-sdk`

## Layabox style (Recommended)
Providing a standard Layabox project structure:

copy release/zilliqa-laya-sdk.js to bin/libs

copy release/zilliqa-laya-sdk.d.ts to libs

You can download LayaAir IDE and open sample/ZilliqaJS for details and press F5 to have a try.

# Usage

```
// construct a zilliqa client on Test Net
const zilliqaClient = new ZilliqaLaya(ZilliqaNet.TEST);

// create a account
const account = zilliqaClient.createAccount();

// print mnemonic words
console.log(account.mnemonic);

// get balance of certain address
const result = await zilliqaClient.getBalance(account.address);

// import existing account with private key
const address = zilliqaClient.importAccountFromPrivateKey(
    'f4c43ef478f0f05667f90c10f6d17d61c8a324e0fd5b2db2c67568c070813879');

// send zil from one address to another
const tx = await zilliqaClient.sendToken(
    address,
    account.address,
    '1',
    '1000',
    10);

// check transaction result
console.log(tx.receipt.success);
```

More functionality please reference the [api document](https://chainhubdev.github.io/zilliqa-laya-sdk/).

---

在Layabox平台使用Zilliqa区块链的Javascript库

# 安装
## npm方式
`npm i -S zilliqa-laya-sdk`

## Layabox方式
对于一个标准的Layabox项目结构：

复制release/zilliqa-laya-sdk.js到bin/libs目录下

复制release/zilliqa-laya-sdk.d.ts到libs目录下

可以下载LayaAir开发环境，打开sample/ZilliqaJS示例，然后按F5尝试使用。

## 使用
```
// 创建测试网客户端
const zilliqaClient = new ZilliqaLaya(ZilliqaNet.TEST);

// 创建账户
const account = zilliqaClient.createAccount();

// 打印助记词
console.log(account.mnemonic);

// 查询余额
const result = await zilliqaClient.getBalance(account.address);

// 导入已有私钥
const address = zilliqaClient.importAccountFromPrivateKey(
    'f4c43ef478f0f05667f90c10f6d17d61c8a324e0fd5b2db2c67568c070813879');

// 转账zil
const tx = await zilliqaClient.sendToken(
    address,
    account.address,
    '1',
    '1000',
    10);

// 检查转账结果
console.log(tx.receipt.success);
```
更多其它功能请参考[API接口文档](https://chainhubdev.github.io/zilliqa-laya-sdk/)

# License
[MIT](http://vjpr.mit-license.org/)
