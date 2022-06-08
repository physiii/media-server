const isEmpty = (value) => {
		if (typeof value === 'number') {
			if (Object.is(value, NaN)) {
				return true;
			}

			return false;
		}

		if (typeof value === 'boolean') {
			return false;
		}

		if (typeof value === 'undefined' || value === null) {
			return true;
		}

		// Arrays and strings.
		if (typeof value.length !== 'undefined' && value.length === 0) {
			return true;
		}
	},
	onChange = (object, onChange) => {
		const handler = {
			get (target, property, receiver) {
				let value = target[property];

				const tag = Object.prototype.toString.call(value),
					shouldBindProperty = (property !== 'constructor') && (
						tag === '[object Function]' ||
						tag === '[object AsyncFunction]' ||
						tag === '[object GeneratorFunction]'
					);

				if (shouldBindProperty) {
					value = value.bind(target);
				}

				try {
					return new Proxy(value, handler);
				} catch (err) {
					return Reflect.get(target, property, receiver);
				}
			},
			defineProperty (target, property, descriptor) {
				const result = Reflect.defineProperty(target, property, descriptor);
				onChange();
				return result;
			},
			deleteProperty (target, property) {
				const result = Reflect.deleteProperty(target, property);
				onChange();
				return result;
			}
		};

		return new Proxy(object, handler);
	},
	stripHtml = (string = '') => {
		return string.replace(/(<([^>]+)>)/ig, '');
	},
	isEmail = (value) => {
		const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; // eslint-disable-line no-useless-escape

		return emailRegex.test(value);
	},
	isValidRgbArray = (array) => {
		if (!Array.isArray(array)) return false;
		if (array.length !== 3) return false;
		if (typeof array[0] !== 'number') return false;
		if (typeof array[1] !== 'number') return false;
		if (typeof array[2] !== 'number') return false;
		if (array[0] < 0 || array[0] > 255) return false;
		if (array[1] < 0 || array[1] > 255) return false;
		if (array[2] < 0 || array[2] > 255) return false;

		return true;
	},
	isIterable = (object) => {
		return object != null && typeof object[Symbol.iterator] === 'function';
	},
	validators = {
		'string': () => (value, label) => typeof value === 'string' ? null : label + ' must be a string.',
		'boolean': () => (value, label) => typeof value === 'boolean' ? null : label + ' must be boolean.',
		'decimal': () => (value, label) => Number.isFinite(value) ? null : label + ' must be a number.',
		'integer': () => (value, label) => Number.isInteger(value) ? null : label + ' must be a whole number.',
		'percentage': (scale = 1) => (value, label) => typeof value === 'number' && value >= 0 && value <= scale ? null : label + ' must be a number between 0 and ' + scale + '.',
		'color': () => (value, label) => isValidRgbArray(value) ? null : label + ' must be an RGB array (e.g. [255, 255, 255]).',
		'one-of': (options = []) => (value, label) => {
			return options.some((option) => option === value)
				? null
				: label + ' must be one of these: ' + options.map((option) => option + ' (' + typeof option + ')').join(', ') + '.';
		},
		'is_required': (is_required) => (value, label) => !is_required || !isEmpty(value) ? null : label + ' is required.',
		'min': (min) => (value, label) => value >= min ? null : label + ' must be at least ' + min + '.',
		'max': (max) => (value, label) => value <= max ? null : label + ' must be no more than ' + max + '.',
		'min_length': (min_length) => (value, label) => value.length >= min_length ? null : label + ' must be at least ' + min_length + ' characters long.',
		'max_length': (max_length) => (value, label) => value.length <= max_length ? null : label + ' must be no more than ' + max_length + ' characters long.'
	};

const
	loop_delay = 60 * 1000,
	TAG = '[utils]',
	MINIMUM_FREE_SPACE = 5,
	rimraf = require('rimraf'),
	exec = require('child_process').exec,
  diskUsage = require('diskusage');

function removeOldCameraRecordings () {
	return new Promise((resolve, reject) => {
		// Return only base file name without dir
		exec('find /usr/local/lib/open-automation/recording/ -type f -printf \'%T+ %p\n\' | sort | head -n 1', (error, stdout, stderr) => {
			if (error) {
				console.error(TAG, `Remove old recordings: error: ${error}`);
				reject(error);

				return;
			}

			if (!stdout) {
				console.log(TAG, 'Remove old recordings: no motion files found to remove.');
				resolve();

				return;
			}

			var temp_arr = stdout.split(' ')[1].split('/'),
				oldest_dir = '';

			temp_arr[temp_arr.length - 1] = '';

			for (var i = 0; i < temp_arr.length; i++) {
				if (temp_arr[i] === '') {
					continue;
				}

				oldest_dir += '/' + temp_arr[i];
			}

			try {
				rimraf(oldest_dir, function (error) {
					if (error) {
						console.log(TAG, 'Remove old recordings: error:', error);
						reject(error);

						return;
					}

					console.log(TAG, 'Remove old recordings: directory deleted:', oldest_dir);
					resolve(oldest_dir);
				});
			} catch (error) {
				console.log(TAG, 'Remove old recordings: error deleting files:', error);
				reject(error);
			};
		});
	});
}

function checkDiskSpace () {
	return new Promise(function(resolve, reject) {
		diskUsage.check('/', function (error, info) {
			if (error) {
				return console.log(TAG, error);
			}
			resolve(info);
		});
	})
}

function loop () {
	setInterval(() => {
		checkDiskSpace().then((info) => {
	    let ratio = info.free / info.total;
	    if (ratio < MINIMUM_FREE_SPACE/100) {
	      removeOldCameraRecordings();
	    }
	  });
	}, loop_delay);
}

loop();

module.exports = {
	isEmpty,
	onChange,
	stripHtml,
	isEmail,
	isValidRgbArray,
	validators
};
