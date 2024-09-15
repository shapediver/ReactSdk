import { ShapeDiverResponseExport } from "@shapediver/api.geometry-api-dto-v2";
import { ISessionApi } from "@shapediver/viewer";
import { IShapeDiverExport } from "../shapediver/export";
import { IShapeDiverParameter, IShapeDiverParameterDefinition } from "../shapediver/parameter";
import { StoreApi, UseBoundStore } from "zustand";

export type IParameterStore = UseBoundStore<StoreApi<IShapeDiverParameter<any>>>;

export type IParameterStores = { [parameterId: string]: IParameterStore }

export type IParameterStoresPerSession = { [sessionId: string]: IParameterStores };

export type IExportStore = UseBoundStore<StoreApi<IShapeDiverExport>>;

export type IExportStores = { [parameterId: string]: IExportStore }

export type IExportStoresPerSession = { [sessionId: string]: IExportStores };

export type IDefaultExportsPerSession = { [sessionId: string]: string[] };

export type IExportResponse = { [exportId: string]: ShapeDiverResponseExport };

export type IExportResponsesPerSession = { [sessionId: string]: IExportResponse };

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
	accept: () => Promise<void>;
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
	values: { [key: string]: any }, sessionId: string
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
	 * @returns
	 */
	readonly getParameter: (sessionId: string, paramId: string) => IParameterStore | undefined;

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
}
