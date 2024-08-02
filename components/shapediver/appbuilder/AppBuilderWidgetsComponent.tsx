import React from "react";
import { 
	IAppBuilderWidget, 
	isAccordionWidget, 
	isAreaChartWidget, 
	isBarChartWidget, 
	isImageWidget, 
	isLineChartWidget, 
	isRoundChartWidget, 
	isTextWidget,
	isInteractionWidget,
} from "../../../types/shapediver/appbuilder";
import AppBuilderTextWidgetComponent from "./AppBuilderTextWidgetComponent";
import AppBuilderImageWidgetComponent from "./AppBuilderImageWidgetComponent";
import AppBuilderAccordionWidgetComponent from "./AppBuilderAccordionWidgetComponent";
import AppBuilderRoundChartWidgetComponent from "./AppBuilderRoundChartWidgetComponent";
import AppBuilderLineChartWidgetComponent from "./AppBuilderLineChartWidgetComponent";
import AppBuilderAreaChartWidgetComponent from "./AppBuilderAreaChartWidgetComponent";
import AppBuilderBarChartWidgetComponent from "./AppBuilderBarChartWidgetComponent";
import AppBuilderSelectionWidgetComponent from "./AppBuilderSelectionWidgetComponent";
import AppBuilderGumballWidgetComponent from "./AppBuilderGumballWidgetComponent";
import { isInteractionGumballParameterSettings, isInteractionSelectionParameterSettings } from "@shapediver/viewer";

interface Props {
	/** 
	 * Default session id to use for parameter and export references that do 
	 * not specify a session id.
	 */
	sessionId: string,
	/** The widgets to display. */
	widgets: IAppBuilderWidget[] | undefined,
}

export default function AppBuilderWidgetsComponent({ sessionId, widgets }: Props) {

	if (!widgets) {
		return <></>;
	}

	return <>
		{ widgets.map((w, i) => {
			if (isTextWidget(w))
				return <AppBuilderTextWidgetComponent key={i} {...w.props} />;
			else if (isImageWidget(w))
				return <AppBuilderImageWidgetComponent key={i} sessionId={sessionId} {...w.props} />;
			else if (isAccordionWidget(w))
				return <AppBuilderAccordionWidgetComponent key={i} sessionId={sessionId} {...w.props} />;
			else if (isRoundChartWidget(w))
				return <AppBuilderRoundChartWidgetComponent key={i} {...w.props} />;
			else if (isLineChartWidget(w))
				return <AppBuilderLineChartWidgetComponent key={i} {...w.props} />;
			else if (isAreaChartWidget(w))
				return <AppBuilderAreaChartWidgetComponent key={i} {...w.props} />;
			else if (isBarChartWidget(w))
				return <AppBuilderBarChartWidgetComponent key={i} {...w.props} />;
			else if (isInteractionWidget(w))
				if(isInteractionSelectionParameterSettings(w.props.interactionSettings))
					return <AppBuilderSelectionWidgetComponent key={i} sessionId={sessionId} {...w.props} />;
				else if(isInteractionGumballParameterSettings(w.props.interactionSettings))
					return <AppBuilderGumballWidgetComponent key={i} sessionId={sessionId} {...w.props} />;
				else
					return null;
			else
				return null;
		})}
	</>;

}
