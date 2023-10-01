import {CompositeAudioNode, ParamMgrNode} from '@webaudiomodules/sdk-parammgr'
import {MIDI, ScheduledMIDIEvent} from "../../shared/midi";

type Algorithm = 'resample' | 'phase-vocoder';

const DEFAULT_ALGORITHM: Algorithm = 'resample';

export interface SimplerState {
    params?: {
        start: number,
        fadein: number,
        fadeout: number,
        end: number
    }
    url?: string
    algorithm?: Algorithm
    sampleNote?: number
}

export class SimplerNode extends CompositeAudioNode {

    paramMgr: ParamMgrNode
    public url: string;
    buffer: AudioBuffer;
    algorithm: Algorithm = DEFAULT_ALGORITHM;
    public sampleNote = 60;

    constructor(audioContext: BaseAudioContext) {
        super(audioContext);
        this._output = this.context.createGain();
    }

    async getState(): Promise<any> {
        return {
            params: await super.getState(),
            url: this.url,
            algorithm: this.algorithm,
            sampleNote: this.sampleNote
        }
    }

    async setState(state: SimplerState) {
        if (state.params) {
            await super.setState(state.params)
        }
        this.url = state.url;
        this.algorithm = state.algorithm || DEFAULT_ALGORITHM;
        this.sampleNote = state.sampleNote || 60;
    }

    setup(paramMgr: ParamMgrNode) {
        // @ts-ignore
        paramMgr.addEventListener('wam-midi', (e) => this.processMIDIEvents([{event: e.detail.data.bytes, time: 0}]));

        this._wamNode = paramMgr
        this.paramMgr = paramMgr
    }

    processMIDIEvents = (midiEvents: ScheduledMIDIEvent[]) => {
        midiEvents.forEach((message) => {
            const [eventType, midiNote, velocity] = message.event
            
            if (message.event[0] == MIDI.NOTE_ON) {
                this.play(midiNote, velocity / 127);
            }
        });
    }

    play(midiNote: number, volume: number = 1) {
        if (!this.buffer) {
            console.warn(`SimplerNode.play: no buffer`);
            return
        }

        const {start, end, fadein, fadeout} = this.paramMgr.getParamsValues();
        const source = this.context.createBufferSource();
        source.buffer = this.buffer

        const time = this.context.currentTime;
        const playbackDuration = (end - start) * this.buffer.duration;

        const gainNode = this.context.createGain();

        if (fadein - start > 0) {
            gainNode.gain.setValueAtTime(0, time);
            gainNode.gain.linearRampToValueAtTime(
                volume,
                time + fadein * playbackDuration
            );
        } else {
            gainNode.gain.setValueAtTime(volume, time);
        }

        if (end - fadeout > 0) {
            gainNode.gain.setValueAtTime(volume, time + fadeout * playbackDuration);
            gainNode.gain.linearRampToValueAtTime(
                0,
                time + playbackDuration
            );
        }

        let vocoderNode = null;

        if (this.algorithm === 'resample') {
            source.playbackRate.value = 2 ** ((midiNote - this.sampleNote) / 12);
            source.connect(gainNode);
        } else if (this.algorithm === 'phase-vocoder') {
            vocoderNode = new AudioWorkletNode(this.context, 'phase-vocoder-processor');
            vocoderNode.parameters.get('pitchFactor').value = 2 ** ((midiNote - this.sampleNote) / 12);
            source.connect(vocoderNode);
            vocoderNode.connect(gainNode);
        }

        gainNode.connect(this._output);
        source.start(time, start * this.buffer.duration, playbackDuration);

        source.onended = () => {
            // cleanup voices
            gainNode.disconnect();
            vocoderNode && vocoderNode.disconnect();
            source.disconnect();
        }
    }
}
