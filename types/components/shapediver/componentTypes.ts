import ExportButtonComponent from "../../../components/shapediver/exports/ExportButtonComponent";
import ExportLabelComponent from "../../../components/shapediver/exports/ExportLabelComponent";
import ParameterBooleanComponent from "../../../components/shapediver/parameter/ParameterBooleanComponent";
import ParameterColorComponent from "../../../components/shapediver/parameter/ParameterColorComponent";
import ParameterDraggingComponent from "shared/components/shapediver/parameter/ParameterDraggingComponent";
import ParameterDrawingComponent from "shared/components/shapediver/parameter/ParameterDrawingComponent";
import ParameterFileInputComponent from "../../../components/shapediver/parameter/ParameterFileInputComponent";
import ParameterGumballComponent from "../../../components/shapediver/parameter/ParameterGumballComponent";
import ParameterLabelComponent from "../../../components/shapediver/parameter/ParameterLabelComponent";
import ParameterSelectComponent from "../../../components/shapediver/parameter/ParameterSelectComponent";
import ParameterSelectionComponent from "../../../components/shapediver/parameter/ParameterSelectionComponent";
import ParameterSliderComponent from "../../../components/shapediver/parameter/ParameterSliderComponent";
import ParameterStringComponent from "../../../components/shapediver/parameter/ParameterStringComponent";
import { EXPORT_TYPE, PARAMETER_TYPE } from "@shapediver/viewer";
import { IShapeDiverParamOrExportDefinition } from "../../shapediver/common";
import { PropsParameter } from "./propsParameter";
import { ReactElement } from "react";

type ComponentsMapValueType = {
	/** Parameter component */
	c: (props: PropsParameter) => ReactElement,
	/** Defines whether extra bottom padding is required */
	extraBottomPadding: boolean,
}

type ComponentsMapType = {
	[key: string]: ComponentsMapValueType 
};

const parameterComponentsMap: ComponentsMapType = {
	[PARAMETER_TYPE.INT]: {c: ParameterSliderComponent, extraBottomPadding: true},
	[PARAMETER_TYPE.FLOAT]: {c: ParameterSliderComponent, extraBottomPadding: true},
	[PARAMETER_TYPE.EVEN]: {c: ParameterSliderComponent, extraBottomPadding: true},
	[PARAMETER_TYPE.ODD]: {c: ParameterSliderComponent, extraBottomPadding: true},
	[PARAMETER_TYPE.BOOL]: {c: ParameterBooleanComponent, extraBottomPadding: false},
	[PARAMETER_TYPE.STRING]: {c: ParameterStringComponent, extraBottomPadding: false},
	[PARAMETER_TYPE.STRINGLIST]: {c: ParameterSelectComponent, extraBottomPadding: false},
	[PARAMETER_TYPE.COLOR]: {c: ParameterColorComponent, extraBottomPadding: false},
	[PARAMETER_TYPE.FILE]: {c: ParameterFileInputComponent, extraBottomPadding: false},
	[PARAMETER_TYPE.DRAWING]: {c: ParameterDrawingComponent, extraBottomPadding: true},
};

const interactionParameterComponentsMap: ComponentsMapType = {
	"selection": {c: ParameterSelectionComponent, extraBottomPadding: true},
	"gumball": {c: ParameterGumballComponent, extraBottomPadding: true},
	"dragging": {c: ParameterDraggingComponent, extraBottomPadding: false},
};

export const getParameterComponent = (definition: IShapeDiverParamOrExportDefinition) => {
	const type = definition.type;
	const component = type === PARAMETER_TYPE.INTERACTION ? 
		interactionParameterComponentsMap[definition.settings?.type] : 
		parameterComponentsMap[type];


	if (component) {
		return {
			component: component.c,
			extraBottomPadding: component.extraBottomPadding,
		};
	}

	return {
		component: ParameterLabelComponent,
		extraBottomPadding: false,
	};
};

const exportComponentsMap = {
	[EXPORT_TYPE.DOWNLOAD]: ExportButtonComponent,
	[EXPORT_TYPE.EMAIL]: ExportButtonComponent,
};

export const getExportComponent = (definition: IShapeDiverParamOrExportDefinition) => {
	const type = definition.type as keyof typeof exportComponentsMap;

	return exportComponentsMap[type] || ExportLabelComponent;
};
