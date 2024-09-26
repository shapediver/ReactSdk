import React from "react";
import reportWebVitals from "reportWebVitals";
import { ITrackerContext } from "../types/context/trackercontext";
import { DummyTracker, TrackerContext } from "../context/TrackerContext";

interface Props {

	children: React.ReactNode;

	/** 
	 * Note: Activate strict mode during development to detect potential bugs.
	 * @see https://react.dev/reference/react/StrictMode
	 */
	useStrictMode?: boolean

	/**
	 * The optional tracker to use.
	 */
	tracker?: ITrackerContext
}

export default function RootComponent(props: Props) {
	const { 
		children, 
		useStrictMode = false,
		tracker
	} = props;

	tracker?.trackPageview();

	return useStrictMode ? <React.StrictMode>
		<TrackerContext.Provider value={tracker ?? DummyTracker}>
			{children}
		</TrackerContext.Provider>
	</React.StrictMode> : 
		<TrackerContext.Provider value={tracker ?? DummyTracker}>
			{children}
		</TrackerContext.Provider>;
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(r => console.debug("reportWebVitals", r));
