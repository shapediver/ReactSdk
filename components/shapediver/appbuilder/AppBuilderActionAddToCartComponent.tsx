import React, { useCallback, useContext } from "react";
import { IAppBuilderActionPropsAddToCart } from "../../../types/shapediver/appbuilder";
import AppBuilderActionComponent from "./AppBuilderActionComponent";
import { ECommerceApiSingleton } from "../../../modules/ecommerce/singleton";
import { NotificationContext } from "../../../context/NotificationContext";
import { useShapeDiverStoreViewer } from "shared/store/useShapeDiverStoreViewer";

type Props = IAppBuilderActionPropsAddToCart & {
	sessionId: string;
};

/**
 * Functional component for an "addToCart" action.
 *
 * @returns
 */
export default function AppBuilderActionAddToCartComponent(props: Props) {
	
	const { 
		label = "Add to cart", 
		icon, 
		tooltip, 
		sessionId,
		productId,
		quantity,
		price,
		description,
	} = props;
	const sessionApi = useShapeDiverStoreViewer(state => state.sessions[sessionId]);
	const notifications = useContext(NotificationContext);

	const onClick = useCallback(async () => {
		// TODO check whether we are running inside an iframe
		const api = await ECommerceApiSingleton;
		const modelStateId = await sessionApi.createModelState();
		const result = await api.addItemToCart({
			modelStateId,
			productId,
			quantity,
			price,
			description,
		});
		// TODO display modal instead of notification, offer possibility to hide configurator
		notifications.show({message: `Item for state ${modelStateId} added to cart: ${result.id}`});
	}, [
		productId,
		quantity,
		price,
		description,
	]);

	return <AppBuilderActionComponent 
		label={label}
		icon={icon}
		tooltip={tooltip}
		onClick={onClick}
	/>;
}
