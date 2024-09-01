import { createContext } from "react";
import { IAppBuilderContainerContext, IAppBuilderTemplateContext } from "../types/context/AppBuilderContext";

/** Information about a container's context. */
export const AppBuilderContainerContext = createContext<IAppBuilderContainerContext>({
	orientation: "unspecified",
	name: "unspecified"
});

/** Information about a template. */
export const AppBuilderTemplateContext = createContext<IAppBuilderTemplateContext>({
	name: "unspecified"
});