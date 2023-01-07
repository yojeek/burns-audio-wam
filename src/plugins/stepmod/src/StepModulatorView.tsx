import { Component, h } from 'preact';
import { Fader } from '../../shared/ui/Fader'
import { Select } from '../../shared/ui/Select'
import { Knob } from '../../shared/ui/Knob'

import StepModulatorModule from '.';
import { StepModulator } from './StepModulator';

import styleRoot from "./StepModulatorView.scss"

// @ts-ignore
let styles = styleRoot.locals as typeof styleRoot

let quantizeOptions = [
    "1/32",
    "1/16",
    "1/8",
    "1/4",
    "1/2",
    "1 bar",
    "2 bar",
    "4 bar",
]

let quantizeValues = [
    3,
    6,
    12,
    24,
    48,
    96,
    96*2,
    96*4,
]

export type StepModulatorViewProps = {
    plugin: StepModulatorModule
    sequencer: StepModulator
    clipId: string
}

type StepModulatorViewState = {
    gain: number
    slew: number
}

export class StepModulatorView extends Component<StepModulatorViewProps, any> {
    statePoller: number

    constructor() {
        super();
        this.pollState = this.pollState.bind(this)

        this.state = {
            "gain" : {value: 1.0},
            "slew" : {value: 1.0},
          }
    }

    componentDidMount() {
        this.pollState()

        this.props.sequencer.renderCallback = () => {
            this.forceUpdate()
        }
    }

    componentWillUnmount() {
        window.cancelAnimationFrame(this.statePoller)

        this.props.sequencer.renderCallback = undefined
    }

    async pollState() {
        this.state = await this.props.plugin.audioNode.getParameterValues(false)

        this.statePoller = window.requestAnimationFrame(this.pollState)
    }

    paramChanged(name: string, value: number) {
        this.state[name].value = value
        this.props.plugin.audioNode.setParameterValues(this.state) 
    }

    async targetChanged(v: string) {
        await this.props.plugin.audioNode.sequencer.setTargetParameter(v)
    }

    targetValueString(v: number): string {
        
        let param = this.props.plugin.targetParam

        if (!param) {
            return v.toFixed(1)
        }

        switch(param.type) {
            case "float":
                return `${(param.minValue + ((param.maxValue - param.minValue)*v)).toFixed(2)}${param.units}`
            case "int":
                return `${Math.round(param.minValue + ((param.maxValue - param.minValue)*v))}${param.units}`
            case "choice":
                let index = Math.round(v)
                return (index >=0 && index < param.choices.length) ? param.choices[index] : "?"
            case "boolean":
                return (Math.round(v) == 0) ? "false" : "true"
        } 
    }

    render() {
        h("div", {})
        
        let clip = this.props.sequencer.getClip(this.props.clipId)
        let steps = clip.state.steps.map((step, index) => {
            return <Fader value={() => clip.state.steps[index]} valueString={v => this.targetValueString(v)} onChange={(e) => {clip.state.steps[index] = e; clip.updateProcessor(clip)}}/>
        })

        let paramNames: string[] = ["--"]
        let paramIds: string[] = ["disabled"]

        if (this.props.plugin.audioNode.paramList) {
            paramNames.push(...Object.keys(this.props.plugin.audioNode.paramList))
            paramIds.push(...Object.keys(this.props.plugin.audioNode.paramList))
        }

        return (
        <div class={styles.Module}>
            <div style="display: flex">
                {steps}
            </div>

            <div style="display: flex">
                <Knob label="Gain" size={40} value={() => this.state['gain'].value} minimumValue={0} maximumValue={1} onChange={(v) => this.paramChanged("gain", v)}/>
                <Knob label="Slew" size={40} value={() => this.state['slew'].value} minimumValue={0} maximumValue={1} onChange={(v) => this.paramChanged("slew", v)}/>
                <Select label="Speed" options={quantizeOptions} values={quantizeValues} value={() => clip.state.speed} onChange={(e) => { clip.state.speed = parseInt(e); clip.updateProcessor(clip)}} />
                <Select label="Param" options={paramNames} values={paramIds} value={() => this.props.plugin.audioNode.sequencer.targetParam} onChange={(v) => this.targetChanged(v)}/>
            </div>

            <div style="flex: 1"></div>
        </div>)
    }  
}