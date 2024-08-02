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
 * Clean the output and pattern inputs to ensure that the output and pattern are in the correct format.
 * 
 * If the output is a string, it is converted to an array with one element.
 * 
 * For each output, a pattern has to be clearly defined, otherwise the patterns are ignored.
 * The patterns are stored in a dictionary with the output name as the key.
 * 
 * @param outputInput 
 * @param patternInput 
 * @returns 
 */
const cleanOutputPattern = (outputInput: string | string[], patternInput?: string | string[]): { output: string[], pattern: { [key: string]: string } } => {
	let outputs: string[] = [];
	const pattern: { [key: string]: string } = {};
	if(typeof outputInput === "string") {
		outputs = [outputInput];

		if(patternInput) {
			if(typeof patternInput === "string") {
				// one defined output to one defined pattern, fits!
				pattern[outputInput] = patternInput;
			} else {
				// one defined output, multiple patterns, ignore the pattern
			}
		}
	} else {
		outputs = outputInput;

		if(patternInput) {
			if(typeof patternInput === "string") {
				// multiple defined outputs to one defined pattern, ignore the pattern
			} else {
				if(outputInput.length === patternInput.length) {
					// multiple defined outputs to multiple defined patterns, fits!
					for(let i = 0; i < outputInput.length; i++) {
						pattern[outputInput[i]] = patternInput[i];
					}
				} else {
					// multiple defined outputs, multiple defined patterns, but not the same amount, ignore the pattern
				}
			}
		}
	}

	return { output: outputs, pattern: pattern };
};

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
const createResponseObject = (outputs: string[], pattern?: { [key: string]: string },  node?: ITreeNode, nodes?: ITreeNode[]): string => {
	const getOutputAndPathFromNode = (node: ITreeNode): {
		output: string,
		pattern?: string,
		nodeName: string,
		path: string
	} | undefined => {
		let tempNode = node;
		while(tempNode && tempNode.parent) {
			const outputApiData = tempNode.data.find((data) => data instanceof OutputApiData);
			if(outputApiData) {
				const p = pattern?.[outputApiData.id];

				return { 
					output: outputApiData.id, 
					pattern: p,
					nodeName: node.name,
					path: node.getPath()
				};
			}
			tempNode = tempNode.parent;
		}
	};

	const response: {
		node?: {
			output: string,
			pattern?: string,
			nodeName: string,
			path: string
		},
		nodes: {
			output: string,
			pattern?: string,
			nodeName: string,
			path: string
		}[]
	} = {
		node: undefined,
		nodes: [],
	};

	if(node) 
		response.node = getOutputAndPathFromNode(node);
	
	if(nodes) {
		nodes.map((node) => {
			const result = getOutputAndPathFromNode(node);
			if (result) 
				response.nodes.push(result);
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
export default function AppBuilderInteractionWidgetComponent({ interactionSettings, parameterName, sessionId, viewportId }: Props) {
	// generate a unique id for the widget
	const uuid = useId();

	// state for the interaction application
	const [interactionActive, setInteractionActive] = useState<boolean>(false);

	const [selectedNodes, setSelectedNodes] = useState<ITreeNode[]>([]);

	// get the parameter API
	const parameter = useParameterStateless<string>(sessionId, parameterName || "");
	const parameterRef = useRef(parameter);

	// update the parameter reference when the parameter changes
	useEffect(() => {
		parameterRef.current = parameter;
	}, [parameter]);

	const outputRef = useRef<string[]>([]);
	const patternRef = useRef<{
		[key: string]: string;
	} | undefined>(undefined);

	let output: string[] = [], pattern: { [key: string]: string } = {};
	if (interactionSettings && interactionSettings.output) {
		({ output, pattern } = cleanOutputPattern(interactionSettings.output, interactionSettings.pattern));

		outputRef.current = output;
		patternRef.current = pattern;
	
		output.forEach((item) => {
			useNodeInteractionData(sessionId, item, pattern, interactionSettings.interactionTypes, interactionSettings.groupNodes);
		});
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

			parameterRef.current.actions.setUiValue(createResponseObject(outputRef.current, patternRef.current, selectEvent.node));
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

			parameterRef.current.actions.setUiValue(createResponseObject(outputRef.current, patternRef.current));
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

			parameterRef.current.actions.setUiValue(createResponseObject(outputRef.current, patternRef.current, multiSelectEvent.node, multiSelectEvent.nodes));
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

			parameterRef.current.actions.setUiValue(createResponseObject(outputRef.current, patternRef.current, undefined, multiSelectEvent.nodes));
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
	}, [interactionSettings]);


	useInteraction(viewportId || VIEWPORT_ID, interactionActive ? interactionSettings : undefined, selectedNodes);

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

	if (parameterName !== undefined)
		return <ParametersAndExportsAccordionComponent key={uuid}
			parameters={parameterProps}
			defaultGroupName="Interactions"
		/>;
	else
		return <></>;
}
