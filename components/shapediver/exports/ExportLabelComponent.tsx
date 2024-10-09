import { MantineThemeComponent, Text, Tooltip, useProps } from "@mantine/core";
import { useExport } from "../../../hooks/shapediver/parameters/useExport";
import React from "react";
import { PropsExport } from "../../../types/components/shapediver/propsExport";

interface StyleProps {
	fontWeight: string
}

const defaultStyleProps : Partial<StyleProps> = {
	fontWeight: "500",
};

type ParameterLabelComponentPropsType = Partial<StyleProps>;

export function ExportLabelComponentThemeProps(props: ParameterLabelComponentPropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

/**
 * Functional component that creates a label for an export.
 *
 * @returns
 */
export default function ExportLabelComponent(props: PropsExport & Partial<StyleProps>) {
	const { definition } = useExport(props);
	const { 
		fontWeight,
	} = useProps("ExportLabelComponent", defaultStyleProps, props);
	const { displayname, name, tooltip } = definition;
	const label = displayname || name;

	const labelcomp = <Text pb={4} size="sm" fw={fontWeight}>
		{label}
	</Text>;

	return <Text pb={4} size="sm" fw={fontWeight}>
		{tooltip ? <Tooltip label={tooltip} position="top">{labelcomp}</Tooltip> : labelcomp}
	</Text>;
}
