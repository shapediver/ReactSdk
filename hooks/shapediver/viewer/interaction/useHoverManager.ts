import { IInteractionParameterProps, MaterialStandardData } from "@shapediver/viewer";
import { HoverManager, InteractionEngine } from "@shapediver/viewer.features.interaction";
import { useEffect, useState } from "react";
import { useInteractionEngine } from "./useInteractionEngine";

// #region Functions (1)

// create an object to store the hover managers for the viewports
const hoverManagers: {
	[key: string]: {
		hoverManager: HoverManager,
		token: string
	}
} = {};

/**
 * Clean up the hover manager for the given viewportId.
 *
 * @param viewportId - The ID of the viewport.
 * @param interactionEngine - The interaction engine instance.
 */
const cleanUpHoverManager = (viewportId: string, interactionEngine?: InteractionEngine) => {
	if (hoverManagers[viewportId]) {
		if (interactionEngine)
			interactionEngine.removeInteractionManager(hoverManagers[viewportId].token);
		delete hoverManagers[viewportId];
	}
};

/**
 * Hook providing hover managers for viewports. 
 * Use the useNodeInteractionData hook to add interaction data to nodes of the
 * scene tree and make them hoverable.
 * 
 * @param viewportId The ID of the viewport.
 * @param settings The settings for the hover manager. If the settings are not provided, the hover manager will not be created.
 */
export function useHoverManager(viewportId: string, settings?: Pick<IInteractionParameterProps, "hoverColor">): {
	/**
	 * The hover manager that was created for the viewport.
	 */
	hoverManager?: HoverManager
} {
	// call the interaction engine hook
	const { interactionEngine } = useInteractionEngine(viewportId);

	// define a state for the select manager
	const [hoverManager, setHoverManager] = useState<HoverManager | undefined>(undefined);

	// use an effect to create the hover manager
	useEffect(() => {
		if (settings && interactionEngine && !hoverManagers[viewportId]) {
			const hoverManager = new HoverManager();
			hoverManager.effectMaterial = new MaterialStandardData({ color: settings.hoverColor || "#00ff78" });
			const token = interactionEngine.addInteractionManager(hoverManager);
			hoverManagers[viewportId] = { hoverManager, token };
			setHoverManager(hoverManagers[viewportId].hoverManager);
		}

		return () => {
			// clean up the hover manager
			if (hoverManagers[viewportId]) {
				cleanUpHoverManager(viewportId, interactionEngine);
				setHoverManager(undefined);
			}
		};
	}, [interactionEngine, settings]);

	return {
		hoverManager
	};
}

// #endregion Functions (1)
