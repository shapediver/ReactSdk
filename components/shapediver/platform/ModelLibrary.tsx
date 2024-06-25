import React from "react";
import { Alert, Container, Loader, SimpleGrid } from "@mantine/core";
import ModelCard from "./ModelCard";
import useModelQuery, { IUseModelQueryProps } from "shared/hooks/shapediver/platform/useModelQuery";

export interface IModelLibraryProps extends IUseModelQueryProps {
	
}

export default function ModelLibrary(props: IModelLibraryProps) {

	const { loading, error, items } = useModelQuery(props);
	
	return (
		error ? <Alert title="Error">{error.message}</Alert> :
			loading ? <Loader /> :
				<Container>
					<SimpleGrid cols={3}>
						{items?.map((model, index) => (
							<ModelCard key={index} model={model} href={`${window.location.origin}${window.location.pathname}?slug=${model.slug}`} />
						))}
					</SimpleGrid>
				</Container>
	);
}
