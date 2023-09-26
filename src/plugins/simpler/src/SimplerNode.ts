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

    constructor(audioContext: BaseAudioContext, initialState = {}) {
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
        midiEvents.forEach((message) => {
            if (message.event[0] == MIDI.NOTE_ON) {
                let midiNote = message.event[1]

                this.play(midiNote);
            }
        });
    }

    private sampleNote = 60;

    play(midiNote: number) {
        if (!this.buffer) {
            console.warn(`SimplerNode.play: no buffer`);
            return
        }

        const {start, end, fadein, fadeout} = this.paramMgr.getParamsValues();
        const source = this.context.createBufferSource();

        source.playbackRate.value = 2 ** ((midiNote - this.sampleNote) / 12);
        source.buffer = this.buffer

        const time = this.context.currentTime;
        const playbackDuration = this.buffer.duration;

        const gainNode = this.context.createGain();

        if (fadein - start > 0) {
            gainNode.gain.setValueAtTime(0, time);
            gainNode.gain.linearRampToValueAtTime(
                1,
                (time + 1) + ((fadein - start) * playbackDuration)
            );
        }

        if (end - fadeout > 0) {
            gainNode.gain.linearRampToValueAtTime(
                0,
                time + ((end - fadeout) * playbackDuration)
            );
        }

        source.connect(gainNode);
        gainNode.connect(this._output);
        source.start(time, start * playbackDuration, (end - start) * playbackDuration);

        source.onended = () => {
            source.disconnect();
            gainNode.disconnect();
        }
    }
}
