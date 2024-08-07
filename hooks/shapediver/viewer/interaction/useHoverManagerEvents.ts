import { addListener, EVENTTYPE_INTERACTION, IEvent, removeListener } from "@shapediver/viewer";
import { InteractionEventResponseMapping } from "@shapediver/viewer.features.interaction";
import { useState, useEffect } from "react";
import { processNodes } from "./utils/patternUtils";

// #region Functions (1)

/**
 * Hook allowing to create the hover manager events.
 * 
 * @param viewportId 
 */
export function useHoverManagerEvents(pattern: { [key: string]: string[][] }): {
	/**
	 * The hovered node names.
	 */
    hoveredNodeNames: string[]
} {
	// state for the hovered nodes
	const [hoveredNodeNames, setHoveredNodeNames] = useState<string[]>([]);

	// register an event handler and listen for output updates
	useEffect(() => {
		/**
         * Event handler for the hover on event.
         * In this event handler, the response object is created and the parameter is updated.
         */
		const tokenHoverOn = addListener(EVENTTYPE_INTERACTION.HOVER_ON, async (event: IEvent) => {
			const hoverEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.HOVER_ON];

			// don't send the customization if the event is coming from an API call
			if (!hoverEvent.event) return;

			const hovered = [hoverEvent.node];
			const nodeNames = processNodes(pattern, hovered);
			setHoveredNodeNames(nodeNames.names);
		});

		/**
         * Event handler for the hover off event.
         * In this event handler, the response object is created and the parameter is updated.
         */
		const tokenHoverOff = addListener(EVENTTYPE_INTERACTION.HOVER_OFF, async (event: IEvent) => {
			const hoverEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.HOVER_OFF];

			// don't send the customization if the event is coming from an API call
			if (!hoverEvent.event) return;

			setHoveredNodeNames([]);
		});

		/**
         * Remove the event listeners when the component is unmounted.
         */
		return () => {
			removeListener(tokenHoverOn);
			removeListener(tokenHoverOff);
		};
	}, [pattern]);

	return {
		hoveredNodeNames
	};
}

// #endregion Functions (1)
