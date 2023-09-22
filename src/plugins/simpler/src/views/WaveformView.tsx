import {h, Component} from 'preact';

export interface WaveformViewProps {
    buffer: AudioBuffer
}

type WaveformFrame = {
    min: number
    max: number
}

export class WaveformView extends Component<WaveformViewProps, any> {
    canvasRef?: HTMLCanvasElement
    canvas?: CanvasRenderingContext2D
    container?: HTMLDivElement

    setupContainer(ref: HTMLDivElement | null) {
        if (!ref) {
            return
        }
        this.container = ref
        this.setup()
    }

    setupCanvas(ref: HTMLCanvasElement | null) {
        if (!ref) {
            return
        }
        this.canvasRef = ref
        this.setup()
    }

    calculateWaveform(): WaveformFrame[] {
        let data = this.props.buffer.getChannelData(0)
        let count = this.canvasRef.width

        let result: WaveformFrame[] = []

        let samplesPerPixel = data.length / count

        let min = 0
        let max = 0
        let acc = 0
        for (let i = 0; i < data.length; i++) {
            if (data[i] < min) {
                min = data[i]
            }
            if (data[i] > max) {
                max = data[i]
            }
            acc++
            if (acc > samplesPerPixel) {
                result.push({min, max})
                min = data[i]
                max = data[i]
                acc = 0
            }
        }

        return result
    }

    draw() {
        this.canvas.beginPath();
        this.canvas.rect(0, 0, this.canvasRef.width, this.canvasRef.height);
        this.canvas.fillStyle = 'white';
        this.canvas.fill();

        if (!this.props.buffer) {
            return
        }

        let waveform = this.calculateWaveform()
        this.canvas.beginPath()
        this.canvas.lineWidth = 1
        this.canvas.strokeStyle = "black";
        let mid = this.canvasRef.height / 2
        for (let i = 0; i < waveform.length; i++) {
            this.canvas.moveTo(i, Math.round(mid + (mid * waveform[i].min)))
            this.canvas.lineTo(i, Math.round(mid + (mid * waveform[i].max)))
        }
        this.canvas.stroke()

    }

    setup() {
        if (!this.container || !this.canvasRef) {
            return
        }

        this.container.addEventListener("resize", (ev) => {
            this.canvasRef.width = this.container.clientWidth
            this.canvasRef.height = this.container.clientHeight
            this.draw()
        })

        this.canvasRef.width = this.container.clientWidth
        this.canvasRef.height = this.container.clientHeight

        this.canvas = this.canvasRef.getContext("2d")

        this.draw()
    }

    render() {
        return <div ref={(ref => this.setupContainer(ref))} style={{width: '100%', height: '100%'}}>
            <canvas ref={(ref) => this.setupCanvas(ref)}></canvas>
        </div>
    }
}
