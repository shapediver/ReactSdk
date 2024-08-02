import ParametersAndExportsAccordionComponent from "../ui/ParametersAndExportsAccordionComponent";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { IAppBuilderWidgetPropsInteraction } from "../../../types/shapediver/appbuilder";
import { IGenericParameterDefinition } from "../../../types/store/shapediverStoreParameters";
import { ShapeDiverResponseParameterType } from "@shapediver/sdk.geometry-api-sdk-v2";
import { useDefineGenericParameters } from "../../../hooks/shapediver/parameters/useDefineGenericParameters";
import { useId } from "@mantine/hooks";
import { useInteraction } from "shared/hooks/shapediver/viewer/useInteraction";
import { useParameterStateless } from "shared/hooks/shapediver/parameters/useParameterStateless";
import { useSessionPropsParameter } from "../../../hooks/shapediver/parameters/useSessionPropsParameter";
import { IInteractionParameterSettings, ISelectionParameterSettings, isInteractionGumballParameterSettings, SelectionParameterValue } from "@shapediver/viewer";
import { useGumball } from "shared/hooks/shapediver/viewer/useGumball";

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
 * Widget component for the gumball.
 * 
 * @param param0 
 * @returns 
 */
export default function AppBuilderGumballWidgetComponent({ interactionSettings, parameter: p, sessionId, viewportId }: Props) {
	// generate a unique id for the widget
	const uuid = useId();
	const settings = isInteractionGumballParameterSettings(interactionSettings) ? interactionSettings : undefined;

	// state for the gumball application
	const [gumballActive, setGumballActive] = useState<boolean>(false);

	// get the parameter API
	const parameter = useParameterStateless<string>(sessionId, p?.name || "selected");
	const parameterRef = useRef(parameter);

	// update the parameter reference when the parameter changes
	useEffect(() => {
		parameterRef.current = parameter;
	}, [parameter]);


	const selectionSettingsRef = useRef<IInteractionParameterSettings | undefined>(undefined);
	useEffect(() => {
		selectionSettingsRef.current = {
			type: "selection",
			props: {
				nameFilter: settings?.props.nameFilter,
				hover: settings?.props.hover,
				minimumSelection: 0,
				maximumSelection: Infinity
			} as ISelectionParameterSettings
		};
	}, [settings]);


	const selectionParameterValueRef = useRef<SelectionParameterValue | undefined>(undefined);

	const callback = useCallback((value: SelectionParameterValue | undefined) => {
		selectionParameterValueRef.current = value;
		console.log("Selection value", value);
	}, [settings]);
	

	useInteraction(sessionId, viewportId || VIEWPORT_ID, gumballActive ? selectionSettingsRef.current : undefined, callback);

	const { gumball, responseObject } = useGumball(sessionId, viewportId || VIEWPORT_ID, gumballActive ? settings : undefined, selectionParameterValueRef.current);

	useEffect(() => {
		// once the selected object changes, we create a new gumball
		// if the gumball has already been created, we store the name and the transformation matrix
		if (parameterRef.current && responseObject) {
			parameterRef.current.actions.setUiValue(JSON.stringify(responseObject));
			parameterRef.current.actions.execute(true);
		}
	}, [gumball]);

	// define the parameter names for the gumball
	const enum PARAMETER_NAMES {
		START_GUMBALL = "startGumball"
	}

	const [parameters, setParameters] = useState<IGenericParameterDefinition[]>([]);

	useEffect(() => {
		setParameters(
			[
				{
					definition: {
						id: PARAMETER_NAMES.START_GUMBALL,
						name: "Start Gumball",
						defval: gumballActive + "",
						type: ShapeDiverResponseParameterType.BOOL,
						hidden: false
					},
				}
			]
		);
	}, [gumballActive]);


	// define the custom gumball parameters and a handler for changes
	const customSessionId = "mysession";
	useDefineGenericParameters(customSessionId, false /* acceptRejectMode */,
		parameters,
		async (values) => {
			if (PARAMETER_NAMES.START_GUMBALL in values)
				setGumballActive("" + values[PARAMETER_NAMES.START_GUMBALL] === "true");

			return values;
		}
	);
	const parameterProps = useSessionPropsParameter(customSessionId);

	if (parameter !== undefined)
		return <ParametersAndExportsAccordionComponent key={uuid}
			parameters={parameterProps}
			defaultGroupName="Gumball"
		/>;
	else
		return <></>;
}
