import { useCallback } from "react";
import { useShapeDiverStoreViewport } from "../../store/useShapeDiverStoreViewport";
import { useShapeDiverStoreSession } from "../../store/useShapeDiverStoreSession";
import { useShallow } from "zustand/react/shallow";
import { useViewportId } from "./viewer/useViewportId";

interface Props {
	namespace: string
}

/**
 * Hook wrapping @see {@link ISessionApi.createModelState}
 * 
 * @param props 
 * @returns 
 */
export function useCreateModelState(props: Props) {
	
	const { namespace: sessionId } = props;
	const { viewportId } = useViewportId();
	const { sessionApi } = useShapeDiverStoreSession(useShallow(state => ({
		sessionApi: state.sessions[sessionId],
	})));
	const { viewportApi } = useShapeDiverStoreViewport(useShallow(state => ({
		viewportApi: state.viewports[viewportId],
	})));
	
	const createModelState = useCallback(async (
		parameterValues?: {[key: string]: unknown},
		omitSessionParameterValues?: boolean,
		includeImage?: boolean,
		data?: Record<string, any>,
		includeGltf?: boolean,
	) => 
		sessionApi ? sessionApi.createModelState(
			parameterValues,
			omitSessionParameterValues,
			includeImage && viewportApi ? () => viewportApi.getScreenshot() : undefined,
			data, // <-- custom data
			includeGltf && viewportApi ? async () => viewportApi.convertToGlTF() : undefined
		) : undefined, 
	[sessionApi, viewportApi]);

	return {
		createModelState
	};
}
