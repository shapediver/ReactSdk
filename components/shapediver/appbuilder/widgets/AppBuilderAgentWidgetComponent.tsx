import React, { useContext } from "react";
import { MantineStyleProp, MantineThemeComponent, Paper, PaperProps, useProps } from "@mantine/core";
import { IAppBuilderWidgetPropsAgent } from "../../../../types/shapediver/appbuilder";
import MarkdownWidgetComponent from "../../ui/MarkdownWidgetComponent";
import { AppBuilderContainerContext } from "../../../../context/AppBuilderContext";

/** Style properties that can be controlled via the theme. */
type StylePros = PaperProps & {
	
};

/** Default values for style properties. */
const defaultStyleProps : Partial<StylePros> = {
};

type AppBuilderAgentWidgetThemePropsType = Partial<StylePros>;

export function AppBuilderAgentWidgetThemeProps(props: AppBuilderAgentWidgetThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

export default function AppBuilderAgentWidgetComponent(props: IAppBuilderWidgetPropsAgent & AppBuilderAgentWidgetThemePropsType) {
	
	const { context, ...rest } = props;

	const themeProps = useProps("AppBuilderAgentWidgetComponent", defaultStyleProps, rest);
	
	const containerContext = useContext(AppBuilderContainerContext);

	const styleProps: MantineStyleProp = {};
	if (containerContext.orientation === "horizontal") {
		styleProps.height = "100%";
	} else if (containerContext.orientation === "vertical") {
		styleProps.overflowX = "auto";
	}
	styleProps.fontWeight = "100";

	return <Paper {...themeProps} style={styleProps}>
		<MarkdownWidgetComponent>
			{ `Context: ${context}` }
		</MarkdownWidgetComponent>
	</Paper>;
}
