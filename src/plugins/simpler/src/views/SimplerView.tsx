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
}

const ENVELOPE_START_IDX = 0;
const ENVELOPE_FADE_IN_IDX = 1;
const ENVELOPE_FADE_OUT_IDX = 2;
const ENVELOPE_END_IDX = 3;

export default class SimplerView extends Component<SimplerViewProps, SimplerViewState> {
    async componentWillMount(): Promise<void> {
        this.setState({sampleUrl: this.props.plugin.audioNode.url});

        const {start, end, fadein, fadeout} = this.props.plugin.audioNode.paramMgr.getParams();
        this.setState({
            sampleStart: start.value,
            fadeIn: fadein.value,
            fadeOut: fadeout.value,
            sampleEnd: end.value
        });
    }

    componentDidMount() {
        const sampleUrl = this.state.sampleUrl;

        if (sampleUrl) {
            loadSample(this.props.plugin.audioContext, sampleUrl).then(buffer => {
                this.setState({buffer});
                this.props.plugin.audioNode.buffer = buffer;
            })
        }
    }

    render(props?: RenderableProps<SimplerViewProps>, state?: Readonly<SimplerViewState>, context?: any): ComponentChild {
        const [width, setWidth] = useState(400);
        const [height, setHeight] = useState(175);

        const waveformContainerRef = useRef();

        const envelopeHandlesPoints : ReadonlyArray<any> = [
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

            onDragEnd(position.x, idx)

            return position;
        }

        const onDragEnd = (x: number, pos: number) => {
            const value = x / width;

            console.log('DRAG END', x, value, pos, this.state)

            switch (pos) {
                case 0:
                    this.props.plugin.audioNode.paramMgr.setParamValue('start', value);
                    this.setState({sampleStart: value})
                    break;
                case 1:
                    this.props.plugin.audioNode.paramMgr.setParamValue('fadein', value);
                    this.setState({fadeIn: value})
                    break;
                case 2:
                    this.props.plugin.audioNode.paramMgr.setParamValue('fadeout', value);
                    this.setState({fadeOut: value})
                    break;
                case 3:
                    this.props.plugin.audioNode.paramMgr.setParamValue('end', value);
                    this.setState({sampleEnd: value})
            }
        }

        return <div>
            <p>Plugin : {props.plugin.name}</p>
            <p>File : {state.sampleUrl}</p>
            <div class="waveform-container" style={{width, height}} ref={waveformContainerRef}>
                <WaveformView buffer={state.buffer}></WaveformView>
                <EnvelopeView points={envelopeHandlesPoints}>
                    <Draggable
                        className="drag-handle"
                        initialPos={envelopeHandlesPoints[ENVELOPE_START_IDX]}
                        id="fade-in"
                        fixOnAxis={"x"}
                        constrainFn={(pos) => constrainDrag(pos, ENVELOPE_START_IDX)}
                        onDragEnd={(pos) => onDragEnd(pos.x, ENVELOPE_START_IDX)}
                    ></Draggable>
                    <Draggable
                        className="drag-handle"
                        initialPos={envelopeHandlesPoints[ENVELOPE_FADE_IN_IDX]}
                        id="crop-start"
                        fixOnAxis={"x"}
                        onDragEnd={(pos) => onDragEnd(pos.x, ENVELOPE_FADE_IN_IDX)}
                        constrainFn={(pos) => constrainDrag(pos, ENVELOPE_FADE_IN_IDX)}
                    ></Draggable>
                    <Draggable
                        className="drag-handle"
                        initialPos={envelopeHandlesPoints[ENVELOPE_FADE_OUT_IDX]}
                        id="crop-end"
                        fixOnAxis={"x"}
                        onDragEnd={(pos) => onDragEnd(pos.x, ENVELOPE_FADE_OUT_IDX)}
                        constrainFn={(pos) => constrainDrag(pos, ENVELOPE_FADE_OUT_IDX)}
                    ></Draggable>
                    <Draggable
                        className="drag-handle"
                        initialPos={envelopeHandlesPoints[ENVELOPE_END_IDX]}
                        id="crop-end"
                        fixOnAxis={"x"}
                        onDragEnd={(pos) => onDragEnd(pos.x, ENVELOPE_END_IDX)}
                        constrainFn={(pos) => constrainDrag(pos, ENVELOPE_END_IDX)}
                    ></Draggable>
                </EnvelopeView>
            </div>
        </div>
    }
}
