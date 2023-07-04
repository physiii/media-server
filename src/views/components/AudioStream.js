import React from 'react';
import PropTypes from 'prop-types';
import {JSMpeg} from '../../lib/jsmpeg/jsmpeg.min.js';
import {connect} from 'react-redux';
import {audioStartStream, audioStopStream, cameraStartAudioRecordingStream, cameraStopAudioRecordingStream} from '../../state/ducks/services-list/operations.js';
// import styles from './AudioStream.css';

export class AudioStream extends React.Component {
	constructor (props) {
		super(props);

		this.resourceStreamingStatus = {};
		this.canvas = React.createRef();
	}

	componentDidMount () {
		this.bootstrapPlayer();

		if (this.props.autoplay) {
			this.start();
		}
	}

	shouldComponentUpdate (nextProps) {
		const didRecordingChange = (nextProps.recording && nextProps.recording.id) !== (this.props.recording && this.props.recording.id),
			didAudioChange = nextProps.audioServiceId !== this.props.audioServiceId,
			didTokenChange = nextProps.streamingToken !== this.props.streamingToken;

		// Check to see if shouldStream changed and, if so, start or stop the stream.
		if (!this.props.shouldStream && nextProps.shouldStream) {
			this.start();
		} else if (this.props.shouldStream && !nextProps.shouldStream) {
			this.stop();
		}

		// Only re-render if the audio or recording changes. This prevents
		// unnecessary re-bootstrapping of JSMpeg.
		if (didRecordingChange || didAudioChange) {
			// Stop the stream for the current recording or audio.
			this.stop();

			return true;
		}

		// Update if the token changes so JSMpeg can bootstrap with the new token.
		if (didTokenChange) {
			return true;
		}

		return false;
	}

	componentDidUpdate () {
		this.bootstrapPlayer();
	}

	componentWillUnmount () {
		this.stop();

		if (this.player) {
			this.player.destroy();
		}
	}

	start () {
		const streamId = this.getStreamIdForCurrentResource();

		// Play JSMpeg. Need to match exactly false because of JSMpeg quirks.
		if (this.player && this.player.isPlaying === false) {
			this.player.play();
		}

		if (this.resourceStreamingStatus[streamId]) {
			return;
		}

		this.props.startStreaming();

		this.resourceStreamingStatus[streamId] = true;
	}

	stop () {
		const streamId = this.getStreamIdForCurrentResource();

		// Pause JSMpeg.
		if (this.player && this.player.isPlaying) {
			this.player.pause();
		}

		if (!this.resourceStreamingStatus[streamId]) {
			return;
		}

		this.props.stopStreaming();

		this.resourceStreamingStatus[streamId] = false;
	}

	getStreamIdForCurrentResource () {
		return this.props.recording ? this.props.recording.id : this.props.audioServiceId;
	}

	bootstrapPlayer () {
		if (this.player) {
			// this.player.destroy();
		}

		this.player = new JSMpeg.Player(
			this.props.streamingHost + '?stream_id=' + this.getStreamIdForCurrentResource() + '&stream_token=' + this.props.streamingToken,
			{
				canvas: this.canvas.current,
				disableGl: true
			}
		);

		if (this.props.shouldStream) {
			this.start();
		} else {
			this.stop();
		}
	}

	render () {
		return (
			<canvas
				className={this.props.className}
				ref={this.canvas} />
		);
	}
}

AudioStream.propTypes = {
	audioServiceId: PropTypes.string.isRequired,
	recording: PropTypes.object, // TODO: Shape of recording object
	streamingToken: PropTypes.string,
	streamingHost: PropTypes.string,
	shouldStream: PropTypes.bool,
	// autoplay will start the stream only once when the component mounts.
	autoplay: PropTypes.bool,
	// className can be passed in to override the default CSS class.
	className: PropTypes.string,
	startStreaming: PropTypes.func.isRequired,
	stopStreaming: PropTypes.func.isRequired
};

export const mapStateToProps = (state) => {
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

		return {
			streamingHost: protocol + '//' + window.location.hostname + ':' + state.config.stream_port + '/stream-relay'
		};
	},
	mapDispatchToProps = (dispatch, ownProps) => {
		return {
			startStreaming: () => {
				if (ownProps.recording) {
					dispatch(cameraStartAudioRecordingStream(ownProps.recording));
				} else {
					dispatch(audioStartStream(ownProps.audioServiceId));
				}
			},
			stopStreaming: () => {
				if (ownProps.recording) {
					dispatch(cameraStopAudioRecordingStream(ownProps.recording));
				} else {
					dispatch(audioStopStream(ownProps.audioServiceId));
				}
			}
		};
	};

export default connect(mapStateToProps, mapDispatchToProps)(AudioStream);
