import { isViewerCustomizationError, ShapeDiverResponseModelComputationStatus } from "@shapediver/viewer";
import { useContext, useMemo } from "react";
import { IEventTracking, IEventTrackingProps } from "../types/eventTracking";
import { NotificationContext } from "../context/NotificationContext";
import { TrackerContext } from "../context/TrackerContext";



/**
 * Hook for event tracking.
 * @returns 
 */
export const useEventTracking = () => {

	const notifications = useContext(NotificationContext);
	const tracker = useContext(TrackerContext);

	const eventTracking = useMemo<IEventTracking>(() => {
		return {
			onError: (e: any, context?: IEventTrackingProps) => {
				const { namespace, duration, action } = context ?? {};
				if (isViewerCustomizationError(e)) {
					let _title = namespace ? `Computation failed for session "${namespace}"` : "Computation failed";
					_title = duration ? `${_title} after ${duration} ms` : _title;
					const status = Object.values(e.errorObject.outputs).map(o => o.status_computation)
						.concat(Object.values(e.errorObject.exports).map(o => o.status_computation))
						.concat(Object.values(e.errorObject.outputs).map(o => o.status_collect))
						.concat(Object.values(e.errorObject.exports).map(o => o.status_collect))
						.find(s => s && s !== ShapeDiverResponseModelComputationStatus.SUCCESS);
					const title = status ? `${_title} (${status})` : _title;
					console.warn(title, e);
					notifications.error({title, message: e.message});
					tracker.trackEvent(`${action}_error`, { props: { namespace, duration, status } });
				} else {
					const _title = namespace ? `Error while executing changes for session "${namespace}"` : "Error while executing changes";
					const title = duration ? `${_title} after ${duration} ms` : _title;
					console.error(title, e);
					notifications.error({title, message: e.message});
					tracker.trackEvent(`${action}_error`, { props: { namespace, duration } });
				}
			},
			onSuccess: (context: IEventTrackingProps) => {
				const { action, ...props } = context;
				tracker.trackEvent(`${action}_success`, { props });
			},
		};
	}, []);

	return eventTracking;
};
