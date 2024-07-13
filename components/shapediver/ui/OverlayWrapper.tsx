import React, { useMemo } from "react";

export const OverlayPosition = {
	TOP_LEFT: "top-left",
	TOP_RIGHT: "top-right",
	BOTTOM_LEFT: "bottom-left",
	BOTTOM_RIGHT: "bottom-right",
} as const;

export type OverlayPositionType = typeof OverlayPosition[keyof typeof OverlayPosition];

function getPositionStyles(offset: string | number = 0) {
	return {
		[OverlayPosition.TOP_LEFT]: {
			top: `${offset}`,
			left: `${offset}`,
		},
		[OverlayPosition.TOP_RIGHT]: {
			top: `${offset}`,
			right: `${offset}`,
		},
		[OverlayPosition.BOTTOM_LEFT]: {
			bottom: `${offset}`,
			left: `${offset}`,
		},
		[OverlayPosition.BOTTOM_RIGHT]: {
			bottom: `${offset}`,
			right: `${offset}`,
		},
	};
}

interface Props {
	children?: React.ReactNode;
}

export interface OverlayStyleProps {
	position: OverlayPositionType;
	offset?: string;
}

export default function OverlayWrapper(props: Props & Partial<OverlayStyleProps>) {

	const { 
		children = <></>, 
		position = OverlayPosition.TOP_LEFT,
		offset,
	} = props;

	const positionStyles = useMemo(() => getPositionStyles(offset), [offset]);
	
	return <section style={{...positionStyles[position], position: "absolute"}}>
		{ children }
	</section>;
}
