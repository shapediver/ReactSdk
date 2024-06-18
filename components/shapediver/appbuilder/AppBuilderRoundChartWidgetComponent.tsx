import React, { } from "react";
import { Badge, Paper, Title } from "@mantine/core";
import { IAppBuilderWidgetPropsRoundChart } from "shared/types/shapediver/appbuildercharts";
import { DonutChart, PieChart } from "@mantine/charts";

export default function AppBuilderRoundChartWidgetComponent(props: IAppBuilderWidgetPropsRoundChart) {
	
	const {name, style, labels, legend, data} = props;

	return (
		<Paper>
			<Title 
				order={2}
			>
				{name}
			</Title>
			{
				style=="pie" ?
					<PieChart 
						{...(labels ? { withLabels: true } : {})}
						labelsPosition="inside"
						labelsType="value"
						style={{height: "250px",}} // TODO make this a style prop
						data={data} 
					/>
					:
					<DonutChart 
						{...(labels ? { withLabels: true } : {})}
						style={{height: "250px",}} // TODO make this a style prop
						withTooltip={false}
						data={data} 
					/>			
			}
			{
				legend ?
					data.map((item, index) => (
						<Badge 
							key={index} 
							style={{marginRight: "10px"}} // TODO make this a style prop
							color={item.color}
						>
							{item.name}
						</Badge>
					)) : undefined
			}	 
		</Paper>
	);
}
