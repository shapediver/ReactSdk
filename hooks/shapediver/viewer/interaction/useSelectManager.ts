import { ISelectionParameterSettings, MaterialStandardData } from "@shapediver/viewer";
import { SelectManager, MultiSelectManager, InteractionEngine } from "@shapediver/viewer.features.interaction";
import { useEffect } from "react";
import { useInteractionEngine } from "./useInteractionEngine";

// #region Functions (1)

// create an object to store the select managers or the multi select managers for the viewports
const selectManagers: { [key: string]: {
	selectManager: SelectManager | MultiSelectManager,
	selectMultiple: boolean,
	token: string
} } = {};

/**
 * Clean up the select manager for the given viewportId.
 * We also deselect all selected nodes.
 *
 * @param viewportId - The ID of the viewport.
 * @param interactionEngine - The interaction engine instance.
 */
const cleanUpSelectManager = (viewportId: string, interactionEngine?: InteractionEngine) => {
	if (selectManagers[viewportId]) {
		if (selectManagers[viewportId].selectManager instanceof SelectManager) {
			(selectManagers[viewportId].selectManager as SelectManager).deselect();
		} else if (selectManagers[viewportId].selectManager instanceof MultiSelectManager) {
			(selectManagers[viewportId].selectManager as MultiSelectManager).deselectAll();
		}
		if(interactionEngine)
			interactionEngine.removeInteractionManager(selectManagers[viewportId].token);
		delete selectManagers[viewportId];
	}
};

/**
 * Hook allowing to create a select manager for a viewport.
 * 
 * @param viewportId The ID of the viewport.
 * @param settings The settings for the select manager. If the settings are not provided, the select manager will not be created.
 */
export function useSelectManager(viewportId: string, settings?: Pick<ISelectionParameterSettings, "minimumSelection" | "maximumSelection" | "selectionColor">): {
	/**
	 * The select manager that was created for the viewport.
	 * Depending on the settings, this can be a select manager or a multi select manager.
	 */
	selectManager?: SelectManager | MultiSelectManager
} {
	// call the interaction engine hook
	const { interactionEngine } = useInteractionEngine(viewportId);

	// use an effect to create the select manager
	useEffect(() => {
		if (settings) {
			// whenever this output node changes, we want to create the interaction engine
			const selectMultiple = (settings.minimumSelection !== undefined && settings.maximumSelection !== undefined) &&
				settings.minimumSelection <= settings.maximumSelection && settings.maximumSelection > 1;

			// check if a select manager already exists for the viewport, but with different settings
			// in this case we need to remove the old select manager and create a new one
			if (selectManagers[viewportId] && selectManagers[viewportId].selectMultiple !== selectMultiple) {
				cleanUpSelectManager(viewportId, interactionEngine);
			}

			if (interactionEngine) {
				// depending on the settings, create a select manager or a multi select manager
				if (selectMultiple) {
					const selectManager = new MultiSelectManager();
					selectManager.effectMaterial = new MaterialStandardData({ color: settings.selectionColor || "#0d44f0" });
					selectManager.minimumNodes = settings.minimumSelection!;
					selectManager.maximumNodes = settings.maximumSelection!;
					selectManager.deselectOnEmpty = false;

					const token = interactionEngine.addInteractionManager(selectManager);
					selectManagers[viewportId] = { selectManager, token, selectMultiple };
				} else {
					const selectManager = new SelectManager();
					selectManager.effectMaterial = new MaterialStandardData({ color: settings.selectionColor || "#0d44f0" });
					selectManager.deselectOnEmpty = false;

					const token = interactionEngine.addInteractionManager(selectManager);
					selectManagers[viewportId] = { selectManager, token, selectMultiple };
				}
			}
		}

		return () => {
			// clean up the select manager
			if (selectManagers[viewportId]) {
				cleanUpSelectManager(viewportId, interactionEngine);
			}
		};
	}, [interactionEngine, settings]);

	return {
		selectManager: selectManagers[viewportId]?.selectManager
	};
}

// #endregion Functions (1)
