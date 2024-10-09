import { List, Space, Group, Button, Checkbox, Collapse, NumberInput, Slider, Stack, Switch, Text, Tooltip } from "@mantine/core";
import { PlaneRestrictionApi, GeometryRestrictionApi, IDrawingToolsApi } from "@shapediver/viewer.features.drawing-tools";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import React, { useState, useEffect } from "react";
import Icon from "shared/components/ui/Icon";
import { useShapeDiverStoreViewer } from "shared/store/useShapeDiverStoreViewer";
import { IconTypeEnum } from "shared/types/shapediver/icons";
import { useDrawingOptionsStore } from "shared/store/useDrawingOptionsStore";

/**
 * Component for the drawing options.
 * 
 * @param props The properties.
 * @param props.viewportId The viewport ID.
 * @param props.drawingToolsApi The drawing tools API.
 * @returns 
 */
export default function DrawingOptionsComponent(props: {
	viewportId: string,
	drawingToolsApi: IDrawingToolsApi | undefined
}) {
	const { 
		showPointLabels, 
		setShowPointLabels, 
		showDistanceLabels, 
		setShowDistanceLabels, 
		gridSize, 
		setGridSize, 
		angleStep, 
		setAngleStep, 
		snapToVertices, 
		setSnapToVertices, 
		snapToEdges, 
		setSnapToEdges, 
		snapToFaces, 
		setSnapToFaces 
	} = useDrawingOptionsStore();

	const { drawingToolsApi, viewportId } = props;

	// state for the options
	const [optionsOpened, setOptionsOpened] = useState(false);
	// get the viewport API
	const viewportApi = useShapeDiverStoreViewer(state => { return state.viewports[viewportId]; });

	// state for the plane restriction availability
	const [hasPlaneRestriction, setHasPlaneRestriction] = useState(false);
	// state for the geometry restriction availability
	const [hasGeometryRestriction, setHasGeometryRestriction] = useState(false);

	/**
	 * Various effects for the drawing tools API.
	 * 
	 * The effects are used to set the options for the drawing tools.
	 * The options are set depending on the state of the component.
	 */

	useEffect(() => {
		if (drawingToolsApi) {
			drawingToolsApi.showPointLabels = showPointLabels;
			viewportApi.render();
		}
	}, [showPointLabels, drawingToolsApi]);

	useEffect(() => {
		if (drawingToolsApi) {
			drawingToolsApi.showDistanceLabels = showDistanceLabels;
			viewportApi.render();
		}
	}, [showDistanceLabels, drawingToolsApi]);

	useEffect(() => {
		if (drawingToolsApi) {
			const planeRestrictionApis = Object.values(drawingToolsApi.restrictions).filter(r => r instanceof PlaneRestrictionApi);
			planeRestrictionApis.forEach(r => {
				(r as PlaneRestrictionApi).gridRestrictionApi.gridUnit = gridSize;
			});
		}
	}, [gridSize, drawingToolsApi]);

	useEffect(() => {
		if (drawingToolsApi) {
			const planeRestrictionApis = Object.values(drawingToolsApi.restrictions).filter(r => r instanceof PlaneRestrictionApi);
			planeRestrictionApis.forEach(r => {
				(r as PlaneRestrictionApi).angularRestrictionApi.angleStep = Math.PI / angleStep;
			});
		}
	}, [angleStep, drawingToolsApi]);

	useEffect(() => {
		if (drawingToolsApi) {
			const geometryRestrictionApis = Object.values(drawingToolsApi.restrictions).filter(r => r instanceof GeometryRestrictionApi);
			geometryRestrictionApis.forEach(r => {
				(r as GeometryRestrictionApi).snapToVertices = snapToVertices;
				(r as GeometryRestrictionApi).snapToEdges = snapToEdges;
				(r as GeometryRestrictionApi).snapToFaces = snapToFaces;
			});
		}
	}, [snapToVertices, snapToEdges, snapToFaces, drawingToolsApi]);

	useEffect(() => {
		if (drawingToolsApi) {
			const planeRestrictionApis = Object.values(drawingToolsApi.restrictions).filter(r => r instanceof PlaneRestrictionApi);
			setHasPlaneRestriction(planeRestrictionApis.length > 0);
			const geometryRestrictionApis = Object.values(drawingToolsApi.restrictions).filter(r => r instanceof GeometryRestrictionApi);
			setHasGeometryRestriction(geometryRestrictionApis.length > 0);
		}
	}, [drawingToolsApi]);



	/**
	 * The description of the drawing tools.
	 * This description is shown when hovering over the info button.
	 */
	const description =
		<List listStyleType="none" fw={400} size="xs">
			<List.Item>Adding Points:
				<List listStyleType="disc" fw={400} size="xs" fs="italic">
					<List.Item>Starts automatically if no points exist</List.Item>
					<List.Item>Press Insert to add a point at cursor position</List.Item>
					<List.Item>Hover over a line segment to add a new point at the center</List.Item>
				</List>
			</List.Item>
			<List.Item>Removing Points:
				<List listStyleType="disc" fw={400} size="xs" fs="italic">
					<List.Item>Select points and press Delete</List.Item>
				</List>
			</List.Item>
			<List.Item>Moving Points:
				<List listStyleType="disc" fw={400} size="xs" fs="italic">
					<List.Item>Drag individual points or select multiple points to move together</List.Item>
					<List.Item>Movement restrictions:
						<List listStyleType="disc" fw={400} size="xs" fs="italic">
							<List.Item>Press g for grid</List.Item>
							<List.Item>Press a for angles</List.Item>
							<List.Item>Press x/y/z for axes</List.Item>
						</List>
					</List.Item>
				</List>
			</List.Item>
			<List.Item>History of Operations:
				<List listStyleType="disc" fw={400} size="xs" fs="italic">
					<List.Item>Press Ctrl+z to undo</List.Item>
					<List.Item>Press Ctrl+y to redo</List.Item>
				</List>
			</List.Item>
			<List.Item>Update/Cancel:
				<List listStyleType="disc" fw={400} size="xs" fs="italic">
					<List.Item>Press Confirm or Enter to send changes to the server</List.Item>
					<List.Item>Press Cancel or Escape to discard changes</List.Item>
				</List>
			</List.Item>
		</List>;

	/**
	 * The options for the drawing tools.
	 * 
	 * The options are shown when the options are opened.
	 * The options are used to set the drawing tools settings.
	 * The settings are set depending on the state of the component.
	 */
	const options =
		<Collapse in={optionsOpened} transitionDuration={250} transitionTimingFunction="linear" w={"100%"} pr="xs" >
			<Stack>
				<Tooltip label={description} >
					<Button justify="space-between" fullWidth h="100%" p="xs" >
						<Icon type={IconTypeEnum.IconInfoCircleFilled} />
						<Space />
						<Text pl="xs" size="xs" > Hover for Details </Text>
					</Button>
				</Tooltip>
				{drawingToolsApi && <Switch
					size="xs"
					checked={showPointLabels}
					onChange={() => setShowPointLabels(!showPointLabels)}
					label="Show Point Labels"
				/>}
				{
					drawingToolsApi && <Switch
						size="xs"
						checked={showDistanceLabels}
						onChange={() => setShowDistanceLabels(!showDistanceLabels)}
						label="Show Distance Labels"
					/>}
				{
					drawingToolsApi && hasPlaneRestriction &&
					<>
						<Text size="xs" > Grid Size </Text>
						< Group justify="space-between" w="100%" wrap="nowrap" >
							<Slider
								w={"60%"}
								size="xs"
								min={0.01}
								max={100}
								step={0.01}
								value={gridSize}
								onChange={setGridSize}
							/>
							<NumberInput
								size="xs"
								w={"35%"}
								min={0.01}
								max={100}
								step={0.01}
								value={gridSize}
								onChange={v => setGridSize(+ v)}
							/>
						</Group>
					</>
				}
				{
					drawingToolsApi && hasPlaneRestriction &&
					<>
						<Text size="xs" > Angle Step </Text>
						< Group justify="space-between" w="100%" wrap="nowrap" >
							<Slider
								w={"60%"}
								size="xs"
								min={1}
								max={32}
								step={1}
								value={angleStep}
								onChange={setAngleStep}
							/>
							<NumberInput
								size="xs"
								w={"35%"}
								min={1}
								max={32}
								step={1}
								value={angleStep}
								onChange={v => setAngleStep(+ v)}
							/>
						</Group>
					</>
				}
				{
					drawingToolsApi && hasGeometryRestriction &&
					<>
						<Text size="xs"> Snap to </Text>
						< Group >
							<Checkbox
								size="xs"
								checked={snapToVertices}
								onChange={() => setSnapToVertices(!snapToVertices)}
								label="Vertices"
							/>
							<Checkbox
								size="xs"
								checked={snapToEdges}
								onChange={() => setSnapToEdges(!snapToEdges)}
								label="Edges"
							/>
							<Checkbox
								size="xs"
								checked={snapToFaces}
								onChange={() => setSnapToFaces(!snapToFaces)}
								label="Faces"
							/>
						</Group>
					</>
				}
			</Stack>
		</Collapse>;

	return <Stack p="sm">
		<Group justify="space-between" onClick={() => setOptionsOpened((t) => !t)}>
			<Text size="xs" fw={400} fs="italic" ta="left">
				{optionsOpened ? "Hide Options" : "Show Options"}
			</Text>
			{optionsOpened ? <IconChevronUp /> : <IconChevronDown />}
		</Group>
		{options}
	</Stack>;
}