import { gatherNodesForPattern, NodeNameFilterPattern } from "@shapediver/viewer.features.interaction";
import { ITreeNode, OutputApiData } from "@shapediver/viewer";
import { useCallback, useState } from "react";
import { useOutputNode } from "../useOutputNode";

// #region Functions (1)

/**
 * Hook for finding nodes in the scene tree that match the given patterns.
 * 
 * Makes use of {@link useOutputNode}.
 * 
 * @param patterns The patterns for matching the node names of the given output
 * 
 * @returns 
 */
export function useFindNodesByPattern(
	sessionId: string,
	outputIdOrName: string,
	patterns: NodeNameFilterPattern[]
): {
    /**
     * The available nodes for the given output and patterns.
     */
    nodes: ITreeNode[]
} {
	const [nodes, setNodes] = useState<ITreeNode[]>([]);

	/**
     * Output update callback for gathering the nodes. 
     * 
     * @param node
     */
	const callback = useCallback((newNode?: ITreeNode, oldNode?: ITreeNode) => {
		if (oldNode && !newNode) {
			// clear the available node names if the node is removed
			setNodes([]);
		} else if (newNode) {
			const outputApiData = newNode.data.find((data) => data instanceof OutputApiData) as OutputApiData;

			const availableNodes: { [nodeId: string]: { node: ITreeNode, name: string } } = {};
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
	
			setNodes(Object.values(availableNodes).map(n => n.node));
		}

	}, [patterns]);

	// define the node update callback
	useOutputNode(sessionId, outputIdOrName, callback);

	return {
		nodes
	};
}

// #endregion Functions (1)