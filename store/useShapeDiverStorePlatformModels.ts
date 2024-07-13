import { devtools } from "zustand/middleware";
import { devtoolsSettings } from "./storeSettings";
import { create } from "zustand";
import { produce } from "immer";
import { IShapeDiverStorePlatformModelExtended, ModelCacheKeyEnum, TModelData, TModelEmbed, TModelQueryPropsExt } from "../types/store/shapediverStorePlatformModels";
import { IPlatformPagedItemQueryProps } from "../types/store/shapediverStorePlatformGeneric";
import { useShapeDiverStorePlatform } from "./useShapeDiverStorePlatform";
import { SdPlatformModelQueryEmbeddableFields, SdPlatformModelQueryParameters, SdPlatformSortingOrder } from "@shapediver/sdk.platform-api-sdk-v1";
import { useCallback, useMemo, useState } from "react";
import { IPlatformClientRef } from "../types/store/shapediverStorePlatform";

/**
 * Store for ShapeDiver Platform models.
 * @see {@link IShapeDiverStorePlatform}
 */
export const useShapeDiverStorePlatformModels = create<IShapeDiverStorePlatformModelExtended>()(devtools((set, get) => ({

	items: {},

	queryCache: {},

	addItem(clientRef: IPlatformClientRef, data: TModelData) {
	
		const actions = {
			bookmark: async () => {
				await clientRef.client.bookmarks.create({model_id: data.id});
				set(state => produce(state, draft => { draft.items[data.id].data.bookmark = { bookmarked: true }; }), false, `bookmark ${data.id}`);
				//pruneCache(ModelCacheKeyEnum.BookmarkedModels);
			},
			unbookmark: async () => {
				await clientRef.client.bookmarks.delete(data.id);
				set(state => produce(state, draft => { draft.items[data.id].data.bookmark = { bookmarked: false }; }), false, `unbookmark ${data.id}`);
				//pruneCache(PlatformCacheTypeEnum.FetchModels, PlatformCacheKeyEnum.BookmarkedModels);
			},
			confirmForOrganization: async () => {
				await clientRef.client.models.patch(data.id, { organization_settings: { confirmed: true } });
				set(state => produce(state, draft => { draft.items[data.id].data.organization_settings = { confirmed: true }; }), false, `confirmForOrganization ${data.id}`);
				// TODO prune cache
			},
			revokeForOrganization: async () => {
				await clientRef.client.models.patch(data.id, { organization_settings: { confirmed: false } });
				set(state => produce(state, draft => { draft.items[data.id].data.organization_settings = { confirmed: false }; }), false, `revokeForOrganization ${data.id}`);
				// TODO prune cache
			},
		};
		
		set(state => ({
			items: {
				...state.items,
				[data.id]: {
					data,
					actions
				}
			}
		}), false, `addItem ${data.id}`);
	},

	useQuery(params: IPlatformPagedItemQueryProps<TModelEmbed, TModelQueryPropsExt>) {
		const { clientRef, getUser } = useShapeDiverStorePlatform();
		const { addItem, queryCache } = get();
		
		const { queryParams, filterByUser, filterByOrganization, cacheKey } = params;

		const queryParamsExt = useMemo(() => ({
			filters: { deleted_at: null, status: "done" },
			sorters: { created_at: SdPlatformSortingOrder.Desc },
			embed: [
				SdPlatformModelQueryEmbeddableFields.Bookmark,
				SdPlatformModelQueryEmbeddableFields.Decoration,
				SdPlatformModelQueryEmbeddableFields.Tags,
				SdPlatformModelQueryEmbeddableFields.User,
			],
			strict_limit: true,
			limit: 12,
			...queryParams,
		}), [queryParams]);
	
		const cacheKeyArray = Array.isArray(cacheKey) ? cacheKey : [cacheKey];
		const key = useMemo(() => `${JSON.stringify(cacheKeyArray)}-${JSON.stringify(queryParamsExt)}`, [cacheKeyArray, queryParamsExt]);
	
		const data = queryCache[key] ?? { items: [] };
		if ( !queryCache[key] ) {
			set(state => ({ queryCache: { ...state.queryCache, [key]: data } }), false, `useQuery ${key}`);
		}

		const [ loading, setLoading ] = useState<boolean>(false);
		const [ error, setError ] = useState<Error | undefined>(undefined);

		const loadMore = useCallback(async () => {
			if (!clientRef)	return;

			const userFilter = filterByUser ? 
				{"user_id[=]": typeof filterByUser === "string" ? filterByUser : ((await getUser())?.id ?? "%")} 
				: undefined;
			const orgFilter = filterByOrganization ? 
				{"organization_id[=]": typeof filterByOrganization === "string" ? filterByOrganization : ((await getUser())?.organization?.id ?? "%")} 
				: undefined;
			
			const params: SdPlatformModelQueryParameters = {
				...queryParamsExt,
				offset: queryCache[key]?.pagination?.next_offset ?? undefined,
				filters: {
					...queryParamsExt.filters,
					...(userFilter ?? {}),
					...(orgFilter ?? {})
				}
			};
	
			setLoading(true);
			try {
				const { pagination, result: items } = (await clientRef.client.models.query(params)).data;
				items.forEach(item => addItem(clientRef, item));
				set(state => produce(state, draft => { 
					draft.queryCache[key].items.push(...items.map(m => m.id)); 
					draft.queryCache[key].pagination = pagination; 
				}), false, `loadMore ${key}`);
			}
			catch (error) {
				// TODO central error handling
				setError(error as Error);
			}
			finally {
				setLoading(false);
			}
		
		}, [clientRef, queryParamsExt, filterByUser, filterByOrganization, key]);
	
		return {
			loadMore, 
			loading,
			hasMore: !data.pagination || !!data.pagination.next_offset,
			items: data.items,
			error,
		};
	},

	pruneCache: (cacheType: ModelCacheKeyEnum) => {
		const key = cacheType;

		const { queryCache } = get();
		const _prunedCache = { ...queryCache };
		for (const _key in queryCache) {
			if (queryCache[_key].cacheKeys.includes(key)) {
				delete _prunedCache[_key];
			}	
		}
		
		if (Object.keys(_prunedCache).length !== Object.keys(queryCache).length)
			set(() => ({ queryCache: _prunedCache }), false, `pruneCache ${key}`);
	},


}), { ...devtoolsSettings, name: "ShapeDiver | Platform | Models" }));
