import { MaterialStandardData } from "@shapediver/viewer";
import { HoverManager } from "@shapediver/viewer.features.interaction";
import { useEffect } from "react";
import { useInteractionEngine } from "./useInteractionEngine";

// #region Functions (1)

// create an object to store the hover managers for the viewports
const hoverManagers: { [key: string]: {
	hoverManager: HoverManager,
	token: string
} } = {};

/**
 * Hook allowing to create a hover manager for a viewport.
 * 
 * @param viewportId The ID of the viewport.
 * @param settings The settings for the hover manager. If the settings are not provided, the hover manager will not be created.
 */
export function useHoverManager(viewportId: string, settings?: { color?: string }): {
	/**
	 * The hover manager that was created for the viewport.
	 */
    hoverManager?: HoverManager
} {
	// call the interaction engine hook
	const { interactionEngine } = useInteractionEngine(viewportId);

	// use an effect to create the hover manager
	useEffect(() => {
		if (interactionEngine && settings) {
			if(!hoverManagers[viewportId]) {
				const hoverManager = new HoverManager();
				hoverManager.effectMaterial = new MaterialStandardData({ color: settings.color || "#00ff78" });
				const token = interactionEngine.addInteractionManager(hoverManager);
				hoverManagers[viewportId] = { hoverManager, token };
			}
		}

		return () => {
			// clean up the hover manager
			if (hoverManagers[viewportId]) {
				if(interactionEngine)
					interactionEngine.removeInteractionManager(hoverManagers[viewportId].token);
				delete hoverManagers[viewportId];
			}
		};
	}, [interactionEngine, settings]);

	return {
		hoverManager: hoverManagers[viewportId]?.hoverManager
	};
}

// #endregion Functions (1)
