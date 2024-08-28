import {
	addListener,
	EVENTTYPE_GUMBALL,
	removeListener
} from "@shapediver/viewer";
import { GumballEventResponseMapping } from "@shapediver/viewer.features.gumball";
import { useEffect, useState } from "react";

// #region Functions (1)

/**
 * Hook allowing to create the gumball events.
 * In this event handler, the transformed nodes are updated.
 * 
 * @param selectedNodes The selected nodes.
 * @param initialTransformedNodeNames The initial transformed node names (used to initialize the selection state).
 * 					Note that this initial state is not checked against the filter pattern. 
 */
export function useGumballEvents(
	selectedNodeNames: string[],
	initialTransformedNodeNames?: { name: string, transformation: number[] }[]
): {
    /**
     * The transformed nodes.
     */
    transformedNodeNames: { name: string, transformation: number[] }[],
    /**
     * Set the transformed nodes.
     * 
     * @param nodes 
     * @returns 
     */
    setTransformedNodeNames: (nodes: { name: string, transformation: number[] }[]) => void
} {

	// state for the transformed nodes
	const [transformedNodeNames, setTransformedNodeNames] = useState<{ name: string, transformation: number[] }[]>(initialTransformedNodeNames ?? []);

	// register an event handler and listen for output updates
	useEffect(() => {
		const token = addListener(EVENTTYPE_GUMBALL.MATRIX_CHANGED, (e) => {
			const gumballEvent = e as GumballEventResponseMapping[EVENTTYPE_GUMBALL.MATRIX_CHANGED];

			// Create a new array to avoid mutating the state directly
			const newTransformedNodeNames = [...transformedNodeNames];

			for (let i = 0; i < gumballEvent.nodes.length; i++) {
				const node = gumballEvent.nodes[i];
				const transformation = gumballEvent.transformations[i];

				// search for the node in the selected nodes
				selectedNodeNames.forEach((name) => {
					const parts = name.split(".");
					if (node.getPath().endsWith(parts.slice(1).join("."))) {

						// determine if the node is already in the transformed nodes array
						// if not add it, otherwise update the transformation
						const index = newTransformedNodeNames.findIndex(tn => tn.name === name);
						if (index !== -1) {
							newTransformedNodeNames[index].transformation = Array.from(transformation);
						} else {
							newTransformedNodeNames.push({
								name: name,
								transformation: Array.from(transformation)
							});
						}
					}
				});
			}

			// Set the new array
			setTransformedNodeNames(newTransformedNodeNames);
		});

		/**
		 * Remove the event listeners when the component is unmounted.
		 */
		return () => {
			removeListener(token);
		};
	}, [selectedNodeNames]);

	return {
		transformedNodeNames,
		setTransformedNodeNames
	};
}

// #endregion Functions (1)
