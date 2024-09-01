import { createContext } from "react";

/** Types of containers */
export type AppBuilderContainerOrientationType = "unspecified" | "horizontal" | "vertical";

/** Contextual information for App Builder containers. */
export interface IAppBuilderContainerContext {
    /** Orientation of the container. */
    orientation: AppBuilderContainerOrientationType,
    /** Name of the container. */
    name: string,
}

/** Information about a container's context. */
export const AppBuilderContainerContext = createContext<IAppBuilderContainerContext>({
	orientation: "unspecified",
	name: "unspecified"
});

/** Types of templates */
export type AppBuilderTemplateType = "appshell" | "grid" | "unspecified";

export interface IAppBuilderTemplateContext {
    name: AppBuilderTemplateType,
}

/** Information about a template. */
export const AppBuilderTemplateContext = createContext<IAppBuilderTemplateContext>({
	name: "unspecified"
});