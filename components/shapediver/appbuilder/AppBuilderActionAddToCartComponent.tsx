import React from "react";
import { IAppBuilderActionPropsAddToCart } from "../../../types/shapediver/appbuilder";
import AppBuilderActionComponent from "./AppBuilderActionComponent";

type Props = IAppBuilderActionPropsAddToCart;

/**
 * Functional component for an "addToCart" action.
 *
 * @returns
 */
export default function AppBuilderActionAddToCartComponent(props: Props) {
	
	const { label = "Add to cart", icon, tooltip } = props;
	
	// TODO: Implement the action

	return <AppBuilderActionComponent 
		label={label}
		icon={icon}
		tooltip={tooltip}
	/>;
}