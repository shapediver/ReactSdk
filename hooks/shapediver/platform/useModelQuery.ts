import useAsync from "../../misc/useAsync";
import { useShapeDiverStorePlatform } from "shared/store/useShapeDiverStorePlatform";
import { SdPlatformModelQueryParameters } from "@shapediver/sdk.platform-api-sdk-v1";

export interface IUseModelQueryProps {
	queryParams?: SdPlatformModelQueryParameters,
	filterByUser?: boolean | string,
	filterByOrganization?: boolean | string,
}

export default function useModelQuery(props: IUseModelQueryProps) {

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

	return {
		loading,
		error,
		items: value?.data.result,
		hasNextPage: !!value?.data.pagination.next_offset
	};
}
