import { useEffect } from "react";
import { useShapeDiverStoreParameters } from "../../../store/useShapeDiverStoreParameters";
import { IHistoryEntry } from "shared/types/store/shapediverStoreParameters";

/**
 * Hook providing parameter history. 
 */
export function useParameterHistory() {
	
	const restoreHistoryStateFromEntry = useShapeDiverStoreParameters(state => state.restoreHistoryStateFromEntry);
	
	useEffect(() => {
		const handlePopState = async (event: any) => {
			if (!event.state) 
				return;
			const entry = event.state as IHistoryEntry;
			await restoreHistoryStateFromEntry(entry);
		};
	
		window.addEventListener("popstate", handlePopState);
	
		return () => {
			window.removeEventListener("popstate", handlePopState);
		};
	}, [restoreHistoryStateFromEntry]); 


	return;
}
