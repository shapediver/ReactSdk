import React from "react";
import { ITrackerContext } from "../types/context/trackercontext";
import { DummyTracker, TrackerContext } from "../context/TrackerContext";
import { ComponentContext, DummyComponent } from "shared/context/ComponentContext";
import { IComponentContext } from "shared/types/context/componentcontext";

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
	tracker?: ITrackerContext,

	/**
	 * The optional component context to use.
	 */
	componentContext?: IComponentContext
}

export default function RootComponent(props: Props) {
	const { 
		children, 
		useStrictMode = false,
		tracker,
		componentContext
	} = props;

	return useStrictMode ? <React.StrictMode>
		<TrackerContext.Provider value={tracker ?? DummyTracker}>
			<ComponentContext.Provider value={componentContext ?? DummyComponent}>
				{children}
			</ComponentContext.Provider>
		</TrackerContext.Provider>
	</React.StrictMode> : 
		<TrackerContext.Provider value={tracker ?? DummyTracker}>
			<ComponentContext.Provider value={componentContext ?? DummyComponent}>
				{children}
			</ComponentContext.Provider>
		</TrackerContext.Provider>;
}

