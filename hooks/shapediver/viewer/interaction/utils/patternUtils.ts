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
		
		// find the output Ids that match the output name
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const outputIds = Object.entries(outputIdsToNamesMapping).filter(([id, name]) => name === outputName).map(([outputId, _]) => outputId);
		
		// we iterate over the output mappings
		for(const outputId of outputIds) {
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
		const { node: outputNode, outputApi} = outputApiAndNode;

		// replace the output node path from the node path to get the path relative to the output node
		const path = node.getPath().replace(outputNode.getPath(), "");
		// check if the path matches the pattern and return the first match
		for(const pattern of patterns[outputApi.id] ?? []) {
			const match = path.match(pattern.join("."));
			if (match) return outputApi.name + "." + match[0];
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
