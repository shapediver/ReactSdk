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
