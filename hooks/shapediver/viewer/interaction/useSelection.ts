import { IInteractionParameterSettings, isInteractionSelectionParameterSettings, ITreeNode, OutputApiData } from "@shapediver/viewer";
import { InteractionData } from "@shapediver/viewer.features.interaction";
import { useCallback, useMemo } from "react";
import { vec3 } from "gl-matrix";
import { useSelectManagerEvents } from "./useSelectManagerEvents";
import { useSelectManager } from "./useSelectManager";
import { useHoverManager } from "./useHoverManager";
import { useCreateNameFilterPattern } from "./useCreateNameFilterPattern";
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

	// check if the settings are selection settings
	const selectionSettings = isInteractionSelectionParameterSettings(settings) ? settings.props : undefined;
	// create the hover settings
	const hoverSettings = useMemo(() => { 
		return settings ? { color: settings?.props.hoverColor } : undefined; 
	}, [settings]);

	// call the select manager hook
	const { selectManager } = useSelectManager(viewportId, selectionSettings);
	// call the hover manager hook
	useHoverManager(viewportId, hoverSettings);

	// call the process pattern hook
	const { pattern } = useCreateNameFilterPattern(sessionId, settings?.props.nameFilter);
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
		if (selectManager && settings) {
			// deselect all nodes
			node.traverse(n => {
				const interactionData = n.data.find(d => d instanceof InteractionData) as InteractionData;
				if (interactionData)
					selectManager?.deselect(n);
			});

			// select the nodes based on the selected node names
			if (selectedNodeNames) {
				selectedNodeNames.forEach((nodeName, i) => {
					const parts = nodeName.split(".");

					// check if the node name matches the pattern
					const outputApi = node.data.find(d => d instanceof OutputApiData) as OutputApiData;
					if (!outputApi) return;
					if (outputApi.api.name !== parts[0]) return;

					// if the node name matches the pattern, select the node
					node.traverse(n => {
						if (n.getPath().endsWith(parts.slice(1).join("."))) {
							const interactionData = n.data.find(d => d instanceof InteractionData) as InteractionData;
							if (interactionData) 
								selectManager?.select({ distance: i, point: vec3.create(), node: n });
						}
					});
				});
			}
		}
	}, [selectedNodeNames, selectManager, settings]);

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
