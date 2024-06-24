import { ActionIcon, ColorInput } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import React, { useCallback, useEffect, useState } from "react";
import ParameterLabelComponent from "./ParameterLabelComponent";
import { PropsParameter } from "../../../types/components/shapediver/propsParameter";
import { useParameterComponentCommons } from "../../../hooks/shapediver/parameters/useParameterComponentCommons";

function convertFromSdColor(val: string) {
	return val.replace("0x", "#").substring(0, 7);
}

function convertToSdColor(val: string) {
	return val.replace("#", "0x") + "ff";
}

/**
 * Functional component that creates a color swatch for a color parameter.
 *
 * @returns
 */
export default function ParameterColorComponent(props: PropsParameter) {

	const {
		definition,
		handleChange,
		value: paramValue,
		onCancel,
		disabled
	} = useParameterComponentCommons<string>(props, 0, state => state.uiValue);

	const handleSdColorChange = useCallback((val: string) => {
		handleChange(convertToSdColor(val));
	}, [handleChange]);

	const [value, setValue] = useState(convertFromSdColor(paramValue));
	useEffect(() => {
		setValue(convertFromSdColor(paramValue));
	}, [paramValue]);

	return <>
		<ParameterLabelComponent { ...props } cancel={onCancel} />
		{ definition && <ColorInput
			placeholder="Pick color"
			value={value}
			rightSection={
				<ActionIcon onClick={() => handleChange(definition.defval)}>
					<IconRefresh size={16} />
				</ActionIcon>
			}
			onChange={setValue}
			onChangeEnd={handleSdColorChange}
			disabled={disabled}
			popoverProps={{withinPortal: false}}
		/> }
	</>;
}
