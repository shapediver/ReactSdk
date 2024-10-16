import { IDrawingParameterSettings, ITreeNode } from "@shapediver/viewer";
import { GeometryRestrictionProperties, PlaneRestrictionProperties, Settings } from "@shapediver/viewer.features.drawing-tools";
import { useEffect, useState } from "react";
import { useShapeDiverStoreViewer } from "shared/store/useShapeDiverStoreViewer";
import { useCreateNameFilterPattern } from "../interaction/useCreateNameFilterPattern";
import { useFindNodesByPattern } from "../interaction/useFindNodesByPattern";

// #region Functions (1)

/**
 * Hook for using the restrictions.
 * 
 * @param restrictionProps The restriction properties.
 * 
 * @returns The restriction settings.
 */
export function useRestrictions(
	restrictionProps: IDrawingParameterSettings["restrictions"]
): Settings["restrictions"] {
	// state for available node names
	const [nodes, setNodes] = useState<{ [key: string]: ITreeNode[] }>({});
	// restriction settings state
	const [restrictions, setRestrictions] = useState<Settings["restrictions"]>({});

	// create the name filter patterns
	const { patterns } = useCreateNameFilterPattern(undefined, restrictionProps?.find(r => r.type === "geometry")?.nameFilter);

	// get the sessions
	const sessions = useShapeDiverStoreViewer(state => { return state.sessions; });
	// iterate over the sessions
	for (const sessionId in sessions) {
		const outputs = sessions[sessionId].outputs;
		// iterate over the outputs
		for (const outputId in outputs) {
			// add interaction data
			if (!patterns[outputId]) patterns[outputId] = [];
			const { nodes: nodesForOutput } = useFindNodesByPattern(sessionId, outputId, patterns[outputId]);

			// update the available node names
			useEffect(() => {
				setNodes(prev => {
					return { ...prev, [outputs[outputId].name]: nodesForOutput };
				});
			}, [nodesForOutput]);
		}
	}

	/**
	 * Create the restriction settings.
	 * 
	 * Depending on the restriction type, the restriction settings are created.
	 * For a plane restriction, the restriction properties are copied.
	 * For a geometry restriction, all available nodes are used.
	 * @todo For now, only one geometry restriction is supported.
	 */
	useEffect(() => {
		const restrictions: Settings["restrictions"] = {};
		if (restrictionProps) {
			for (let i = 0; i < restrictionProps.length; i++) {
				const r = restrictionProps![i];
				const restrictionName = `restriction_${i}`;

				switch (r.type) {
				case "plane":
					restrictions[restrictionName] = {
						...r
					} as PlaneRestrictionProperties;
					break;
				case "geometry":
					restrictions[restrictionName] = {
						type: "geometry",
						nodes: Object.values(nodes).flat(),
					} as GeometryRestrictionProperties;
					break;
				default:
					break;
				}
			}
		}
		setRestrictions(restrictions);
	}, [restrictionProps, nodes]);

	return restrictions;
}

// #endregion Functions (1)
