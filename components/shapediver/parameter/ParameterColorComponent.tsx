import { ActionIcon, ColorInput, MantineThemeComponent, useProps } from "@mantine/core";
import React, { useCallback, useEffect, useState } from "react";
import ParameterLabelComponent from "./ParameterLabelComponent";
import { PropsParameter } from "../../../types/components/shapediver/propsParameter";
import { useParameterComponentCommons } from "../../../hooks/shapediver/parameters/useParameterComponentCommons";
import Icon from "../../ui/Icon";
import { IconTypeEnum } from "../../../types/shapediver/icons";
import { ColorFormatType, convertFromSdColor, convertToSdColor } from "../../../utils/misc/colors";

interface StyleProps {
	colorFormat: ColorFormatType
}

const defaultStyleProps : StyleProps = {
	colorFormat: "rgba",
};

type ParameterColorComponentPropsType = Partial<StyleProps>;

export function ParameterColorComponentThemeProps(props: ParameterColorComponentPropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

/**
 * Functional component that creates a color swatch for a color parameter.
 *
 * @returns
 */
export default function ParameterColorComponent(props: PropsParameter) {

	const { 
		colorFormat,
	} = useProps("ParameterColorComponent", defaultStyleProps, defaultStyleProps);

	const {
		definition,
		handleChange,
		value: paramValue,
		onCancel,
		disabled
	} = useParameterComponentCommons<string>(props, 0, state => state.uiValue);

	const handleSdColorChange = useCallback((val: string) => {
		handleChange(convertToSdColor(val, colorFormat));
	}, [handleChange, colorFormat]);

	const [value, setValue] = useState(convertFromSdColor(paramValue, colorFormat));
	useEffect(() => {
		setValue(convertFromSdColor(paramValue, colorFormat));
	}, [paramValue, colorFormat]);

	return <>
		<ParameterLabelComponent { ...props } cancel={onCancel} />
		{ definition && <ColorInput
			placeholder="Pick color"
			value={value}
			rightSection={
				<ActionIcon onClick={() => handleChange(definition.defval)}>
					<Icon type={IconTypeEnum.Refresh} />
				</ActionIcon>
			}
			onChange={setValue}
			onChangeEnd={handleSdColorChange}
			disabled={disabled}
			popoverProps={{withinPortal: false}}
			format={colorFormat}
		/> }
	</>;
}
