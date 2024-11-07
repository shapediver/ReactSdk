import { isViewerCustomizationError } from "@shapediver/viewer";
import { useContext, useMemo } from "react";
import { IErrorReporting, IErrorReportingContext } from "../types/errorReporting";
import { NotificationContext } from "../context/NotificationContext";

/**
 * Hook for exception reporting.
 * @returns 
 */
export const useErrorReporting = () => {

	const notifications = useContext(NotificationContext);

	const errorReporting = useMemo<IErrorReporting>(() => {
		return {
			onError: (e: any, context?: IErrorReportingContext) => {
				const namespace = context?.namespace;
				if (isViewerCustomizationError(e)) {
					const title = namespace ? `Computation failed for session "${namespace}"` : "Computation failed";
					console.warn(title, e);
					notifications?.error({title, message: e.message});
				} else {
					const title = namespace ? `Error while executing changes for session "${namespace}"` : "Error while executing changes";
					console.error(title, e);
					notifications?.error({title, message: e.message});
				}
			}
		};
	}, []);

	return errorReporting;
};
