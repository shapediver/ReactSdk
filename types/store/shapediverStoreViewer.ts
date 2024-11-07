import { ISessionApi, IViewportApi, SessionCreationDefinition, ViewportCreationDefinition } from "@shapediver/viewer";
import { IErrorReporting } from "../errorReporting";

/**
 * Redeclaration of SessionCreationDefinition to always have an id.
 */
export interface SessionCreateDto extends SessionCreationDefinition {
	id: string,
}

/**
 * Redeclaration of ViewportCreationDefinition to always have an id.
 */
export interface ViewportCreateDto extends ViewportCreationDefinition {
	showStatistics?: boolean,
}

export interface IShapeDiverStoreViewerSessions {
	[sessionId: string]: ISessionApi;
}

export interface IShapeDiverStoreViewerViewports {
	[viewportId: string]: IViewportApi;
}

/**
 * Callbacks related to IShapeDiverStoreViewer.
 */
export type IShapeDiverStoreViewerCallbacks = IErrorReporting;

/**
 * Interface for the store of viewer-related data.
 */
export interface IShapeDiverStoreViewer {

	/**
	 * Viewports currently known by the store.
	 */
	viewports: IShapeDiverStoreViewerViewports

	/**
	 * Create a viewport and add it to the store.
	 * @param dto
	 * @returns
	 */
	createViewport: (
		dto: ViewportCreateDto,
		callbacks?: IShapeDiverStoreViewerCallbacks
	) => Promise<IViewportApi | undefined>;

	/**
	 * Close a viewport and remove it from the store.
	 */
	closeViewport: (
		viewportId: string,
		callbacks?: IShapeDiverStoreViewerCallbacks
	) => Promise<void>;

	/**
	 * Sessions currently known by the store.
	 */
	sessions: IShapeDiverStoreViewerSessions

	/**
	 * Create a session and add it to the store.
	 * @param dto
	 * @param callbacks
	 * @returns
	 */
	createSession: (
		dto: SessionCreateDto,
		callbacks?: IShapeDiverStoreViewerCallbacks
	) => Promise<ISessionApi | undefined>;

	/**
	 * Close a session and remove it from the store.
	 */
	closeSession: (
		sessionId: string,
		callbacks?: IShapeDiverStoreViewerCallbacks
	) => Promise<void>;

	/**
	 * Synchronize the sessions with the given dtos, create and close sessions as required.
	 * @param sessionsDtos
	 * @param callbacks
	 * @returns
	 */
	syncSessions: (
		sessionDtos: SessionCreateDto[], 
		callbacks?: IShapeDiverStoreViewerCallbacks
	) => Promise<(ISessionApi | undefined)[]>,
}
