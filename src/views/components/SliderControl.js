import React from 'react';
import PropTypes from 'prop-types';
import Slider from 'rc-slider';
// import 'rc-slider/assets/index.css';

export class SliderControl extends React.Component {
	constructor (props) {
		super(props);
		const value = props.value || 0;

		this.state = {
			value,
			is_changing: false
		};
	}

	onBeforeChange () {
		if (this.state.is_changing) {
			return;
		}

		this.setState({
			value: this.props.value,
			is_changing: true
		});
	}

	handleInput (value) {
		this.setState({value});

		if (typeof this.props.onInput === 'function') {
			this.props.onInput(value);
		}
	}

	handleChange (value) {
		this.setState({
			value,
			is_changing: false
		});

		if (typeof this.props.onChange === 'function') {
			this.props.onChange(value);
		}
	}

	render() {
		const SliderComponent = this.props.tooltip
				? Slider.createSliderWithTooltip(Slider)
				: Slider,
			currentValue = this.state.is_changing
				? this.state.value
				: this.props.value;

		return (
			<SliderComponent
				value={Number.isFinite(parseFloat(currentValue)) ? parseFloat(currentValue) : 0}
				onBeforeChange={this.onBeforeChange.bind(this)}
				onChange={this.handleInput.bind(this)}
				onAfterChange={this.handleChange.bind(this)}
				max={this.props.max}
				min={this.props.min}
				disabled={this.props.disabled} />
		);
	}
}

SliderControl.propTypes = {
	value: PropTypes.number,
	max: PropTypes.number,
	min: PropTypes.number,
	tooltip: PropTypes.bool,
	onChange: PropTypes.func,
	onInput: PropTypes.func,
	disabled: PropTypes.bool
};

SliderControl.defaultProps = {
	value: 0
};

export default SliderControl;
