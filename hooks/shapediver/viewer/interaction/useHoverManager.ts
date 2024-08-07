import { IInteractionParameterSettings, MaterialStandardData } from "@shapediver/viewer";
import { HoverManager } from "@shapediver/viewer.features.interaction";
import { useState, useRef, useEffect } from "react";
import { useShapeDiverStoreViewer } from "shared/store/useShapeDiverStoreViewer";
import { useInteractionEngine } from "./useInteractionEngine";

// #region Functions (1)

/**
 * Hook allowing to create the hoverManager.
 * 
 * @param viewportId 
 */
export function useHoverManager(viewportId: string, settings?: IInteractionParameterSettings): {
	/**
	 * The hover manager.
	 */
    hoverManager?: HoverManager
} {
	// get the viewport API
	const viewportApi = useShapeDiverStoreViewer(state => { return state.viewports[viewportId]; });

	// call the interaction engine hook
	const { interactionEngine } = useInteractionEngine(viewportId);

	// create a state for the hover manager
	const [hoverManager, setHoverManager] = useState<HoverManager | undefined>(undefined);
	// create a reference for the hover manager token
	const hoverManagerTokenRef = useRef<string | undefined>(undefined);

	// use an effect to apply changes to the material, and to apply the callback once the node is available
	useEffect(() => {
		if (viewportApi && interactionEngine && settings) {
			const hoverManager = new HoverManager();
			hoverManager.effectMaterial = new MaterialStandardData({ color: settings.props.hoverColor || "#00ff78" });
			setHoverManager(hoverManager);
			hoverManagerTokenRef.current = interactionEngine.addInteractionManager(hoverManager);
		}

		return () => {
			// clean up the hover manager
			if (hoverManager) {
				if(hoverManagerTokenRef.current && interactionEngine)
					interactionEngine.removeInteractionManager(hoverManagerTokenRef.current);
				hoverManagerTokenRef.current = undefined;
				setHoverManager(undefined);
			}
		};
	}, [viewportApi, interactionEngine, settings]);

	return {
		hoverManager
	};
}

// #endregion Functions (1)
