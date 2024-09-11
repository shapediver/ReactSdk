import React, { } from "react";
import { MantineThemeComponent, Paper, PaperProps, Stack } from "@mantine/core";
import { IAppBuilderWidgetPropsActions, isAddToCartAction, isSetBrowserLocationAction, isSetParameterValueAction } from "../../../types/shapediver/appbuilder";
//import { usePropsAppBuilder } from "../../../hooks/ui/usePropsAppBuilder";
import AppBuilderActionAddToCartComponent from "./AppBuilderActionAddToCartComponent";
import AppBuilderActionSetParameterValueComponent from "./AppBuilderActionSetParameterValueComponent";
import AppBuilderActionSetBrowserLocationComponent from "./AppBuilderActionSetBrowserLocationComponent";

type StylePros = PaperProps;

// const defaultStyleProps : Partial<StylePros> = {
// };

type AppBuilderActionsWidgetThemePropsType = Partial<StylePros>;

export function AppBuilderActionWidgetThemeProps(props: AppBuilderActionsWidgetThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

type Props = IAppBuilderWidgetPropsActions & {
	sessionId: string;
};

export default function AppBuilderActionsWidgetComponent(props: Props & AppBuilderActionsWidgetThemePropsType) {
	
	const { 
		actions, 
		sessionId, 
		//...rest 
	} = props;

	//const themeProps = usePropsAppBuilder("AppBuilderActionsWidgetComponent", defaultStyleProps, rest);
	
	if (!actions || actions.length === 0) {
		return <></>;
	}

	const actionComponents = actions.map((action, i) => {
		if (isAddToCartAction(action))
			return <AppBuilderActionAddToCartComponent key={i} sessionId={sessionId} {...action.props} />;
		else if (isSetParameterValueAction(action))
			return <AppBuilderActionSetParameterValueComponent key={i} sessionId={sessionId} {...action.props} />;
		else if (isSetBrowserLocationAction(action))
			return <AppBuilderActionSetBrowserLocationComponent key={i} {...action.props} />;
		else
			return null;
	});

	if (actions.length === 1)
		return actionComponents[0];

	return <Paper>
		<Stack>
			{ actionComponents }
		</Stack>
	</Paper>;
}
