import { InteractionEngine } from "@shapediver/viewer.features.interaction";
import { useEffect, useRef, useState } from "react";
import { useShapeDiverStoreViewer } from "shared/store/useShapeDiverStoreViewer";

// #region Functions (1)

/**
 * Hook allowing to create the interaction engine.
 * 
 * @param viewportId 
 */
export function useInteractionEngine(viewportId: string): {
	/**
	 * The interaction engine.
	 */
    interactionEngine?: InteractionEngine
} {
	// get the viewport API
	const viewportApi = useShapeDiverStoreViewer(state => { return state.viewports[viewportId]; });

	// create a state for the interaction engine
	const [interactionEngine, setInteractionEngine] = useState<InteractionEngine | undefined>(undefined);
	const interactionEngineRef = useRef<InteractionEngine | undefined>(undefined);

	// use an effect to apply changes to the material, and to apply the callback once the node is available
	useEffect(() => {
		if (viewportApi) {
			// whenever this output node changes, we want to create the interaction engine
			const interactionEngine = new InteractionEngine(viewportApi);
			interactionEngineRef.current = interactionEngine;
			setInteractionEngine(interactionEngine);
		}

		return () => {
			console.log("Cleaning up interaction engine");
			// clean up the interaction engine
			if (interactionEngine) {
				interactionEngine.close();
				console.log("Interaction engine closed");
				interactionEngineRef.current = undefined;
				setInteractionEngine(undefined);
			}
		};
	}, [viewportApi]);

	return {
		interactionEngine: interactionEngineRef.current
	};
}

// #endregion Functions (1)
