import { IDrawingParameterSettings, ITreeNode } from "@shapediver/viewer";
import { CameraPlaneRestrictionProperties, GeometryRestrictionProperties, LineRestrictionProperties, PlaneRestrictionProperties, PointRestrictionProperties, Settings } from "@shapediver/viewer.features.drawing-tools";
import React, { useEffect, useState } from "react";
import { useCreateNameFilterPattern } from "../interaction/useCreateNameFilterPattern";
import { FindNodesByPatternHandler, IFindNodesByPatternState } from "../interaction/useFindNodesByPattern";

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
): {
	/**
	 * The restriction settings.
	 */
	restrictions: Settings["restrictions"]
	/**
	 * The find nodes by pattern handlers.
	 */
	findNodesByPatternHandlers: JSX.Element[]
} {
	// state for available node names
	const [nodes, setNodes] = useState<{ [key: string]: { [key: string]: ITreeNode[] }}>({});
	// state for the find nodes by pattern state map
	const [findNodesByPatternStateMap, setFindNodesByPatternStateMap] = useState<{ [key: string]: { [key: string]: IFindNodesByPatternState }}>({});
	// state for the find nodes by pattern handlers
	const [findNodesByPatternHandlers, setFindNodesByPatternHandlers] = useState<JSX.Element[]>([]);
	// restriction settings state
	const [restrictions, setRestrictions] = useState<Settings["restrictions"]>({});

	// create the name filter patterns
	const { patterns } = useCreateNameFilterPattern(undefined, restrictionProps?.find(r => r.type === "geometry")?.nameFilter);

	useEffect(() => {
		const findNodesByPatternHandlers: JSX.Element[] = [];
		Object.entries(patterns).forEach(([sessionId, pattern]) => {
			Object.entries(pattern).forEach(([outputId, pattern]) => {
				if (!findNodesByPatternStateMap[sessionId]?.[outputId]) {
					setFindNodesByPatternStateMap({
						...findNodesByPatternStateMap,
						[sessionId]: {
							...findNodesByPatternStateMap[sessionId],
							[outputId]: {
								nodes: []
							}
						}
					});
				}

				findNodesByPatternHandlers.push(
					<FindNodesByPatternHandler
						key={`FindNodesByPatternHandler_${sessionId}_${outputId}`}
						sessionId={sessionId}
						outputIdOrName={outputId}
						patterns={pattern}
						setData={(data) => {
							setFindNodesByPatternStateMap(prev => ({
								...prev,
								[sessionId]: {
									...prev[sessionId],
									[outputId]: data as IFindNodesByPatternState
								}
							}));
						}}
					/>
				);
			});
		});

		setFindNodesByPatternHandlers(findNodesByPatternHandlers);
	}, [patterns]);

	useEffect(() => {
		const gatheredNodes: { [key: string]: { [key: string]: ITreeNode[] }} = {};
		Object.entries(findNodesByPatternStateMap).forEach(([sessionId, dataPerSession]) => {
			Object.entries(dataPerSession).forEach(([outputId, dataPerOutput]) => {
				if(!gatheredNodes[sessionId]) gatheredNodes[sessionId] = {};
				gatheredNodes[sessionId][outputId] = dataPerOutput.nodes;
			});
		});

		setNodes(gatheredNodes);
	}, [findNodesByPatternStateMap]);

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
				const restrictionName = r.id || `restriction_${i}`;

				if(r.type === "geometry" && Object.keys(nodes).length !== 0) {
					const nodesArray: ITreeNode[] = [];
					for (const sessionId in nodes) {
						for (const outputId in nodes[sessionId]) {
							nodesArray.push(...nodes[sessionId][outputId]);
						}
					}

					restrictions[restrictionName] = {
						...r,
						nodes: nodesArray
					} as GeometryRestrictionProperties;
					continue;
				} else if (r.type !== "geometry") {
					restrictions[restrictionName] = r as PlaneRestrictionProperties | CameraPlaneRestrictionProperties | LineRestrictionProperties | PointRestrictionProperties;
				}
			}
		}
		setRestrictions(restrictions);
	}, [restrictionProps, nodes]);

	return {
		findNodesByPatternHandlers,
		restrictions
	};
}

// #endregion Functions (1)
