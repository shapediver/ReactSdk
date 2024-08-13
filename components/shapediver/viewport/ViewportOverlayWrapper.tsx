import { MantineThemeComponent, useProps } from "@mantine/core";
import React from "react";
import OverlayWrapper, { OverlayStyleProps, OverlayPosition } from "../ui/OverlayWrapper";

interface Props {
	children?: React.ReactNode;
}

const defaultStyleProps: OverlayStyleProps = {
	position: OverlayPosition.TOP_RIGHT,
};

type ViewportOverlayWrapperThemePropsType = Partial<OverlayStyleProps>;

export function ViewportOverlayWrapperThemeProps(props: ViewportOverlayWrapperThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

export default function ViewportOverlayWrapper(props: Props & Partial<OverlayStyleProps>) {

	const { children = <></>, ...rest } = props;
	const _props = useProps("ViewportOverlayWrapper", defaultStyleProps, rest);

	return <OverlayWrapper {..._props}>
		{ children }
	</OverlayWrapper>;
}
