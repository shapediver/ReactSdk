import { MultiSelect, Select } from "@mantine/core";
import React, { useMemo } from "react";
import ParameterLabelComponent from "./ParameterLabelComponent";
import { PropsParameter } from "../../../types/components/shapediver/propsParameter";
import { useParameterComponentCommons } from "../../../hooks/shapediver/parameters/useParameterComponentCommons";
import { ShapeDiverResponseParameterVisualization } from "@shapediver/api.geometry-api-dto-v2";

/**
 * Functional component that creates a dropdown select component for a string list parameter.
 *
 * @returns
 */
export default function ParameterSelectComponent(props: PropsParameter) {

	const {
		definition,
		value,
		handleChange,
		onCancel,
		disabled
	} = useParameterComponentCommons<string>(props, 0);

	// We need to prevent duplicate values in definition choices
	// and append a numeric postfix to duplicate items to make them unique
	const uniqueChoices = useMemo(() => {
		if (!definition.choices) return [];
		const uniqueChoices: string[] = [];
		const choiceCounts: { [key: string]: number } = {};
		definition.choices.forEach((choice) => {
			if (choiceCounts[choice] === undefined) {
				choiceCounts[choice] = 0;
			} else {
				choiceCounts[choice]++;
			}
			uniqueChoices.push(choiceCounts[choice] > 0 ? `${choice} ${choiceCounts[choice]}` : choice);
		});
		
		return uniqueChoices;
	}, [definition.choices]);
	
	const inputComponent = definition.visualization === ShapeDiverResponseParameterVisualization.CHECKLIST
		? <MultiSelect
			value={value ? value.split(",").map((v) => uniqueChoices[parseInt(v)]) : []}
			onChange={(v) => {
				handleChange(uniqueChoices
					// Collect indexes and values
					.map((value, index) => ({ index, value }))
					// Filter by values
					.filter((obj) => v.includes(obj.value))
					// Return filtered indexes
					.map((obj) => obj.index)
					.join(",")
				);
			}}
			data={uniqueChoices}
			disabled={disabled}
			comboboxProps={{withinPortal: false}}
		/>
		: <Select
			allowDeselect={false}
			value={uniqueChoices[+value]}
			onChange={(v) => handleChange(uniqueChoices.indexOf(v!) + "")}
			data={uniqueChoices}
			disabled={disabled}
			comboboxProps={{withinPortal: false}}
		/>;

	return <>
		<ParameterLabelComponent { ...props } cancel={onCancel} />
		{ definition && inputComponent}
	</>;
}
