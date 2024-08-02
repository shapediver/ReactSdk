import ParametersAndExportsAccordionComponent from "../ui/ParametersAndExportsAccordionComponent";
import React, { useEffect, useRef, useState } from "react";
import { IAppBuilderWidgetPropsInteraction } from "../../../types/shapediver/appbuilder";
import { IGenericParameterDefinition } from "../../../types/store/shapediverStoreParameters";
import { ShapeDiverResponseParameterType } from "@shapediver/sdk.geometry-api-sdk-v2";
import { useDefineGenericParameters } from "../../../hooks/shapediver/parameters/useDefineGenericParameters";
import { useId } from "@mantine/hooks";
import { useInteraction } from "shared/hooks/shapediver/viewer/useInteraction";
import { useNodeInteractionData } from "shared/hooks/shapediver/viewer/useNodeInteractionData";
import { useParameterStateless } from "shared/hooks/shapediver/parameters/useParameterStateless";
import { useSessionPropsParameter } from "../../../hooks/shapediver/parameters/useSessionPropsParameter";
import { EVENTTYPE_INTERACTION, IEvent, ITreeNode, OutputApiData, addListener, removeListener } from "@shapediver/viewer";
import { InteractionEventResponseMapping, MultiSelectManager } from "@shapediver/viewer.features.interaction";
import { notifications } from "@mantine/notifications";
import { isInteractionSelectionParameterDefinition } from "shared/types/shapediver/appbuilderinteractiontypes";

const VIEWPORT_ID = "viewport_1";

interface Props extends IAppBuilderWidgetPropsInteraction {
	/** 
	 * Default session id to use for parameter and export references that do 
	 * not specify a session id.
	 */
	sessionId: string,
	/**
	 * Default viewport id to use for the widgets that do not specify a viewport id.
	 */
	viewportId?: string,
}

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
		while(tempNode && tempNode.parent) {
			const outputApiData = tempNode.data.find((data) => data instanceof OutputApiData) as OutputApiData | undefined;
			if(outputApiData) {
				const path = node.getPath().replace(tempNode.getPath(), "");
				const p = patterns?.[outputApiData.api.name];

				if(p) {
					for(const pattern of p) {
						const match = path.match(pattern.join(".*"));
						if(match) 
							return match[0];
					}
				}
			}
			tempNode = tempNode.parent;
		}
	};

	const response: { names: string[] } = { names: [], };

	if(nodes) {
		nodes.map((node) => {
			const result = getOutputAndPathFromNode(node);
			if (result) 
				response.names.push(result);
		});
	}

	return JSON.stringify(response);
};

/**
 * Widget component for the selections.
 * 
 * @param param0 
 * @returns 
 */
export default function AppBuilderSelectionWidgetComponent({ interactionSettings, parameter: p, sessionId, viewportId }: Props) {
	// generate a unique id for the widget
	const uuid = useId();
	const settings = isInteractionSelectionParameterDefinition(interactionSettings) ? interactionSettings : undefined;

	// state for the selection application
	const [selectionActive, setSelectionActive] = useState<boolean>(false);
	// state for the selected nodes
	const [selectedNodes, setSelectedNodes] = useState<ITreeNode[]>([]);

	// get the parameter API
	const parameter = useParameterStateless<string>(sessionId, p?.name || "selected");
	const parameterRef = useRef(parameter);

	// update the parameter reference when the parameter changes
	useEffect(() => {
		parameterRef.current = parameter;
	}, [parameter]);

	const patternRef = useRef<{
		[key: string]: string[][];
	}>({});

	let nameFilter: string[] = [];

	if (settings && settings.props.nameFilter !== undefined) {
		if(typeof settings.props.nameFilter === "string") {
			if((settings.props.nameFilter as string).startsWith("[") && (settings.props.nameFilter as string).endsWith("]") && (settings.props.nameFilter as string) !== "[]") {
				try {
					nameFilter = JSON.parse(settings.props.nameFilter) as string[];
					console.log(nameFilter)
				} catch(e) {
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

		for(let i = 0; i < nameFilter.length; i++) {
			const parts = nameFilter[i].split(".");
			const outputName = parts[0];

			// create a regex pattern from the other parts of the array
			// replace all "*" with ".*"
			const patternArray = parts.slice(1).map(part => part.replace(/\*/g, ".*"));
			if(patternRef.current[outputName] === undefined) patternRef.current[outputName] = [];
			patternRef.current[outputName].push(patternArray);
		}


		for(const output in patternRef.current) {
			useNodeInteractionData(sessionId, output, patternRef.current[output], { select: true, hover: settings.props.hover });
		}
	} else {
		patternRef.current = {};
	}
	
	// register an event handler and listen for output updates
	useEffect(() => {
		/**
		 * Event handler for the select on event.
		 * In this event handler, the response object is created and the parameter is updated.
		 */
		const tokenSelectOn = addListener(EVENTTYPE_INTERACTION.SELECT_ON, async (event: IEvent) => {
			const selectEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.SELECT_ON];

			// update the parameter
			if (!parameterRef.current) return;
			// don't send the customization if the event is coming from an API call
			if (!selectEvent.event) return;

			const selected = [selectEvent.node];
			setSelectedNodes(selected);

			parameterRef.current.actions.setUiValue(createResponseObject(patternRef.current, selected));
			await parameterRef.current.actions.execute(true);
		});
	
		/**
		 * Event handler for the select off event.
		 * In this event handler, the response object is created and the parameter is updated.
		 */
		const tokenSelectOff = addListener(EVENTTYPE_INTERACTION.SELECT_OFF, async (event: IEvent) => {
			const selectEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.SELECT_OFF];

			// update the parameter
			if (!parameterRef.current) return;
			// don't send the event if it is a reselection
			if (selectEvent.reselection) return;
			// don't send the customization if the event is coming from an API call
			if (!selectEvent.event) return;

			const selected: ITreeNode[] = [];
			setSelectedNodes(selected);

			parameterRef.current.actions.setUiValue(createResponseObject(patternRef.current));
			await parameterRef.current.actions.execute(true);
		});

		/**
		 * Event handler for the multi select on event.
		 * In this event handler, the response object is created and the parameter is updated.
		 */
		const tokenMultiSelectOn = addListener(EVENTTYPE_INTERACTION.MULTI_SELECT_ON, async (event: IEvent) => {
			const multiSelectEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.MULTI_SELECT_ON];

			// update the parameter
			if (!parameterRef.current) return;
			// don't send the customization if the event is coming from an API call
			if (!multiSelectEvent.event) return;

			const selected = selectedNodes;
			selected.push(multiSelectEvent.node);
			setSelectedNodes(selected);

			if(multiSelectEvent.nodes.length < (multiSelectEvent.manager as MultiSelectManager).minimumNodes) {
				notifications.show({
					title: "Minimum Number of Nodes not reached",
					message: `Expected ${(multiSelectEvent.manager as MultiSelectManager).minimumNodes} nodes, got ${multiSelectEvent.nodes.length} nodes.`
				});

				return;
			}

			parameterRef.current.actions.setUiValue(createResponseObject(patternRef.current, selected));
			await parameterRef.current.actions.execute(true);
		});

		/**
		 * Event handler for the multi select off event.
		 * In this event handler, the response object is created and the parameter is updated.
		 */
		const tokenMultiSelectOff = addListener(EVENTTYPE_INTERACTION.MULTI_SELECT_OFF, async (event: IEvent) => {
			const multiSelectEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.MULTI_SELECT_OFF];

			// update the parameter
			if (!parameterRef.current) return;
			// don't send the customization if the event is coming from an API call
			if (!multiSelectEvent.event) return;

			// remove the node from the selected nodes
			const selected = selectedNodes;
			selected.splice(selected.indexOf(multiSelectEvent.node), 1);
			setSelectedNodes(selected);

			if(multiSelectEvent.nodes.length < (multiSelectEvent.manager as MultiSelectManager).minimumNodes) {
				notifications.show({
					title: "Minimum Number of Nodes not reached",
					message: `Expected ${(multiSelectEvent.manager as MultiSelectManager).minimumNodes} nodes, got ${multiSelectEvent.nodes.length} nodes.`
				});
				
				return;
			}

			parameterRef.current.actions.setUiValue(createResponseObject(patternRef.current, selected));
			await parameterRef.current.actions.execute(true);
		});

		/**
		 * Event handler for the minimum multi select event.
		 * In this event handler, a notification is shown.
		 */
		const tokenMinimumMultiSelect = addListener(EVENTTYPE_INTERACTION.MULTI_SELECT_MINIMUM_NODES, async (event: IEvent) => {
			const multiSelectEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.MULTI_SELECT_MINIMUM_NODES];

			// update the parameter
			if (!parameterRef.current) return;
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

			// update the parameter
			if (!parameterRef.current) return;
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


	useInteraction(viewportId || VIEWPORT_ID, selectionActive ? settings : undefined, selectedNodes);

	// define the parameter names for the selection
	const enum PARAMETER_NAMES {
		START_SELECTION = "startSelection"
	}

	const [parameters, setParameters] = useState<IGenericParameterDefinition[]>([]);

	useEffect(() => {
		setParameters(
			[
				{
					definition: {
						id: PARAMETER_NAMES.START_SELECTION,
						name: "Start Selection",
						defval: selectionActive + "",
						type: ShapeDiverResponseParameterType.BOOL,
						hidden: false
					},
				}
			]
		);
	}, [selectionActive]);


	// define the custom selection parameters and a handler for changes
	const customSessionId = "mysession";
	useDefineGenericParameters(customSessionId, false /* acceptRejectMode */,
		parameters,
		async (values) => {
			if (PARAMETER_NAMES.START_SELECTION in values)
				setSelectionActive("" + values[PARAMETER_NAMES.START_SELECTION] === "true");

			return values;
		}
	);
	const parameterProps = useSessionPropsParameter(customSessionId);

	if (parameter !== undefined)
		return <ParametersAndExportsAccordionComponent key={uuid}
			parameters={parameterProps}
			defaultGroupName="Selections"
		/>;
	else
		return <></>;
}
