import { MantineThemeComponent, Tooltip, TooltipProps, useMantineTheme, useProps } from "@mantine/core";
import React, {  } from "react";

interface TooltipWrapperProps {
	floating?: boolean;
}

const defaultStyleProps: Partial<TooltipWrapperProps & TooltipProps> = {
	withArrow: true,
};

type TooltipWrapperThemePropsType = Partial<TooltipWrapperProps & TooltipProps>;

export function TooltipWrapperThemeProps(props: TooltipWrapperThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

/**
 * Wrapper for tooltips.
 * @param props 
 * @returns 
 */
export default function TooltipWrapper(props: TooltipWrapperProps & TooltipProps) {

	const { children = <></>, ...rest } = props;
	const { color, floating, ..._props } = useProps("TooltipWrapper", defaultStyleProps, rest);
	const theme = useMantineTheme();

	return floating ? <Tooltip.Floating
		color={color ?? theme.primaryColor} 
		label={_props.label}
		position={_props.position}
		withinPortal={_props.withinPortal}
		portalProps={_props.portalProps}
		radius={_props.radius}
		multiline={_props.multiline}
		zIndex={_props.zIndex}
	>
		{ children }
	</Tooltip.Floating> : <Tooltip
		color={color ?? theme.primaryColor} 
		{..._props}
	>
		{ children }
	</Tooltip>;
}
