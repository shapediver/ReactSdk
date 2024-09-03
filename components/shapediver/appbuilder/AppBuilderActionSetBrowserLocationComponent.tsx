import React from "react";
import { IAppBuilderActionPropsSetBrowserLocation } from "../../../types/shapediver/appbuilder";
import AppBuilderActionComponent from "./AppBuilderActionComponent";

type Props = IAppBuilderActionPropsSetBrowserLocation;

/**
 * Functional component for an "setBrowserLocation" action.
 *
 * @returns
 */
export default function AppBuilderActionSetBrowserLocationComponent(props: Props) {
	
	const { label = "Set location", icon, tooltip } = props;
	
	// TODO: Implement the action

	return <AppBuilderActionComponent 
		label={label}
		icon={icon}
		tooltip={tooltip}
	/>;
}