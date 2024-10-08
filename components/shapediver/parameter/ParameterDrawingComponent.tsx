import Icon from "../../ui/Icon";
import ParameterLabelComponent from "./ParameterLabelComponent";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Group, Loader, Space, Stack, Text, Tooltip, TypographyStylesProvider } from "@mantine/core";
import { IconTypeEnum } from "../../../types/shapediver/icons";
import { IDrawingParameterSettings as IDrawingParameterProps } from "@shapediver/viewer";
import { PointsData } from "@shapediver/viewer.features.drawing-tools";
import { PropsParameter } from "../../../types/components/shapediver/propsParameter";
import { useDrawingTools } from "shared/hooks/shapediver/viewer/drawing/useDrawingTools";
import { useParameterComponentCommons } from "../../../hooks/shapediver/parameters/useParameterComponentCommons";
import { useViewportId } from "../../../hooks/shapediver/viewer/useViewportId";
import classes from "./pulse.module.css";

/**
 * Parse the value of a drawing parameter and extract the points data.
 * @param value 
 * @returns 
 */
const parsePointsData = (value?: string): PointsData => {
	if (!value) return [];
	try {
		const valueCopy = JSON.parse(JSON.stringify(value));

		return JSON.parse(valueCopy).points;
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	catch (e) {
		return [];
	}
};

/**
 * Functional component that creates a component for a drawing parameter.
 *
 * @returns
 */
export default function ParameterDrawingComponent(props: PropsParameter) {
	const {
		definition,
		handleChange,
		onCancel,
		disabled,
		state
	} = useParameterComponentCommons<string>(props);

	// get the viewport ID
	const { viewportId } = useViewportId();

	// get the drawing parameter properties
	const drawingProps = definition.settings as IDrawingParameterProps;

	// state for the tooltip
	const [tooltipOpened, setTooltipOpened] = useState(false);
	// state for the drawing application
	const [drawingActive, setDrawingActive] = useState<boolean>(false);
	// state for the last confirmed value
	const [parsedUiValue, setParsedUiValue] = useState<PointsData>(parsePointsData(state.uiValue));

	/**
	 * Callback function to change the value of the parameter.
	 * This function is called when the drawing is confirmed.
	 * It also ends the drawing process.
	 */
	const confirmDrawing = useCallback((pointsData?: PointsData) => {
		setDrawingActive(false);
		handleChange(JSON.stringify({ points: pointsData }), 0);
	}, []);

	/**
	 * Callback function to cancel the drawing.
	 * This function is called when the drawing interaction is aborted by the user.
	 */
	const cancelDrawing = useCallback(() => {
		if (drawingToolsApi) drawingToolsApi.close();
		setDrawingActive(false);
	}, []);

	// use the drawing tools
	const { pointsData, setPointsData, drawingToolsApi } = useDrawingTools(
		viewportId,
		drawingProps,
		confirmDrawing,
		cancelDrawing,
		drawingActive,
		parsedUiValue
	);

	// react to changes of the uiValue and update the drawing state if necessary
	useEffect(() => {
		const parsed = parsePointsData(state.uiValue);
		// compare the parsed value with the current points data
		if (parsed.length !== pointsData?.length ||
			!parsed.every((p, i) => p === pointsData[i])
		) {
			setDrawingActive(false);
			setPointsData(parsed);
			setParsedUiValue(parsed);
		}
	}, [state.uiValue]);

	// extend the onCancel callback to reset the drawing state
	const _onCancel = useMemo(() => onCancel ? () => {
		setDrawingActive(false);
		onCancel?.();
	} : undefined, [onCancel]);


	/**
	 * The content of the tooltip.
	 * 
	 * It contains a description of the usage of the drawing tools.
	 */
	const tooltipContent = <Group style={{ display: "block" }}>
		<h3 id="drawing-tools-usage">Drawing Tools Usage</h3>
		<p>You can use the drawing tools to create and modify a drawing. The drawing tools allow you to create points and lines, move points, and remove points.</p>
		<h4 id="adding-points">Adding Points</h4>
		
		<p>There are three ways to add new points via the drawing tools.</p>
		<ol>
			<li>If <em>autoStart</em> is active, the insertion process will start right away if there are no points present.</li>
			<li>Press the <strong>Insert</strong> key. This will add a point at the position of your cursor and once you click. This will continue until you press either <strong>Enter</strong> or <strong>Escape</strong>.</li>
			<li>Hover over a line segment. A new point will appear at the center of the line segment. One you move the new point it will be added permanently.</li>
		</ol>
		<h4 id="removing-points">Removing Points</h4>
		<p>You can remove points by selecting them and pressing <strong>Delete</strong>.</p>
		<h4 id="moving-points">Moving Points</h4>
		<p>You can either move points separately my dragging a point or you can select multiple points by clicking on them an then move them all at once.</p>
		<p>You can restrict the movement by:</p>
		<ul>
			<li>pressing <strong>g</strong> to snap to the grid</li>
			<li>pressing <strong>a</strong> to snap to angles</li>
			<li>pressing <strong>x</strong>, <strong>y</strong> or <strong>z</strong> to snap to the axis</li>
		</ul>
		<h4 id="history-of-operations">History of Operations</h4>
		<p>You can also undo (<strong>Ctrl+z</strong>) and redo (<strong>Ctrl+y</strong>) operations.</p>
		<h4 id="update-cancel-the-drawing-tools">Update &amp; Cancel the Drawing Tools</h4>
		<p>You can either update or cancel the drawing tools.</p>
		<p>Updating the drawing tools (<strong>Confirm</strong>-button or <strong>Enter</strong>-key) means that you send the current state of the drawing tools as a customization request to the server and that you can continue the drawing after this process. Cancelling the drawing tools (<strong>Cancel</strong>-button or <strong>Escape</strong>-key) will result in closing the drawing tools and forgetting about all the progress that was done.</p>
	</Group>;

	/**
	 * The content of the parameter when it is active.
	 * 
	 * It contains a button to confirm the drawing and a button to cancel the drawing.
	 * 
	 * The confirm button sets the current parameter value to the points data.
	 * The cancel button resets the points data to the last value.
	 * 
	 */
	const contentActive =
		<Stack>
			<Tooltip w={"25%"} style={{ "textWrap": "wrap" }}
				withArrow
				position="top-start"
				multiline
				opened={tooltipOpened}
				onClick={() => setTooltipOpened((o) => !o)}
				label={
					<Group style={{ "scale": 0.5 }}>
						<TypographyStylesProvider>
							{tooltipContent}
						</TypographyStylesProvider>
					</Group>}>
				<Button justify="space-between" fullWidth h="100%" disabled={disabled}
					rightSection={<Loader type="dots" />}
				// onClick={cancelDrawing}
				>
					<Stack>
						<Space />
						<Text size="sm" fw={500} ta="left">
							Created a drawing with {pointsData?.length} points
						</Text>
						<Group>

							<Icon className={tooltipOpened ? classes.nopulse : classes.pulse} type={IconTypeEnum.IconInfoCircleFilled}></Icon>
							<Text size="sm" fw={400} fs="italic" ta="left">
								Interact with the drawing to change the points
							</Text>
						</Group>
						<Space />
					</Stack>
				</Button>
			</Tooltip>

			<Group justify="space-between" w="100%" wrap="nowrap">
				<Button
					disabled={pointsData?.length === 0}
					fullWidth={true}
					variant="filled"
					onClick={() => confirmDrawing(pointsData)}
				>
					<Text>Confirm</Text>
				</Button>
				<Button
					fullWidth={true}
					variant={"light"}
					onClick={cancelDrawing}>
					<Text>Cancel</Text>
				</Button>
			</Group>
		</Stack>;


	/**
	 * The content of the parameter when it is inactive.
	 * 
	 * It contains a button to start the drawing.
	 * Within the button, the number of points within the drawing is displayed.
	 */
	const contentInactive =
		<Button justify="space-between" fullWidth={true} disabled={disabled}
			rightSection={<Icon type={IconTypeEnum.Pencil} />}
			variant={pointsData?.length === 0 ? "light" : "filled"}
			onClick={() => setDrawingActive(true)}>
			<Text size="sm">
				Start drawing
			</Text>
		</Button>;

	return <>
		<ParameterLabelComponent {...props} cancel={_onCancel} />
		{
			definition &&
				drawingActive ? contentActive : contentInactive
		}
	</>;
}