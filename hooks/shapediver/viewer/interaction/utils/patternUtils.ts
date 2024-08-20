import { IOutputApi, ITreeNode, OutputApiData } from "@shapediver/viewer";

/**
 * The type for the name filter pattern.
 * 
 * This is an object where the key is the output ID.
 * The value is an array of the patterns to match the node names (which is an array of strings).
 * 
 * The matching is done by checking if the node name matches the pattern. This can be on any level of the node hierarchy.
 * 
 * Example:
 * ```json
 * {
 *    "OUTPUT_ID": [
 * 	 	["Node_a", "Node_b"], // matches nodes with the name "Node_a.Node_b" in the output with the ID "OUTPUT_ID"
 * 	 	["Node_a", "Node_c"], // matches nodes with the name "Node_a.Node_c" in the output with the ID "OUTPUT_ID"
 * 	 	["Node_a", "Node_d", "Node_e"] // matches nodes with the name "Node_a.Node_d.Node_e" in the output with the ID "OUTPUT_ID"
 *   ]
 * }
 * 
 */
export type NameFilterPattern = { [key: string]: string[][] };

/**
 * The black list of node names that should be ignored.
 * 
 * These node names will be ignored when checking the node names.
 * These names are used in the ShapeDiver GH plugin for certain operations.
 */
const nodeNameBlackList = ["TransformZUpToYUp", "no_transformations"];

/**
 * Check if the node matches the pattern and add interaction data if it does.
 * 
 * For each pattern, the scene tree is traversed to find the nodes that match the pattern.
 * We check hierarchically if the node names match the pattern parts.
 * If a node (and it's parents) match the full pattern, we add the interaction data to the node.
 * 
 * @param node The node to check.
 * @param pattern The pattern to check.
 * @param count The current count of the pattern.
 * @param result The result array. 
 */
export const gatherNodesForPattern = (node: ITreeNode, pattern: string[], count: number, result: ITreeNode[] = []): void => {
	// if there is no original name or the node name is in the black list, ignore the node
	if (!node.originalName || nodeNameBlackList.includes(node.originalName)) {
		for (const child of node.children) {
			gatherNodesForPattern(child, pattern, 0, result);
		}
	}
	// if the original name matches the pattern, check the children
	else if (node.originalName && new RegExp(`^${pattern[count]}$`).test(node.originalName)) {
		if (count === pattern.length - 1) {
			result.push(node);
		} else {
			for (const child of node.children) {
				gatherNodesForPattern(child, pattern, count + 1, result);
			}
		}
	}
};

/**
 * Process the nameFilter and update the pattern.
 * 
 * The name filter is an array of strings where each string is a pattern to match the node names.
 * The first part of the pattern is the output name.
 * The rest of the pattern are the node names separated by a dot.
 * The node names can contain "*" as a wildcard to match any node name or any part of the node name.
 * 
 * @param nameFilter The name filter to process.
 * @param outputIdsToNamesMapping The mapping of the output IDs to the output names.
 * @returns The pattern object with updated patterns.
 */
export const processPattern = (nameFilter: string[], outputIdsToNamesMapping: { [key: string]: string }): NameFilterPattern => {
	const pattern: {
		[key: string]: string[][];
	} = {};

	// we iterate over the name filter array
	// we store the result with the output ID as the key and an array of patterns as the value
	for (let i = 0; i < nameFilter.length; i++) {
		const parts = nameFilter[i].split(".");
		const outputName = parts[0];

		// replace the "*" with ".*" to create a regex pattern
		const outputNameRegex = new RegExp(`^${outputName.replace(/\*/g, ".*")}$`);
		// find the output Ids that match the output name
		const outputIds = Object.entries(outputIdsToNamesMapping).filter(([, name]) => outputNameRegex.test(name)).map(([id]) => id);

		// we iterate over the output mappings
		for (const outputId of outputIds) {
			// create a regex pattern from the other parts of the array
			// replace all "*" with ".*"
			const patternArray = parts.slice(1).map(part => part.replace(/\*/g, ".*"));

			// store the pattern in the pattern object
			if (!pattern[outputId]) pattern[outputId] = [];
			pattern[outputId].push(patternArray);
		}
	}

	return pattern;
};

/**
 * Traverse the node hierarchy up to find the output API data.
 * Return the node that contains the output API data and the output API.
 * 
 * @param node The node to start the search from.
 * @returns The node that contains the output API data and the output API.
 */
const findOutputApiAndNode = (node: ITreeNode): {
	node: ITreeNode,
	outputApi: IOutputApi
} | undefined => {
	let tempNode = node;
	while (tempNode && tempNode.parent) {
		// find the output API data in the node
		const outputApiData = tempNode.data.find((data) => data instanceof OutputApiData) as OutputApiData | undefined;
		if (outputApiData) {
			return {
				node: tempNode,
				outputApi: outputApiData.api
			};
		}
		tempNode = tempNode.parent;
	}
};

/**
 * Get the original names of the node hierarchy.
 * 
 * We traverse the parent nodes and get the original names of the nodes.
 * We ignore the names that are in the black list.
 * 
 * @param node The node to start the search from.
 * @returns The original names of the node hierarchy.
 */
const getOriginalNames = (node: ITreeNode): string[] => {
	const names: string[] = [];
	let tempNode: ITreeNode | undefined = node;
	while (tempNode) {
		if (!tempNode.originalName) break;
		if (!nodeNameBlackList.includes(tempNode.originalName))
			names.push(tempNode.originalName);
		tempNode = tempNode.parent;
	}

	return names.reverse();
};

/**
 * Process the nodes and return the names that match the pattern.
 * 
 * For each node, we traverse the parent nodes until we find the output API data.
 * We then check if the path of the node matches the pattern.
 * 
 * 
 * 
 * @param patterns The pattern to match the node names.
 * @param nodes The nodes to process.
 * @returns The names of the nodes that match the pattern.
 */
export const processNodes = (patterns: NameFilterPattern = {}, nodes: ITreeNode[] = []): string[] => {
	/**
	 * Get the output and the node name from the node.
	 * First, we find the output API and the node that contains the output API data.
	 * Then we check if the path of the node matches the pattern.
	 * 
	 * @param node 
	 * @returns 
	 */
	const getOutputAndNodeNameFromNode = (node: ITreeNode): string | undefined => {
		const outputApiAndNode = findOutputApiAndNode(node);
		if (!outputApiAndNode) return;
		const { outputApi } = outputApiAndNode;

		// create an array of the names of the node hierarchy, only consisting of original names
		const originalNames = getOriginalNames(node);

		// check if the path matches the pattern and return the first match
		for (const pattern of patterns[outputApi.id] ?? []) {
			if(pattern.length === 0) {
				// special case, just the output name was provided
				return outputApi.name;
			} else {
				// create a regex pattern from the pattern array, join the array with dot
				const match = originalNames.join(".").match(pattern.join("\\."));
				if (match) return outputApi.name + "." + match[0];
			}
		}
	};

	// we iterate over the nodes and get the output and node names
	const nodeNames: string[] = [];
	nodes.forEach((node) => {
		const result = getOutputAndNodeNameFromNode(node);
		if (result)
			nodeNames.push(result);
	});

	return nodeNames;
};
