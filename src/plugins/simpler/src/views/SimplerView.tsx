import {Component, ComponentChild, h, RenderableProps} from "preact";
import Simpler from "../index";
import {WaveformView} from "./WaveformView";
import {loadSample} from "../helpers";
import {useEffect, useRef, useState} from "preact/compat";
import {Draggable} from "./Draggable";

export interface SimplerViewProps {
    plugin: Simpler
}

type SimplerViewState = {
    sampleUrl?: string
    buffer: AudioBuffer
    sampleStart: number
    sampleEnd: number
}

export default class SimplerView extends Component<SimplerViewProps, SimplerViewState> {
    async componentWillMount(): Promise<void> {
        this.setState({sampleUrl: this.props.plugin.audioNode.url});

        const { start, end } = this.props.plugin.audioNode.paramMgr.getParams();
        this.setState({sampleStart: start.value, sampleEnd: end.value});
    }

    componentDidMount() {
        let sampleUrl = this.state.sampleUrl;

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

        const [sampleStart, setSampleStart] = useState(this.state.sampleStart);
        const [sampleEnd, setSampleEnd] = useState(this.state.sampleEnd);

        const onSampleStartChange = (value: number) => {
            setSampleStart(value);
            this.props.plugin.audioNode.paramMgr.setParamValue('start', value);
        }

        const onSampleEndChange = (value: number) => {
            setSampleEnd(value);
            this.props.plugin.audioNode.paramMgr.setParamValue('end', value);
        }

        return <div>
            <p>Plugin : {props.plugin.name}</p>
            <p>File : {state.sampleUrl}</p>
            <div class="waveform-container" style={{width, height}}>
                <WaveformView buffer={state.buffer}></WaveformView>
                <Draggable
                    className="v-line draggable"
                    initialPos={{x: width * sampleStart, y: 0}}
                    id="crop-region-start"
                    fixOnAxis={"x"}
                    constrains={{x: 0, y: 0, width, height}}
                    onDragEnd={(pos) => onSampleStartChange(pos.x / width)}
                ><span>start</span></Draggable>
                <Draggable
                    className="v-line draggable"
                    initialPos={{x: width * sampleEnd, y: 0}}
                    id="crop-region-end"
                    fixOnAxis={"x"}
                    constrains={{x: 0, y: 0, width, height}}
                    onDragEnd={(pos) => onSampleEndChange(pos.x / width)}
                ><span>end</span></Draggable>
            </div>
        </div>
    }
}
