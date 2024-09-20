import { useContext } from "react";
import { ViewportContext } from "../../../context/ViewportContext";

/**
 * Hook for getting the id of the main viewport used by the application. 
 * (Viewport of the ShapeDiver 3D Viewer).
 * 
 * @returns
 */
export function useViewportId() {
	
	const { viewportId } = useContext(ViewportContext);
	
	return {
		viewportId
	};
}
