import React from "react";
import { useViewport } from "../../../hooks/shapediver/viewer/useViewport";
import classes from "./ViewportComponent.module.css";
import { useComputedColorScheme, useProps } from "@mantine/core";
import AlertPage from "../../../pages/misc/AlertPage";
import { ViewportBrandingProps, ViewportComponentProps } from "shared/types/shapediver/viewport";

/**
 * Functional component that creates a canvas in which a viewport with the specified properties is loaded.
 *
 * @returns
 */
export default function ViewportComponent(props: ViewportComponentProps) {
	const { children = <></>, className = "", ...rest } = props;
	const _props = useProps("ViewportComponent", {}, rest);

	const brandingProps = useProps("ViewportBranding", {}, {}) as ViewportBrandingProps;
	const scheme = useComputedColorScheme();
	if (!_props.branding) 
		_props.branding = brandingProps[scheme];

	const { canvasRef, error } = useViewport(_props);

	return (
		error ? <AlertPage title="Error">{error.message}</AlertPage> :
			<div className={`${classes.container} ${className}`}>
				<canvas ref={canvasRef} />
				{children}
			</div>
	);
}
