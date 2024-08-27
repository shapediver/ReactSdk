import { useEffect, useMemo, useRef } from "react";
import { Gumball } from "@shapediver/viewer.features.gumball";
import { IInteractionParameterSettings, ISelectionParameterSettings, isInteractionGumballParameterSettings, ITreeNode } from "@shapediver/viewer";
import { useShapeDiverStoreViewer } from "shared/store/useShapeDiverStoreViewer";
import { useSelection } from "../selection/useSelection";
import { useGumballEvents } from "./useGumballEvents";

// #region Functions (1)

/**
 * Hook allowing to create the interaction engine and the managers that are specified via the settings.
 * 
 * @param viewportId 
 */
export function useGumball(sessionId: string, viewportId: string, settings?: IInteractionParameterSettings): {
	transformedNodes: {
		name: string,
		transformation: number[]
	}[],
	setTransformedNodes: (nodes: { name: string, transformation: number[] }[]) => void,
	selectedNodes: { name: string, node: ITreeNode }[],
	setSelectedNodes: (selectedNodes: { name: string, node: ITreeNode }[]) => void
} {
	// get the viewport API
	const viewportApi = useShapeDiverStoreViewer(state => { return state.viewports[viewportId]; });
	// check if the settings are gumball settings
	const gumballSettings = isInteractionGumballParameterSettings(settings) ? settings : undefined;
	// create the selection settings from the interaction settings
	const selectionSettings = useMemo(() => {
		if (!gumballSettings) return undefined;

		return {
			type: "selection",
			props: {
				nameFilter: gumballSettings?.props.nameFilter,
				hover: gumballSettings?.props.hover,
				minimumSelection: 0,
				maximumSelection: Infinity
			} as ISelectionParameterSettings
		} as IInteractionParameterSettings;
	}, [gumballSettings]);

	// get the selected nodes
	const { selectedNodes, setSelectedNodes } = useSelection(sessionId, viewportId, selectionSettings);
	// create a reference for the gumball
	const gumballRef = useRef<Gumball | undefined>(undefined);

	// use an effect to apply changes to the material, and to apply the callback once the node is available
	useEffect(() => {
		if (viewportApi && gumballSettings) {
			// whenever this output node changes, we want to create the interaction engine
			const gumball = new Gumball(viewportApi, Object.values(selectedNodes).map(n => n.node));
			gumballRef.current = gumball;
		}

		return () => {
			// clean up the select manager
			if (gumballRef.current) {
				gumballRef.current.close();
				gumballRef.current = undefined;
			}
		};
	}, [viewportApi, gumballSettings, selectedNodes]);

	const { transformedNodes, setTransformedNodes } = useGumballEvents(selectedNodes);

	return {
		transformedNodes: transformedNodes,
		setTransformedNodes: setTransformedNodes,
		selectedNodes: selectedNodes,
		setSelectedNodes: setSelectedNodes
	};
}

// #endregion Functions (1)
