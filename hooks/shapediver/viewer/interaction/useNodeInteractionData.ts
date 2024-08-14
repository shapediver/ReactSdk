import { gatherNodesForPattern } from "./utils/patternUtils";
import { IInteractionData, InteractionData } from "@shapediver/viewer.features.interaction";
import { IOutputApi, ITreeNode } from "@shapediver/viewer";
import { useCallback, useEffect } from "react";
import { useOutputNode } from "../useOutputNode";

// #region Functions (1)

/**
 * Hook adding interaction data to the nodes of an output.
 * 
 * @see https://viewer.shapediver.com/v3/latest/api/features/interaction/interfaces/IInteractionData.html
 * 
 * Makes use of {@link useOutputNode}.
 * 
 * @param sessionId The ID of the session.
 * @param outputIdOrName The ID or name of the output.
 * @param patterns The patterns to match the node names.
 * @param interactionSettings The settings for the interaction data.
 * @param additionalUpdateCallback Additional callback function to update the nodes.
 * 
 * @returns 
 */
export function useNodeInteractionData(sessionId: string, outputIdOrName: string, patterns?: string[][], interactionSettings?: { select?: boolean, hover?: boolean, drag?: boolean }, additionalUpdateCallback?: (newNode?: ITreeNode, oldNode?: ITreeNode) => Promise<void> | void): {
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
	 * Callback function to add interaction data to the nodes of the output.
	 * 
	 * @param node
	 */
	const callback = useCallback((node?: ITreeNode) => {
		if (!node) return;

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
			// remove the interaction data if it already exists
			if (nodesWithInteractionData[node.id]) {
				nodesWithInteractionData[node.id].node.removeData(nodesWithInteractionData[node.id].data);
				delete nodesWithInteractionData[node.id];
			}

			// add the interaction data to the node
			const interactionData = new InteractionData(interactionDataSettings);
			node.addData(interactionData);
			node.updateVersion();
			nodesWithInteractionData[node.id] = { node, data: interactionData };
		};

		// if there are patterns, begin the check
		if (patterns && interactionSettings) {
			for (const pattern of patterns) {
				const nodes: ITreeNode[] = [];
				gatherNodesForPattern(node, pattern, 0, nodes);
				nodes.forEach(node => {
					addInteractionData(node, interactionSettings);
				});
			}
		}

		// call the additional update callback
		if (additionalUpdateCallback)
			additionalUpdateCallback(node);
	}, [patterns, interactionSettings, additionalUpdateCallback]);

	// define the node update callback
	const { outputApi, outputNode } = useOutputNode(sessionId, outputIdOrName, callback);

	useEffect(() => {
		// call the callback with the output node
		callback(outputNode);

		return () => {
			// remove the interaction data from the nodes
			for (const id in nodesWithInteractionData) {
				const { node, data } = nodesWithInteractionData[id];
				node.removeData(data);
				node.updateVersion();
			}
			// clear the dictionary
			Object.keys(nodesWithInteractionData).forEach(key => delete nodesWithInteractionData[key]);
		};

	}, [patterns, interactionSettings, additionalUpdateCallback, callback, outputNode]);

	return {
		outputApi,
		outputNode
	};
}

// #endregion Functions (1)

// #region Variables (1)

/**
 * Dictionary to store the nodes with interaction data.
 * 
 * We need to store the nodes with interaction data to be able to remove the interaction data when the hook is unmounted.
 */
const nodesWithInteractionData: { [key: string]: { node: ITreeNode, data: IInteractionData } } = {};

// #endregion Variables (1)
