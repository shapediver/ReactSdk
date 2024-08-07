import { useShapeDiverStoreViewer } from "shared/store/useShapeDiverStoreViewer";
import { processPattern } from "./utils/patternUtils";
import { IInteractionParameterSettings } from "@shapediver/viewer";
import { useState, useEffect } from "react";

// #region Functions (1)

/**
 * Hook that processes a pattern for a session.
 * 
 * @param viewportId 
 */
export function useProcessPattern(sessionId: string, settings?: IInteractionParameterSettings): {
    pattern: {
        [key: string]: string[][];
    }
} {
	// get the session API
	const sessionApi = useShapeDiverStoreViewer(state => { return state.sessions[sessionId]; });

	// create a state for the pattern
	const [pattern, setPattern] = useState<{ [key: string]: string[][]; }>({});

	useEffect(() => {
		if (settings && settings.props.nameFilter !== undefined) {
			setPattern(processPattern(sessionApi, settings));
		}
	}, [settings]);

	return {
		pattern
	};
}

// #endregion Functions (1)
