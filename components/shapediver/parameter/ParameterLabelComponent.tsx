import { Group, MantineThemeComponent, Text, useProps } from "@mantine/core";
import { useParameter } from "../../../hooks/shapediver/parameters/useParameter";
import React from "react";
import { PropsParameter } from "../../../types/components/shapediver/propsParameter";
import Icon from "../../ui/Icon";
import { IconTypeEnum } from "../../../types/shapediver/icons";

interface Props extends PropsParameter {
	cancel?: () => void
}

interface StyleProps {
	fontWeight: string
}

const defaultStyleProps : Partial<StyleProps> = {
	fontWeight: "500",
};

type ParameterLabelComponentPropsType = Partial<StyleProps>;

export function ParameterLabelComponentThemeProps(props: ParameterLabelComponentPropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

/**
 * Functional component that creates a label for a parameter or .
 *
 * @returns
 */
export default function ParameterLabelComponent(props: Props & Partial<StyleProps>) {
	const { cancel, ...rest } = props;
	const { 
		fontWeight,
	} = useProps("ParameterLabelComponent", defaultStyleProps, rest);
	const { definition } = useParameter<any>(props);

	return <Group justify="space-between" w="100%" wrap="nowrap">
		<Text pb={4} size="sm" fw={fontWeight}>
			{definition.displayname || definition.name}
		</Text>
		{cancel && <Icon type={IconTypeEnum.X} color="red" onClick={cancel} />}
	</Group>;
}
