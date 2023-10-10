const database = require('../database.js'),
	Account = require('./account.js'),
	crypto = require('crypto'),
	accounts_list = new Map(),
	PASSWORD_MINIMUM_LENGTH = 8,
	TAG = '[AccountsManager]';

class AccountsManager {
	constructor () {
		this.init = this.init.bind(this);
	}

	init () {
		return this.loadAccountsFromDb();
	}

	_addAccount (account) {
		if (!account instanceof Account) {
			console.error(TAG, 'Only instances of Account can be added to the accounts list.');

			return false;
		}

		accounts_list.set(account.id, account);
	}

	_removeAccount (account_id) {
		accounts_list.delete(account_id);
	}

	createAccount (data) {
		const {password, ...new_account} = data,
			account = new Account({
				registration_date: new Date(),
				...new_account
			});

		return new Promise((resolve, reject) => {
			if (!this.isUsernameValid(data.username)) {
				reject('username');
				return;
			}

			if (!this.isPasswordValid(password)) {
				reject('password');
				return;
			}

			account.setPassword(password).then(() => {
				this._addAccount(account);
				resolve(account);
			}).catch(reject);
		});
	}

	getAccountById (account_id) {
		return accounts_list.get(account_id);
	}

	getAccountByUsername (username) {
		for (let [id, account] of accounts_list) {
			if (account.username.toLowerCase() === username.toLowerCase()) {
				return account;
			}
		}
	}

	isUsernameValid (username) {
		if (!username || username.length < 1) {
			return false;
		}

		return !Boolean(this.getAccountByUsername(username));
	}

	isPasswordValid (password) {
		return typeof password === 'string' && password.length >= PASSWORD_MINIMUM_LENGTH;
	}

	changePassword(username, oldPassword, newPassword) {
		return new Promise((resolve, reject) => {
			const account = this.getAccountByUsername(username);
	
			if (!account) {
				reject(new Error('Username not found.'));
				return;
			}
	
			account.isCorrectPassword(oldPassword).then(isCorrect => {
				if (isCorrect) {
					account.setPassword(newPassword).then(() => {
						resolve();
					}).catch(reject);
				} else {
					reject(new Error('Old password is incorrect.'));
				}
			}).catch(reject);
		});
	}	

	loadAccountsFromDb () {
		return new Promise((resolve, reject) => {
			database.getAccounts().then((accounts) => {
				accounts_list.clear();
				accounts.forEach((account) => this._addAccount(new Account(account)));
				resolve();
			}).catch(reject);
		});
	}
}

module.exports = new AccountsManager();
