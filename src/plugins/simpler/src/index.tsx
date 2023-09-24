import {WebAudioModule} from '@webaudiomodules/sdk';
import {ParametersMappingConfiguratorOptions, ParamMgrFactory} from '@webaudiomodules/sdk-parammgr'
import {getBaseUrl} from '../../shared/getBaseUrl';
import {SimplerNode, SimplerState} from './SimplerNode';

import {h, render} from "preact";
import {insertStyle} from "../../shared/insertStyle";
import SimplerView from "./views/SimplerView";
import styles from "./views/SimplerView.css"
import "./views/SimplerView.css"

const baseUrl = getBaseUrl(new URL(import.meta.url));

export default class Simpler extends WebAudioModule<SimplerNode> {
    _baseURL = baseUrl;
    _descriptorUrl = `${this._baseURL}/descriptor.json`;
    private view: JSXInternal.Element;

    constructor(audioContext, options) {
        super(audioContext, options);
    }

    async createAudioNode(initialState: any) {
        const simplerNode = new SimplerNode(this.audioContext, initialState);

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
            },
            internalParamsConfig: {
                start: {
                    onChange: (value, prevValue) => {
                        console.log(`Param "start" has been changed from ${prevValue} to ${value}`);
                    }, // callback
                    automationRate: 10 // 10 times/sec
                }
            }
        };
        const paramMgrNode = await ParamMgrFactory.create(this, optionsIn);

        paramMgrNode.setNormalizedParamValue('start', 0.5);

        simplerNode.setup(paramMgrNode);

        if (initialState) {
            await simplerNode.setState(initialState);
        } else {
            await simplerNode.setState({
                params: {},
                url: ''
            })
        }

        console.log(simplerNode.paramMgr.getParams());

        return simplerNode;
    }

    async initialize(initialState?: SimplerState) {
        if (!this._audioNode) this.audioNode = await this.createAudioNode(initialState);
        this.initialized = true;
        return this;
    }

    async createGui() {
        const div = document.createElement('div');

        // vite doesn't play nice with shadow dom css hot reload;
        // todo uncomment when css finished

        /*const shadow = div.attachShadow({mode: 'open'});
        insertStyle(shadow, styles.toString())*/

        this.view = <SimplerView plugin={this}></SimplerView>;

        render(this.view, div);

        return div;
    }
}
