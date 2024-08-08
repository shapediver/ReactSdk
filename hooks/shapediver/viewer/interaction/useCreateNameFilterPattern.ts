import { useShapeDiverStoreViewer } from "shared/store/useShapeDiverStoreViewer";
import { NameFilterPattern, processPattern } from "./utils/patternUtils";
import { useState, useEffect } from "react";

// #region Functions (1)

/**
 * Hook that processes a pattern for a session.
 * 
 * @param sessionId The ID of the session.
 * @param nameFilter The name filter to apply to the pattern.
 */
export function useCreateNameFilterPattern(sessionId: string, nameFilter?: string[]): {
    pattern: NameFilterPattern
} {
	// get the session API
	const sessionApi = useShapeDiverStoreViewer(state => { return state.sessions[sessionId]; });

	// create a state for the pattern
	const [pattern, setPattern] = useState<NameFilterPattern>({});

	useEffect(() => {
		if (nameFilter !== undefined) {
			const outputIdsToNamesMapping: { [key: string]: string } = {};
			Object.entries(sessionApi.outputs).forEach(([outputId, output]) => outputIdsToNamesMapping[outputId] = output.name);
			setPattern(processPattern(nameFilter, outputIdsToNamesMapping));
		}
	}, [nameFilter, sessionApi]);

	return {
		pattern
	};
}

// #endregion Functions (1)
