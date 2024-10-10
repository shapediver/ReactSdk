import { createContext } from "react";
import { IParameterDrawingContext } from "shared/types/context/parameterdrawingcontext";

/** Contextual information for ShapeDiver Drawing Parameter. */
export const ParameterDrawingContext = createContext<IParameterDrawingContext>({});