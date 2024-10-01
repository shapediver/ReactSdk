import { gatherNodesForPattern, NodeNameFilterPattern } from "./utils/patternUtils";
import { InteractionData, MultiSelectManager, SelectManager } from "@shapediver/viewer.features.interaction";
import { IOutputApi, ITreeNode, OutputApiData } from "@shapediver/viewer";
import { useCallback, useState } from "react";
import { useOutputNode } from "../useOutputNode";

// #region Functions (1)

/**
 * Hook for managing interaction data for the nodes of an output. 
 * Use this hook for defining which nodes are selectable, hoverable, or draggable. 
 * 
 * @see https://viewer.shapediver.com/v3/latest/api/features/interaction/interfaces/IInteractionData.html
 * 
 * Makes use of {@link useOutputNode}.
 * 
 * @param sessionId The ID of the session.
 * @param componentId The ID of the component.
 * @param outputIdOrName The ID or name of the output.
 * @param patterns The patterns for matching the node names of the given output
 * @param interactionSettings The settings for the interaction data.
 * @param selectManager The select manager to be used for selection.
 * If not provided, the selection will not be possible, but the interaction data will be added.
 * 
 * @returns 
 */
export function useNodeInteractionData(
	sessionId: string, 
	componentId: string,
	outputIdOrName: string, 
	patterns: NodeNameFilterPattern[], 
	interactionSettings: { select?: boolean, hover?: boolean, drag?: boolean },
	selectManager?: SelectManager | MultiSelectManager
): {
	/**
	 * API of the output
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html
	 */
	outputApi: IOutputApi | undefined,
	/**
	 * Scene tree node of the output
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html#node
	 */
	outputNode: ITreeNode | undefined,
	/**
	 * The available node names for the given output and patterns.
	 */
	availableNodeNames: string[]
} {

	const [availableNodeNames, setAvailableNodeNames] = useState<string[]>([]);
	
	/**
	 * Output update callback for adding interaction data. 
	 * 
	 * @param node
	 */
	const callback = useCallback((newNode?: ITreeNode, oldNode?: ITreeNode) => {		
		// remove interaction data on deregistration
		if (oldNode) {
			oldNode.traverse(node => {
				for (const data of node.data) {
					// remove existing interaction data if it is restricted to the current component
					if (data instanceof InteractionData && data.restrictedManagers.includes(componentId)) {
						if (data.interactionStates.select === true)
							selectManager?.deselect(node);
						node.removeData(data);
						node.updateVersion();
					}
				}
			});
		}

		if (newNode) {
			const outputApiData = newNode.data.find((data) => data instanceof OutputApiData) as OutputApiData;

			const availableNodes: {[nodeId: string]: { node: ITreeNode, name: string }} = {};
			for (const pattern of patterns) {
				if (pattern.length === 0) {
					availableNodes[newNode.id] = {
						node: newNode,
						name: outputApiData.api.name
					};
				} else {
					gatherNodesForPattern(newNode, pattern, outputApiData.api.name, availableNodes);
				}
			}
			Object.values(availableNodes).forEach(availableNode => {
				addInteractionData(availableNode.node, interactionSettings, componentId);
			});

			setAvailableNodeNames(Object.values(availableNodes).map(n => n.name));
		}

		// clear the available node names if the node is removed
		if(oldNode && !newNode) {
			setAvailableNodeNames([]);
		}

	}, [patterns, interactionSettings, selectManager]);

	// define the node update callback
	const { outputApi, outputNode } = useOutputNode(sessionId, outputIdOrName, callback);

	return {
		outputApi,
		outputNode,
		availableNodeNames
	};
}

/**
 * Add interaction data to the node.
 * 
 * If the node already has interaction data, the function will remove the interaction data and add the new interaction data.
 * Then the function will update the version of the node.
 * 
 * @param node 
 * @param interactionDataSettings 
 */
const addInteractionData = (node: ITreeNode, interactionDataSettings: { select?: boolean, hover?: boolean, drag?: boolean }, componentId: string) => {
	for (const data of node.data) {
		// remove existing interaction data if it is restricted to the current component
		if (data instanceof InteractionData && data.restrictedManagers.includes(componentId)) {
			console.warn(`Node ${node.id} already has interaction data with id ${data.id}, removing it.`);
			node.removeData(data);
		}
	}

	// add the interaction data to the node
	const interactionData = new InteractionData(interactionDataSettings, undefined, [componentId]);
	node.addData(interactionData);
	node.updateVersion();
};

// #endregion Functions (1)
