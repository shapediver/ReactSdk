import { useCallback } from "react";
import { useShapeDiverStoreSession } from "../../store/useShapeDiverStoreSession";
import { useShallow } from "zustand/react/shallow";
import { useViewportId } from "./viewer/useViewportId";
import { useShapeDiverStoreViewportAccessFunctions } from "shared/store/useShapeDiverStoreViewportAccessFunctions";

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
	const { getScreenshot, convertToGlTF } = useShapeDiverStoreViewportAccessFunctions(useShallow(state => ({
		getScreenshot: state.viewportAccessFunctions[viewportId]?.getScreenshot,
		convertToGlTF: state.viewportAccessFunctions[viewportId]?.convertToGlTF
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
			includeImage && getScreenshot ? () => getScreenshot() : undefined,
			data, // <-- custom data
			includeGltf && convertToGlTF ? async () => convertToGlTF() : undefined
		) : undefined, 
	[sessionApi, getScreenshot, convertToGlTF]);

	return {
		createModelState
	};
}
