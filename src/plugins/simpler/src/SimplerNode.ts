import {CompositeAudioNode, ParamMgrNode} from '@webaudiomodules/sdk-parammgr'
import {MIDI, ScheduledMIDIEvent} from "../../shared/midi";

export interface SimplerState {
    params?: any
    url?: string
    start?: number
    end?: number
}

export class SimplerNode extends CompositeAudioNode {

    paramMgr: ParamMgrNode
    public url: string;
    buffer: AudioBuffer;

    constructor(audioContext: BaseAudioContext, initialState={}) {
        super(audioContext, initialState);

        this._output = this.context.createGain();
    }

    async getState(): Promise<any> {
        return {
            params: await super.getState(),
            url: this.url,
        }
    }

    async setState(state: SimplerState) {
        if (state.params) {
            await super.setState(state.params)
        }
        this.url = state.url;
    }

    setup(paramMgr: ParamMgrNode) {
        // @ts-ignore
        paramMgr.addEventListener('wam-midi', (e) => this.processMIDIEvents([{event: e.detail.data.bytes, time: 0}]));

        this._wamNode = paramMgr
        this.paramMgr = paramMgr
    }

    processMIDIEvents = (midiEvents: ScheduledMIDIEvent[]) => {
        midiEvents.forEach ((message) => {
            if (message.event[0] == MIDI.NOTE_ON) {
                let midiNote = message.event[1]

                this.play(midiNote);
            }
        });
    }

    private sampleNote = 60;

    play(midiNote: number) {
        if (!this.buffer) {
            return
        }

        const { start, end } = this.paramMgr.getParamsValues();
        const source = this.context.createBufferSource();

        source.playbackRate.value = 2 ** ((midiNote - this.sampleNote) / 12);
        source.buffer = this.buffer

        source.connect(this._output);
        source.start(this.context.currentTime, start * this.buffer.duration, (end - start) * this.buffer.duration);
    }
}
