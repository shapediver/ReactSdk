import React, { useMemo } from "react";
import TabsComponent, { ITabsComponentProps } from "shared/components/ui/TabsComponent";
import ModelLibrary, { IModelLibraryProps } from "../../components/shapediver/platform/ModelLibrary";
import { BoxProps } from "@mantine/core";
import classes from "./LibraryPage.module.css";

export interface IModelLibraryTabProps extends IModelLibraryProps {
	name: string,
}

interface Props extends BoxProps {
	tabs: IModelLibraryTabProps[]
}

export default function LibraryPage(props: Props) {

	const { tabs, ...rest } = props;

	const tabDefinitions = useMemo((): ITabsComponentProps => {
		if (tabs.length === 0) {
			return {
				defaultValue: "",
				tabs: []
			};
		}

		return {
			defaultValue: tabs[0].name,
			tabs: tabs.map(tab => {
				const { name, ...rest } = tab;

				return {
					name: tab.name,
					children: [<ModelLibrary key={name} {...rest} />],
					className: classes.tabsPanels
				};
			})
		};

	}, [tabs]);

	return (
		<TabsComponent className={classes.tabsRoot} {...tabDefinitions} {...rest}/>
	);
}
