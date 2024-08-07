import { notifications } from "@mantine/notifications";
import { IInteractionParameterSettings, ISessionApi, ITreeNode, OutputApiData } from "@shapediver/viewer";

/**
 * Process the nameFilter and update the pattern.
 * 
 * @param sessionApi The session API used to get output IDs by name.
 * @param settings The settings object containing nameFilter.
 * @returns The pattern object with updated patterns.
 */
export const processPattern = (sessionApi: ISessionApi, settings?: IInteractionParameterSettings): { [key: string]: string[][] } => {
	const pattern: {
		[key: string]: string[][];
	} = {};

	let nameFilter: string[] = [];

	if (settings && settings.props.nameFilter !== undefined) {
		if (typeof settings.props.nameFilter === "string") {
			if ((settings.props.nameFilter as string).startsWith("[") && (settings.props.nameFilter as string).endsWith("]") && (settings.props.nameFilter as string) !== "[]") {
				try {
					nameFilter = JSON.parse(settings.props.nameFilter) as string[];
				} catch (e) {
					notifications.show({
						title: "Invalid Name Filter",
						message: "The name filter is not a valid JSON array."
					});
				}
			} else {
				nameFilter = [settings.props.nameFilter];
			}
		} else if (Array.isArray(settings.props.nameFilter)) {
			nameFilter = settings.props.nameFilter;
		}

		for (let i = 0; i < nameFilter.length; i++) {
			const parts = nameFilter[i].split(".");
			const outputName = parts[0];
			const outputId = sessionApi.getOutputByName(outputName)[0].id;

			// create a regex pattern from the other parts of the array
			// replace all "*" with ".*"
			const patternArray = parts.slice(1).map(part => part.replace(/\*/g, ".*"));

			if (!pattern[outputId]) pattern[outputId] = [];
			pattern[outputId].push(patternArray);
		}
	}

	return pattern;
};

/**
 * Create a response object with the names of the nodes that match the patterns.
 * 
 * @param patterns The patterns object.
 * @param nodes The nodes to check.
 * @returns The response object which contains the names of the nodes that match the patterns.
 */
export const processNodes = (patterns?: { [key: string]: string[][] }, nodes?: ITreeNode[]): { names: string[] } => {
	const getOutputAndPathFromNode = (node: ITreeNode): string | undefined => {
		let tempNode = node;
		while (tempNode && tempNode.parent) {
			const outputApiData = tempNode.data.find((data) => data instanceof OutputApiData) as OutputApiData | undefined;
			if (outputApiData) {
				const path = node.getPath().replace(tempNode.getPath(), "");
				const p = patterns?.[outputApiData.api.id];

				if (p) {
					for (const pattern of p) {
						const match = path.match(pattern.join("."));
						if (match)
							return outputApiData.api.name + "." + match[0];
					}
				}
			}
			tempNode = tempNode.parent;
		}
	};

	const response: { names: string[] } = { names: [], };

	if (nodes) {
		nodes.map((node) => {
			const result = getOutputAndPathFromNode(node);
			if (result)
				response.names.push(result);
		});
	}

	return response;
};
