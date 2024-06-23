import React from "react";
import { Alert, Container, Loader, SimpleGrid } from "@mantine/core";
import ModelCard from "./ModelCard";
import useAsync from "../../../hooks/misc/useAsync";
import { useShapeDiverStorePlatform } from "shared/store/useShapeDiverStorePlatform";
import { SdPlatformModelQueryParameters } from "@shapediver/sdk.platform-api-sdk-v1";

export interface IModelLibraryProps {
	queryParams?: SdPlatformModelQueryParameters,
	filterByUser?: boolean | string,
	filterByOrganization?: boolean | string,
}

export default function ModelLibrary(props: IModelLibraryProps) {

	const { queryParams = {}, filterByUser, filterByOrganization } = props;
	const { fetchModels, getUser } = useShapeDiverStorePlatform();

	const { loading, error, value } = useAsync(async () => {
		if (filterByUser) {
			queryParams.filters = {
				...queryParams.filters,
				"user_id[=]": typeof filterByUser === "string" ? filterByUser : ((await getUser())?.id ?? "%")
			};
		}
		if (filterByOrganization) {
			queryParams.filters = {
				...queryParams.filters,
				"organization_id[=]": typeof filterByOrganization === "string" ? filterByOrganization : ((await getUser())?.organization?.id ?? "%")
			};
		}

		return fetchModels(queryParams);
	}, [queryParams]);

	return (
		error ? <Alert title="Error">{error.message}</Alert> :
			loading ? <Loader /> :
				<Container>
					<SimpleGrid cols={3}>
						{value?.data?.result?.map((model, index) => (
							<ModelCard key={index} model={model} href={`${window.location.origin}${window.location.pathname}?slug=${model.slug}`} />
						))}
					</SimpleGrid>
				</Container>
	);
}
