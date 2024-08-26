import { gatherNodesForPattern, NodeNameFilterPattern } from "./utils/patternUtils";
import { InteractionData, MultiSelectManager, SelectManager } from "@shapediver/viewer.features.interaction";
import { IOutputApi, ITreeNode } from "@shapediver/viewer";
import { useCallback } from "react";
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
	outputNode: ITreeNode | undefined
} {
	
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
					if (data instanceof InteractionData) {
						if (data.interactionStates.select === true)
							selectManager?.deselect(node);
						node.removeData(data);
						node.updateVersion();
					}
				}
			});
		}

		if (newNode) {
			const nodes: {[nodeId: string]: ITreeNode} = {};
			for (const pattern of patterns) {
				if (pattern.length === 0) {
					nodes[newNode.id] = newNode;
				} else {
					gatherNodesForPattern(newNode, pattern, nodes);
				}
			}
			Object.values(nodes).forEach(node => {
				addInteractionData(node, interactionSettings);
			});
		}

	}, [patterns, interactionSettings, selectManager]);

	// define the node update callback
	const { outputApi, outputNode } = useOutputNode(sessionId, outputIdOrName, callback);

	return {
		outputApi,
		outputNode
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
const addInteractionData = (node: ITreeNode, interactionDataSettings: { select?: boolean, hover?: boolean, drag?: boolean }) => {
	
	// remove existing interaction data
	// TODO to be discussed how to improve this and allow parallel interaction data
	for (const data of node.data) {
		if (data instanceof InteractionData) {
			console.warn(`Node ${node.id} already has interaction data with id ${data.id}, removing it.`);
			node.removeData(data);
		}
	}

	// add the interaction data to the node
	const interactionData = new InteractionData(interactionDataSettings);
	node.addData(interactionData);
	node.updateVersion();
};

// #endregion Functions (1)
