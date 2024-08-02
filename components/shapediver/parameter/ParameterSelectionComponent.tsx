import { Switch } from "@mantine/core";
import React, { useEffect, useState } from "react";
import ParameterLabelComponent from "./ParameterLabelComponent";
import { PropsParameter } from "../../../types/components/shapediver/propsParameter";
import { useParameterComponentCommons } from "../../../hooks/shapediver/parameters/useParameterComponentCommons";
import { useInteraction } from "shared/hooks/shapediver/viewer/useInteraction";
import { IInteractionParameterDefinition } from "shared/types/shapediver/appbuilderinteractiontypes";

const VIEWPORT_ID = "viewport_1";

/**
 * Functional component that creates a switch component for a selection parameter.
 *
 * @returns
 */
export default function ParameterSelectionComponent(props: PropsParameter) {

	const {
		definition,
		handleChange,
		onCancel,
		disabled
	} = useParameterComponentCommons<string>(props, 0);
    
	// state for the selection application
	const [selectionActive, setSelectionActive] = useState<boolean>(false);
	const { responseObject } = useInteraction(props.sessionId, VIEWPORT_ID, selectionActive ? (definition.settings as IInteractionParameterDefinition).props as IInteractionParameterDefinition : undefined);

	useEffect(() => {
		if(responseObject)
			handleChange(responseObject);
	}, [responseObject]);

	return <>
		<ParameterLabelComponent { ...props } cancel={onCancel} />
		{ definition && <Switch
			checked={selectionActive}
			onChange={(e) => setSelectionActive(e.currentTarget.checked)}
			disabled={disabled}
		/>}
	</>;
}
