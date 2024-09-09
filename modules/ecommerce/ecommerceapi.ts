import { ICrossWindowApi, ICrossWindowApiOptions, ICrossWindowFactory, ICrossWindowPeerInfo } from "../crosswindowapi/types/crosswindowapi";
import { 
	IAddItemToCartData, 
	IAddItemToCartReply, 
	IECommerceApi, 
	IECommerceApiActions, 
	IECommerceApiConnector, 
	IECommerceApiFactory, 
	IGetUserProfileReply 
} from "./types/ecommerceapi";
import { CrossWindowApiFactory } from "../crosswindowapi/crosswindowapi";

// Message types for the API calls.
// CAUTION: When implementing new API calls and messages type, make sure to add
// the corresponding listener in the ECommerceApiConnector constructor.

const MESSAGE_TYPE_ADD_ITEM_TO_CART = "ADD_ITEM_TO_CART";
const MESSAGE_TYPE_GET_USER_PROFILE = "GET_USER_PROFILE";
const MESSAGE_TYPE_CLOSE_CONFIGURATOR = "CLOSE_CONFIGURATOR";
const MESSAGE_TYPE_HANDSHAKE = "HANDSHAKE";

export class ECommerceApi implements IECommerceApi {

	/** 
	 * The cross window API instance to use for communication 
	 * with the e-commerce plugin.
	 */
	crossWindowApi: ICrossWindowApi;

	/**
	 * Timeout for the API calls.
	 */
	timeout?: number;

	debug: boolean;

	constructor(crossWindowApi: ICrossWindowApi, options?: ICrossWindowApiOptions) {
		this.crossWindowApi = crossWindowApi;
		this.debug = options?.debug ?? false;
		this.timeout = options?.timeout;
		this.peerIsReady = this.crossWindowApi.handshake(MESSAGE_TYPE_HANDSHAKE, this.timeout);
	}
	async closeConfigurator(): Promise<boolean> {
		await this.peerIsReady;
		
		return this.crossWindowApi.send(MESSAGE_TYPE_CLOSE_CONFIGURATOR, undefined, this.timeout); 
	}
	
	async addItemToCart(data: IAddItemToCartData): Promise<IAddItemToCartReply> {
		await this.peerIsReady;
		
		return this.crossWindowApi.send(MESSAGE_TYPE_ADD_ITEM_TO_CART, data, this.timeout); 
	}
	
	async getUserProfile(): Promise<IGetUserProfileReply> {
		await this.peerIsReady;
		
		return this.crossWindowApi.send(MESSAGE_TYPE_GET_USER_PROFILE, undefined, this.timeout);
	}
	
	peerIsReady: Promise<ICrossWindowPeerInfo>;
}

export class ECommerceApiConnector implements IECommerceApiConnector {

	peerIsReady: Promise<ICrossWindowPeerInfo>;

	/**
	 * Implementation of the API actions.
	 */
	actions: IECommerceApiActions;

	/** 
	 * The cross window API instance to use for communication 
	 * with the application using the e-commerce API.
	 */
	crossWindowApi: ICrossWindowApi;

	/**
	 * Timeout for the API calls.
	 */
	timeout?: number;

	debug: boolean;

	constructor(actions: IECommerceApiActions, crossWindowApi: ICrossWindowApi, options?: ICrossWindowApiOptions) {
		this.actions = actions;
		this.crossWindowApi = crossWindowApi;
		this.debug = options?.debug ?? false;
		this.timeout = options?.timeout;
		this.peerIsReady = this.crossWindowApi
			.handshake(MESSAGE_TYPE_HANDSHAKE, this.timeout)
			.then((peerInfo) => {
				this.crossWindowApi.on(MESSAGE_TYPE_ADD_ITEM_TO_CART, (data: IAddItemToCartData) => this.actions.addItemToCart(data));
				this.crossWindowApi.on(MESSAGE_TYPE_GET_USER_PROFILE, () => this.actions.getUserProfile());
				this.crossWindowApi.on(MESSAGE_TYPE_CLOSE_CONFIGURATOR, () => this.actions.closeConfigurator());
				
				return peerInfo;
			});
	}

}

export class DummyECommerceApiActions implements IECommerceApiActions {

	closeConfigurator(): Promise<boolean> {
		return Promise.resolve(true);
	}

	addItemToCart(/*data: IAddItemToCartDat*/): Promise<IAddItemToCartReply> {
		const reply: IAddItemToCartReply = {
			id: "dummyId",
		};
		
		return Promise.resolve(reply);
	}

	getUserProfile(): Promise<IGetUserProfileReply> {
		const reply: IGetUserProfileReply = {
			id: "dummyId",
			email: "dummyEmail",
			name: "dummyName",
		};
		
		return Promise.resolve(reply);
	}

}

class _ECommerceApiFactory implements IECommerceApiFactory {

	crossWindowFactory: ICrossWindowFactory;

	constructor(crossWindowFactory: ICrossWindowFactory) {
		this.crossWindowFactory = crossWindowFactory;
	}

	async getApplicationApi(name: string, peerName: string, options?: ICrossWindowApiOptions): Promise<IECommerceApi> {
		const api = await this.crossWindowFactory.getParentApi(name, peerName, options);

		return new ECommerceApi(api, options);
	}

	async getConnectorApi(window: Window, actions: IECommerceApiActions, name: string, peerName: string, options?: ICrossWindowApiOptions): Promise<IECommerceApiConnector> {
		const api = await this.crossWindowFactory.getWindowApi(window, name, peerName, options);

		return new ECommerceApiConnector(actions, api, options);
	}
	
}

export const ECommerceApiFactory = new _ECommerceApiFactory(CrossWindowApiFactory);
