import React from "react";
import { IAppBuilderActionPropsSetParameterValue } from "../../../types/shapediver/appbuilder";
import AppBuilderActionComponent from "./AppBuilderActionComponent";

type Props = IAppBuilderActionPropsSetParameterValue & {
	sessionId: string;
};

/**
 * Functional component for an "setParameterValue" action.
 *
 * @returns
 */
export default function AppBuilderActionSetParameterValueComponent(props: Props) {
	
	const { label = "Set parameter", icon, tooltip } = props;

	// TODO: Implement the action
	
	return <AppBuilderActionComponent 
		label={label}
		icon={icon}
		tooltip={tooltip}
	/>;
}