import React from 'react';
import PropTypes from 'prop-types';
import {JSMpeg} from '../../lib/jsmpeg/jsmpeg.min.js';
import {connect} from 'react-redux';
import {cameraStartStream, cameraStopStream, cameraStartRecordingStream, cameraStopRecordingStream} from '../../state/ducks/services-list/operations.js';
import styles from './VideoStream.css';

export class VideoStream extends React.Component {
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
			didCameraChange = nextProps.cameraServiceId !== this.props.cameraServiceId,
			didTokenChange = nextProps.streamingToken !== this.props.streamingToken;

		// Check to see if shouldStream changed and, if so, start or stop the stream.
		if (!this.props.shouldStream && nextProps.shouldStream) {
			this.start();
		} else if (this.props.shouldStream && !nextProps.shouldStream) {
			this.stop();
		}

		// Only re-render if the camera or recording changes. This prevents
		// unnecessary re-bootstrapping of JSMpeg.
		if (didRecordingChange || didCameraChange) {
			// Stop the stream for the current recording or camera.
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
		return this.props.recording ? this.props.recording.id : this.props.cameraServiceId;
	}

	bootstrapPlayer () {
		if (this.player) {
			this.player.destroy();
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

		// Make the background black.
		if (this.player && this.player.renderer) {
			setTimeout(() => {
				if (!this.player) {
					return;
				}

				const {context, canvas} = this.player.renderer;

				if (!context || !canvas) {
					return;
				}

				context.fillStyle = '#000000';
				context.fillRect(0, 0, canvas.width, canvas.height);
			}, 100);
		}
	}

	render () {
		return (
			<canvas
				className={styles.canvas}
				width={this.props.width}
				height={this.props.height}
				ref={this.canvas} />
		);
	}
}

VideoStream.propTypes = {
	cameraServiceId: PropTypes.string.isRequired,
	recording: PropTypes.object, // TODO: Shape of recording object
	streamingToken: PropTypes.string,
	streamingHost: PropTypes.string,
	width: PropTypes.number.isRequired,
	height: PropTypes.number.isRequired,
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
					dispatch(cameraStartRecordingStream(ownProps.recording));
				} else {
					dispatch(cameraStartStream(ownProps.cameraServiceId));
				}
			},
			stopStreaming: () => {
				if (ownProps.recording) {
					dispatch(cameraStopRecordingStream(ownProps.recording));
				} else {
					dispatch(cameraStopStream(ownProps.cameraServiceId));
				}
			}
		};
	};

export default connect(mapStateToProps, mapDispatchToProps)(VideoStream);
