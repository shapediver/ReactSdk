import React, { useCallback, useContext } from "react";
import { IAppBuilderActionPropsCloseConfigurator } from "../../../../types/shapediver/appbuilder";
import AppBuilderActionComponent from "./AppBuilderActionComponent";
import { ECommerceApiSingleton } from "../../../../modules/ecommerce/singleton";
import { NotificationContext } from "../../../../context/NotificationContext";
import { IconTypeEnum } from "shared/types/shapediver/icons";

type Props = IAppBuilderActionPropsCloseConfigurator & {
};

/**
 * Functional component for an "addToCart" action.
 *
 * @returns
 */
export default function AppBuilderActionCloseConfiguratorComponent(props: Props) {
	
	const { 
		label = "Close configurator", 
		icon = IconTypeEnum.X, 
		tooltip, 
	} = props;
	const notifications = useContext(NotificationContext);

	const onClick = useCallback(async () => {
		// in case we are not running inside an iframe, the instance of 
		// IEcommerceApi will be a dummy for testing
		const api = await ECommerceApiSingleton;
		const result = await api.closeConfigurator();
		if (!result)
			notifications.show({message: "Could not close configurator."});
	}, []);

	return <AppBuilderActionComponent 
		label={label}
		icon={icon}
		tooltip={tooltip}
		onClick={onClick}
	/>;
}
