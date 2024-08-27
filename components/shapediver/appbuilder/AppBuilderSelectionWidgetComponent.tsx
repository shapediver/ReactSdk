import ParametersAndExportsAccordionComponent from "../ui/ParametersAndExportsAccordionComponent";
import React, { useEffect, useRef, useState } from "react";
import { IAppBuilderWidgetPropsInteraction } from "../../../types/shapediver/appbuilder";
import { IGenericParameterDefinition } from "../../../types/store/shapediverStoreParameters";
import { ShapeDiverResponseParameterType } from "@shapediver/sdk.geometry-api-sdk-v2";
import { useDefineGenericParameters } from "../../../hooks/shapediver/parameters/useDefineGenericParameters";
import { useId } from "@mantine/hooks";
import { useParameterStateless } from "../../../hooks/shapediver/parameters/useParameterStateless";
import { useSessionPropsParameter } from "../../../hooks/shapediver/parameters/useSessionPropsParameter";
import { isInteractionSelectionParameterSettings, SelectionParameterValue } from "@shapediver/viewer";
import { useSelection } from "../../../hooks/shapediver/viewer/interaction/useSelection";

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
 * Widget component for the selections.
 * 
 * IMPORTANT NOTE: THIS COMPONENT IS WILL PROBABLY BE REFACTORED IN THE FUTURE.
 * Once the AppBuilder Selection Widget is fully implemented, this component will be refactored to match the new structure.
 * 
 * @param param0 
 * @returns 
 */
export default function AppBuilderSelectionWidgetComponent({ interactionSettings, parameter: p, sessionId, viewportId }: Props) {
	// generate a unique id for the widget
	const uuid = useId();
	const settings = isInteractionSelectionParameterSettings(interactionSettings) ? interactionSettings : undefined;

	// state for the selection application
	const [selectionActive, setSelectionActive] = useState<boolean>(false);

	// get the parameter API
	const parameter = useParameterStateless<string>(sessionId, p?.name || "selected");
	const parameterRef = useRef(parameter);

	// update the parameter reference when the parameter changes
	useEffect(() => {
		parameterRef.current = parameter;
	}, [parameter]);

	const { selectedNodeNames } = useSelection(sessionId, viewportId || VIEWPORT_ID, settings!.props, selectionActive);

	useEffect(() => {
		if (parameterRef.current && selectedNodeNames) {
			const parameterValue: SelectionParameterValue = { names: selectedNodeNames };
			parameterRef.current.actions.setUiValue(JSON.stringify(parameterValue));
			parameterRef.current.actions.execute(true);
		}
	}, [selectedNodeNames]);

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
