import { IComponentContext, ParameterComponentMapValueType } from "shared/types/context/componentcontext";
import ExportLabelComponent from "../../../components/shapediver/exports/ExportLabelComponent";
import { IShapeDiverParamOrExportDefinition } from "../../shapediver/common";
import ParameterLabelComponent from "shared/components/shapediver/parameter/ParameterLabelComponent";
import { PARAMETER_TYPE } from "@shapediver/viewer.session";

export const getParameterComponent = (context: IComponentContext, definition: IShapeDiverParamOrExportDefinition): ParameterComponentMapValueType => {
	const type = definition.type;
	let component = context.parameters[type];

	// check if the component is already a component or a map
	if (type === PARAMETER_TYPE.INTERACTION)
		component = (component as { [key: string]: ParameterComponentMapValueType })[definition.settings.type];
	else 
		component = component as ParameterComponentMapValueType;

	if (component) {
		return {
			component: component.component,
			extraBottomPadding: component.extraBottomPadding,
		};
	}

	return {
		component: ParameterLabelComponent,
		extraBottomPadding: false,
	};
};

export const getExportComponent = (context: IComponentContext, definition: IShapeDiverParamOrExportDefinition) => {
	const type = definition.type;

	return context.exports[type] ? context.exports[type] : ExportLabelComponent;
};
