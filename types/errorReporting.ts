
/**
 * Context object for exception reporting.
 */
export interface IErrorReportingContext {
    /** Namespace (of parameters and exports) */
	namespace: string
}

/**
 * Interface for exception reporting.
 */
export interface IErrorReporting {
	onError: (error: any, context?: IErrorReportingContext) => void;
}
