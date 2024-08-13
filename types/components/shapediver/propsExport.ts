import { IShapeDiverExportDefinition } from "../../shapediver/export";
import { PropsParameterOrExport } from "./propsCommon";

/** Props of an export reference. */
export interface PropsExport extends PropsParameterOrExport {
	
	/**
     * Id of the export.
     */
	readonly exportId: string;

     /**
      * Properties of the export to be overridden.
      */
     readonly overrides?: Pick<Partial<IShapeDiverExportDefinition>, "displayname" | "group" | "order" | "tooltip" | "hidden">;
}

