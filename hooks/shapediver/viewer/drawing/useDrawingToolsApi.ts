import { createDrawingTools, IDrawingToolsApi, PointsData, Settings } from "@shapediver/viewer.features.drawing-tools";
import { useEffect, useState } from "react";
import { useShapeDiverStoreViewer } from "shared/store/useShapeDiverStoreViewer";

// #region Variables (1)

// define the drawing tools APIs for the viewports
const drawingToolsApis: {
	[key: string]: IDrawingToolsApi
} = {};

// #endregion Variables (1)

// #region Functions (1)

/**
 * Hook allowing to create the drawing tools API.
 * 
 * @param viewportId The ID of the viewport.
 * @param drawingToolsSettings The settings for the drawing tools.
 * @param onUpdate The callback function for the update event.
 * @param onCancel The callback function for the cancel event.
 * @returns 
 */
export function useDrawingToolsApi(
	viewportId: string,
	drawingToolsSettings: Partial<Settings> | undefined,
	onUpdate: (pointsData: PointsData) => void,
	onCancel: () => void
): IDrawingToolsApi | undefined {
	// get the viewport API
	const viewportApi = useShapeDiverStoreViewer(state => { return state.viewports[viewportId]; });
	// state for the drawing tools API
	const [drawingToolsApi, setDrawingToolsApi] = useState<IDrawingToolsApi | undefined>(undefined);

	useEffect(() => {
		if (viewportApi && drawingToolsSettings && !drawingToolsApis[viewportId]) {
			const drawingToolsApi = createDrawingTools(viewportApi, { onUpdate, onCancel }, drawingToolsSettings);
			drawingToolsApis[viewportId] = drawingToolsApi;
			setDrawingToolsApi(drawingToolsApi);
		}

		return () => {
			// clean up the drawing tools
			if (drawingToolsApis[viewportId]) {
				drawingToolsApis[viewportId].close();
				delete drawingToolsApis[viewportId];
				setDrawingToolsApi(undefined);
			}
		};
	}, [viewportApi, drawingToolsSettings, onUpdate, onCancel]);

	return drawingToolsApi;
}

// #endregion Functions (1)
