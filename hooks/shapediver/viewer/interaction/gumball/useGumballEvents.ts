import {
	addListener,
	EVENTTYPE_GUMBALL,
	ITreeNode,
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
 */
export function useGumballEvents(selectedNodes: { name: string, node: ITreeNode }[]): {
    /**
     * The transformed nodes.
     */
    transformedNodes: { name: string, transformation: number[] }[],
    /**
     * Set the transformed nodes.
     * 
     * @param nodes 
     * @returns 
     */
    setTransformedNodes: (nodes: { name: string, transformation: number[] }[]) => void
} {
	const [transformedNodes, setTransformedNodes] = useState<{ name: string, transformation: number[] }[]>([]);

	// register an event handler and listen for output updates
	useEffect(() => {
		const token = addListener(EVENTTYPE_GUMBALL.MATRIX_CHANGED, (e) => {
			const gumballEvent = e as GumballEventResponseMapping[EVENTTYPE_GUMBALL.MATRIX_CHANGED];

			// Create a new array to avoid mutating the state directly
			const newTransformedNodes = [...transformedNodes];

			for (let i = 0; i < gumballEvent.nodes.length; i++) {
				const node = gumballEvent.nodes[i];
				const transformation = gumballEvent.transformations[i];

				// search for the node in the selected nodes
				selectedNodes.forEach((value) => {
					if (value.node === node) {

						// determine if the node is already in the transformed nodes array
						// if not add it, otherwise update the transformation
						const index = newTransformedNodes.findIndex(tn => tn.name === value.name);
						if (index !== -1) {
							newTransformedNodes[index].transformation = Array.from(transformation);
						} else {
							newTransformedNodes.push({
								name: value.name,
								transformation: Array.from(transformation)
							});
						}
					}
				});
			}

			// Set the new array
			setTransformedNodes(newTransformedNodes);

		});

		return () => {
			removeListener(token);
		};
	}, [selectedNodes, transformedNodes]);

	return {
		transformedNodes,
		setTransformedNodes
	};
}

// #endregion Functions (1)
