import React, { useCallback, useContext } from "react";
import { IAppBuilderActionPropsAddToCart } from "../../../types/shapediver/appbuilder";
import AppBuilderActionComponent from "./AppBuilderActionComponent";
import { ECommerceApiSingleton } from "../../../modules/ecommerce/singleton";
import { NotificationContext } from "../../../context/NotificationContext";
import { useShapeDiverStoreViewer } from "../../../store/useShapeDiverStoreViewer";
import { useViewportId } from "../../../hooks/shapediver/viewer/useViewportId";
import { useShallow } from "zustand/react/shallow";

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
		//image, // TODO use image defined by export of href
		createGltf
	} = props;
	const { viewportId } = useViewportId();
	const { sessionApi, viewportApi } = useShapeDiverStoreViewer(useShallow(state => ({
		sessionApi: state.sessions[sessionId],
		viewportApi: state.viewports[viewportId],
	})));
	const notifications = useContext(NotificationContext);

	const onClick = useCallback(async () => {
		// in case we are not running inside an iframe, the instance of 
		// IEcommerceApi will be a dummy for testing
		const api = await ECommerceApiSingleton;
		const modelStateId = await sessionApi.createModelState(
			undefined, // <-- use parameter values of the session
			false, // <-- use parameter values of the session
			() => viewportApi.getScreenshot(),
			undefined, // <-- custom data
			createGltf ? async () => viewportApi.convertToGlTF() : undefined
		);
		try {
			const result = await api.addItemToCart({
				modelStateId,
				productId,
				quantity,
				price,
				description,
			});
			// TODO display modal instead of notification, offer possibility to hide configurator
			notifications.show({message: `An item for configuration ID ${modelStateId} has been added to the cart (cart item id ${result.id}).`});
		} catch (e) {
			notifications.show({message: `An error happened while adding configuration ID ${modelStateId} to the cart.`});
			// TODO report error to sentry
			throw e;
		}
	}, [
		productId,
		quantity,
		price,
		description,
		sessionApi,
		viewportApi,
		createGltf
	]);

	return <AppBuilderActionComponent 
		label={label}
		icon={icon}
		tooltip={tooltip}
		onClick={onClick}
	/>;
}
