import { IInteractionParameterSettings, isInteractionSelectionParameterSettings, ITreeNode, OutputApiData } from "@shapediver/viewer";
import { InteractionData } from "@shapediver/viewer.features.interaction";
import { useCallback } from "react";
import { vec3 } from "gl-matrix";
import { useSelectManagerEvents } from "./useSelectManagerEvents";
import { useSelectManager } from "./useSelectManager";
import { useHoverManager } from "./useHoverManager";
import { useProcessPattern } from "./useProcessPattern";
import { useShapeDiverStoreViewer } from "shared/store/useShapeDiverStoreViewer";
import { useNodeInteractionData } from "./useNodeInteractionData";

// #region Functions (1)

/**
 * Hook allowing to create a selection manager for a viewport.
 * 
 * @param viewportId 
 */
export function useSelection(sessionId: string, viewportId: string, settings?: IInteractionParameterSettings): {
	/**
	 * The selected node names.
	 */
    selectedNodes: string[],
	/**
	 * Callback function to reset the selected node names.
	 * 
	 * @returns 
	 */
    resetSelectedNodeNames: () => void
} {
	// get the session API
	const sessionApi = useShapeDiverStoreViewer(state => { return state.sessions[sessionId]; });

	// call the select manager hook and save the result into a single manager
	const { selectManager: single, multiSelectManager: multi } = useSelectManager(viewportId, settings);

	// call the hover manager hook
	useHoverManager(viewportId, settings?.props.hover ? settings : undefined);

	// call the process pattern hook
	const { pattern } = useProcessPattern(sessionId, settings);

	// check if the settings are selection settings
	const selectionSettings = isInteractionSelectionParameterSettings(settings) ? settings : undefined;

	// call the select manager events hook
	const { selectedNodeNames, resetSelectedNodeNames } = useSelectManagerEvents(pattern);

	/**
	 * Callback function for the node interaction.
	 * Allows to select nodes based on the selected node names.
	 * Deselects all nodes before selecting the new ones.
	 * 
	 * @param node
	 */
	const callback = useCallback((node?: ITreeNode) => {
		if (!node) return;
		if ((single || multi) && settings) {
			node.traverse(n => {
				const interactionData = n.data.find(d => d instanceof InteractionData) as InteractionData;
				if (interactionData)
					(single || multi)?.deselect(n);
			});

			if (selectedNodeNames) {
				selectedNodeNames.forEach((nodeName, i) => {
					const parts = nodeName.split(".");

					const outputApi = node.data.find(d => d instanceof OutputApiData) as OutputApiData;
					if (!outputApi) return;
					if (outputApi.api.name !== parts[0]) return;

					node.traverse(n => {
						if (n.getPath().endsWith(parts.slice(1).join("."))) {
							const interactionData = n.data.find(d => d instanceof InteractionData) as InteractionData;
							if (interactionData) 
								(single || multi)?.select({ distance: i, point: vec3.create(), node: n });
						}
					});
				});
			}
		}
	}, [selectedNodeNames, single, multi, settings]);

	// add interaction data for each output, even if it is not in the pattern
	// this is necessary to keep the number of hooks constant
	for (const outputId in sessionApi.outputs) {
		if (!pattern[outputId]) pattern[outputId] = [];
		useNodeInteractionData(sessionId, outputId, pattern[outputId], { select: !!selectionSettings, hover: settings?.props.hover}, callback);
	}

	return {
		selectedNodes: selectedNodeNames,
		resetSelectedNodeNames
	};
}

// #endregion Functions (1)
