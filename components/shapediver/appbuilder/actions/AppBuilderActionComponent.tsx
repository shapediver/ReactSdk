import { Button, ButtonProps, Tooltip, PolymorphicComponentProps } from "@mantine/core";
import React from "react";
import Icon from "../../../ui/Icon";
import { IAppBuilderActionPropsCommon } from "../../../../types/shapediver/appbuilder";

type ButtonComponentProps<C = "button"> = PolymorphicComponentProps<C, ButtonProps>;

type Props = IAppBuilderActionPropsCommon & ButtonComponentProps;

/**
 * Functional component common to all action components.
 *
 * @returns
 */
export default function AppBuilderActionComponent(props: Props) {
	const { label, icon, tooltip, ...rest } = props;

	const button = <Button 
		leftSection={icon ? <Icon type={icon} /> : undefined} 
		{...rest} 
	>
		{label}
	</Button>;

	if (tooltip) {
		return <Tooltip label={tooltip}>{button}</Tooltip>;
	}
	
	return button;
}
