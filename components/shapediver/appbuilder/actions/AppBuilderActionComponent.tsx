import { Button, ButtonProps, PolymorphicComponentProps, CloseButton } from "@mantine/core";
import React from "react";
import Icon from "../../../ui/Icon";
import { IAppBuilderActionPropsCommon } from "../../../../types/shapediver/appbuilder";
import { IconTypeEnum } from "../../../../types/shapediver/icons";
import TooltipWrapper from "../../../ui/TooltipWrapper";

type ButtonComponentProps<C = "button"> = PolymorphicComponentProps<C, ButtonProps>;

type Props = IAppBuilderActionPropsCommon & ButtonComponentProps;

/**
 * Functional component common to all action components.
 *
 * @returns
 */
export default function AppBuilderActionComponent(props: Props) {
	const { label, icon, tooltip, onClick, ...rest } = props;
	const iconOnly = !label && icon;
	const useCloseButton = iconOnly && icon === IconTypeEnum.X;
	const _onclick = onClick === null ? undefined : onClick;

	const button = useCloseButton ? <CloseButton onClick={_onclick} /> : <Button 
		leftSection={!iconOnly && icon ? <Icon type={icon} /> : undefined} 
		{...rest} 
		onClick={_onclick}
	>
		{iconOnly ? <Icon type={icon} /> : label}
	</Button>;

	if (tooltip) {
		return <TooltipWrapper label={tooltip}>{button}</TooltipWrapper>;
	}
	
	return button;
}
