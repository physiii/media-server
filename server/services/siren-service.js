const Service = require('./service.js');

class SirenService extends Service {
	setSiren (trigger) {
		return new Promise((resolve, reject) => {
			if (trigger) {
				this.deviceEmit('siren', {chirp: 2});
			}

			resolve();
		});
	}
}

SirenService.type = 'siren';
SirenService.friendly_type = 'Siren';
SirenService.indefinite_article = 'A';
SirenService.state_definitions = new Map()
	.set('trigger', {
		type: 'boolean',
		setter: 'setSiren'
	});

module.exports = SirenService;
