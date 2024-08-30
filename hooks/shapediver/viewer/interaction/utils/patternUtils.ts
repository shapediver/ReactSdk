import { ITreeNode, OutputApiData } from "@shapediver/viewer";

/**
 * Type declaration for a filter pattern used to hierarchically filter nodes of the scene tree by name.
 */
export type NodeNameFilterPattern = string[];

/**
 * Dictionary type declaration for filter patterns used to filter nodes of the scene tree by name. 
 * The dictionary keys correspond to the IDs of outputs of a ShapeDiver model. 
 * The dictionary values are arrays of patterns for hierarchical matching of node names of the output.
 * Each pattern is defined by an array of strings, which represent regular expressions 
 * that are applied to nodes of the hierarchy. 
 * 
 * Example (simplified, disregarding the regular expression syntax):
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
export type OutputNodeNameFilterPatterns = { [outputId: string]: NodeNameFilterPattern[] };

/**
 * The black list of node names that should be ignored.
 * 
 * These node names will be ignored when checking the node names.
 * These names are used in the ShapeDiver GH plugin for certain operations.
 */
const NODE_NAME_BLACKLIST = ["TransformZUpToYUp", "no_transformations"];

/**
 * Recurse the scene tree downwards starting from the given node, gather all nodes that match the pattern, 
 * and add them to the result array.
 * 
 * @param node The node to start traversing from. Typically this is the node of an output of a ShapeDiver model.
 * @param pattern The hierarchical pattern to check for. 
 *                Each string of the pattern represents a regular expression for matching the node name.
 * @param result The result object, matching nodes will be added here. 
 * @param count The current index into the pattern array.
 */
export const gatherNodesForPattern = (
	node: ITreeNode, 
	pattern: NodeNameFilterPattern, 
	result: { [nodeId: string]: ITreeNode }, 
	count: number = 0
): void => {
	// if the node has no original name (was not given a name in Grasshopper) or 
	// its name matches the black list, do not consider it for pattern matching
	if (!node.originalName || NODE_NAME_BLACKLIST.includes(node.originalName)) {
		for (const child of node.children) {
			gatherNodesForPattern(child, pattern, result, count);
		}
	}
	// if the original name matches the pattern, check the children
	else if (node.originalName && new RegExp(`^${pattern[count]}$`).test(node.originalName)) {
		if (count === pattern.length - 1) {
			// we reached the end of the pattern, add the node to the result
			result[node.id] = node;
		} else {
			for (const child of node.children) {
				gatherNodesForPattern(child, pattern, result, count + 1);
			}
		}
	}
};

/**
 * Convert the user-defined name-filters to filter patterns as used by useNodeInteractionData. 
 * 
 * The name filter is an array of dot-separated strings. 
 * Each string represents a pattern to hierarchically match node names.
 * The first part of the pattern is the output name.
 * The rest of the pattern correspond to hierarchical node names, which may contain the "*"
 * character as a wildcard to match any node name or any part of the node name. 
 * 
 * @param nameFilter The user-defined name filters to convert.
 * @param outputIdsToNamesMapping A mapping of output IDs to output names for the session to be used.
 * 
 * @returns The filter pattern object to be used with useNodeInteractionData, useSelection, and other interaction hooks.
 */
export const convertUserDefinedNameFilters = (
	nameFilter: string[], 
	outputIdsToNamesMapping: { [key: string]: string }
): OutputNodeNameFilterPatterns => {

	const patterns: OutputNodeNameFilterPatterns = {};

	// we iterate over the name filter array
	// we store the result with the output ID as the key and an array of patterns as the value
	for (let i = 0; i < nameFilter.length; i++) {
		const parts = nameFilter[i].split(".");
		const outputName = parts[0];

		// replace the "*" with ".*" to create a regex pattern
		const outputNameRegex = new RegExp(`^${outputName.replace(/\*/g, ".*")}$`);
		// find the IDs of outputs whose names match
		const outputIds = Object.entries(outputIdsToNamesMapping).filter(([, name]) => outputNameRegex.test(name)).map(([id]) => id);

		// create a regex pattern from the other parts of the array
		// replace all "*" with ".*"
		const patternArray = parts.slice(1).map(part => part.replace(/\*/g, ".*"));

		// we iterate over the output mappings
		for (const outputId of outputIds) {
			// store the pattern in the pattern object
			if (!patterns[outputId]) patterns[outputId] = [];
			patterns[outputId].push(patternArray);
		}
	}

	return patterns;
};

/**
 * Traverse the node hierarchy upwards to find the node that corresponds to an output 
 * of the ShapeDiver model. 
 * Return the node itself, the corresponding output id and name, and the original names 
 * concatenated using dots.
 * 
 * @param node The node to start the upwards traversal from.
 * @returns
 */
export const getNodeData = (node: ITreeNode): {
	outputId: string,
	outputName: string, 
	originalName: string
} | undefined => {

	const names: string[] = [];
	let tempNode = node;
	while (tempNode && tempNode.parent) {
		if (tempNode.originalName && !NODE_NAME_BLACKLIST.includes(tempNode.originalName))
			names.push(tempNode.originalName);
		// look for the output API data in the node
		const data = tempNode.data.find((data) => data instanceof OutputApiData) as OutputApiData | undefined;
		if (data) {
			const api = data.api;
			
			return {
				outputId: api.id,
				outputName: api.name,
				originalName: names.reverse().join(".")
			};
		}
		tempNode = tempNode.parent;
	}
};

/**
 * Try to match the given node with the patterns. 
 * In case of a match, return the concatenated name of the node as required 
 * for setting values of interaction parameters.
 * 
 * @param patterns 
 * @param node 
 * @returns 
 */
const matchNodeWithPatterns = (patterns: OutputNodeNameFilterPatterns, node: ITreeNode): string | undefined => {
	const nodeData = getNodeData(node);
	if (!nodeData) return;
	const { outputId, outputName, originalName } = nodeData;

	// check if the path matches the pattern and return the first match
	for (const pattern of patterns[outputId] ?? []) {
		if (pattern.length === 0) {
			// special case, just the output name was provided
			return outputName;
		} else {
			// create a regex pattern from the pattern array, match the original name
			const match = originalName.match(`^${pattern.join("\\.")}$`);
			if (match) 
				return outputName + "." + match[0];
		}
	}
};

/**
 * Try to match the given nodes with the patterns. 
 * For matching nodes, return the concatenated names of the nodes as required 
 * for setting values of interaction parameters.
 * 
 * @param patterns The patterns to match the node names.
 * @param nodes The nodes to process.
 * @returns The concatenated names of the nodes that match the pattern.
 */
export const matchNodesWithPatterns = (patterns: OutputNodeNameFilterPatterns, nodes: ITreeNode[]): string[] => {
	
	// we iterate over the nodes and get the output and node names
	const nodeNames: string[] = [];
	nodes.forEach((node) => {
		const result = matchNodeWithPatterns(patterns, node);
		if (result)
			nodeNames.push(result);
	});

	return nodeNames;
};
