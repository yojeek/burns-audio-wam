import initializeWamHost from "@webaudiomodules/sdk/src/initializeWamHost";
import {WebAudioModule} from "@webaudiomodules/sdk";

function scheduleWamNote(plugin: WebAudioModule, note: number, time: number, durationSec = 0.1, noteVelocity = 100) {
    const auNode = plugin.audioNode;

    if (!time) {
        time = auNode.context.currentTime;
    }

    console.log(`scheduling note ${note} in ${time - auNode.context.currentTime}`)

    const MIDI_NODE_ON = 0x90;
    const MIDI_NOTE_OFF = 0x80;

    const WAM_EVENT = 'wam-midi';

    const midiOnMessage = {bytes: new Uint8Array([MIDI_NODE_ON, note, noteVelocity])};
    const midiOnEvent = {
        type: WAM_EVENT,
        time,
        data: midiOnMessage
    };
    const midiOffMessage = {bytes: new Uint8Array([MIDI_NOTE_OFF, note, noteVelocity])};
    const midiOffEvent = {
        type: WAM_EVENT,
        time: time + durationSec,
        data: midiOffMessage
    };

    // @ts-ignore
    auNode.scheduleEvents(midiOnEvent, midiOffEvent);
}

async function main() {
    const audioContext = new AudioContext();
    await initializeWamHost(audioContext, 'default-wam-host-group');

    const { default: pluginFactory } = await import('../src/index'); // load main plugin file

    // Create a new instance of the plugin
    // You can can optionally specify additional information such as the initial state of the
    // plugin
    const pluginInstance = await pluginFactory.createInstance('default-wam-host-group', audioContext, {
        // initialState
        params: {
            start: 0,
            end: .5
        },
        url: './pianoc4.wav'
    });

    // instance.audioNode is the plugin WebAudio node (native, AudioWorklet or
    // Composite). It can then be connected to the WebAudio graph.


    // for example...
    //mediaElementSource.connect(pluginInstance.audioNode);
    pluginInstance.audioNode.connect(audioContext.destination);

    // then create the GUI
    const pluginDomNode = await pluginInstance.createGui();
    // for example
    document.getElementById('testplugin').appendChild(pluginDomNode);

    // handle play c4, d4, e4
    document.getElementById('playC4')?.addEventListener('click', () => {
        audioContext.resume();
        scheduleWamNote(pluginInstance, 60, audioContext.currentTime);
    });
    document.getElementById('playD4')?.addEventListener('click', () => {
        audioContext.resume();
        scheduleWamNote(pluginInstance, 62, audioContext.currentTime);
    });
    document.getElementById('playE4')?.addEventListener('click', () => {
        audioContext.resume();
        scheduleWamNote(pluginInstance, 64, audioContext.currentTime);
    });

}

main();
