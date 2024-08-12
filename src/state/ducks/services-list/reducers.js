import Immutable from 'immutable';
import {immutableMapFromArray, immutableOrderedMapFromArray} from '../../../utilities.js';
import createService from './models/service.js';
import CameraRecordingRecord from './models/camera-recording-record.js';
import * as types from './types';
import * as devicesListTypes from '../devices-list/types';
import * as sessionTypes from '../session/types';

const initialState = Immutable.Map({
		services: Immutable.Map(),
		loading: false,
		fetched: false, // Whether first fetch has completed.
		error: false
	}),
	logInitialState = Immutable.Map({
		log: Immutable.List(),
		loading: false,
		error: false
	}),
	recordingsInitialState = Immutable.Map({
		recordings: Immutable.OrderedMap(),
		dateIndex: Immutable.Map(),
		dates: Immutable.Map(),
		loading: false,
		error: false
	}),
	reducer = (state = initialState, action) => {
		switch (action.type) {
			case devicesListTypes.FETCH_DEVICES:
				return state.set('loading', true);
			case devicesListTypes.FETCH_DEVICES_SUCCESS:
				return state.merge({
					loading: false,
					fetched: true,
					error: false,
					services: immutableMapFromArray(action.payload.devices, (device) => immutableMapFromArray(device.services, (service) => {
						const currentServiceState = state.getIn(['services', service.id]);

						return createService({
							...currentServiceState && currentServiceState.toJS(),
							...service,
							device_id: device.id,
							state: {
								...service.state,
								connected: device.state.connected &&
									(Object.prototype.hasOwnProperty.call(service.state, 'connected')
										? service.state.connected
										: true)
							},
							logList: logReducer(
								currentServiceState && currentServiceState.logList,
								{
									...action,
									payload: {log: service.log}
								}
							),
							recordingsList: recordingsReducer(
								currentServiceState && currentServiceState.recordingsList,
								{
									...action,
									payload: {recordings: service.recordings}
								}
							)
						});
					})).flatten(1) // Flatten the devices collection to get a list of just services.
				});
			case devicesListTypes.FETCH_DEVICES_ERROR:
				return state.merge({
					loading: false,
					error: action.payload.error.message
				});
			case types.DO_SERVICE_ACTION:
				return state.mergeDeepIn(
					['services', action.payload.serviceId],
					{
						state: Immutable.Map().set(action.payload.serviceAction.property, action.payload.serviceAction.value),
						error: null
					}
				);
			case types.DO_SERVICE_ACTION_ERROR:
				return state.mergeDeepIn(
					['services', action.payload.serviceId],
					{
						state: Immutable.Map().set(action.payload.serviceAction.property, action.payload.originalValue),
						error: action.payload.error.message
					}
				);
			case types.SET_SETTINGS:
				return state.mergeIn(
					['services', action.payload.serviceId],
					{
						settings: action.payload.settings,
						error: null
					}
				);
			case types.SET_SETTINGS_ERROR:
				return state.mergeIn(
					['services', action.payload.serviceId],
					{
						settings: action.payload.originalSettings,
						error: action.payload.error.message
					}
				);
			case types.FETCH_SERVICE_LOG:
			case types.FETCH_SERVICE_LOG_SUCCESS:
			case types.FETCH_SERVICE_LOG_ERROR:
				return state.setIn(
					['services', action.payload.serviceId, 'logList'],
					logReducer(
						state.getIn(['services', action.payload.serviceId, 'logList']),
						action
					)
				);
			case types.FETCH_CAMERA_RECORDINGS:
			case types.FETCH_CAMERA_RECORDINGS_SUCCESS:
			case types.FETCH_CAMERA_RECORDINGS_ERROR:
			case types.STREAM_CAMERA_RECORDING:
				return state.setIn(
					['services', action.payload.cameraId, 'recordingsList'],
					recordingsReducer(
						state.getIn(['services', action.payload.cameraId, 'recordingsList']),
						action
					)
				);
			case types.STREAM_CAMERA_AUDIO_RECORDING:
				return state.setIn(
					['services', action.payload.cameraId, 'recordingsList'],
					recordingsReducer(
						state.getIn(['services', action.payload.cameraId, 'recordingsList']),
						action
					)
				);
			case types.STREAM_CAMERA_LIVE:
				return state.setIn(
					['services', action.payload.cameraId, 'streaming_token'],
					action.payload.streamToken
				);
			case types.STREAM_AUDIO_LIVE:
				return state.setIn(
					['services', action.payload.audioId, 'streaming_token'],
					action.payload.streamToken
				);
			case sessionTypes.LOGOUT:
				return initialState;
			default:
				return state;
		}
	},
	logReducer = (state = logInitialState, action) => {
		switch (action.type) {
			case devicesListTypes.FETCH_DEVICES_SUCCESS:
				return state.set('log', action.payload.log
					? Immutable.List(action.payload.log)
					: state.get('log'));
			case types.FETCH_SERVICE_LOG:
				return state.set('loading', true);
			case types.FETCH_SERVICE_LOG_SUCCESS:
				return state.merge({
					loading: false,
					error: false,
					log: Immutable.List(action.payload.log)
				});
			case types.FETCH_SERVICE_LOG_ERROR:
				return state.merge({
					loading: false,
					error: action.payload.error.message
				});
			default:
				return state;
		}
	},
	recordingsReducer = (state = recordingsInitialState, action) => {
		switch (action.type) {
			case devicesListTypes.FETCH_DEVICES_SUCCESS:
				return state.set('recordings', action.payload.recordings
					? immutableOrderedMapFromArray(action.payload.recordings.map((recording) => new CameraRecordingRecord(recording)))
					: state.get('recordings'));
			case types.FETCH_CAMERA_RECORDINGS:
				return state.set('loading', true);
			case types.FETCH_CAMERA_RECORDINGS_SUCCESS:
				return state.merge({
					loading: false,
					error: false,
					recordings: immutableOrderedMapFromArray(action.payload.recordings.map((recording) => new CameraRecordingRecord(recording))),
					dateIndex: Immutable.Map(action.payload.dateIndex.entries()),
					dates: Immutable.Map(action.payload.dates.entries())
				});
			case types.FETCH_CAMERA_RECORDINGS_ERROR:
				return state.merge({
					loading: false,
					error: action.payload.error.message
				});
			case types.STREAM_CAMERA_RECORDING:
				return state.setIn(
					['recordings', action.payload.recordingId, 'streaming_token'],
					action.payload.streamToken
				);
			case types.STREAM_CAMERA_AUDIO_RECORDING:
				return state.setIn(
					['recordings', action.payload.recordingId, 'audio_streaming_token'],
					action.payload.streamToken
				);
			default:
				return state;
		}
	};

export default reducer;
