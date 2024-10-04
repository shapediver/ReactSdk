import React, { } from "react";
import { MantineThemeComponent, Paper, PaperProps, Stack } from "@mantine/core";
import { IAppBuilderWidgetPropsActions, isAddToCartAction, isCloseConfiguratorAction, isCreateModelStateAction, isSetBrowserLocationAction, isSetParameterValueAction } from "../../../../types/shapediver/appbuilder";
import AppBuilderActionAddToCartComponent from "../actions/AppBuilderActionAddToCartComponent";
import AppBuilderActionSetParameterValueComponent from "../actions/AppBuilderActionSetParameterValueComponent";
import AppBuilderActionSetBrowserLocationComponent from "../actions/AppBuilderActionSetBrowserLocationComponent";
import AppBuilderActionCloseConfiguratorComponent from "../actions/AppBuilderActionCloseConfiguratorComponent";
import AppBuilderActionCreateModelStateComponent from "../actions/AppBuilderActionCreateModelStateComponent";

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

	//const themeProps = useProps("AppBuilderActionsWidgetComponent", defaultStyleProps, rest);
	
	if (!actions || actions.length === 0) {
		return <></>;
	}

	const actionComponents = actions.map((action, i) => {
		if (isCreateModelStateAction(action))
			return <AppBuilderActionCreateModelStateComponent key={i} sessionId={sessionId} {...action.props} />;
		else if (isAddToCartAction(action))
			return <AppBuilderActionAddToCartComponent key={i} sessionId={sessionId} {...action.props} />;
		else if (isCloseConfiguratorAction(action))
			return <AppBuilderActionCloseConfiguratorComponent key={i} {...action.props} />;
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
