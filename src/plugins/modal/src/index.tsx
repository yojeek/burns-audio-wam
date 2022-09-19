/* eslint-disable class-methods-use-this */
/* eslint-disable max-len */
/* eslint-disable import/extensions */
/* eslint-disable max-classes-per-file */
/* eslint-disable no-underscore-dangle */

import { WamEventMap } from '@webaudiomodules/api';
import { WebAudioModule, WamNode, addFunctionModule } from '@webaudiomodules/sdk';

import { h, render } from 'preact';
import { getBaseUrl } from '../../shared/getBaseUrl';
import getSpectrumModalProcessor from "./SpectrumModalProcessor"

import { SpectrumModalView } from './SpectrumModalView';

import styleRoot from "./SpectrumModalView.scss";
	
class SpectrumModalNode extends WamNode {
	destroyed = false;
	_supportedEventTypes: Set<keyof WamEventMap>

	/**
	 * @param {WebAudioModule} module
	 * @param {AudioWorkletNodeOptions} options
	 */
	 constructor(module: WebAudioModule, options: AudioWorkletNodeOptions) {
		super(module, {
			...options, 
			numberOfInputs: 0,
			numberOfOutputs: 1,
			outputChannelCount: [2],
		});

		// 'wam-automation' | 'wam-transport' | 'wam-midi' | 'wam-sysex' | 'wam-mpe' | 'wam-osc';
		this._supportedEventTypes = new Set(['wam-automation', 'wam-midi']);
		this.channelCountMode = "explicit"

	}
}

export default class SpectrumModalModule extends WebAudioModule<WamNode> {
	//@ts-ignore
	_baseURL = getBaseUrl(new URL('.', __webpack_public_path__));

	_descriptorUrl = `${this._baseURL}/descriptor.json`;
	_coreUrl = `${this._baseURL}/SpectrumModalCore.js`;
	nonce: string | undefined;

	async _loadDescriptor() {
		const url = this._descriptorUrl;
		if (!url) throw new TypeError('Descriptor not found');
		const response = await fetch(url);
		const descriptor = await response.json();
		Object.assign(this._descriptor, descriptor);
		return descriptor
	}

	async initialize(state: any) {
		await this._loadDescriptor();

		return super.initialize(state);
	}

	async createAudioNode(initialState: any) {
		await SpectrumModalNode.addModules(this.audioContext, this.moduleId)

		await this.audioContext.audioWorklet.addModule(this._coreUrl)
		
		await addFunctionModule(this.audioContext.audioWorklet, getSpectrumModalProcessor, this.moduleId)

		const node: SpectrumModalNode = new SpectrumModalNode(this, {});
		await node._initialize()

		if (initialState) node.setState(initialState);

		return node
    }

	async createGui() {
		const div = document.createElement('div');
		// hack because h() is getting stripped for non-use despite it being what the JSX compiles to
		h("div", {})

		div.setAttribute("style", "display: flex; height: 100%; width: 100%; flex: 1;")

		var shadow = div.attachShadow({mode: 'open'});

		if (this.nonce) {
			// we've already rendered before, unuse the styles before using them again
			this.nonce = undefined

			//@ts-ignore
			styleRoot.unuse()
		}

		this.nonce = Math.random().toString(16).substr(2, 8);
		div.setAttribute("data-nonce", this.nonce)

		// @ts-ignore
		styleRoot.use({ target: shadow });

		render(<SpectrumModalView plugin={this}></SpectrumModalView>, shadow);

		return div;
	}

	destroyGui(el: Element) {
		if (el.getAttribute("data-nonce") == this.nonce) {
			// this was the last time we rendered the GUI so clear the style
			
			//@ts-ignore
			styleRoot.unuse()
		}
		
		render(null, el)
	}
}
