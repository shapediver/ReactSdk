import { ShapeDiverResponseExport } from "@shapediver/api.geometry-api-dto-v2";
import { ISessionApi } from "@shapediver/viewer";
import { IShapeDiverExport } from "../shapediver/export";
import { IShapeDiverParameter, IShapeDiverParameterDefinition } from "../shapediver/parameter";
import { StoreApi, UseBoundStore } from "zustand";

/** A store for an individual parameter. */
export type IParameterStore = UseBoundStore<StoreApi<IShapeDiverParameter<any>>>;

/** A map from parameter id to parameter store. */
export type IParameterStores = { [parameterId: string]: IParameterStore }

/** A map from session id to parameter stores per parameter id. */
export type IParameterStoresPerSession = { [sessionId: string]: IParameterStores };

/** A store for an individual export. */
export type IExportStore = UseBoundStore<StoreApi<IShapeDiverExport>>;

/** A map from export id to export store. */
export type IExportStores = { [exportId: string]: IExportStore }

/** A map from session id to export stores per export id. */
export type IExportStoresPerSession = { [sessionId: string]: IExportStores };

/** A map from session id to default export ids (ids of exports that will be requested with every computation). */
export type IDefaultExportsPerSession = { [sessionId: string]: string[] };

/** A map from export id to export response. Used for responses of default exports. */
export type IExportResponse = { [exportId: string]: ShapeDiverResponseExport };

/** A map from session id to export responses per export id. */
export type IExportResponsesPerSession = { [sessionId: string]: IExportResponse };

/** The parameter values for a single session at the time of the history entry. */
export type ISingleSessionHistoryState = { [parameterId: string]: any };

/** The parameter values for multiple sessions at the time of the history entry. */
export type ISessionsHistoryState = { [sessionId: string]: ISingleSessionHistoryState };

/** A state in the history for arbitrary sessions. */
export interface IHistoryEntry {
	/** The parameter values per session at the time of the history entry. */
	state: ISessionsHistoryState;
	/** The time of the history entry (return value of Date.now()). */
	time: number;
}

/**
 * Pending parameter changes (waiting to be executed).
 */
export interface IParameterChanges {
	/** The parameter values to change */
	values: { [parameterId: string]: any };
	/** 
	 * Promise allowing to wait for pending changes.
	 * The returned values are the ones that have been executed, 
	 * which might differ from the values that have been set, 
	 * because they might have been overridden by a pre-execution hook.
	 */
	wait: Promise<{ [parameterId: string]: any }>;
	/** Accept the changes, this resolves wait */
	accept: (
		/** If true, skip the creation of a history entry after successful execution. */
		skipHistory?: boolean
	) => Promise<void>;
	/** Reject the changes, this rejects wait */
	reject: () => void;
	/** True if changes are currently being executed */
	executing: boolean;
	/** 
	 * Priority of pending changes. 
	 * This is used to determine the order of accepting changes in case 
	 * of multiple pending change objects.
	 */
	priority: number;
}

export interface IParameterChangesPerSession { [sessionId: string]: IParameterChanges}

/**
 * Definition of a generic parameter, which is not necessarily implemented by a parameter of a ShapeDiver model. 
 * @see {@link IGenericParameterExecutor}
 * @see {@link IShapeDiverStoreParameters}
 */
export interface IGenericParameterDefinition {

	/** The static definition of the parameter. */
	readonly definition: IShapeDiverParameterDefinition,

	/** 
	 * The value to set for the generic parameter. Use this to update
	 * the parameter's current value (i.e. its state) without changing the 
	 * parameter definition. 
	 * In case no value is defined when creating a new generic parameter, 
	 * the new parameter's value is set to the default value defined in the 
	 * parameter definition.
	 */
	readonly value?: string;

	/**
     * Evaluates if a given value is valid for this parameter.
     *
     * @param value the value to evaluate
     * @param throwError if true, an error is thrown if validation does not pass (default: false)
     */
    readonly isValid?: (value: any, throwError?: boolean) => boolean;

	/**
	 * Stringify the given value according to the parameter definition.
	 */
	readonly stringify?: (value: any) => string;
}

/**
 * Executor function for generic parameters. 
 * @see {@link IGenericParameterDefinition}
 */
export type IGenericParameterExecutor = (
	/**
	 * Key-value pairs of parameter value changes 
	 * that should be executed. 
	 * In case of executors for sessions, this typically does not 
	 * include all parameters defined by the session. 
	 */
	values: { [key: string]: any },
	/** The session id. */
	sessionId: string,
	/** If true, skip the creation of a history entry after successful execution. */
	skipHistory?: boolean,
) => Promise<unknown|void>;

/**
 * Hook to be executed before executor. 
 * This can be used to override or retrieve parameter values immediately before execution.
 */
export type IPreExecutionHook = (values: { [key: string]: any }, sessionId: string) => Promise<{ [key: string]: any }>;

/**
 * Executor function override per session.
 */
export interface IPreExecutionHookPerSession { [sessionId: string]: IPreExecutionHook}

/**
 * Selector for deciding whether a parameter should use accept/reject mode or immediate execution.
 */
export type IAcceptRejectModeSelector = (param: IShapeDiverParameterDefinition) => boolean;

/**
 * Interface for the store of parameters and exports. 
 * The parameters and exports managed by this store are abstractions of the 
 * parameters and exports defined by a ShapeDiver 3D Viewer session. 
 * It is easy to plug all parameters and exports defined by one or multiple sessions 
 * into this store. 
 * The abstraction provided by this store also allows to define parameters which
 * are not directly linked to a session. 
 */
export interface IShapeDiverStoreParameters {
	/**
	 * Parameter stores.
	 */
	readonly parameterStores: IParameterStoresPerSession;

	/**
	 * Export stores.
	 */
	readonly exportStores: IExportStoresPerSession;

	/**
	 * Pending parameter changes.
	 */
	readonly parameterChanges: IParameterChangesPerSession;

	/**
	 * Default exports.
	 */
	readonly defaultExports: IDefaultExportsPerSession;

	/**
	 * Responses to default exports.
	 */
	readonly defaultExportResponses: IExportResponsesPerSession;

	/**
	 * Pre-execution hooks per session.
	 */
	readonly preExecutionHooks: IPreExecutionHookPerSession;

	/**
	 * History of parameter values.
	 */
	readonly history: IHistoryEntry[];

	/**
	 * Index of the current history entry.
	 * If the history is empty, the index is -1.
	 */
	readonly historyIndex: number;

	/**
	 * Add parameter and export stores for all parameters and exports of the session.
	 * CAUTION: Repeated calls will be ignored. Use removeSession to remove a session first before 
	 * calling addSession again for the same session.
	 * @param session
	 * @param acceptRejectMode If true, changes are not executed immediately. May be specified as a boolean or a function of the parameter definition.
	 * @param token Token (JWT) that was used when creating the session. If provided, it will be used for export downloads. Optional.
	 * @returns
	 */
	readonly addSession: (session: ISessionApi, acceptRejectMode: boolean | IAcceptRejectModeSelector, token?: string) => void,

	/**
	 * Add generic parameters. 
	 * CAUTION: Repeated calls will be ignored. Use removeSession to remove a session first before 
	 * calling addSession again for the same session.
	 * @param sessionId The namespace to use.
	 * @param acceptRejectMode If true, changes are not executed immediately. May be specified as a boolean or a function of the parameter definition.
	 * @param definitions Definitions of the parameters.
	 * @param executor Executor of parameter changes.
	 * @returns 
	 */
	readonly addGeneric: (
		sessionId: string, 
		acceptRejectMode: boolean | IAcceptRejectModeSelector, 
		definitions: IGenericParameterDefinition | IGenericParameterDefinition[], 
		executor: IGenericParameterExecutor
	) => void,

	/**
	 * Synchronize (add/remove) generic parameters for a given session id. 
	 * @param sessionId The namespace to use.
	 * @param acceptRejectMode If true, changes are not executed immediately. May be specified as a boolean or a function of the parameter definition.
	 * @param definitions Definitions of the parameters.
	 * @param executor Executor of parameter changes.
	 * @returns 
	 */
	readonly syncGeneric: (
		sessionId: string, 
		acceptRejectMode: boolean | IAcceptRejectModeSelector, 
		definitions: IGenericParameterDefinition | IGenericParameterDefinition[], 
		executor: IGenericParameterExecutor
	) => void,

	/**
	 * Remove parameter and exports stores for all parameters and exports of the session.
	 * @param sessionId
	 * @param parameters
	 * @returns
	 */
	readonly removeSession: (sessionId: string) => void,

	/**
	 * Get all parameter stores for a given session id.
	 * @param sessionId
	 * @returns
	 */
	readonly getParameters: (sessionId: string) => IParameterStores;

	/**
	 * Get a single parameter store by parameter id or name.
	 * @param sessionId
	 * @param paramId
	 * @param type Optional. If provided, the parameter store is only returned if the parameter has the given type.
	 * @returns
	 */
	readonly getParameter: (sessionId: string, paramId: string, type?: string) => IParameterStore | undefined;

	/**
	 * Get all export stores for a given session id.
	 * @param sessionId
	 * @returns
	 */
	readonly getExports: (sessionId: string) => IExportStores;

	/**
	 * Get a single export store by export id or name.
	 * @param sessionId
	 * @param exportId
	 * @returns
	 */
	readonly getExport: (sessionId: string, exportId: string) => IExportStore | undefined;

	/**
	 * Get or add pending parameter changes for a given session id.
	 * @param sessionId 
	 * @param executor 
	 * @param priority 
	 * @param preExecutionHook 
	 * @returns 
	 */
	readonly getChanges: (
		sessionId: string, 
		executor: IGenericParameterExecutor, 
		priority: number,
		preExecutionHook?: IPreExecutionHook
	) => IParameterChanges,

	/**
	 * Remove pending parameter changes for a given session id.
	 * @param sessionId 
	 * @returns 
	 */
	readonly removeChanges: (sessionId: string) => void,

	/**
	 * Register a default export for a given session id. The given export
	 * will always be included when running computations.
	 * @param sessionId 
	 * @param exportId 
	 * @returns 
	 */
	readonly registerDefaultExport: (sessionId: string, exportId: string | string[]) => void,

	/**
	 * Deregister a default export for a given session id.
	 * @param sessionId 
	 * @param exportId 
	 * @returns 
	 */
	readonly deregisterDefaultExport: (sessionId: string, exportId: string | string[]) => void,

	/**
	 * Register a pre-execution hook for a session id.
	 * @param sessionId 
	 * @param hook 
	 * @returns 
	 */
	readonly setPreExecutionHook: (sessionId: string, hook: IPreExecutionHook) => void,

	/**
	 * Remove a pre-execution hook for a session id.
	 * @param sessionId 
	 * @returns 
	 */
	readonly removePreExecutionHook: (sessionId: string) => void,

	/**
	 * Set the values of multiple parameters of a session at once, 
	 * execute and await the changes immediately.
	 * @param sessionId 
	 * @param values 
	 * @param skipHistory If true, skip the creation of a history entry after successful execution.
	 * @returns 
	 */
	readonly batchParameterValueUpdate: (sessionId: string, values: { [parameterId: string]: any }, skipHistory?: boolean) => Promise<void>,

	/** 
	 * Push a state of parameter values to the history at the current index.
	 * In case the history index is not at the end of the history,
	 * all history entries after the current index are removed.
	 */
	readonly pushHistoryState: (state: ISessionsHistoryState) => IHistoryEntry,

	/**
	 * Restore the state of parameter values from the given history state. 
	 * In case the history index is not at the end of the history,
	 * all history entries after the current index are removed.
	 * @param state 
	 * @returns 
	 */
	readonly restoreHistoryState: (state: ISessionsHistoryState, skipHistory?: boolean) => Promise<void>,

	/**
	 * Restore the state of parameter values from the history at the given index.
	 * @param index 
	 * @returns 
	 */
	readonly restoreHistoryStateFromIndex: (index: number) => Promise<void>,

	/**
	 * Restore the state of parameter values from the history at the given timestamp.
	 * Throws an error if the timestamp is not found in the history.
	 * @param time 
	 * @returns 
	 */
	readonly restoreHistoryStateFromTimestamp: (time: number) => Promise<void>,

	/**
	 * Restore the state of parameter values from the given history entry.
	 * Tries to restore by timestamp, in case this fails, tries to restore by 
	 * matching parameter values to entries in the history, in case this fails 
	 * restores the state of the entry directly.
	 * @param entry 
	 * @returns 
	 */
	readonly restoreHistoryStateFromEntry: (entry: IHistoryEntry) => Promise<void>,
}
