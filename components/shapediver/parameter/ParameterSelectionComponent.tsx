import { ActionIcon, Button, Grid, Group, Loader, Stack, Text } from "@mantine/core";
import React, { useCallback, useEffect, useState } from "react";
import ParameterLabelComponent from "./ParameterLabelComponent";
import { PropsParameter } from "../../../types/components/shapediver/propsParameter";
import { useParameterComponentCommons } from "../../../hooks/shapediver/parameters/useParameterComponentCommons";
import { ISelectionParameterProps, SelectionParameterValue } from "@shapediver/viewer";
import { useSelection } from "../../../hooks/shapediver/viewer/interaction/selection/useSelection";
import { IconTypeEnum } from "../../../types/shapediver/icons";
import Icon from "../../ui/Icon";
import { useViewportId } from "../../../hooks/shapediver/viewer/useViewportId";
import classes from "./ParameterInteractionComponent.module.css";

/**
 * Parse the value of a selection parameter and extract the selected node names.
 * @param value 
 * @returns 
 */
const parseNames = (value?: string): string[] => {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		
		return parsed.names;
	}
	catch {
		return [];
	}
};

/**
 * Functional component that creates a switch component for a selection parameter.
 *
 * @returns
 */
export default function ParameterSelectionComponent(props: PropsParameter) {
	const {
		definition,
		handleChange,
		setOnCancelCallback,
		onCancel,
		disabled,
		value,
		state,
		sessionDependencies
	} = useParameterComponentCommons<string>(props);

	const selectionProps = definition.settings?.props as ISelectionParameterProps;
	const minimumSelection = selectionProps?.minimumSelection ?? 1;
	const maximumSelection = selectionProps?.maximumSelection ?? 1;
	
	// is the selection active or not? 
	const [selectionActive, setSelectionActive] = useState<boolean>(false);
	// state for the dirty flag
	const [dirty, setDirty] = useState<boolean>(false);

	// get the viewport ID
	const { viewportId } = useViewportId();
	
	const { selectedNodeNames, setSelectedNodeNames, setSelectedNodeNamesAndRestoreSelection, nodeInteractionDataHandlers } = useSelection(
		sessionDependencies, 
		viewportId, 
		selectionProps,
		selectionActive,
		parseNames(value)
	);

	// check if the current selection is within the constraints
	const acceptable = selectedNodeNames.length >= minimumSelection && selectedNodeNames.length <= maximumSelection;
	const acceptImmediately = minimumSelection === maximumSelection && acceptable;

	useEffect(() => {
		const parsed = parseNames(state.uiValue);

		// compare uiValue to selectedNodeNames
		if (parsed.length !== selectedNodeNames.length || !parsed.every((n, i) => n === selectedNodeNames[i])) {
			setDirty(true);
		} else {
			setDirty(false);
		}
	}, [state.uiValue, selectedNodeNames]);

	/**
	 * Callback function to change the value of the parameter.
	 * This function is called when the selection is confirmed (by the user, or automatically).
	 * It also ends the selection process.
	 */
	const changeValue = useCallback((names: string[]) => {
		setSelectionActive(false);
		const parameterValue: SelectionParameterValue = { names };
		handleChange(JSON.stringify(parameterValue), 0);
	}, []);
	
	// check whether the selection should be accepted immediately
	useEffect(() => {
		if (acceptImmediately)
			changeValue(selectedNodeNames);
	}, [acceptImmediately, selectedNodeNames]);

	/**
	 * Callback function to reset the selected node names.
	 * This function is called when the selection is aborted by the user.
	 * It also ends the selection process.
	 */
	const resetSelection = useCallback((val: string) => {
		setSelectionActive(false);
		setSelectedNodeNames(parseNames(val));
	}, []);

	// react to changes of the uiValue and update the selection state if necessary
	useEffect(() => {
		const names = parseNames(state.uiValue);
		// compare names to selectedNodeNames
		if (names.length !== selectedNodeNames.length || !names.every((n, i) => n === selectedNodeNames[i])) {
			setSelectionActive(false);
			setSelectedNodeNames(names);
		}
	}, [state.uiValue]); 

	/**
	 * Callback function to clear the selection.
	 */
	const clearSelection = useCallback(() => {
		setSelectedNodeNamesAndRestoreSelection([]);
	}, []);

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
			<Group justify="space-between" className={classes.interactionMain}>
				<Grid w="100%">
					<Grid.Col span={"auto"}>
						<Text size="sm" fw={500} ta="left" className={classes.interactionText}>
							{selectionProps.prompt?.activeTitle ?? `Currently selected: ${selectedNodeNames.length}`}
						</Text>
					</Grid.Col>
					<Grid.Col span={"content"}>
						<ActionIcon onClick={clearSelection} variant={selectedNodeNames.length === 0 ? "light" : "filled"}>
							<Icon type={IconTypeEnum.Trash} />
						</ActionIcon>
					</Grid.Col>
				</Grid>
				<Grid w="100%">
					<Grid.Col span={"auto"}>
						<Text size="sm" fw={400} fs="italic" ta="left" className={classes.interactionText}>
							{
								selectionProps.prompt?.activeText ??
									minimumSelection === maximumSelection ?
									`Select ${minimumSelection} object${minimumSelection > 1 ? "s" : ""}` :
									`Select between ${minimumSelection} and ${maximumSelection} objects`
							}
						</Text>
					</Grid.Col>
					<Grid.Col span={"content"}>
						<Loader size={28} type="dots" />
					</Grid.Col>
				</Grid>
			</Group>

			{minimumSelection !== maximumSelection &&
				<Group justify="space-between" w="100%" wrap="nowrap">
					<Button
						fullWidth={true}
						disabled={!acceptable || !dirty}
						variant="filled"
						onClick={() => changeValue(selectedNodeNames)}
					>
						<Text>Confirm</Text>
					</Button>
					<Button
						fullWidth={true}
						variant={"light"}
						onClick={() => resetSelection(value)}>
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
		<Button justify="space-between" fullWidth={true} disabled={disabled} className={classes.interactionButton}
			rightSection={<Icon type={IconTypeEnum.IconHandFinger} />}
			variant={selectedNodeNames.length === 0 ? "light" : "filled"}
			onClick={() => setSelectionActive(true)}>
			<Text size="sm" className={classes.interactionText}>
				{selectionProps.prompt?.inactiveTitle ?? `Start selection (${selectedNodeNames.length})`}
			</Text>
		</Button>;

	// extend the onCancel callback to reset the selected node names.
	const _onCancelCallback = useCallback(() => {
		resetSelection(state.execValue);
	}, []);

	useEffect(() => {
		setOnCancelCallback(() => _onCancelCallback);
	}, [_onCancelCallback]);

	return <>
		<>{nodeInteractionDataHandlers}</>
		<ParameterLabelComponent {...props} cancel={onCancel} />
		{
			definition &&
			selectionActive ? contentActive : contentInactive
		}
	</>;
}
