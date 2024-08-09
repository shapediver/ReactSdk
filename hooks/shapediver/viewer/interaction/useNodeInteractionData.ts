import { GeometryData, IOutputApi, ITreeNode } from "@shapediver/viewer";
import { useCallback, useEffect } from "react";
import { IInteractionData, InteractionData } from "@shapediver/viewer.features.interaction";
import { useOutputNode } from "../useOutputNode";

/**
 * Dictionary to store the nodes with interaction data.
 * 
 * We need to store the nodes with interaction data to be able to remove the interaction data when the hook is unmounted.
 */
const nodesWithInteractionData: { [key: string]: { node: ITreeNode, data: IInteractionData } } = {};

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
export function useNodeInteractionData(sessionId: string, outputIdOrName: string, patterns?: string[][], interactionSettings?: { select?: boolean, hover?: boolean, drag?: boolean }, additionalUpdateCallback?: (newNode?: ITreeNode, oldNode?: ITreeNode) => Promise<void> | void) : {
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
		if(!node) return;
		/**
		 * Check if the node matches the pattern and add interaction data if it does.
		 * 
		 * For each pattern, the function will check if the node name matches the pattern.
		 * If the node name matches the pattern, the function will check the children of the node.
		 * Only if the node name matches the last pattern, the interaction data will be added.
		 * 
		 * @param node The node to check.
		 * @param pattern The pattern to check.
		 * @param count The current count of the pattern.
		 * @param result The result array. 
		 */
		const checkNode = (node: ITreeNode, pattern: string[], count: number, result: ITreeNode[] = []): void => {
			if(new RegExp(`^${pattern[count]}$`).test(node.name)) {
				if(count === pattern.length - 1) result.push(node);

				for(const child of node.children) {
					checkNode(child, pattern, count === pattern.length - 1 ? 0 : count + 1, result);
				}
			} else {
				for(const child of node.children) {
					checkNode(child, pattern, 0, result);
				}
			}
		};

		/**
		 * Add interaction data to the node.
		 * 
		 * If the node already has interaction data, the function will remove the interaction data and add the new interaction data.
		 * Then the function will update the version of the node.
		 * 
		 * @param node 
		 * @param interactionDataSettings 
		 */
		const addInteractionData = (node: ITreeNode, interactionDataSettings: { select?: boolean, hover?: boolean, drag?: boolean}) => {
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
				// special case: if there is only one pattern and it is allows anything, we enable selection on the lowest level
				if(pattern.length === 1 && pattern[0] === ".*") {
					node.traverse(node => {
						if (node.data.some(data => data instanceof GeometryData)) {
							addInteractionData(node, interactionSettings);
						}
					});
				} else {
					const nodes: ITreeNode[] = [];
					checkNode(node, pattern, 0, nodes);
					nodes.forEach(node => {
						addInteractionData(node, interactionSettings);
					});
				}
			}
		}

		// call the additional update callback
		if(additionalUpdateCallback)
			additionalUpdateCallback(node);
	}, [patterns, interactionSettings, additionalUpdateCallback] );
	

	// define the node update callback
	const { outputApi, outputNode } = useOutputNode(sessionId, outputIdOrName, callback);

	useEffect(() => {
		// call the callback with the output node
		callback(outputNode);

		return () => {
			// remove the interaction data from the nodes
			for(const id in nodesWithInteractionData) {
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
