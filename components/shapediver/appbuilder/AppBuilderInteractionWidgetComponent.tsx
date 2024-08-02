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
const createResponseObject = (pattern?: { [key: string]: string }, nodes?: ITreeNode[]): string => {
	const getOutputAndPathFromNode = (node: ITreeNode): string | undefined => {
		let tempNode = node;
		while(tempNode && tempNode.parent) {
			const outputApiData = tempNode.data.find((data) => data instanceof OutputApiData);
			if(outputApiData) {
				// const p = pattern?.[outputApiData.id];
				return node.getPath();
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
 * Widget component for the interactions.
 * 
 * @param param0 
 * @returns 
 */
export default function AppBuilderInteractionWidgetComponent({ interactionSettings, parameter: p, sessionId, viewportId }: Props) {
	// generate a unique id for the widget
	const uuid = useId();

	const settings = isInteractionSelectionParameterDefinition(interactionSettings) ? interactionSettings : undefined;

	// state for the interaction application
	const [interactionActive, setInteractionActive] = useState<boolean>(false);

	const [selectedNodes, setSelectedNodes] = useState<ITreeNode[]>([]);

	// get the parameter API
	const parameter = useParameterStateless<string>(sessionId, p?.name || "");
	const parameterRef = useRef(parameter);

	// update the parameter reference when the parameter changes
	useEffect(() => {
		parameterRef.current = parameter;
	}, [parameter]);

	const patternRef = useRef<{
		[key: string]: string;
	}>({});

	if (settings && settings.props.nameFilter) {
		for(const name of settings.props.nameFilter) {
			const parts = name.split(".");
			const outputName = parts[0];

			// create a regex pattern from the other parts of the array
			// replace all "*" with ".*"
			const patternName = outputName + "." + parts.slice(1).join(".").replace(/\*/g, ".*");
			patternRef.current[outputName] = patternName;
		}

		for(const output in patternRef.current) {
			useNodeInteractionData(sessionId, output, patternRef.current, { select: true, hover: settings.props.hover });
		}
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

			setSelectedNodes([selectEvent.node]);

			parameterRef.current.actions.setUiValue(createResponseObject(patternRef.current, selectedNodes));
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

			setSelectedNodes([]);

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

			selectedNodes.push(multiSelectEvent.node);
			setSelectedNodes(selectedNodes);

			if(multiSelectEvent.nodes.length < (multiSelectEvent.manager as MultiSelectManager).minimumNodes) {
				notifications.show({
					title: "Minimum Number of Nodes not reached",
					message: `Expected ${(multiSelectEvent.manager as MultiSelectManager).minimumNodes} nodes, got ${multiSelectEvent.nodes.length} nodes.`
				});

				return;
			}

			parameterRef.current.actions.setUiValue(createResponseObject(patternRef.current, selectedNodes));
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
			selectedNodes.splice(selectedNodes.indexOf(multiSelectEvent.node), 1);
			setSelectedNodes(selectedNodes);

			if(multiSelectEvent.nodes.length < (multiSelectEvent.manager as MultiSelectManager).minimumNodes) {
				notifications.show({
					title: "Minimum Number of Nodes not reached",
					message: `Expected ${(multiSelectEvent.manager as MultiSelectManager).minimumNodes} nodes, got ${multiSelectEvent.nodes.length} nodes.`
				});
				
				return;
			}

			parameterRef.current.actions.setUiValue(createResponseObject(patternRef.current, selectedNodes));
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


	useInteraction(viewportId || VIEWPORT_ID, interactionActive ? settings : undefined, selectedNodes);

	// define the parameter names for the interaction
	const enum PARAMETER_NAMES {
		START_INTERACTION = "startInteraction"
	}

	const [parameters, setParameters] = useState<IGenericParameterDefinition[]>([]);

	useEffect(() => {
		setParameters(
			[
				{
					definition: {
						id: PARAMETER_NAMES.START_INTERACTION,
						name: "Start Interaction",
						defval: interactionActive + "",
						type: ShapeDiverResponseParameterType.BOOL,
						hidden: false
					},
				}
			]
		);
	}, [interactionActive]);


	// define the custom interaction parameters and a handler for changes
	const customSessionId = "mysession";
	useDefineGenericParameters(customSessionId, false /* acceptRejectMode */,
		parameters,
		async (values) => {
			if (PARAMETER_NAMES.START_INTERACTION in values)
				setInteractionActive("" + values[PARAMETER_NAMES.START_INTERACTION] === "true");

			return values;
		}
	);
	const parameterProps = useSessionPropsParameter(customSessionId);

	if (parameter !== undefined)
		return <ParametersAndExportsAccordionComponent key={uuid}
			parameters={parameterProps}
			defaultGroupName="Interactions"
		/>;
	else
		return <></>;
}
