import { ISelectionParameterProps, ITreeNode, OutputApiData } from "@shapediver/viewer";
import { InteractionData, MultiSelectManager, SelectManager } from "@shapediver/viewer.features.interaction";
import { useEffect, useMemo } from "react";
import { vec3 } from "gl-matrix";
import { ISelectionState, useSelectManagerEvents } from "./useSelectManagerEvents";
import { useSelectManager } from "./useSelectManager";
import { useHoverManager } from "./useHoverManager";
import { useCreateNameFilterPattern } from "./useCreateNameFilterPattern";
import { useShapeDiverStoreViewer } from "../../../../store/useShapeDiverStoreViewer";
import { useNodeInteractionData } from "./useNodeInteractionData";

// #region Functions (1)

/**
 * Hook providing stateful object selection for a viewport and session. 
 * This wraps lover level hooks for the select manager, hover manager, and node interaction data.
 * 
 * @param sessionId ID of the session for which objects shall be selected.
 * @param viewportId ID of the viewport for which selection shall be enabled. 
 * @param selectionProps Parameter properties to be used. This includes name filters, and properties for the behavior of the selection.
 * @param activate Set this to true to activate selection. If false, preparations are made but no selection is possible.
 * @param initialSelectedNodeNames The initial selected node names (used to initialize the selection state).
 * 					Note that this initial state is not checked against the filter pattern. 
 */
export function useSelection(
	sessionId: string, 
	viewportId: string, 
	selectionProps: ISelectionParameterProps,
	activate: boolean,
	initialSelectedNodeNames?: string[]
): ISelectionState {
	
	// call the select manager hook
	const { selectManager } = useSelectManager(viewportId, activate ? selectionProps : undefined);

	// call the hover manager hook
	const hoverSettings = useMemo(() => { return { hoverColor: selectionProps.hoverColor }; }, [selectionProps]);
	useHoverManager(viewportId, activate ? hoverSettings : undefined);
	
	// convert the user-defined name filters to filter patterns, and subscribe to selection events
	const { patterns } = useCreateNameFilterPattern(sessionId, selectionProps.nameFilter);
	const { selectedNodeNames, setSelectedNodeNames, resetSelectedNodeNames } = useSelectManagerEvents(patterns, initialSelectedNodeNames);

	// add interaction data for each output, even if it is not in the pattern
	// this is necessary to keep the number of hooks constant
	// TODO to work around this, we would need a hook similar to useOutputUpdateCallback, 
	// but for all outputs (or the session), e.g. useSessionOutputsUpdateCallback
	const interactionSettings = useMemo(
		() => { return { select: true, hover: selectionProps.hover }; },
		[selectionProps]
	);
	const outputs = useShapeDiverStoreViewer(state => { return state.sessions[sessionId].outputs; });
	for (const outputId in outputs) {
		// add interaction data
		if (!patterns[outputId]) patterns[outputId] = [];
		const { outputNode } = useNodeInteractionData(sessionId, outputId, patterns[outputId], interactionSettings);
		// in case selection becomes active or the output node changes, restore the selection status
		useEffect(() => {
			if (outputNode && selectManager) 
				restoreSelection(outputNode, selectManager, selectedNodeNames);
		}, [outputNode, selectManager]);
	}

	return {
		selectedNodeNames,
		/** 
		 * TODO we might extend setSelectedNodeNames and resetSelectedNodeNames 
		 * and call restoreSelection. Given the current implementation of 
		 * ParameterSelectionComponent, this is not necessary.
		 */
		setSelectedNodeNames, 
		resetSelectedNodeNames 
	};
}

/**
 * Restore selection status
 * @param node 
 * @param mgr 
 * @param selectedNodeNames 
 * @returns 
 */
const restoreSelection = (node: ITreeNode, mgr: SelectManager | MultiSelectManager, selectedNodeNames: string[]) => {
	
	// the node must have an OutputApiData object
	const apiData = node.data.find(d => d instanceof OutputApiData) as OutputApiData;
	if (!apiData) return;

	// deselect all child nodes FIXME do we really need to do this?
	node.traverse(n => {
		const interactionData = n.data.find(d => d instanceof InteractionData) as InteractionData;
		if (interactionData && interactionData.interactionStates.select === true)
			mgr.deselect(n);
	});

	// select child nodes based on selectedNodeNames
	selectedNodeNames.forEach((name) => {
	
		const parts = name.split(".");
		if (apiData.api.name !== parts[0]) return;

		if (parts.length === 1) {
			// special case if only the output name is given
			const interactionData = node.data.find(d => d instanceof InteractionData) as InteractionData;
			if (interactionData) 
				mgr.select({ distance: 1, point: vec3.create(), node: node });
		} else {
			// if the node name matches the pattern, select the node
			node.traverse(n => {
				if (n.getPath().endsWith(parts.slice(1).join("."))) {
					const interactionData = n.data.find(d => d instanceof InteractionData) as InteractionData;
					if (interactionData)
						mgr.select({ distance: 1, point: vec3.create(), node: n });
				}
			});
		}
	});
};

// #endregion Functions (1)
