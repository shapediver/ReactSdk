import { useEffect, useRef, useState } from "react";
import { useShapeDiverStoreViewer } from "../../../store/useShapeDiverStoreViewer";
import { HoverManager, InteractionEngine, MultiSelectManager, SelectManager } from "@shapediver/viewer.features.interaction";
import { MaterialStandardData, sceneTree } from "@shapediver/viewer";
import { vec3 } from "gl-matrix";

/**
 * Hook allowing to create the interaction engine and the managers that are specified via the settings.
 * 
 * @param viewportId 
 */
export function useInteraction(viewportId: string, settings?: {
	interactionTypes?: {
		drag?: boolean,
		select?: boolean,
		hover?: boolean,
	},
	multiple?: boolean,
	output?: string | string[],
	pattern?: string | string[],
	groupNodes?: boolean,
	selectedNodes?: {
		node?: {
			output: string,
			pattern?: string,
			nodeName: string,
			path: string
		},
		nodes?: {
			output: string,
			pattern?: string,
			nodeName: string,
			path: string
		}[]
	}
}): {
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
		if (viewportApi && settings && settings.output) {
			// whenever this output node changes, we want to create the interaction engine
			interactionEngineRef.current = new InteractionEngine(viewportApi);
			setInteractionEngine(interactionEngineRef.current);

			if (settings.interactionTypes?.select) {
				if (settings.multiple) {
					multiSelectManagerRef.current = new MultiSelectManager();
					multiSelectManagerRef.current.effectMaterial = new MaterialStandardData({ color: "red" });
					setMultiSelectManager(multiSelectManagerRef.current);

					interactionEngineRef.current.addInteractionManager(multiSelectManagerRef.current);

					if(settings.selectedNodes && settings.selectedNodes.nodes) {
						settings.selectedNodes.nodes.forEach((nodeData, i) => {
							const node = sceneTree.getNodeAtPath(nodeData.path);
							if(node) {
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

					if(settings.selectedNodes && settings.selectedNodes.node) {
						const node = sceneTree.getNodeAtPath(settings.selectedNodes.node.path);
						if(node) {
							selectManagerRef.current!.select({
								distance: 0,
								point: vec3.create(),
								node
							});
						}
					}
				}
			}

			if (settings.interactionTypes?.hover) {
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