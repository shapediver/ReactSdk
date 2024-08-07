import { notifications } from "@mantine/notifications";
import { addListener, EVENTTYPE_INTERACTION, IEvent, removeListener } from "@shapediver/viewer";
import { InteractionEventResponseMapping, MultiSelectManager } from "@shapediver/viewer.features.interaction";
import { useState, useCallback, useEffect } from "react";
import { processNodes } from "./utils/patternUtils";

// #region Functions (1)

/**
 * Hook allowing to create the select manager events.
 * 
 * @param viewportId 
 */
export function useSelectManagerEvents(pattern: { [key: string]: string[][] }): {
	/**
	 * The selected node names.
	 */
    selectedNodeNames: string[],
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
         * In this event handler, the response object is created and the parameter is updated.
         */
		const tokenSelectOn = addListener(EVENTTYPE_INTERACTION.SELECT_ON, async (event: IEvent) => {
			const selectEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.SELECT_ON];

			// don't send the customization if the event is coming from an API call
			if (!selectEvent.event) return;

			const selected = [selectEvent.node];
			const nodeNames = processNodes(pattern, selected);
			setSelectedNodeNames(nodeNames.names);
		});

		/**
         * Event handler for the select off event.
         * In this event handler, the response object is created and the parameter is updated.
         */
		const tokenSelectOff = addListener(EVENTTYPE_INTERACTION.SELECT_OFF, async (event: IEvent) => {
			const selectEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.SELECT_OFF];

			// don't send the event if it is a reselection
			if (selectEvent.reselection) return;
			// don't send the customization if the event is coming from an API call
			if (!selectEvent.event) return;

			setSelectedNodeNames([]);
		});

		/**
         * Event handler for the multi select on event.
         * In this event handler, the response object is created and the parameter is updated.
         */
		const tokenMultiSelectOn = addListener(EVENTTYPE_INTERACTION.MULTI_SELECT_ON, async (event: IEvent) => {
			const multiSelectEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.MULTI_SELECT_ON];

			// don't send the customization if the event is coming from an API call
			if (!multiSelectEvent.event) return;

			const selected = multiSelectEvent.nodes;
			const nodeNames = processNodes(pattern, selected);
			setSelectedNodeNames(nodeNames.names);

			if (multiSelectEvent.nodes.length < (multiSelectEvent.manager as MultiSelectManager).minimumNodes) return;
			if (multiSelectEvent.nodes.length > (multiSelectEvent.manager as MultiSelectManager).maximumNodes) return;
		});

		/**
         * Event handler for the multi select off event.
         * In this event handler, the response object is created and the parameter is updated.
         */
		const tokenMultiSelectOff = addListener(EVENTTYPE_INTERACTION.MULTI_SELECT_OFF, async (event: IEvent) => {
			const multiSelectEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.MULTI_SELECT_OFF];

			// don't send the customization if the event is coming from an API call
			if (!multiSelectEvent.event) return;

			// remove the node from the selected nodes
			const selected = multiSelectEvent.nodes;
			const nodeNames = processNodes(pattern, selected);
			setSelectedNodeNames(nodeNames.names);

			if (multiSelectEvent.nodes.length < (multiSelectEvent.manager as MultiSelectManager).minimumNodes) return;
			if (multiSelectEvent.nodes.length > (multiSelectEvent.manager as MultiSelectManager).maximumNodes) return;
		});

		/**
         * Event handler for the maximum multi select event.
         * In this event handler, a notification is shown.
         */
		const tokenMaximumMultiSelect = addListener(EVENTTYPE_INTERACTION.MULTI_SELECT_MAXIMUM_NODES, async (event: IEvent) => {
			const multiSelectEvent = event as InteractionEventResponseMapping[EVENTTYPE_INTERACTION.MULTI_SELECT_MAXIMUM_NODES];

			// don't send the customization if the event is coming from an API call
			if (!multiSelectEvent.event) return;

			notifications.show({
				title: "Maximum Number of Nodes reached",
				message: `Expected ${(multiSelectEvent.manager as MultiSelectManager).maximumNodes} nodes, got ${multiSelectEvent.nodes.length} nodes.`
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
		resetSelectedNodeNames
	};
}

// #endregion Functions (1)
