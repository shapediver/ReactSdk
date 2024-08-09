import { Button, Group, Text } from "@mantine/core";
import React, { useCallback, useEffect, useState } from "react";
import ParameterLabelComponent from "./ParameterLabelComponent";
import { PropsParameter } from "../../../types/components/shapediver/propsParameter";
import { useParameterComponentCommons } from "../../../hooks/shapediver/parameters/useParameterComponentCommons";
import { IconHandFinger, IconInfoCircleFilled } from "@tabler/icons-react";
import { IInteractionParameterSettings, ISelectionParameterSettings, isInteractionSelectionParameterSettings, SelectionParameterValue } from "@shapediver/viewer";
import { useShapeDiverStoreViewer } from "shared/store/useShapeDiverStoreViewer";
import { useSelection } from "shared/hooks/shapediver/viewer/interaction/useSelection";

const VIEWPORT_ID = "viewport_1";

/**
 * Functional component that creates a switch component for a selection parameter.
 *
 * @returns
 */
export default function ParameterSelectionComponent(props: PropsParameter) {

	// get the parameter API as we might have to overwrite the acceptRejectMode
	const sessionApi = useShapeDiverStoreViewer(state => { return state.sessions[props.sessionId]; });
	const parameterApi = sessionApi?.getParameterByName(props.parameterId)[0];

	let acceptRejectMode = props.acceptRejectMode;
	if(parameterApi && isInteractionSelectionParameterSettings(parameterApi.settings as any)) {
		const selectionProps = parameterApi.settings?.props as ISelectionParameterSettings;
		if((selectionProps?.minimumSelection ?? 1) < (selectionProps?.maximumSelection ?? 1)) {
			acceptRejectMode = true;
		}
	}

	const {
		definition,
		handleChange,
		onCancel,
		disabled,
		value,
		state
	} = useParameterComponentCommons<string>({
		acceptRejectMode,
		disableIfDirty: props.disableIfDirty,
		sessionId: props.sessionId,
		parameterId: props.parameterId,
		overrides: props.overrides,
	}, 0);
	
	// state for the selection application
	const [selectionActive, setSelectionActive] = useState<boolean>(false);
	const { selectedNodes, resetSelectedNodeNames } = useSelection(props.sessionId, VIEWPORT_ID, selectionActive ? definition.settings as IInteractionParameterSettings : undefined);

	useEffect(() => {
		const parameterValue: SelectionParameterValue = { names: selectedNodes };
		handleChange(JSON.stringify(parameterValue));
	}, [selectedNodes]);

	useEffect(() => {
		if(acceptRejectMode === true && state.execValue === value) {
			setSelectionActive(false);
			resetSelectedNodeNames();
		}
	}, [state.execValue]);

	/**
	 * Callback function for the cancel button.
	 */
	const onCancelCallback = useCallback(() => {
		setSelectionActive(false);
		resetSelectedNodeNames();
		
		if(onCancel)
			onCancel();
	}, [selectionActive, resetSelectedNodeNames]);

	const iconFinger = <IconHandFinger width={"1.5rem"} height={"1.5rem"} />;
	const iconInfo = <IconInfoCircleFilled width={"1.5rem"} height={"1.5rem"} />;
	const contentActive =
		<Group style={{ flexDirection: "column" }} align="left">
			<Text style={{ textAlign: "left" }} size="sm" fw={500}>
				Select your object
			</Text>
			<Group>
				<Text size="sm" fw={400} fs="italic">
					Click on an object to select it in the viewer
				</Text>
			</Group>
		</Group>;
	const contentInactive =
		<Text size="sm" fw={500}>
			Select your object
		</Text>;

	return <>
		<Group>
			<ParameterLabelComponent {...props} cancel={selectionActive ? onCancel && onCancelCallback : undefined} />
			{
				definition &&
				<Button justify="space-between" fullWidth h="100%" disabled={disabled}
					rightSection={selectionActive ? iconInfo : iconFinger}
					bg={selectionActive ? "" : "blue"}
					onClick={() => setSelectionActive(!selectionActive)}>
					<Group justify="space-between" w="100%" pt={"sm"} pb={"sm"}>
						{selectionActive ? contentActive : contentInactive}
					</Group>
				</Button>
			}
		</Group>
		
	</>;
}
