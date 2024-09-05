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
	
	/**
	 * TODO: Implement the action
	 * 
	 *   * check if we are running inside an iframe whose parent implements the required iframe API
	 *   * if not, show some debug message or popup
	 *   * create a model state
	 *   * call the iframe API method to add the model to the cart
	 *   * await the result
	 *   * display a success or error message or popup
	 * 
	 */

	return <AppBuilderActionComponent 
		label={label}
		icon={icon}
		tooltip={tooltip}
	/>;
}