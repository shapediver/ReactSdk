import { ReactElement } from "react";
import { PropsExport } from "../components/shapediver/propsExport";
import { PropsParameter } from "../components/shapediver/propsParameter";
import { ViewportComponentProps } from "../shapediver/viewport";
import { OverlayStyleProps } from "shared/components/shapediver/ui/OverlayWrapper";
import { ViewportOverlayWrapperProps } from "../shapediver/viewportOverlayWrapper";
import { ViewportIconsProps, ViewportIconsOptionalProps } from "../shapediver/viewportIcons";

// #region Type aliases (2)

type ExportComponentMapValueType = (props: PropsExport) => ReactElement;
export type ParameterComponentMapValueType = {
	/** Parameter component */
	component: (props: PropsParameter) => ReactElement,
	/** Defines whether extra bottom padding is required */
	extraBottomPadding: boolean,
}

// #endregion Type aliases (2)

// #region Interfaces (1)

export interface IComponentContext {
	// #region Properties (3)

	exports: { [key: string]: ExportComponentMapValueType },
	parameters: { [key: string]: ParameterComponentMapValueType | { [key: string]: ParameterComponentMapValueType } },
	viewportComponent?: (props: ViewportComponentProps) => ReactElement,
	viewportOverlayWrapper?: (props: ViewportOverlayWrapperProps & Partial<OverlayStyleProps>) => ReactElement,
	viewportIcons?: (props: ViewportIconsProps & Partial<ViewportIconsOptionalProps>) => ReactElement,

	// #endregion Properties (3)
}

// #endregion Interfaces (1)
