import {WebAudioModule} from '@webaudiomodules/sdk';
import {ParametersMappingConfiguratorOptions, ParamMgrFactory} from '@webaudiomodules/sdk-parammgr'
import {getBaseUrl} from '../../shared/getBaseUrl';
import {SimplerNode, SimplerState} from './SimplerNode';

import {h, render} from "preact";
import {insertStyle} from "../../shared/insertStyle";
import SimplerView from "./views/SimplerView";
import styles from "./views/SimplerView.css?inline"

const baseUrl = getBaseUrl(new URL(import.meta.url));

export default class Simpler extends WebAudioModule<SimplerNode> {
    _baseURL = baseUrl;
    _descriptorUrl = `${this._baseURL}/descriptor.json`;

    private view: any;

    constructor(audioContext, options) {
        super(audioContext, options);
    }

    nonce: string | undefined;

    async _loadDescriptor() {
        const url = this._descriptorUrl;
        if (!url) throw new TypeError('Descriptor not found');
        const response = await fetch(url);
        const descriptor = await response.json();
        Object.assign(this._descriptor, descriptor);
        return descriptor
    }

    async createAudioNode(initialState: any) {
        const moduleURL = `${this._baseURL}/phase-vocoder.js`;
        console.log('Loading module', moduleURL)
        await this.audioContext.audioWorklet.addModule(moduleURL);

        const simplerNode = new SimplerNode(this.audioContext);

        let optionsIn: ParametersMappingConfiguratorOptions = {
            paramsConfig: {
                start: {
                    label: 'Start',
                    type: 'float',
                    defaultValue: 0,
                    minValue: 0,
                    maxValue: 1
                },
                fadein: {
                    label: 'Fade In',
                    type: 'float',
                    defaultValue: 0,
                    minValue: 0,
                    maxValue: 1
                },
                fadeout: {
                    label: 'Fade Out',
                    type: 'float',
                    defaultValue: 1,
                    minValue: 0,
                    maxValue: 1
                },
                end: {
                    label: 'End',
                    type: 'float',
                    defaultValue: 1,
                    minValue: 0,
                    maxValue: 1
                }
            }
        };

        const paramMgrNode = await ParamMgrFactory.create(this, optionsIn);
        simplerNode.setup(paramMgrNode);

        if (initialState) {
            await simplerNode.setState(initialState);
        } else {
            await simplerNode.setState({
                params: {},
                url: ''
            })
        }

        return simplerNode;
    }

    setSampleUrl(url: string) {
        this.audioNode.setState({...this.audioNode.getState(), url});
    }

    setSampleNote(sampleNote: number) {
        this.audioNode.setState({...this.audioNode.getState(), sampleNote});
    }

    async initialize(state: any) {
        await this._loadDescriptor();
        if (!this._audioNode) this.audioNode = await this.createAudioNode(state);
        this.initialized = true;
        return this;
    }

    async createGui() {
        const div = document.createElement('div');

        const shadow = div.attachShadow({mode: 'open'});
        insertStyle(shadow, styles.toString())

        this.view = <SimplerView plugin={this}></SimplerView>;

        render(this.view, shadow);

        return div;
    }

    destroyGui(el: Element) {
        render(null, el.shadowRoot)
    }
}
