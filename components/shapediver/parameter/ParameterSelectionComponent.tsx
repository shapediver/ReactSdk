import { Button, Group, Loader, Space, Stack, Text } from "@mantine/core";
import React, { useCallback, useEffect, useState } from "react";
import ParameterLabelComponent from "./ParameterLabelComponent";
import { PropsParameter } from "../../../types/components/shapediver/propsParameter";
import { useParameterComponentCommons } from "../../../hooks/shapediver/parameters/useParameterComponentCommons";
import { IInteractionParameterSettings, ISelectionParameterSettings, SelectionParameterValue } from "@shapediver/viewer";
import { useShapeDiverStoreViewer } from "../../../store/useShapeDiverStoreViewer";
import { useSelection } from "../../../hooks/shapediver/viewer/interaction/useSelection";
import { IconTypeEnum } from "../../../types/shapediver/icons";
import Icon from "../../ui/Icon";

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

	const selectionProps = parameterApi.settings?.props as ISelectionParameterSettings;
	const minimumSelection = selectionProps?.minimumSelection ?? 1;
	const maximumSelection = selectionProps?.maximumSelection ?? 1;

	const {
		actions,
		definition,
		handleChange,
		onCancel,
		disabled,
		value,
		state
	} = useParameterComponentCommons<string>(props);
	
	// state for the selection application
	const [selectionActive, setSelectionActive] = useState<boolean>(false);
	// state for if the current value can be accepted
	const [acceptableValue, setAcceptableValue] = useState<boolean>(false);

	const { selectedNodeNames, setSelectedNodeNames } = useSelection(props.sessionId, VIEWPORT_ID, selectionActive ? definition.settings as IInteractionParameterSettings : undefined);

	useEffect(() => {
		// check if the current value is acceptable
		const acceptable = selectedNodeNames.length >= minimumSelection && selectedNodeNames.length <= maximumSelection;
		setAcceptableValue(acceptable);

		// case where the confirm/cancel buttons are not needed
		if (minimumSelection === maximumSelection && acceptable) {
			setSelectionActive(false);
			const parameterValue: SelectionParameterValue = { names: selectedNodeNames };
			actions.setUiValue(JSON.stringify(parameterValue));
			actions.execute(!props.acceptRejectMode);
		}
	}, [selectedNodeNames]);

	useEffect(() => {
		setSelectionActive(false);
		setSelectedNodeNames(state.execValue ? JSON.parse(state.execValue).names : []);
	}, [state.execValue]);

	useEffect(() => {
		setSelectionActive(false);
		setSelectedNodeNames(value ? JSON.parse(value).names : []);
	}, [value]);

	/**
	 * Callback function to change the value of the parameter.
	 * This function is called when the selection is confirmed.
	 * It also ends the selection process.
	 */
	const changeValue = useCallback(() => {
		const parameterValue: SelectionParameterValue = { names: selectedNodeNames };
		handleChange(JSON.stringify(parameterValue));
		setSelectionActive(false);
	}, [selectedNodeNames]);

	/**
	 * Callback function to reset the selected node names.
	 * This function is called when the selection is aborted.
	 * It also ends the selection process.
	 */
	const abortSelection = useCallback(() => {
		setSelectionActive(false);
		const lastValue = value ? JSON.parse(value).names : [];
		setSelectedNodeNames(lastValue);
	}, [selectionActive]);

	/**
	 * The content of the parameter when it is active.
	 * 
	 * It contains a button to confirm the selection and a button to cancel the selection
	 * as well as the number of selected nodes and the selection constraints.
	 * 
	 * The confirm button is only enabled if the selection is within the constraints.
	 * The cancel button resets the selection to the last value.
	 * 
	 */
	const contentActive =
		<Stack>
			<Button justify="space-between" fullWidth h="100%" disabled={disabled}
				rightSection={<Loader type="dots" />}
				onClick={abortSelection}
			>
				<Stack>
					<Space />
					<Text size="sm" fw={500} ta="left">
						Currently selected: {selectedNodeNames.length}
					</Text>
					<Text size="sm" fw={400} fs="italic" ta="left">
						{ minimumSelection === maximumSelection ? 
							`Select ${minimumSelection} object${minimumSelection > 1 ? "s" : ""}` :
							`Select between ${minimumSelection} and ${maximumSelection} objects`
						}
					</Text>
					<Space />
				</Stack>
			</Button>
			{minimumSelection !== maximumSelection &&
				<Group justify="space-between" w="100%" wrap="nowrap">
					<Button
						fullWidth={true}
						disabled={!acceptableValue}
						variant="filled"
						onClick={changeValue}
					>
						<Text>Confirm</Text>
					</Button>
					<Button
						fullWidth={true}
						variant={"light"}
						onClick={abortSelection}>
						<Text>Cancel</Text>
					</Button>
				</Group>
			}
		</Stack>;


	/**
	 * The content of the parameter when it is inactive.
	 * 
	 * It contains a button to start the selection.
	 * Within the button, the number of selected nodes is displayed.
	 */
	const contentInactive =
		<Button justify="space-between" fullWidth={true} disabled={disabled}
			rightSection={<Icon type={IconTypeEnum.IconHandFinger} />}
			variant={selectedNodeNames.length === 0 ? "light" : "filled"}
			onClick={() => setSelectionActive(true)}>
			<Text size="sm">
					Start selection ({selectedNodeNames.length})
			</Text>
		</Button>;

	return <>
		<ParameterLabelComponent {...props} cancel={onCancel} />
		{
			definition &&
			selectionActive ? contentActive : contentInactive
		}
	</>;
}
