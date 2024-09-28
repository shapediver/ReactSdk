import React from "react";
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

	return useStrictMode ? <React.StrictMode>
		<TrackerContext.Provider value={tracker ?? DummyTracker}>
			{children}
		</TrackerContext.Provider>
	</React.StrictMode> : 
		<TrackerContext.Provider value={tracker ?? DummyTracker}>
			{children}
		</TrackerContext.Provider>;
}

