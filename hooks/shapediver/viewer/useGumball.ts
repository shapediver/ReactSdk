import { useEffect, useRef, useState } from "react";
import { useShapeDiverStoreViewer } from "../../../store/useShapeDiverStoreViewer";
import { Gumball } from "@shapediver/viewer.features.gumball";
import { GumballParameterValue, IInteractionParameterSettings, isInteractionGumballParameterSettings, ITreeNode, SelectionParameterValue } from "@shapediver/viewer";

// #region Functions (1)

/**
 * Hook allowing to create the interaction engine and the managers that are specified via the settings.
 * 
 * @param viewportId 
 */
export function useGumball(sessionId: string, viewportId: string, settings?: IInteractionParameterSettings, selectionResponseObject?: SelectionParameterValue): {
    gumball: Gumball | undefined,
	responseObject: GumballParameterValue | undefined
} {
	// get the viewport API
	const viewportApi = useShapeDiverStoreViewer(state => { return state.viewports[viewportId]; });
	// get the session API
	const sessionApi = useShapeDiverStoreViewer(state => { return state.sessions[sessionId]; });

	// create a state for the gumball
	const [gumball, setGumball] = useState<Gumball | undefined>(undefined);
	// create a reference for the gumball
	const gumballRef = useRef<Gumball | undefined>(undefined);

	// create a reference for the selected nodes
	const responseObjectRef = useRef<GumballParameterValue | undefined>(undefined);

	const selectedNodesRef = useRef<ITreeNode[]>([]);

	const gumballSettings = isInteractionGumballParameterSettings(settings) ? settings : undefined;

	useEffect(() => {
		selectedNodesRef.current = [];
        console.log("Selection response object", selectionResponseObject);
		selectionResponseObject?.names.forEach(name => {
			const parts = name.split(".");
			const outputName = parts[0];

			const outputApi = sessionApi.getOutputByName(outputName)[0];
			if (!outputApi) return;

			outputApi.node?.traverse(n => {
				if (n.getPath().endsWith(parts.slice(1).join("."))) {
					selectedNodesRef.current.push(n);
				}
			});
		});
	}, [sessionApi, selectionResponseObject]);

	// use an effect to apply changes to the material, and to apply the callback once the node is available
	useEffect(() => {
        console.log(viewportApi && gumballSettings && selectedNodesRef && selectedNodesRef.current)
		if (viewportApi && gumballSettings && selectedNodesRef.current.length > 0) {

            console.log("Gumball settings", selectedNodesRef.current);

			// whenever this output node changes, we want to create the interaction engine
			const gumball = new Gumball(viewportApi, selectedNodesRef.current);
			gumballRef.current = gumball;
			setGumball(gumball);
		}

		return () => {
			// clean up the select manager
			if (gumballRef.current) {
                gumballRef.current.close();
				console.log(gumballRef.current.matrix);
				gumballRef.current = undefined;
				setGumball(undefined);
			}
		};
	}, [viewportApi, gumballSettings, selectedNodesRef.current, selectionResponseObject]);

	return {
		gumball,
		responseObject: responseObjectRef.current
	};
}

// #endregion Functions (1)
