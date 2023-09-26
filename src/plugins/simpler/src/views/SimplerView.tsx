import {Component, ComponentChild, h, RenderableProps} from "preact";
import Simpler from "../index";
import {WaveformView} from "./WaveformView";
import {loadSample} from "../helpers";
import {useEffect, useRef, useState} from "preact/compat";
import {Draggable} from "./Draggable";
import {EnvelopeView} from "./EnvelopeView";

export interface SimplerViewProps {
    plugin: Simpler
}

type SimplerViewState = {
    sampleUrl?: string
    buffer: AudioBuffer
    sampleStart: number
    fadeIn: number
    fadeOut: number
    sampleEnd: number
    canUpdateFromParams: boolean
}

const ENVELOPE_START_IDX = 0;
const ENVELOPE_FADE_IN_IDX = 1;
const ENVELOPE_FADE_OUT_IDX = 2;
const ENVELOPE_END_IDX = 3;

export default class SimplerView extends Component<SimplerViewProps, SimplerViewState> {
    private automationStatePoller: number;

    async componentWillMount(): Promise<void> {
        const {start, end, fadein, fadeout} = this.props.plugin.audioNode.paramMgr.getParams();

        this.setState({
            canUpdateFromParams: true,
            sampleStart: start.value,
            fadeIn: fadein.value,
            fadeOut: fadeout.value,
            sampleEnd: end.value
        });
    }

    componentDidMount() {
        this.automationStatePoller = window.requestAnimationFrame(this.pollAutomationState)
    }

    // Lifecycle: Called just before our component will be destroyed
    componentWillUnmount() {
        window.cancelAnimationFrame(this.automationStatePoller)
    }

    pollAutomationState = async () => {
        const {params: {start, fadein, fadeout, end}, url} = await this.props.plugin.audioNode.getState();

        if (!this.state.canUpdateFromParams) {
            this.automationStatePoller = window.requestAnimationFrame(this.pollAutomationState)
            return;
        }

        const stateUpdate = {};

        if (url !== this.state.sampleUrl) {
            stateUpdate['sampleUrl'] = url;
            loadSample(this.props.plugin.audioContext, url)
                .then(buffer => {
                    this.setState({buffer});
                    this.props.plugin.audioNode.buffer = buffer;
                })
                .catch(e => console.error(e));
        }

        if (start !== this.state.sampleStart) {
            stateUpdate['sampleStart'] = start;
        }
        if (fadein !== this.state.fadeIn) {
            stateUpdate['fadeIn'] = fadein;
        }
        if (fadeout !== this.state.fadeOut) {
            stateUpdate['fadeOut'] = fadeout;
        }
        if (end !== this.state.sampleEnd) {
            stateUpdate['sampleEnd'] = end;
        }

        Object.keys(stateUpdate).length && this.setState(stateUpdate);

        this.automationStatePoller = window.requestAnimationFrame(this.pollAutomationState)
    }

    render(props?: RenderableProps<SimplerViewProps>, state?: Readonly<SimplerViewState>, context?: any): ComponentChild {
        const width = 400;
        const height = 175;

        const waveformContainerRef = useRef();

        const envelopeHandlesPoints: ReadonlyArray<any> = [
            {
                x: state.sampleStart * width,
                y: height
            },
            {
                x: state.fadeIn * width,
                y: 0
            },
            {
                x: state.fadeOut * width,
                y: 0
            },
            {
                x: state.sampleEnd * width,
                y: height
            }
        ];

        const draggableConstraints = {x: 0, y: 0, width, height};

        const constrainDrag = ({x, y}, idx) => {
            const position = {x, y};

            // check constrains within parent dimensions
            if (x < draggableConstraints.x) {
                position.x = 0;
            }
            if (x > draggableConstraints.width) {
                position.x = draggableConstraints.width;
            }
            if (y < draggableConstraints.y) {
                position.y = 0;
            }
            if (y > draggableConstraints.height) {
                position.y = draggableConstraints.height;
            }

            // check constrains in regard to other handles
            const prevKeypointX = envelopeHandlesPoints[idx - 1]?.x;
            const nextKeypointX = envelopeHandlesPoints[idx + 1]?.x;

            if (prevKeypointX && prevKeypointX > x) {
                position.x = prevKeypointX + 1;
            }
            if (nextKeypointX && nextKeypointX < x) {
                position.x = nextKeypointX - 1;
            }

            updateStateFromDrag(position.x, idx)

            return position;
        }

        const paramMgr = this.props.plugin.audioNode.paramMgr;

        const updateStateFromDrag = (x: number, idx: number) => {
            const value = x / width;

            switch (idx) {
                case ENVELOPE_START_IDX:
                    this.setState({sampleStart: value})
                    break;
                case ENVELOPE_FADE_IN_IDX:
                    this.setState({fadeIn: value})
                    break;
                case ENVELOPE_FADE_OUT_IDX:
                    this.setState({fadeOut: value})
                    break;
                case ENVELOPE_END_IDX:
                    this.setState({sampleEnd: value})
            }
        }

        const updateParamsFromState = () => {
            paramMgr.setParamsValues({
                start: state.sampleStart,
                fadein: state.fadeIn,
                fadeout: state.fadeOut,
                end: state.sampleEnd
            })
        }

        const onDragStart = (pos, idx) => {
            this.setState({canUpdateFromParams: false})
        }

        const onDragEnd = (pos, idx) => {
            this.setState({canUpdateFromParams: true})
            updateParamsFromState()
        }

        const onUrlChange = async (e) => {
            const url = e.target.value;

            if (url === state.sampleUrl) {
                return;
            }

            try {
                const buffer = await loadSample(this.props.plugin.audioContext, url);
                this.setState({buffer});
                this.props.plugin.audioNode.buffer = buffer;
            } catch (e) {
                console.error(e);
            }

            this.props.plugin.setSampleUrl(url);
            this.setState({sampleUrl: url});
        }

        return <div>
            <label>
                url : &nbsp;
                <input type="text" value={state.sampleUrl} onChange={onUrlChange}/>
            </label>
            <div class="waveform-container" style={{width, height}} ref={waveformContainerRef}>
                <WaveformView buffer={state.buffer}></WaveformView>
                <EnvelopeView points={envelopeHandlesPoints}>
                    <Draggable
                        initialPos={envelopeHandlesPoints[ENVELOPE_START_IDX]}
                        fixOnAxis={"x"}
                        constrainFn={(pos) => constrainDrag(pos, ENVELOPE_START_IDX)}
                        onDragStart={(pos) => onDragStart(pos, ENVELOPE_START_IDX)}
                        onDragEnd={(pos) => onDragEnd(pos, ENVELOPE_START_IDX)}
                    ></Draggable>
                    <Draggable
                        initialPos={envelopeHandlesPoints[ENVELOPE_FADE_IN_IDX]}
                        fixOnAxis={"x"}
                        constrainFn={(pos) => constrainDrag(pos, ENVELOPE_FADE_IN_IDX)}
                        onDragStart={(pos) => onDragStart(pos, ENVELOPE_FADE_IN_IDX)}
                        onDragEnd={(pos) => onDragEnd(pos, ENVELOPE_FADE_IN_IDX)}
                    ></Draggable>
                    <Draggable
                        initialPos={envelopeHandlesPoints[ENVELOPE_FADE_OUT_IDX]}
                        fixOnAxis={"x"}
                        constrainFn={(pos) => constrainDrag(pos, ENVELOPE_FADE_OUT_IDX)}
                        onDragStart={(pos) => onDragStart(pos, ENVELOPE_FADE_OUT_IDX)}
                        onDragEnd={(pos) => onDragEnd(pos, ENVELOPE_FADE_OUT_IDX)}
                    ></Draggable>
                    <Draggable
                        initialPos={envelopeHandlesPoints[ENVELOPE_END_IDX]}
                        fixOnAxis={"x"}
                        constrainFn={(pos) => constrainDrag(pos, ENVELOPE_END_IDX)}
                        onDragStart={(pos) => onDragStart(pos, ENVELOPE_END_IDX)}
                        onDragEnd={(pos) => onDragEnd(pos, ENVELOPE_END_IDX)}
                    ></Draggable>
                </EnvelopeView>
            </div>
        </div>
    }
}
