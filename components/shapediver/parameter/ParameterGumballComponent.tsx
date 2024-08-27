import { Button, Group, Loader, Text } from "@mantine/core";
import React, { useCallback, useState } from "react";
import ParameterLabelComponent from "./ParameterLabelComponent";
import { PropsParameter } from "../../../types/components/shapediver/propsParameter";
import { useParameterComponentCommons } from "../../../hooks/shapediver/parameters/useParameterComponentCommons";
import { IInteractionParameterSettings, GumballParameterValue } from "@shapediver/viewer";
import { useGumball } from "../../../hooks/shapediver/viewer/interaction/gumball/useGumball";
import { IconTypeEnum } from "../../../types/shapediver/icons";
import Icon from "../../ui/Icon";

const VIEWPORT_ID = "viewport_1";

/**
 * Functional component that creates a switch component for a gumball parameter.
 *
 * @returns
 */
export default function ParameterGumballComponent(props: PropsParameter) {
	const {
		definition,
		handleChange,
		onCancel,
		disabled,
		value
	} = useParameterComponentCommons<string>(props);

	// state for the gumball application
	const [gumballActive, setGumballActive] = useState<boolean>(false);

	// get the transformed nodes and the selected nods
	const { transformedNodes, setTransformedNodes, setSelectedNodes } = useGumball(props.sessionId, VIEWPORT_ID, gumballActive ? definition.settings as IInteractionParameterSettings : undefined);

	/**
	 * Callback function to change the value of the parameter.
	 * This function is called when the gumball interaction is confirmed.
	 * It also ends the gumball interaction process and resets the selected nodes.
	 */
	const changeValue = useCallback(() => {
		const parameterValue: GumballParameterValue = { names: transformedNodes.map(node => node.name), transformations: transformedNodes.map(node => node.transformation) };
		handleChange(JSON.stringify(parameterValue), 0);
		setGumballActive(false);
		setSelectedNodes([]);
	}, [transformedNodes]);

	/**
	 * Callback function to reset the transformed nodes.
	 * This function is called when the gumball interaction is aborted.
	 * It also ends the gumball interaction process and resets the selected nodes.
	 */
	const abortGumball = useCallback(() => {
		setGumballActive(false);
		setSelectedNodes([]);
		const parsedValue = value ? JSON.parse(value).names : [];
		setTransformedNodes(value ? parsedValue.names.map((name: string, index: number) => { return { name: name, transformation: parsedValue.transformations[index] }; }) : []);
	}, [gumballActive]);

	/**
	 * The content of the parameter when it is active.
	 * 
	 * It contains a button to confirm the gumball interaction and a button to cancel the interaction.
	 * 
	 * The confirm button sets the current parameter value to the transformed nodes.
	 * The cancel button resets the transformed nodes to the last value.
	 * 
	 */
	const contentActive =
		<>
			<Button justify="space-between" fullWidth h="100%" disabled={disabled}
				rightSection={<Loader type="dots" />}
				bg={""}
				onClick={abortGumball}>
				<Group justify="space-between" w="100%" pt={"sm"} pb={"sm"}>
					<Group style={{ flexDirection: "column" }} align="left">
						<Text style={{ textAlign: "left" }} size="sm" fw={500}>
							Currently transformed objects: {transformedNodes.length}
						</Text>
						<Group>
							<Text size="sm" fw={400} fs="italic">
								Select objects to transform
							</Text>
						</Group>
					</Group>
				</Group>
			</Button>
			<Group justify="space-between" w="100%">
				<Button
					w="35%"
					bg={"blue"}
					onClick={changeValue}
				>
					<Text>Confirm</Text>
				</Button>
				<Button
					w="35%"
					bg={"red"}
					onClick={abortGumball}>
					<Text>Cancel</Text>
				</Button>
			</Group>
		</>;


	/**
	 * The content of the parameter when it is inactive.
	 * 
	 * It contains a button to start the gumball.
	 * Within the button, the number of transformed nodes is displayed.
	 */
	const contentInactive =
		<Button justify="space-between" fullWidth h="100%" disabled={disabled}
			rightSection={<Icon type={IconTypeEnum.IconHandFinger} />}
			bg={"blue"}
			onClick={() => setGumballActive(true)}>
			<Group justify="space-between" w="100%" pt={"sm"} pb={"sm"}>
				<Text size="sm" fw={500}>
					Start gumball
				</Text>
			</Group>
		</Button>;

	return <>
		<Group>
			<ParameterLabelComponent {...props} cancel={onCancel} />
			{
				definition &&
					gumballActive ? contentActive : contentInactive
			}
		</Group>

	</>;
}
