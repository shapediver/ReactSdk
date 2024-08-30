import { IAppBuilder } from "../../../types/shapediver/appbuilder";
import { useCallback, useEffect, useRef } from "react";
import { useParameterStateless } from "../parameters/useParameterStateless";
import { useDefineGenericParameters } from "../parameters/useDefineGenericParameters";
import { ISessionApi, PARAMETER_TYPE } from "@shapediver/viewer";
import { IAcceptRejectModeSelector, IGenericParameterExecutor } from "../../../types/store/shapediverStoreParameters";
import { useShapeDiverStoreParameters } from "../../../store/useShapeDiverStoreParameters";
import { useShallow } from "zustand/react/shallow";

/** Prefix used to register custom parameters */
const CUSTOM_SESSION_ID_POSTFIX = "_appbuilder";

/** Name of input (parameter of the Grasshopper model) used to consume the custom parameter values */
const CUSTOM_DATA_INPUT_NAME = "AppBuilder";

interface Props {
	sessionApi: ISessionApi | undefined, 
	appBuilderData: IAppBuilder | undefined, 
	acceptRejectMode: IAcceptRejectModeSelector | boolean | undefined,
}

/**
 * This hook registers custom parameters and UI elements defined by a data output component 
 * of the model named "AppBuilder". Updates of the custom parameter values are fed back to the model as JSON into 
 * a text input named "AppBuilder".
 * 
 * @param sessionApi
 * @param appBuilderData
 * @returns 
 */
export function useAppBuilderCustomParameters(props: Props) {
	
	const { sessionApi, appBuilderData, acceptRejectMode } = props;
	const sessionId = sessionApi?.id ?? "";
	const sessionIdAppBuilder = sessionId + CUSTOM_SESSION_ID_POSTFIX;

	// default values and current values of the custom parameters
	const defaultCustomParameterValues = useRef<{ [key: string]: any }>({});
	const customParameterValues = useRef<{ [key: string]: any }>({});

	// define a callback which returns the current state of custom parameter values
	const getCustomParameterValues = useCallback(() => {
		// We want to set the value of the "AppBuilder" to a JSON string 
		// of the current custom parameter values. Values for all currently
		// defined custom parameters shall be included in the JSON string.
		// Therefore we need to merge the default values with the current values.
		const customValues = { ...defaultCustomParameterValues.current };
		Object.keys(customValues).forEach(id => {
			if (id in customParameterValues.current)
				customValues[id] = customParameterValues.current[id];
		});
		// remove leftover values from custom parameters that have been removed
		Object.keys(customParameterValues.current).forEach(id => {
			if (!(id in customValues))
				delete customParameterValues.current[id];
		});

		return customValues;
	}, []);
	
	// "AppBuilder" parameter (used for sending values of custom parameters to the model)
	const appBuilderParam = useParameterStateless<string>(sessionId, CUSTOM_DATA_INPUT_NAME);

	// prepare for adding pre-execution hook, which will set the value of the parameter named "AppBuilder"
	// to a JSON string of the current custom parameter values
	const { setPreExecutionHook, removePreExecutionHook } = useShapeDiverStoreParameters(
		useShallow(state => 
			({ setPreExecutionHook: state.setPreExecutionHook, removePreExecutionHook: state.removePreExecutionHook }))
	);

	// set the default values of the custom parameters whenever the 
	// custom parameter definitions change
	useEffect(() => {
		if (appBuilderData?.parameters) {
			appBuilderData.parameters.forEach(p => {
				defaultCustomParameterValues.current[p.id] = p.defval;
			});
		}
		
		return () => { 
			defaultCustomParameterValues.current = {};
		};
	}, [appBuilderData]);

	// executor function for changes of custom parameter values
	const executor = useCallback<IGenericParameterExecutor>(async (values: { [key: string]: any }) => {
		Object.keys(values).forEach(key => customParameterValues.current[key] = values[key]);
		if (appBuilderParam && appBuilderParam.definition.type === PARAMETER_TYPE.STRING) {
			// strictly speaking there would be no need to set the value of the parameter, 
			// as it is set by the pre-execution hook
			appBuilderParam.actions.setUiValue(JSON.stringify(getCustomParameterValues()));
			await appBuilderParam.actions.execute(true);
		}
		else {
			console.warn(`Parameter "${CUSTOM_DATA_INPUT_NAME}" not found or not of type 'String'!`);
		}
	}, [appBuilderParam]);

	// register the pre-execution hook
	useEffect(() => {
		if (appBuilderParam) {
			if (appBuilderParam.definition.type !== PARAMETER_TYPE.STRING)
				console.warn(`Ignoring parameter "${CUSTOM_DATA_INPUT_NAME}" whose type is ${appBuilderParam.definition.type} instead of 'String'!`);
			else
				setPreExecutionHook(sessionId, async (values) => {
					values[appBuilderParam.definition.id] = JSON.stringify(getCustomParameterValues());
			
					return values;
				});
		}
		
		return () => removePreExecutionHook(sessionId);
	}, [appBuilderParam]);

	// define custom parameters and an execution callback for them
	useDefineGenericParameters(sessionIdAppBuilder, 
		acceptRejectMode ?? false, 
		(appBuilderData?.parameters ?? []).map(p => ({definition: p})),
		executor,
	);
	
	return {
		
	};
}
