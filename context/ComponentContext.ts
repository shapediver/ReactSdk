import { createContext } from "react";
import { IComponentContext } from "shared/types/context/componentcontext";

export const DummyComponent: IComponentContext = {
	exports: {},
	parameters: {},
	viewportComponent: undefined
};

export const ComponentContext = createContext<IComponentContext>(DummyComponent);