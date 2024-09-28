import { createContext } from "react";
import { ITrackerContext, ITrackerEventData, ITrackerEventOptions } from "../types/context/trackercontext";

export const DummyTracker: ITrackerContext = {
	trackPageview: function (eventData?: ITrackerEventData, options?: ITrackerEventOptions): void {
		console.debug("Tracking pageview", eventData, options);
	},
	trackEvent: function (eventName: string, options?: ITrackerEventOptions, eventData?: ITrackerEventData): void {
		console.debug("Tracking event", eventName, options, eventData);
	}
};

/** Information about a template. */
export const TrackerContext = createContext<ITrackerContext>(DummyTracker);

/**
 * Amend the definition of a tracker with default properties.
 * @param tracker 
 * @param defaultProps 
 * @returns 
 */
export function setDefaultTrackerProps(tracker: ITrackerContext, defaultProps: {[key: string]: any}): ITrackerContext {
	return {
		trackPageview: function (eventData?: ITrackerEventData, options?: ITrackerEventOptions): void {
			const {props = {}, callback = undefined} = options ?? {};
			tracker.trackPageview(eventData, { props: {...defaultProps, ...props}, callback});
		},
		trackEvent: function (eventName: string, options?: ITrackerEventOptions, eventData?: ITrackerEventData): void {
			const {props = {}, callback = undefined} = options ?? {};
			tracker.trackEvent(eventName, { props: {...defaultProps, ...props}, callback}, eventData);
		}
	};
}

