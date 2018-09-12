import React from 'react';
import PropTypes from 'prop-types';
import ServiceCardBase from './ServiceCardBase.js';
import Button from './Button.js';
import {connect} from 'react-redux';
import {thermostatSetTemp, thermostatSetMode, thermostatRemoveHold, thermostatSetHold, thermostatFanOn, thermostatFanAuto} from '../../state/ducks/services-list/operations.js';

export const ThermostatCard = (props) => {
	const currentMode = props.thermostatService.state.mode,
		currentTemp = props.thermostatService.state.current_temp,
		targetTemp = props.thermostatService.state.target_Temp,
		fanMode = props.thermostatService.state.fan_mode,
		holdMode = props.thermostatService.state.hold_mode,
		toggleMode = () => {
			if (currentMode === 'off') {
				props.setMode(props.thermostatService.id, 'cool');
			} else if (currentMode === 'cool') {
				props.setMode(props.thermostatService.id, 'heat');
			} else if (currentMode === 'heat') {
				props.setMode(props.thermostatService.id, 'auto');
			} else if (currentMode === 'auto') {
				props.setMode(props.thermostatService.id, 'off');
			} else {
				console.log('Mode is not defined as off, heat, cool, auto...')
			}
		};

	return (
		<ServiceCardBase
			name={props.thermostatService.settings.name || 'Thermostat'}
			status={'Thermostat mode: ' + currentMode + '\nCurrent Temp: ' + currentTemp + '\nTarget Temp: ' + targetTemp + '\nFan mode: ' + fanMode + '\nHold Mode: ' + holdMode}
			isConnected={props.thermostatService.state.connected}
			onCardClick={toggleMode}
			content={<Button onClick={toggleMode}>{'Mode Cycle => ' + props.thermostatService.state.mode}</Button>} />
	);
};

ThermostatCard.propTypes = {
	thermostatService: PropTypes.object,
	setTemp: PropTypes.func,
	setHold: PropTypes.func,
	removeHold: PropTypes.func,
	fanOn: PropTypes.func,
	fanOff: PropTypes.func,
	fanAuto: PropTypes.func,
	setMode: PropTypes.func
};

const mapDispatchToProps = (dispatch) => {
	return {
		setTemp: (data) => dispatch(thermostatSetTemp(data.serviceId, data.temp)),
		setHold: (serviceId) => dispatch(thermostatSetHold(serviceId)),
		removeHold: (serviceId) => dispatch(thermostatRemoveHold(serviceId)),
		fanOn: (serviceId) => dispatch(thermostatFanOn(serviceId)),
		fanAuto: (serviceId) => dispatch(thermostatFanAuto(serviceId)),
		setMode: (serviceId, mode) => dispatch(thermostatSetMode(serviceId, mode))
	};
};

export default connect(null, mapDispatchToProps)(ThermostatCard);