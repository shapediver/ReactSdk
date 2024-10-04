import React, { useContext } from "react";
import { AppBuilderContainerContext } from "../../context/AppBuilderContext";
import AppBuilderVerticalContainer from "./AppBuilderVerticalContainer";
import AppBuilderHorizontalContainer from "./AppBuilderHorizontalContainer";
import { AppBuilderContainerOrientationType, IAppBuilderContainerContext } from "../../types/context/appbuildercontext";
import { usePropsAppBuilder } from "../../hooks/ui/usePropsAppBuilder";
import { MantineThemeComponent } from "@mantine/core";

interface Props {
	children?: React.ReactNode,
}

interface StyleProps {
	orientation: AppBuilderContainerOrientationType,
}

const defaultStyleProps: StyleProps = {
	orientation: "unspecified",
};

type AppBuilderContainerThemePropsType = Partial<StyleProps>;

export function AppBuilderContainerThemeProps(props: AppBuilderContainerThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

/**
 * Wrapper for horizontal and vertical containers
 * @param props 
 * @returns 
 */
export default function AppBuilderContainer(props: Props & AppBuilderContainerThemePropsType) {
	const { 
		children,
		...rest
	} = props;

	// style properties
	const { 
		orientation,
	} = usePropsAppBuilder("AppBuilderContainer", defaultStyleProps, rest);

	const { name } = useContext(AppBuilderContainerContext);
	
	const context: IAppBuilderContainerContext = {
		orientation: !orientation || orientation === "unspecified" ? name === "top" || name === "bottom" ? "horizontal" : "vertical" : orientation,
		name
	};

	const container = context.orientation === "vertical" ? 
		<AppBuilderVerticalContainer>{children}</AppBuilderVerticalContainer> : 
		<AppBuilderHorizontalContainer>{children}</AppBuilderHorizontalContainer>;
		
	return <AppBuilderContainerContext.Provider value={context}>
		{container}
	</AppBuilderContainerContext.Provider>;
}
