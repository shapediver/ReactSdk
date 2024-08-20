import { notifications } from "@mantine/notifications";
import { addListener, EVENTTYPE_INTERACTION, IEvent, removeListener } from "@shapediver/viewer";
import { InteractionEventResponseMapping, MultiSelectManager } from "@shapediver/viewer.features.interaction";
import { useState, useCallback, useEffect } from "react";
import { NameFilterPattern, processNodes } from "./utils/patternUtils";

// #region Functions (1)

/**
 * Hook allowing to create the select manager events.
 * 
 * @param pattern The pattern to match the hovered nodes.
 */
export function useSelectManagerEvents(pattern: NameFilterPattern): {
	/**
	 * The selected node names.
	 */
    selectedNodeNames: string[],
	/**
	 * Set the selected node names.
	 * 
	 * @param names 
	 * @returns 
	 */
	setSelectedNodeNames: (names: string[]) => void,
	/**
	 * Callback function to reset the selected node names.
	 * 
	 * @returns 
	 */
    resetSelectedNodeNames: () => void
} {
	// state for the selected nodes
	const [selectedNodeNames, setSelectedNodeNames] = useState<string[]>([]);
	const resetSelectedNodeNames = useCallback(() => setSelectedNodeNames([]), []);

	// register an event handler and listen for output updates
	useEffect(() => {
		/**
         * Event handler for the select on event.
         * In this event handler, the selected node names are updated.
         */
		const tokenSelectOn = addListener(EVENTTYPE_INTERACTION.SELECT_ON, async (event: IEvent) => {
			const selectEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.SELECT_ON];

			// We ignore the event if it's not based on an event triggered by the UI.
			if (!selectEvent.event) return;

			const selected = [selectEvent.node];
			const nodeNames = processNodes(pattern, selected);
			setSelectedNodeNames(nodeNames);
		});

		/**
         * Event handler for the select off event.
         * In this event handler, the selected node names are updated.
         */
		const tokenSelectOff = addListener(EVENTTYPE_INTERACTION.SELECT_OFF, async (event: IEvent) => {
			const selectEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.SELECT_OFF];

			// don't send the event if it is a reselection
			if (selectEvent.reselection) return;
			// We ignore the event if it's not based on an event triggered by the UI.
			if (!selectEvent.event) return;

			setSelectedNodeNames([]);
		});

		/**
         * Event handler for the multi select on event.
         * In this event handler, the selected node names are updated.
         */
		const tokenMultiSelectOn = addListener(EVENTTYPE_INTERACTION.MULTI_SELECT_ON, async (event: IEvent) => {
			const multiSelectEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.MULTI_SELECT_ON];

			// We ignore the event if it's not based on an event triggered by the UI.
			if (!multiSelectEvent.event) return;

			if (multiSelectEvent.nodes.length > (multiSelectEvent.manager as MultiSelectManager).maximumNodes) return;

			const selected = multiSelectEvent.nodes;
			const nodeNames = processNodes(pattern, selected);
			setSelectedNodeNames(nodeNames);
		});

		/**
         * Event handler for the multi select off event.
         * In this event handler, the selected node names are updated.
         */
		const tokenMultiSelectOff = addListener(EVENTTYPE_INTERACTION.MULTI_SELECT_OFF, async (event: IEvent) => {
			const multiSelectEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.MULTI_SELECT_OFF];

			// We ignore the event if it's not based on an event triggered by the UI.
			if (!multiSelectEvent.event) return;

			// remove the node from the selected nodes
			const selected = multiSelectEvent.nodes;
			const nodeNames = processNodes(pattern, selected);
			setSelectedNodeNames(nodeNames);
		});

		/**
         * Event handler for the maximum multi select event.
         * In this event handler, a notification is shown.
         */
		const tokenMaximumMultiSelect = addListener(EVENTTYPE_INTERACTION.MULTI_SELECT_MAXIMUM_NODES, async (event: IEvent) => {
			const multiSelectEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.MULTI_SELECT_MAXIMUM_NODES];

			// We ignore the event if it's not based on an event triggered by the UI.
			if (!multiSelectEvent.event) return;

			notifications.show({
				title: "Maximum number of objects has already been selected",
				message: `Expected ${(multiSelectEvent.manager as MultiSelectManager).maximumNodes} objects, but selected ${multiSelectEvent.nodes.length + 1} objects instead.`
			});
		});

		/**
         * Remove the event listeners when the component is unmounted.
         */
		return () => {
			removeListener(tokenSelectOn);
			removeListener(tokenSelectOff);
			removeListener(tokenMultiSelectOn);
			removeListener(tokenMultiSelectOff);
			removeListener(tokenMaximumMultiSelect);
		};
	}, [pattern]);

	return {
		selectedNodeNames,
		setSelectedNodeNames,
		resetSelectedNodeNames
	};
}

// #endregion Functions (1)
