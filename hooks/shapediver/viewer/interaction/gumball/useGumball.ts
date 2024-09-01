import { useCallback, useEffect, useMemo, useRef } from "react";
import { Gumball, updateGumballTransformation } from "@shapediver/viewer.features.gumball";
import { IGumballParameterProps, ISelectionParameterProps, ISessionApi, ITreeNode } from "@shapediver/viewer";
import { useShapeDiverStoreViewer } from "../../../../../store/useShapeDiverStoreViewer";
import { useSelection } from "../selection/useSelection";
import { useGumballEvents } from "./useGumballEvents";
import { mat4 } from "gl-matrix";

// #region Functions (1)

export interface IGumballState {
	/**
	 * The transformed node names.
	 */
	transformedNodeNames: {
		name: string,
		transformation: number[]
	}[],
	/**
	 * Set the transformed node names.
	 * 
	 * @param nodes 
	 * @returns 
	 */
	setTransformedNodeNames: (nodes: { name: string, transformation: number[] }[]) => void,
	/**
	 * The selected node names.
	 */
	selectedNodeNames: string[],
	/**
	 * Set the selected node names.
	 * 
	 * @param selectedNodes 
	 * @returns 
	 */
	setSelectedNodeNames: (selectedNodes: string[]) => void,
	/**
	 * Restore the transformed node names.
	 * 
	 * @param newTransformedNodeNames 
	 * @param oldTransformedNodeNames 
	 * @returns 
	 */
	restoreTransformedNodeNames: (newTransformedNodeNames: { name: string, transformation: number[] }[], oldTransformedNodeNames: { name: string, transformation: number[] }[]) => void,
}

/**
 * Hook providing stateful gumball interaction for a viewport and session.
 * This wraps lower level hooks for the selection and gumball events.
 * 
 * @param sessionId ID of the session for which the gumball shall be created.
 * @param viewportId ID of the viewport for which the gumball shall be created.
 * @param gumballProps Parameter properties to be used. This includes name filters, and properties for the behavior of the gumball.
 * @param activate Set this to true to activate the gumball. If false, preparations are made but no gumball is possible.
 * @param initialTransformedNodeNames The initial transformed node names (used to initialize the selection state).
 * 					Note that this initial state is not checked against the filter pattern.
 */
export function useGumball(
	sessionId: string, 
	viewportId: string, 
	gumballProps: IGumballParameterProps,
	activate: boolean,
	initialTransformedNodeNames?: { name: string, transformation: number[] }[]
): IGumballState {
	// get the session API
	const sessionApi = useShapeDiverStoreViewer(state => { return state.sessions[sessionId]; });
	// get the viewport API
	const viewportApi = useShapeDiverStoreViewer(state => { return state.viewports[viewportId]; });
	
	// create the selection settings from the interaction settings
	const selectionSettings = useMemo(() => {
		if (!gumballProps) return {};

		return {
			nameFilter: gumballProps.nameFilter,
			hover: gumballProps.hover,
			minimumSelection: 0,
			maximumSelection: Infinity
		} as ISelectionParameterProps;
	}, [gumballProps]);

	// use the selection hook to get the selected node names
	const { selectedNodeNames, setSelectedNodeNames } = useSelection(sessionId, viewportId, selectionSettings, activate);
	// use the gumball events hook to get the transformed node names
	const { transformedNodeNames, setTransformedNodeNames } = useGumballEvents(selectedNodeNames, initialTransformedNodeNames);

	// create a reference for the gumball
	const gumballRef = useRef<Gumball | undefined>(undefined);

	// use an effect to create the gumball whenever the selected node names change
	useEffect(() => {
		if (viewportApi) {
			// whenever the selected node names change, create a new gumball
			const nodes = getNodesByName(sessionApi, selectedNodeNames);
			const gumball = new Gumball(viewportApi, Object.values(nodes).map(n => n.node));
			gumballRef.current = gumball;
		}

		return () => {
			// clean up the select manager
			if (gumballRef.current) {
				gumballRef.current.close();
				gumballRef.current = undefined;
			}
		};
	}, [viewportApi, sessionApi, selectedNodeNames]);
	
	/**
	 * Restore the transformed node names.
	 * 
	 * This function is used to restore the transformed nodes to their new transformation state.
	 * This means that the transformation of the nodes is updated to the new transformation state.
	 * 
	 * @param newTransformedNodeNames The new transformed node names.
	 * @param oldTransformedNodeNames The old transformed node names.
	 * @returns
	 */
	const restoreTransformedNodeNames = useCallback((newTransformedNodeNames: { name: string, transformation: number[] }[], oldTransformedNodeNames: { name: string }[]) => {
		const nodes = getNodesByName(sessionApi, oldTransformedNodeNames.map(tn => tn.name));

		nodes.forEach(tn => {
			// get the new transformation matrix (if it exists)
			const newTransformation = newTransformedNodeNames.find(nt => nt.name === tn.name);
			const transformationMatrix = newTransformation ? mat4.fromValues(...(newTransformation.transformation as [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number])) : undefined;

			// update the gumball transformation
			// in case the transformation matrix is undefined, the transformation will be reset
			updateGumballTransformation(tn.node, transformationMatrix);
		});

		setTransformedNodeNames(newTransformedNodeNames);

	}, [sessionApi]);

	return {
		transformedNodeNames,
		setTransformedNodeNames,
		selectedNodeNames,
		setSelectedNodeNames,
		restoreTransformedNodeNames
	};
}

/**
 * Get the nodes within the session API by their names.
 * 
 * @param sessionApi The session API.
 * @param names The names of the nodes.
 * @returns 
 */
const getNodesByName = (sessionApi: ISessionApi, names: string[]): { name: string, node: ITreeNode }[] => {

	const nodes: { name: string, node: ITreeNode }[] = [];
	names.forEach(name => {
		const parts = name.split(".");
		const outputName = parts[0];

		const outputApi = sessionApi.getOutputByName(outputName)[0];
		if (!outputApi) return;

		outputApi.node?.traverse(n => {
			if (n.getPath().endsWith(parts.slice(1).join("."))) {
				nodes.push({
					name: name,
					node: n
				});
			}
		});
	});

	return nodes;
};

// #endregion Functions (1)
