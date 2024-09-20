import { useCallback } from "react";
import { useShapeDiverStoreViewer } from "../../store/useShapeDiverStoreViewer";
import { useShallow } from "zustand/react/shallow";
import { useViewportId } from "./viewer/useViewportId";

interface Props {
	sessionId: string
}

/**
 * Hook wrapping @see {@link ISessionApi.createModelState}
 * 
 * @param props 
 * @returns 
 */
export function useCreateModelState(props: Props) {
	
	const { sessionId } = props;
	const { viewportId } = useViewportId();
	const { sessionApi, viewportApi } = useShapeDiverStoreViewer(useShallow(state => ({
		sessionApi: state.sessions[sessionId],
		viewportApi: state.viewports[viewportId],
	})));
	
	const createModelState = useCallback(async (
		parameterValues?: {[key: string]: unknown},
		omitSessionParameterValues?: boolean,
		includeImage?: boolean,
		data?: Record<string, any>,
		includeGltf?: boolean,
	) => 
		sessionApi.createModelState(
			parameterValues,
			omitSessionParameterValues,
			includeImage ? () => viewportApi.getScreenshot() : undefined,
			data, // <-- custom data
			includeGltf ? async () => viewportApi.convertToGlTF() : undefined
		), 
	[sessionApi, viewportApi]);

	return {
		createModelState
	};
}
