import { useEffect, useRef, useState } from "react";
import { useShapeDiverStoreViewer } from "../../../store/useShapeDiverStoreViewer";
import { HoverManager, InteractionData, InteractionEngine, MultiSelectManager, SelectManager } from "@shapediver/viewer.features.interaction";
import { ITreeNode, MaterialStandardData } from "@shapediver/viewer";
import { vec3 } from "gl-matrix";
import { IInteractionParameterDefinition, isInteractionSelectionParameterDefinition } from "shared/types/shapediver/appbuilderinteractiontypes";

/**
 * Hook allowing to create the interaction engine and the managers that are specified via the settings.
 * 
 * @param viewportId 
 */
export function useInteraction(viewportId: string, settings?: IInteractionParameterDefinition, selectedNodes?: ITreeNode[]): {
    interactionEngine?: InteractionEngine,
    selectManager?: SelectManager,
    multiSelectManager?: MultiSelectManager,
    hoverManager?: HoverManager
} {
	// get the viewport API
	const viewportApi = useShapeDiverStoreViewer(state => { return state.viewports[viewportId]; });

	// create a state for the interaction engine
	const [interactionEngine, setInteractionEngine] = useState<InteractionEngine | undefined>(undefined);
	// create a reference for the interaction engine
	const interactionEngineRef = useRef<InteractionEngine | undefined>(undefined);

	// create a state for the select manager
	const [selectManager, setSelectManager] = useState<SelectManager | undefined>(undefined);
	// create a reference for the select manager
	const selectManagerRef = useRef<SelectManager | undefined>(undefined);

	// create a state for the multi select manager
	const [multiSelectManager, setMultiSelectManager] = useState<MultiSelectManager | undefined>(undefined);
	// create a reference for the multi select manager
	const multiSelectManagerRef = useRef<MultiSelectManager | undefined>(undefined);

	// create a state for the hover manager
	const [hoverManager, setHoverManager] = useState<HoverManager | undefined>(undefined);
	// create a reference for the hover manager
	const hoverManagerRef = useRef<HoverManager | undefined>(undefined);

	// use an effect to apply changes to the material, and to apply the callback once the node is available
	useEffect(() => {
		if (viewportApi && settings) {
			// whenever this output node changes, we want to create the interaction engine
			interactionEngineRef.current = new InteractionEngine(viewportApi);
			setInteractionEngine(interactionEngineRef.current);

			const selection = isInteractionSelectionParameterDefinition(settings) ? settings : undefined;
			// const dragging = isInteractionDraggingParameterDefinition(settings) ? settings : undefined;
			// const gumball = isInteractionGumballParameterDefinition(settings) ? settings : undefined;

			if (selection) {
				const selectMultiple = (selection.props.minimumSelection !== undefined && selection.props.maximumSelection !== undefined) &&
					selection.props.minimumSelection < selection.props.maximumSelection && selection.props.maximumSelection > 1;

				if (selectMultiple) {
					multiSelectManagerRef.current = new MultiSelectManager();
					multiSelectManagerRef.current.effectMaterial = new MaterialStandardData({ color: "red" });
					multiSelectManagerRef.current.minimumNodes = selection.props.minimumSelection!;
					multiSelectManagerRef.current.maximumNodes = selection.props.maximumSelection!;
					setMultiSelectManager(multiSelectManagerRef.current);

					interactionEngineRef.current.addInteractionManager(multiSelectManagerRef.current);

					if(selectedNodes) {
						selectedNodes.forEach((node, i) => {
							const interactionData = node.data.find(d => d instanceof InteractionData) as InteractionData;
							if(interactionData) {
								multiSelectManagerRef.current!.select({
									distance: i,
									point: vec3.create(),
									node
								});
							}
						});
					}

				} else {
					selectManagerRef.current = new SelectManager();
					selectManagerRef.current.deselectOnEmpty = false;
					selectManagerRef.current.effectMaterial = new MaterialStandardData({ color: "blue" });
					setSelectManager(selectManagerRef.current);

					interactionEngineRef.current.addInteractionManager(selectManagerRef.current);

					if(selectedNodes) {
						selectedNodes.forEach((node, i) => {
							const interactionData = node.data.find(d => d instanceof InteractionData) as InteractionData;
							if(interactionData) {
								selectManagerRef.current!.select({
									distance: i,
									point: vec3.create(),
									node
								});
							}
						});
					}
				}
			}

			if (settings.props.hover) {
				hoverManagerRef.current = new HoverManager();
				hoverManagerRef.current.effectMaterial = new MaterialStandardData({ color: "green" });
				setHoverManager(hoverManagerRef.current);

				interactionEngineRef.current.addInteractionManager(hoverManagerRef.current);
			}
		}

		return () => {
			// clean up the select manager
			if (selectManagerRef.current) {
				selectManagerRef.current.deselect();
				selectManagerRef.current = undefined;
				setSelectManager(undefined);
			}

			// clean up the multi select manager
			if (multiSelectManagerRef.current) {
				multiSelectManagerRef.current.deselectAll();
				multiSelectManagerRef.current = undefined;
				setMultiSelectManager(undefined);
			}

			// clean up the hover manager
			if (hoverManagerRef.current) {
				hoverManagerRef.current = undefined;
				setHoverManager(undefined);
			}

			// clean up the interaction engine
			if (interactionEngineRef.current) {
				interactionEngineRef.current.close();
				interactionEngineRef.current = undefined;
				setInteractionEngine(undefined);
			}
		};
	}, [viewportApi, settings]);

	return {
		interactionEngine,
		selectManager,
		multiSelectManager,
		hoverManager
	};
}