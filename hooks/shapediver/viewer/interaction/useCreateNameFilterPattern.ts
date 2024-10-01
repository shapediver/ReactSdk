import { convertUserDefinedNameFilters, OutputNodeNameFilterPatterns } from "@shapediver/viewer.features.interaction";
import { useShapeDiverStoreViewer } from "../../../../store/useShapeDiverStoreViewer";
import { useState, useEffect } from "react";

// #region Functions (1)

/**
 * Hook that converts user-defined name filters to filter patterns used by interaction hooks. 
 * 
 * @param sessionId The ID of the session to create the filter pattern for. 
 * 					This is required to match output names to output IDs.
 * @param nameFilter The user-defined name filters to convert.
 */
export function useCreateNameFilterPattern(sessionId: string, nameFilter?: string[]): {
    patterns: OutputNodeNameFilterPatterns
} {
	// get the session API
	const sessionApi = useShapeDiverStoreViewer(state => { return state.sessions[sessionId]; });

	// create a state for the pattern
	const [patterns, setPatterns] = useState<OutputNodeNameFilterPatterns>({});

	useEffect(() => {
		if (nameFilter !== undefined) {
			const outputIdsToNamesMapping: { [key: string]: string } = {};
			Object.entries(sessionApi.outputs).forEach(([outputId, output]) => outputIdsToNamesMapping[outputId] = output.name);
			setPatterns(convertUserDefinedNameFilters(nameFilter, outputIdsToNamesMapping));
		}
	}, [nameFilter, sessionApi]);

	return {
		patterns
	};
}

// #endregion Functions (1)
