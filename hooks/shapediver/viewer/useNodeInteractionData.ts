import { GeometryData, IOutputApi, ITreeNode } from "@shapediver/viewer";
import { useCallback, useEffect, useRef } from "react";
import { IInteractionData, InteractionData } from "@shapediver/viewer.features.interaction";
import { useOutputNode } from "./useOutputNode";

const nodesWithInteractionData: { [key: string]: { node: ITreeNode, data: IInteractionData } } = {};

/**
 * Hook adding interaction data to the nodes of an output.
 * 
 * @see https://viewer.shapediver.com/v3/latest/api/features/interaction/interfaces/IInteractionData.html
 * 
 * Makes use of {@link useOutputNode}.
 * 
 * @param sessionId 
 * @param outputIdOrName 
 * @param patterns
 * @param interactionSettings
 * @param groupNodes
 * 
 * @returns 
 */
export function useNodeInteractionData(sessionId: string, outputIdOrName: string, patterns?: { [key: string]: string }, interactionSettings?: { select?: boolean, hover?: boolean, drag?: boolean }, groupNodes?: boolean) : {
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
	const interactionSettingsRef = useRef<{ select: boolean, hover: boolean, drag: boolean } | null>(null);

	/**
	 * Add interaction data to a node.
	 * 
	 * @param node 
	 * @param groupId 
	 * @returns 
	 */
	const addInteractionData = (node: ITreeNode, groupId?: string) => {
		if (nodesWithInteractionData[node.id]) {
			nodesWithInteractionData[node.id].node.removeData(nodesWithInteractionData[node.id].data);
			delete nodesWithInteractionData[node.id];
		}

		if(!interactionSettingsRef.current) return;

		const interactionData = new InteractionData({
			select: interactionSettingsRef.current.select,
			hover: interactionSettingsRef.current.hover,
			drag: interactionSettingsRef.current.drag
		}, groupId);
		node.addData(interactionData);
		node.updateVersion();
		nodesWithInteractionData[node.id] = {node, data: interactionData};
	};

	/**
	 * Callback function to add interaction data to the nodes of the output.
	 * 
	 * @param node
	 */
	const callback = useCallback((node?: ITreeNode) => {
		if(!node) return;

		if (outputApi && patterns && patterns[outputApi.name]) {
			const pattern = patterns[outputApi.name];
			const nodes = node.getNodesByNameWithRegex(new RegExp(pattern));

			if(groupNodes) {
				// create a dictionary of nodes with the name of the node as key
				const nodeDictionary = nodes.reduce((acc, node) => {
					if(!acc[node.name]) {
						acc[node.name] = [node];
					} else {
						acc[node.name].push(node);
					}

					return acc;
				}, {} as { [key: string]: ITreeNode[] });

				for(const name in nodeDictionary) {
					nodeDictionary[name].forEach(node => {
						addInteractionData(node, name);
					});
				}
			} else {
				nodes.forEach(node => {
					addInteractionData(node);
				});
			}
		} else {
			node.traverse(node => {
				if (node.data.some(data => data instanceof GeometryData)) {
					addInteractionData(node);
				}
			});
		}
	}, [patterns] );

	// define the node update callback
	const { outputApi, outputNode } = useOutputNode(sessionId, outputIdOrName, callback);
	
	useEffect(() => {
		if (interactionSettings) {
			interactionSettingsRef.current = {
				select: interactionSettings.select || false,
				hover: interactionSettings.hover || false,
				drag: interactionSettings.drag || false
			};
		}
		else {
			interactionSettingsRef.current = null;
		}

		callback(outputNode);


		return () => {
			for(const id in nodesWithInteractionData) {
				const { node, data } = nodesWithInteractionData[id];
				node.removeData(data);
				node.updateVersion();
			}
			// clear the dictionary
			Object.keys(nodesWithInteractionData).forEach(key => delete nodesWithInteractionData[key]);
		};
		
	}, [interactionSettings, patterns]);

	return {
		outputApi,
		outputNode
	};
}
