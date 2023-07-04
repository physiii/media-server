import React from 'react';
import PropTypes from 'prop-types';
import {Switch, Redirect, withRouter} from 'react-router-dom';
import {compose} from 'redux';
import {connect} from 'react-redux';
import {thermostatSetHoldTemp, thermostatSetPower, thermostatSetSchedule, thermostatSetMode, thermostatSetHold, thermostatFanOn, thermostatFanAuto} from '../../state/ducks/services-list/operations.js';
import Toggle from './Switch.js';
import {Route} from './Route.js';
import SettingsScreenContainer from './SettingsScreenContainer.js';
import ServiceSettingsScreen from './ServiceSettingsScreen.js';
import RangeControl from './RangeControl.js';
import styles from './ServiceDetails.css';

export class ThermostatServiceDetails extends React.Component {

	constructor (props) {
		super(props);

		const mode = props.service.state.get('mode') ? props.service.state.get('mode') : 'off',
			isPowerOn = props.service.state.get('power') ? props.service.state.get('power') : false,
			isHoldOn = props.service.state.get('hold').mode === 'on',
			temp = props.service.state.get('current_temp') ? props.service.state.get('current_temp') : 0,
			targetTemp = props.service.state.get('target_temp') ? props.service.state.get('target_temp') : 0,
			holdMinTemp = props.service.state.get('hold').minTemp ? props.service.state.get('hold').minTemp : 65,
			holdMaxTemp = props.service.state.get('hold').maxTemp ? props.service.state.get('hold').maxTemp : 75,
			holdTemp = {
				min: holdMinTemp,
				max: holdMaxTemp
			},
			schedule = props.service.state.get('schedule') ? props.service.state.get('schedule') : {},
			tempValues = props.service.state.get('temp_values') ? props.service.state.get('temp_values') : [];

		this.state = {
			is_changing: false,
			shouldShowSchedule: false,
			selectedHour: 1,
			selectedHourTemp: {min: schedule[1].minTemp, max: schedule[1].maxTemp},
			isPowerOn,
			isHoldOn,
			temp,
			targetTemp,
			mode,
			holdTemp,
			schedule,
			tempValues
		};
	}

	showSchedule () {
		this.state.shouldShowSchedule = true;
		this.setState({shouldShowSchedule: true});
	}

	toggleHold () {
		this.state.isHoldOn = !this.state.isHoldOn;
		this.setState({isHoldOn: this.state.isHoldOn});
		this.props.setHold(this.props.service.id, this.state.isHoldOn ? 'on' : 'off');
	}

	togglePower () {
		this.state.isPowerOn = !this.state.isPowerOn;
		this.setState({isPowerOn: this.state.isPowerOn});
		this.props.setPower(this.props.service.id, this.state.isPowerOn ? 'on' : 'off');
	}

	toggleSchedulePower (value) {
		this.state.schedule[value - 1].power = !this.state.schedule[value - 1].power;
		this.setState(this.state);
		this.props.setSchedule(this.props.service.id, this.state.schedule);
	}

	setHoldTemp (data) {
		if (data.maxTemp) {
			this.state.holdTemp.max = data.maxTemp;
		}

		if (data.minTemp) {
			this.state.holdTemp.min = data.minTemp;
		}

		this.setState({holdTemp: this.state.holdTemp});
		this.props.setHoldTemp(this.props.service.id, this.state.holdTemp);
	}

	setScheduleHour (data) {
		const schedule = this.state.schedule,
			hour = data.hour - 1;

		this.state.selectedHour = hour;
		this.state.selectedHourTemp = {min: schedule[hour].minTemp, max: schedule[hour].maxTemp};
		this.setState(this.state);
	}

	setSchedule (data) {
		const schedule = this.state.schedule,
			hour = this.state.selectedHour - 1;

		if (data.minTemp) {
			schedule[hour].minTemp = data[0];
		}

		if (data.maxTemp) {
			schedule[hour].maxTemp = data[1];
		}

		this.setState(this.state);
		this.props.setSchedule(this.props.service.id, schedule);
	}

	handleHoldRangeInput (value) {
		this.state.holdTemp.min = value[0];
		this.state.holdTemp.max = value[1];

		this.setState(this.state);
	}

	handleHoldRangeChange (value) {
		this.state.holdTemp.min = value[0];
		this.state.holdTemp.max = value[1];

		this.setState(this.state);
		this.props.setHoldTemp(this.props.service.id, this.state.holdTemp);
	}

	handleRangeInput (value, event) {
		this.state.schedule[value - 1].minTemp = event[0];
		this.state.schedule[value - 1].maxTemp = event[1];

		this.setState(this.state);
	}

	handleRangeChange (value, event) {
		this.state.schedule[value - 1].minTemp = event[0];
		this.state.schedule[value - 1].maxTemp = event[1];

		this.setState(this.state);
		this.props.setSchedule(this.props.service.id, this.state.schedule);
	}

	render () {
		return (
			<Switch>
				<Route exact path={this.props.match.url} render={() => (
					<SettingsScreenContainer section={true}>
						<span className={styles.field}>
							<label className={styles.label}>Power</label>
							<Toggle
								isOn={this.state.isPowerOn}
								onChange={this.togglePower.bind(this)}
								showLabels={true}
								disabled={false} />
						</span>

						{!this.state.isPowerOn
							? <div className={styles.field}>Thermostat is currently powered off.</div>
							:	<div>
								<span className={styles.field}>
									<label className={styles.label}>Hold</label>
									<Toggle
										isOn={this.state.isHoldOn}
										showLabels={true}
										onChange={this.toggleHold.bind(this)}
										disabled={false} />
								</span>

								<div className={this.state.isHoldOn ? styles.tempSchedule : styles.hidden}>
									<span>
										<div className={styles.tempScheduleLabel}>{this.state.holdTemp.min}&#8457;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{this.state.holdTemp.max}&#8457;</div>
									</span>
									<span className={styles.tempSlider}>
										<RangeControl
											onInput={this.handleHoldRangeInput.bind(this)}
											onChange={this.handleHoldRangeChange.bind(this)}
											minRange={65}
											maxRange={75}
											min={this.state.holdTemp.min}
											max={this.state.holdTemp.max} />
									</span>
								</div>

								<span className={this.state.isHoldOn ? styles.hidden : styles.scheduleTitle}>
									Schedule
								</span>

								<span className={styles.divider} />

								<span className={this.state.isHoldOn ? styles.field : styles.hidden}>
									Schedule is not active because hold is on.
								</span>

								<div className={!this.state.isHoldOn ? '' : styles.hidden}>
									{this.state.schedule.map((hour, idKey) => (
										<div className={styles.tempSchedule} key={idKey}>
											<span>
												<div className={styles.tempScheduleLabel}>{hour.label}</div>
												<div className={styles.tempScheduleToggle}>
													<Toggle
														isOn={hour.power}
														onChange={(event) => this.toggleSchedulePower(hour.value, event)}
														showLabels={false}
														disabled={false} />
												</div>
												<div className={styles.tempScheduleLabel}>{hour.minTemp}&#8457;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{hour.maxTemp}&#8457;</div>
											</span>
											<span className={styles.tempSlider}>
												<RangeControl
													onInput={(event) => this.handleRangeInput(hour.value, event)}
													onChange={(event) => this.handleRangeChange(hour.value, event)}
													minRange={65}
													maxRange={75}
													min={hour.minTemp}
													max={hour.maxTemp}
													disabled={!hour.power} />
											</span>
										</div>
									))}
								</div>
							</div>
						}
					</SettingsScreenContainer>
				)} />
				<ServiceSettingsScreen service={this.props.service} path={this.props.match.path + ThermostatServiceDetails.settingsPath} />
				<Route render={() => <Redirect to={this.props.match.url} />} />
			</Switch>
		);
	}
}

ThermostatServiceDetails.settingsPath = '/service-settings';

ThermostatServiceDetails.propTypes = {
	service: PropTypes.object.isRequired,
	children: PropTypes.node,
	setHoldTemp: PropTypes.func,
	setSchedule: PropTypes.func,
	setHold: PropTypes.func,
	setPower: PropTypes.func,
	fanOn: PropTypes.func,
	fanAuto: PropTypes.func,
	setMode: PropTypes.func,
	shouldShowSettingsButton: PropTypes.bool,
	shouldShowRoomField: PropTypes.bool,
	serviceType: PropTypes.string,
	match: PropTypes.object
};

const mapDispatchToProps = (stateProps, {dispatch}, ownProps) => ({
	...ownProps,
	...stateProps,
	setHoldTemp: (serviceId, temp) => dispatch(thermostatSetHoldTemp(serviceId, temp)),
	setSchedule: (serviceId, schedule) => dispatch(thermostatSetSchedule(serviceId, schedule)),
	setHold: (serviceId, mode) => dispatch(thermostatSetHold(serviceId, mode)),
	setPower: (serviceId, mode) => dispatch(thermostatSetPower(serviceId, mode)),
	fanOn: (serviceId) => dispatch(thermostatFanOn(serviceId)),
	fanAuto: (serviceId) => dispatch(thermostatFanAuto(serviceId)),
	setMode: (serviceId, mode) => dispatch(thermostatSetMode(serviceId, mode))
});

export default compose(
	connect(null, null, mapDispatchToProps),
	withRouter
)(ThermostatServiceDetails);
