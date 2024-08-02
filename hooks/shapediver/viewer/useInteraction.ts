import { useEffect, useRef, useState } from "react";
import { useShapeDiverStoreViewer } from "../../../store/useShapeDiverStoreViewer";
import { HoverManager, InteractionData, InteractionEngine, InteractionEventResponseMapping, MultiSelectManager, SelectManager } from "@shapediver/viewer.features.interaction";
import { addListener, EVENTTYPE_INTERACTION, IEvent, ITreeNode, MaterialStandardData, OutputApiData, removeListener } from "@shapediver/viewer";
import { vec3 } from "gl-matrix";
import { IInteractionParameterDefinition, isInteractionSelectionParameterDefinition } from "shared/types/shapediver/appbuilderinteractiontypes";
import { notifications } from "@mantine/notifications";
import { useNodeInteractionData } from "./useNodeInteractionData";

// #region Functions (1)

/**
 * Hook allowing to create the interaction engine and the managers that are specified via the settings.
 * 
 * @param viewportId 
 */
export function useInteraction(sessionId: string, viewportId: string, settings?: IInteractionParameterDefinition): {
	interactionEngine?: InteractionEngine,
	selectManager?: SelectManager,
	multiSelectManager?: MultiSelectManager,
	hoverManager?: HoverManager,
	responseObject: string | undefined
} {
	// get the viewport API
	const viewportApi = useShapeDiverStoreViewer(state => { return state.viewports[viewportId]; });
	// get the session API
	const sessionApi = useShapeDiverStoreViewer(state => { return state.sessions[sessionId]; });

	// create a state for the interaction engine
	const [interactionEngine, setInteractionEngine] = useState<InteractionEngine | undefined>(undefined);
	// create a reference for the interaction engine
	const interactionEngineRef = useRef<InteractionEngine | undefined>(undefined);

	// create a state for the select manager
	const [selectManager, setSelectManager] = useState<SelectManager | undefined>(undefined);
	// create a reference for the select manager
	const selectManagerRef = useRef<SelectManager | undefined>(undefined);

	// create a state for the multi select manager
	const [multiSelectManager, setMultiSelectManager] = useState<MultiSelectManager | undefined>(undefined);
	// create a reference for the multi select manager
	const multiSelectManagerRef = useRef<MultiSelectManager | undefined>(undefined);

	// create a state for the hover manager
	const [hoverManager, setHoverManager] = useState<HoverManager | undefined>(undefined);
	// create a reference for the hover manager
	const hoverManagerRef = useRef<HoverManager | undefined>(undefined);

	// state for the selected nodes
	const [selectedNodes, setSelectedNodes] = useState<ITreeNode[]>([]);
	const responseObjectRef = useRef<string | undefined>(undefined);

	const patternRef = useRef<{
		[key: string]: string[][];
	}>({});

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
		}

		patternRef.current = {};

		for (let i = 0; i < nameFilter.length; i++) {
			const parts = nameFilter[i].split(".");
			const outputName = parts[0];
			const outputId = sessionApi.getOutputByName(outputName)[0].id;

			// create a regex pattern from the other parts of the array
			// replace all "*" with ".*"
			const patternArray = parts.slice(1).map(part => part.replace(/\*/g, ".*"));

			if (!patternRef.current[outputId]) patternRef.current[outputId] = [];
			patternRef.current[outputId].push(patternArray);
		}
	} else {
		patternRef.current = {};
	}

	const selection = isInteractionSelectionParameterDefinition(settings) ? settings : undefined;

	for (const outputId in sessionApi.outputs) {
		if (!patternRef.current[outputId]) patternRef.current[outputId] = [];
		useNodeInteractionData(sessionId, outputId, patternRef.current[outputId], { select: !!selection, hover: settings?.props.hover });
	}

	// TODO move this to separate file and only activate when needed
	// register an event handler and listen for output updates
	useEffect(() => {
		/**
		 * Event handler for the select on event.
		 * In this event handler, the response object is created and the parameter is updated.
		 */
		const tokenSelectOn = addListener(EVENTTYPE_INTERACTION.SELECT_ON, async (event: IEvent) => {
			const selectEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.SELECT_ON];

			// don't send the customization if the event is coming from an API call
			if (!selectEvent.event) return;

			const selected = [selectEvent.node];
			setSelectedNodes(selected);

			responseObjectRef.current = createResponseObject(patternRef.current, selected);
		});

		/**
		 * Event handler for the select off event.
		 * In this event handler, the response object is created and the parameter is updated.
		 */
		const tokenSelectOff = addListener(EVENTTYPE_INTERACTION.SELECT_OFF, async (event: IEvent) => {
			const selectEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.SELECT_OFF];

			// don't send the event if it is a reselection
			if (selectEvent.reselection) return;
			// don't send the customization if the event is coming from an API call
			if (!selectEvent.event) return;

			const selected: ITreeNode[] = [];
			setSelectedNodes(selected);

			responseObjectRef.current = createResponseObject(patternRef.current);
		});

		/**
		 * Event handler for the multi select on event.
		 * In this event handler, the response object is created and the parameter is updated.
		 */
		const tokenMultiSelectOn = addListener(EVENTTYPE_INTERACTION.MULTI_SELECT_ON, async (event: IEvent) => {
			const multiSelectEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.MULTI_SELECT_ON];

			// don't send the customization if the event is coming from an API call
			if (!multiSelectEvent.event) return;

			const selected = selectedNodes;
			selected.push(multiSelectEvent.node);
			setSelectedNodes(selected);

			if (multiSelectEvent.nodes.length < (multiSelectEvent.manager as MultiSelectManager).minimumNodes) {
				notifications.show({
					title: "Minimum Number of Nodes not reached",
					message: `Expected ${(multiSelectEvent.manager as MultiSelectManager).minimumNodes} nodes, got ${multiSelectEvent.nodes.length} nodes.`
				});

				return;
			}

			responseObjectRef.current = createResponseObject(patternRef.current, selected);
		});

		/**
		 * Event handler for the multi select off event.
		 * In this event handler, the response object is created and the parameter is updated.
		 */
		const tokenMultiSelectOff = addListener(EVENTTYPE_INTERACTION.MULTI_SELECT_OFF, async (event: IEvent) => {
			const multiSelectEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.MULTI_SELECT_OFF];

			// don't send the customization if the event is coming from an API call
			if (!multiSelectEvent.event) return;

			// remove the node from the selected nodes
			const selected = selectedNodes;
			selected.splice(selected.indexOf(multiSelectEvent.node), 1);
			setSelectedNodes(selected);

			if (multiSelectEvent.nodes.length < (multiSelectEvent.manager as MultiSelectManager).minimumNodes) {
				notifications.show({
					title: "Minimum Number of Nodes not reached",
					message: `Expected ${(multiSelectEvent.manager as MultiSelectManager).minimumNodes} nodes, got ${multiSelectEvent.nodes.length} nodes.`
				});

				return;
			}

			responseObjectRef.current = createResponseObject(patternRef.current, selected);
		});

		/**
		 * Event handler for the minimum multi select event.
		 * In this event handler, a notification is shown.
		 */
		const tokenMinimumMultiSelect = addListener(EVENTTYPE_INTERACTION.MULTI_SELECT_MINIMUM_NODES, async (event: IEvent) => {
			const multiSelectEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.MULTI_SELECT_MINIMUM_NODES];

			// don't send the customization if the event is coming from an API call
			if (!multiSelectEvent.event) return;

			notifications.show({
				title: "Minimum Number of Nodes not reached",
				message: `Expected ${(multiSelectEvent.manager as MultiSelectManager).minimumNodes} nodes, got ${multiSelectEvent.nodes.length} nodes.`
			});
		});

		/**
		 * Event handler for the maximum multi select event.
		 * In this event handler, a notification is shown.
		 */
		const tokenMaximumMultiSelect = addListener(EVENTTYPE_INTERACTION.MULTI_SELECT_MAXIMUM_NODES, async (event: IEvent) => {
			const multiSelectEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.MULTI_SELECT_MAXIMUM_NODES];

			// don't send the customization if the event is coming from an API call
			if (!multiSelectEvent.event) return;

			notifications.show({
				title: "Maximum Number of Nodes reached",
				message: `Expected ${(multiSelectEvent.manager as MultiSelectManager).maximumNodes} nodes, got ${multiSelectEvent.nodes.length} nodes.`
			});
		});

		/**
		 * Remove the event listeners when the component is unmounted.
		 */
		return () => {
			removeListener(tokenSelectOn);
			removeListener(tokenSelectOff);
			removeListener(tokenMultiSelectOn);
			removeListener(tokenMultiSelectOff);
			removeListener(tokenMinimumMultiSelect);
			removeListener(tokenMaximumMultiSelect);
		};
	}, [settings]);

	// use an effect to apply changes to the material, and to apply the callback once the node is available
	useEffect(() => {
		if (viewportApi && settings) {
			// whenever this output node changes, we want to create the interaction engine
			interactionEngineRef.current = new InteractionEngine(viewportApi);
			setInteractionEngine(interactionEngineRef.current);

			// const dragging = isInteractionDraggingParameterDefinition(settings) ? settings : undefined;
			// const gumball = isInteractionGumballParameterDefinition(settings) ? settings : undefined;

			if (selection) {
				const selectMultiple = (selection.props.minimumSelection !== undefined && selection.props.maximumSelection !== undefined) &&
					selection.props.minimumSelection < selection.props.maximumSelection && selection.props.maximumSelection > 1;

				if (selectMultiple) {
					multiSelectManagerRef.current = new MultiSelectManager();
					multiSelectManagerRef.current.effectMaterial = new MaterialStandardData({ color: "red" });
					multiSelectManagerRef.current.minimumNodes = selection.props.minimumSelection!;
					multiSelectManagerRef.current.maximumNodes = selection.props.maximumSelection!;
					setMultiSelectManager(multiSelectManagerRef.current);

					interactionEngineRef.current.addInteractionManager(multiSelectManagerRef.current);

					if (selectedNodes) {
						selectedNodes.forEach((node, i) => {
							const interactionData = node.data.find(d => d instanceof InteractionData) as InteractionData;
							if (interactionData) {
								multiSelectManagerRef.current!.select({
									distance: i,
									point: vec3.create(),
									node
								});
							}
						});
					}

				} else {
					selectManagerRef.current = new SelectManager();
					selectManagerRef.current.deselectOnEmpty = false;
					selectManagerRef.current.effectMaterial = new MaterialStandardData({ color: "blue" });
					setSelectManager(selectManagerRef.current);

					interactionEngineRef.current.addInteractionManager(selectManagerRef.current);

					if (selectedNodes) {
						selectedNodes.forEach((node, i) => {
							const interactionData = node.data.find(d => d instanceof InteractionData) as InteractionData;
							if (interactionData) {
								selectManagerRef.current!.select({
									distance: i,
									point: vec3.create(),
									node
								});
							}
						});
					}
				}
			}

			if (settings.props.hover) {
				hoverManagerRef.current = new HoverManager();
				hoverManagerRef.current.effectMaterial = new MaterialStandardData({ color: "green" });
				setHoverManager(hoverManagerRef.current);

				interactionEngineRef.current.addInteractionManager(hoverManagerRef.current);
			}
		}

		return () => {
			// clean up the select manager
			if (selectManagerRef.current) {
				selectManagerRef.current.deselect();
				selectManagerRef.current = undefined;
				setSelectManager(undefined);
			}

			// clean up the multi select manager
			if (multiSelectManagerRef.current) {
				multiSelectManagerRef.current.deselectAll();
				multiSelectManagerRef.current = undefined;
				setMultiSelectManager(undefined);
			}

			// clean up the hover manager
			if (hoverManagerRef.current) {
				hoverManagerRef.current = undefined;
				setHoverManager(undefined);
			}

			// clean up the interaction engine
			if (interactionEngineRef.current) {
				interactionEngineRef.current.close();
				interactionEngineRef.current = undefined;
				setInteractionEngine(undefined);
			}
		};
	}, [viewportApi, settings]);

	return {
		interactionEngine,
		selectManager,
		multiSelectManager,
		hoverManager,
		responseObject: responseObjectRef.current
	};
}

// #endregion Functions (1)

// #region Variables (1)

/**
 * Create the response object for the parameter.
 * 
 * The response object is a JSON string that contains:
 * - the information of the selected node (output, pattern, nodeName, path)
 * - the information of the selected nodes (output, pattern, nodeName, path)
 * 
 * If the node is not defined, the node information is not included in the response object.
 * If the nodes are not defined, the nodes information is not included in the response object.
 * 
 * @param outputs 
 * @param pattern 
 * @param node 
 * @param nodes 
 * @returns 
 */
const createResponseObject = (patterns?: { [key: string]: string[][] }, nodes?: ITreeNode[]): string => {
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
							return match[0];
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

	return JSON.stringify(response);
};

// #endregion Variables (1)
