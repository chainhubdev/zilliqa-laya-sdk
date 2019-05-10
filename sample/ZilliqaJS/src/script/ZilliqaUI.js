export default class ZilliqaUI extends Laya.Scene {
    constructor() {
        super();
        ZilliqaUI.instance = this;
        Laya.MouseManager.multiTouchEnabled = false;
        this.loadScene("ZilliqaScene.scene");    
    }

    onEnable() {
        this._zilliqaClient = new ZilliqaLaya(ZilliqaNet.TEST);
        this.btnCreate.on(Laya.Event.CLICK, this, this.onCreateClick);
        this.btnImport.on(Laya.Event.CLICK, this, this.onImportClick);
        this.btnBalanceSend.on(Laya.Event.CLICK, this, this.onGetBalanceSend);
        this.btnBalanceCall.on(Laya.Event.CLICK, this, this.onGetBalanceCall);
        this.btnSend.on(Laya.Event.CLICK, this, this.onSend);
        this.btnCall.on(Laya.Event.CLICK, this, this.onCall);
    }

    onCreateClick(e) {
        const result = this._zilliqaClient.createAccount();
        this.lblAddressCreate.text = result.address;
        this.lblMnemonic.text = result.mnemonic;
        this.textAddressTo.text = result.address;
    }

    onImportClick(e) {
        const address = this._zilliqaClient.importAccountFromPrivateKey(this.textKey.text);
        this.lblAddressImport.text = address;
        this.textAddressSend.text = address;
        this.textAddressCall.text = address;
    }

    onGetBalanceSend(e) {
        this.getAndUpdateBalance(this.textAddressSend.text, this.lblBalanceSend);
    }

    onGetBalanceCall(e) {
        this.getAndUpdateBalance(this.textAddressCall.text, this.lblBalanceCall);
    }

    async getAndUpdateBalance(address, lbl) {
        try {
            this.textLog.text = 'Getting balance of address: ' + address;
            const result = await this._zilliqaClient.getBalance(address);
            lbl.text = result.balance;
            this.textLog.text = 'Balance is ' + result.balance;
        } catch (ex) {
            this.textLog.text = ex.message;
        }
    }

    onSend(e) {
        this.sendZil(this.textAddressSend.text, this.textAddressTo.text, this.textAmount.text);
    }

    async sendZil(from, to, amount) {
        try {
            this.textLog.text = 'Sending ' + amount + ' zil from ' + from + ' to ' + to;
            const result = await this._zilliqaClient.sendToken(from, to, amount, '1000', 10);
            if (result.receipt.success) {
                this.textLog.text = 'Transaction success';
            } else {
                this.textLog.text = 'Transaction failed';
            }
        } catch(ex) {
            this.textLog.text = ex;
        }
    }

    onCall(e) {
        this.callContract(this.textAddressCall.text, this.textAddressContract.text);
    }

    async callContract(from, contractAddress) {
        try {
            this.textLog.text = 'Calling contract at ' + contractAddress + ' from ' + from;
            const result = await this._zilliqaClient.callContractAtAddress(
                from, 
                contractAddress,
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
            if (result.receipt.success) {
                this.textLog.text = 'Transaction success';
            } else {
                this.textLog.text = 'Transaction failed';
            }
        } catch(ex) {
            this.textLog.text = ex;
        }
    }
}