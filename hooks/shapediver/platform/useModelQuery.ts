import { useShapeDiverStorePlatform } from "shared/store/useShapeDiverStorePlatform";
import { SdPlatformModelQueryParameters, SdPlatformResponseModelPublic } from "@shapediver/sdk.platform-api-sdk-v1";
import { useCallback, useState } from "react";

export interface IUseModelQueryProps {
	queryParams?: SdPlatformModelQueryParameters,
	filterByUser?: boolean | string,
	filterByOrganization?: boolean | string,
}

export default function useModelQuery(props: IUseModelQueryProps) {

	const { queryParams = {}, filterByUser, filterByOrganization } = props;
	const { fetchModels, getUser } = useShapeDiverStorePlatform();
	const [ nextOffset, setNextOffset ] = useState<string | "unset" | "done">("unset");
	const [ items, setItems ] = useState<SdPlatformResponseModelPublic[]>([]);
	const [ loading, setLoading ] = useState<boolean>(false);
	const [ error, setError ] = useState<Error | undefined>(undefined);

	const loadMore = useCallback(async () => {

		const userFilter = filterByUser ? 
			{"user_id[=]": typeof filterByUser === "string" ? filterByUser : ((await getUser())?.id ?? "%")} 
			: undefined;
		const orgFilter = filterByOrganization ? 
			{"organization_id[=]": typeof filterByOrganization === "string" ? filterByOrganization : ((await getUser())?.organization?.id ?? "%")} 
			: undefined;
		
		const params: SdPlatformModelQueryParameters = {
			...queryParams,
			offset: nextOffset !== "unset" && nextOffset !== "done" ? nextOffset : undefined,
			filters: {
				...queryParams.filters,
				...(userFilter ?? {}),
				...(orgFilter ?? {})
			}
		};

		setLoading(true);
		try {
			const result = await fetchModels(params);
			if (result?.data.result)
				setItems([...items, ...result.data.result]);
			if (result?.data.pagination.next_offset)
				setNextOffset(result.data.pagination.next_offset);
			else
				setNextOffset("done");
		}
		catch (error) {
			setError(error as Error);
		}
		finally {
			setLoading(false);
		}
	
	}, [queryParams, filterByUser, filterByOrganization, nextOffset, items]);

	return {
		loading,
		error,
		items,
		hasNextPage: nextOffset !== "done",
		loadMore,
	};
}
