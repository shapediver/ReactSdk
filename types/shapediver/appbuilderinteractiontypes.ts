export type InteractionParameterType = "selection" | "dragging" | "gumball";

/**
 * PART 1 - Parameter Definitions
 * 
 * These are the properties that are defined in GH.
 * These definitions will in the future live in the Viewer.
 */

/**
 * General properties of an interaction parameter.
 */
export interface IGeneralInteractionParameterProperties {
    /** If the objects are hoverable. (default: true) */
    hover?: boolean,
    /** The names of the objects that can be interacted with. (see Jira document and discussion result) */
    nameFilter?: string[]
}

/**
 * Properties of a selection parameter.
 */
export interface IInteractionParameterPropsSelection extends IGeneralInteractionParameterProperties {
    /** The minimum number of objects that can be selected. (default: 1) */
    minimumSelection?: number,
    /** The maximum number of objects that can be selected. (default: 1) */
    maximumSelection?: number,
}

/**
 * Properties of a dragging parameter.
 * 
 * This is a placeholder for now.
 */
export interface IInteractionParameterPropsDragging extends IGeneralInteractionParameterProperties {}

/**
 * Properties of a gumball parameter.
 */
export interface IInteractionParameterPropsGumball extends IGeneralInteractionParameterProperties {
    /** The initial frame of the gumball. */
    initialFrame?: any, // TODO: How to define this?
    /** If the gumball can translate. (default: true) */
    translation?: boolean,
    /** If the gumball can rotate. (default: true) */
    rotation?: boolean,
    /** If the gumball can scale. (default: true) */
    scaling?: boolean
}

/**
 * The definition of an interaction parameter.
 * 
 * For each type, there is a corresponding set of properties.
 */
export interface IInteractionParameterDefinition {
	/** Type of the interaction parameters. */
	type: InteractionParameterType
	/** Properties of the parameter definition. */
	props: IInteractionParameterPropsSelection |
        IInteractionParameterPropsDragging |
        IInteractionParameterPropsGumball
}


/**
 * PART 2 - Parameter Values
 * 
 * These are the definition of the JSON values that are sent from the Viewer.
 * Although the actual type is a string (JSON stringified), we define the structure here.
 */

/**
 * General properties of an interaction parameter value.
 */
export interface IGeneralInteractionProperties {
    /** The names of the objects that are interacted with. */
    names?: string[]
}

/**
 * Properties of a transformation interaction value (gumball or dragging).
 * 
 * TODO: How to define the transformation values? Should this be a matrix?
 */
export interface ITransformationInteractionProperties extends IGeneralInteractionProperties {
    /** The translation values. */
    translation?: number[][], // TODO: How to define this?
    /** The rotation values. */
    rotation?: number[][], // TODO: How to define this?
    /** The scaling values. */
    scaling?: number[][], // TODO: How to define this?
}

/**
 * The definition of an interaction parameter value.
 * 
 * For each type, there is a corresponding set of properties.
 */
export interface IInteractionOutput {
    /** Type of the interaction parameter. */
    type: InteractionParameterType,
    /** Properties of the output value. */
    props: IGeneralInteractionProperties | ITransformationInteractionProperties
}

