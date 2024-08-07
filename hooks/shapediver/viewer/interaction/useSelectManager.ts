import { IInteractionParameterSettings, isInteractionSelectionParameterSettings, MaterialStandardData } from "@shapediver/viewer";
import { SelectManager, MultiSelectManager } from "@shapediver/viewer.features.interaction";
import { useState, useRef, useEffect } from "react";
import { useShapeDiverStoreViewer } from "shared/store/useShapeDiverStoreViewer";
import { useInteractionEngine } from "./useInteractionEngine";

// #region Functions (1)

/**
 * Hook allowing to create a select manager for a viewport.
 * 
 * @param viewportId 
 */
export function useSelectManager(viewportId: string, settings?: IInteractionParameterSettings): {
	/**
	 * The select manager, if the parameter settings only allow single selection.
	 */
	selectManager?: SelectManager,
	/**
	 * The multi select manager, if the parameter settings allow multiple selection.
	 */
	multiSelectManager?: MultiSelectManager
} {
	// get the viewport API
	const viewportApi = useShapeDiverStoreViewer(state => { return state.viewports[viewportId]; });

	// call the interaction engine hook
	const { interactionEngine } = useInteractionEngine(viewportId);

	// create a state for the select manager
	const [selectManager, setSelectManager] = useState<SelectManager | undefined>(undefined);
	// create a reference for the select manager token
	const selectManagerTokenRef = useRef<string | undefined>(undefined);

	// create a state for the multi select manager
	const [multiSelectManager, setMultiSelectManager] = useState<MultiSelectManager | undefined>(undefined);
	// create a reference for the multi select manager token
	const multiSelectManagerTokenRef = useRef<string | undefined>(undefined);

	// check if the settings are selection settings
	const selection = isInteractionSelectionParameterSettings(settings) ? settings : undefined;

	// use an effect to apply changes to the material, and to apply the callback once the node is available
	useEffect(() => {
		if (viewportApi && interactionEngine && settings) {
			// whenever this output node changes, we want to create the interaction engine
			if (selection) {
				const selectMultiple = (selection.props.minimumSelection !== undefined && selection.props.maximumSelection !== undefined) &&
					selection.props.minimumSelection < selection.props.maximumSelection && selection.props.maximumSelection > 1;

				// depending on the settings, create a select manager or a multi select manager
				if (selectMultiple) {
					const multiSelect = new MultiSelectManager();
					multiSelect.effectMaterial = new MaterialStandardData({ color: selection.props.selectionColor || "#0d44f0" });
					multiSelect.minimumNodes = selection.props.minimumSelection!;
					multiSelect.maximumNodes = selection.props.maximumSelection!;
					multiSelect.deselectOnEmpty = false;
					multiSelect.useModifierKeys = true;

					multiSelectManagerTokenRef.current = interactionEngine.addInteractionManager(multiSelect);
					setMultiSelectManager(multiSelect);
				} else {
					const select = new SelectManager();
					select.deselectOnEmpty = false;
					select.effectMaterial = new MaterialStandardData({ color: selection.props.selectionColor || "#0d44f0" });
					select.deselectOnEmpty = false;
					select.useModifierKeys = true;

					selectManagerTokenRef.current = interactionEngine.addInteractionManager(select);
					setSelectManager(select);
				}
			}
		}

		return () => {
			// clean up the select manager
			if (selectManager) {
				selectManager.deselect();
				if(selectManagerTokenRef.current && interactionEngine)
					interactionEngine.removeInteractionManager(selectManagerTokenRef.current);
				selectManagerTokenRef.current = undefined;
				setSelectManager(undefined);
			}

			// clean up the multi select manager
			if (multiSelectManager) {
				multiSelectManager.deselectAll();
				if(multiSelectManagerTokenRef.current && interactionEngine) 
					interactionEngine.removeInteractionManager(multiSelectManagerTokenRef.current);
				multiSelectManagerTokenRef.current = undefined;
				setMultiSelectManager(undefined);
			}
		};
	}, [viewportApi, interactionEngine, settings]);

	return {
		selectManager,
		multiSelectManager
	};
}

// #endregion Functions (1)
