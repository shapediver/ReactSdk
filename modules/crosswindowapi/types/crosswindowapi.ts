
export interface ICrossWindowCancelable {
    cancel: () => void;
}

/**
 * Info about a peer window.
 */
export interface ICrossWindowPeerInfo {
	/** The peer window. */
	readonly window?: Window | null
	/** Origin of the peer window. */
	readonly origin: string
	/** Name of the peer window. */
	readonly name: string
}

/**
 * Interface for an API that can be used to communicate between browser windows. 
 * Typically this is used to communicate between an iframe and its parent window.
 */
export interface ICrossWindowApi {

	/**
	 * Name identifying the instance.
	 */
	readonly name: string

	/**
	 * Name identifying the instance of the API in the peer window 
	 * which we are communicating with.
	 */
	readonly peerName: string

	/**
	 * Sends a message to the peer window.
	 * @param type 
	 * @param data 
	 * @param timeout 
	 */
	send<Trequest extends object | undefined, Tresponse>(type: string, data: Trequest, timeout?: number): Promise<Tresponse>

	/**
	 * Register a handler for a message type.
	 * @param type 
	 * @param handler 
	 */
	on<Trequest, Tresponse>(type: string, handler: (data: Trequest) => Promise<Tresponse>): ICrossWindowCancelable

	/**
	 * Register a one-time handler for a message type.
	 * @param type 
	 * @param handler 
	 */
	once<Trequest, Tresponse>(type: string, handler: (data: Trequest) => Promise<Tresponse>): Promise<Trequest>

	/**
	 * Resolved once the peer is ready.
	 * Rejected if the peer does not respond within the timeout.
	 * Not defined if the peer was not awaited for.
	 */
	readonly peerIsReady: Promise<ICrossWindowPeerInfo>
}


/**
 * Factory for creating a cross window API.
 */
export interface ICrossWindowFactory {

	/**
	 * Creates an API for communicating with the parent window.
	 */
	getParentApi(name: string, peerName: string, timeout?: number): Promise<ICrossWindowApi>

	/**
	 * Creates an API for communicating with the given peer window.
	 * @param window 
	 */
	getWindowApi(window: Window, name: string, peerName: string, timeout?: number): Promise<ICrossWindowApi>

}
