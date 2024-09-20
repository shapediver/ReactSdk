import { createContext } from "react";
import { IViewportContext } from "../types/context/viewportcontext";

/** Information about a template. */
export const ViewportContext = createContext<IViewportContext>({ viewportId: "viewport_1" });
