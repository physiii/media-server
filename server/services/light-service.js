const Service = require('./service.js');

class LightService extends Service {
	setPower (power) {
		return new Promise((resolve, reject) => {
			this.deviceEmit(power ? 'lightOn/set' : 'lightOff/set', {}, (error, data) => {
				if (error) {
					reject(error);
					return;
				}

				resolve();
			});
		});
	}

	setTheme (theme) {
		return new Promise((resolve, reject) => {
			this.deviceEmit('theme/set', {temp}, (error, data) => {
				if (error) {
					reject(error);
					return;
				}

				resolve();
			});
		});
	}

	setBrightness (brightness) {
		return new Promise((resolve, reject) => {
			if (brightness > 0) {
				if (this.state.power === false) {
					this.setPower(true);
				}
			} else if (this.state.power === true) {
				this.setPower(false);
			}

			this.deviceEmit('brightness/set', {brightness}, (error, data) => {
				if (error) {
					reject(error);
					return;
				}

				resolve();
			});
		});
	}

	setColor (color) {
		return new Promise((resolve, reject) => {
			this.deviceEmit('color/set', {color}, (error, data) => {
				if (error) {
					reject(error);
					return;
				}

				resolve();
			});
		});
	}
}

LightService.type = 'light';
LightService.friendly_type = 'Light';
LightService.indefinite_article = 'A';
LightService.action_definitions = new Map([...Service.action_definitions])
	.set('turn-on-lights', {
		label: 'Turn on lights'
	})
	.set('turn-off-lights', {
		label: 'Turn off lights'
	})
	.set('alert', {
		label: 'Alert'
	});
LightService.state_definitions = new Map()
	.set('power', {
		type: 'boolean',
		setter: 'setPower'
	})
	.set('brightness', {
		type: 'percentage',
		setter: 'setBrightness'
	})
	.set('color', {
		type: 'color',
		setter: 'setColor'
	});

module.exports = LightService;
