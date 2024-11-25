import { MantineThemeComponent } from "@mantine/core";
import { OverlayStyleProps } from "shared/components/shapediver/ui/OverlayWrapper";

export interface ViewportOverlayWrapperProps {
	children?: React.ReactNode;
}

type ViewportOverlayWrapperThemePropsType = Partial<OverlayStyleProps>;

export function ViewportOverlayWrapperThemeProps(props: ViewportOverlayWrapperThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}