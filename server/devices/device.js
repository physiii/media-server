const uuid = require('uuid').v4,
	utils = require('../utils.js'),
	database = require('../database.js'),
	debounce = require('debounce'),
	StandardDeviceDriver = require('./drivers/standard-driver.js'),
	LigerDeviceDriver = require('./drivers/liger-driver.js'),
	GenericDeviceDriver = require('./drivers/generic/generic-driver.js'),
	DeviceSettings = require('./device-settings.js'),
	ServicesManager = require('../services/services-manager.js'),
	noOp = () => {},
	TAG = '[Device]';

class Device {
	constructor (data, onUpdate, socket) {
		const driver_class = Device.drivers[data.type] || StandardDeviceDriver;

		this.save = this.save.bind(this);

		this.id = data.id || uuid();
		this.token = data.token;
		this.type = data.type;
		this.account_id = data.account_id;
		this.room = data.room;
		this.room_id = data.room_id;
		this.gateway = data.gateway;
		this.gateway_id = data.gateway_id;
		this.is_saveable = data.is_saveable || false;

		this.onUpdate = debounce(() => onUpdate(this), 100);

		this.driver_data = {...data.driver_data};
		this.driver = new driver_class(this.driver_data, socket, this.id);

		const driverOn = (function () { this.driver.on(...arguments); }).bind(this),
			driverEmit = (function () { this.driver.emit(...arguments); }).bind(this);

		this.services = new ServicesManager(
			this,
			data.services,
			driverOn,
			driverEmit,
			this.onUpdate,
			this.save
		);
		this.settings = new DeviceSettings(
			data.settings,
			data.settings_definitions,
			this.constructor.settings_definitions,
			driverEmit,
			this.save
		);
		this.state = utils.onChange({connected: false}, this.onUpdate);
		this.setInfo(data.info);

		if (socket) {
			this.setSocket(socket, this.token);
		}

		this._subscribeToDriver();
		this.driver.init();
	}

	_subscribeToDriver () {
		this.driver.on('connect', () => this.state.connected = true);
		this.driver.on('disconnect', () => this.state.connected = false);
		this.driver.on('load', (data, callback = noOp) => {
			// this.emit('load', data, callback);

			if (!data.device) {
				callback('No device data provided.');
				return;
			}

			const device_errors = [];

			if (data.device.services) {
				this.services.updateServices(data.device.services, (error) => device_errors.push(error));
			}

			if (data.device.settings_definitions) {
				this.settings.setDefinitions(data.device.settings_definitions);
			}

			if (data.device.info) {
				this.setInfo(data.device.info);
			}

			this.onUpdate();
			this.save();

			if (device_errors.length > 0) {
				callback('The following errors occurred while loading the device data: \n' + device_errors.join(' \n'));
			} else {
				callback();
			}
		});
		this.driver.on('service/load', (data, callback = noOp) => {
			if (!data.service) {
				callback('No service data provided.');
				return;
			}

			this.services.addService(data.service, true, (error) => {
				if (error) {
					callback(error);
					return;
				}

				callback();

				this.onUpdate();
				this.save();
			});
		});
		this.driver.on('driver-data', (data) => {
			this.driver_data = data.driver_data;
			this.save();
		});
	}

	setInfo ({manufacturer, model, firmware_version, hardware_version, serial, local_ip, public_ip} = {}) {
		this.info = {
			local_ip,
			public_ip,
			manufacturer,
			model,
			firmware_version,
			hardware_version,
			serial
		};
	}

	setSettings (settings) {
		return this.settings.set(settings).then(this.onUpdate);
	}

	setRoom (room_id) {
		return new Promise((resolve, reject) => {
			const original_room_id = this.room_id;

			this.room_id = room_id;

			this.save().then(() => {
				resolve();
				this.onUpdate();
			}).catch(() => {
				this.room_id = original_room_id;

				console.error(TAG, this.id, 'Error saving device room to database.', error);

				reject(error);
			});
		});
	}

	setToken (token) {
		return new Promise((resolve, reject) => {
			const original_token = this.token,
				original_is_saveable = this.is_saveable;

			if (!this.state.connected) {
				console.log(TAG, this.id, 'Cannot set device token when the device is not connected.');
				reject('Device not connected.');

				return;
			}

			// Send new token to device.
			this.driver.emit('token', {token}, (error) => {
				if (error) {
					reject(error);
					return;
				}

				// Save the new token locally.
				this.token = token;
				this.is_saveable = true;
				this.save().then(() => {
					this.driver.emit('reconnect-to-relay');

					resolve(this.token);
				}).catch((error) => {
					// Undo token change locally.
					this.token = original_token;
					this.is_saveable = original_is_saveable;

					console.error(TAG, this.id, 'Error saving device token to database.', error);

					// Undo token change on device.
					this.driver.emit('token', {token: original_token}, (undo_error) => {
						if (undo_error) {
							console.error(TAG, this.id, 'Could not undo token change on device. Token on device and token on relay are out of sync.', undo_error);
						}
					});

					reject(error);
				});
			});
		});
	}

	verifyToken (token) {
		return token === this.token;
	}

	setSocket (socket, token) {
		if (!token || !this.verifyToken(token)) {
			console.log(TAG, this.id, 'Could not set socket. Invalid device token.');
			return;
		}

		this.driver.setSocket(socket);
		this.state.connected = socket.connected;
	}

	setType (type) {
		if (this.type === type) {
			return;
		}

		this.type = type;
		this.save();
	}

	emit (event, data) {
		if (event === 'token') {
			console.error(TAG, this.id, 'Do not use emit to set the device token. Use setToken.');
			return;
		}

		// console.log(TAG, "Emitting event '" + event + "' to device '" + this.id + "'.", data);
		this.driver.emit(event, data);
	}

	save () {
		return new Promise((resolve, reject) => {
			if (!this.is_saveable) {
				reject();
				return;
			}

			database.saveDevice(this.dbSerialize()).then(resolve).catch(reject);
		});
	}

	serialize () {
		return {
			id: this.id,
			account_id: this.account_id,
			type: this.type,
			room_id: this.room_id,
			gateway_id: this.gateway_id,
			services: this.services.getSerializedServices(),
			info: this.info,
			...this.settings.serialize()
		};
	}

	dbSerialize () {
		return {
			...this.serialize(),
			token: this.token,
			services: this.services.getDbSerializedServices(),
			driver_data: this.driver_data
		};
	}

	clientSerialize () {
		const services = this.services.getClientSerializedServices();

		return {
			...this.serialize(),
			state: this.state,
			services,
			automator_supported: services.some((service) => service.automator_supported)
		};
	}

	destroy () {
		this.driver.destroy();
		this.services.destroy();
	}
}

Device.settings_definitions = new Map()
	.set('name', {
		type: 'string',
		label: 'Name',
		validation: {
			max_length: 24
		}
	});

Device.drivers = {
	'gateway': StandardDeviceDriver,
	'generic': GenericDeviceDriver
};

module.exports = Device;
