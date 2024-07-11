import { useShapeDiverStorePlatform } from "../../../store/useShapeDiverStorePlatform";
import { SdPlatformModelQueryParameters } from "@shapediver/sdk.platform-api-sdk-v1";
import { useCallback, useState } from "react";
import { IPlatformQueryResponseItemModel } from "../../../types/store/shapediverStorePlatform";

export interface IUseModelQueryProps {
	/** Parameter for the model query */
	queryParams?: SdPlatformModelQueryParameters,
	/** 
	 * Whether to add a further filter to the model query.
	 * If true, filtery by the current user.
	 * If a string, filter by the given user ID.
	 */
	filterByUser?: boolean | string,
	/** 
	 * Whether to add a further filter to the model query.
	 * If true, filter by the current organization.
	 * If a string, filter by the given organization ID.
	 */
	filterByOrganization?: boolean | string,
	/**
	 * Key used to store the query in the cache.
	 */
	cacheKey?: string,
}

export default function useModelQuery(props: IUseModelQueryProps) {

	const { queryParams = {}, filterByUser, filterByOrganization, cacheKey } = props;
	const { fetchModels, getUser } = useShapeDiverStorePlatform();
	const [ nextOffset, setNextOffset ] = useState<string | "unset" | "done">("unset");
	const [ items, setItems ] = useState<IPlatformQueryResponseItemModel[]>([]);
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
			const result = await fetchModels(params, cacheKey);
			if (result?.items)
				setItems([...items, ...result.items]);
			if (result?.pagination.next_offset)
				setNextOffset(result.pagination.next_offset);
			else
				setNextOffset("done");
		}
		catch (error) {
			setError(error as Error);
		}
		finally {
			setLoading(false);
		}
	
	}, [queryParams, filterByUser, filterByOrganization, cacheKey, nextOffset, items]);

	return {
		loading,
		error,
		items,
		hasNextPage: nextOffset !== "done",
		loadMore,
	};
}
