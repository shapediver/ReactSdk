import {
	IPlatformItemDataModel,
	IPlatformQueryResponseItemModel,
	IShapeDiverStorePlatform,
	PlatformCacheKeyEnum,
	PlatformCacheTypeEnum,
} from "../types/store/shapediverStorePlatform";
import {
	create as createSdk,
	isPBInvalidGrantOAuthResponseError,
	isPBInvalidRequestOAuthResponseError,
	SdPlatformModelQueryEmbeddableFields,
	SdPlatformModelQueryParameters,
	SdPlatformResponseUserSelf,
	SdPlatformSortingOrder,
	SdPlatformUserGetEmbeddableFields,
} from "@shapediver/sdk.platform-api-sdk-v1";
import { devtools } from "zustand/middleware";
import { devtoolsSettings } from "../store/storeSettings";
import { getDefaultPlatformUrl, getPlatformClientId, shouldUsePlatform } from "../utils/platform/environment";
import { create } from "zustand";
import { produce } from "immer";

/**
 * Store data related to the ShapeDiver Platform.
 * @see {@link IShapeDiverStorePlatform}
 */
export const useShapeDiverStorePlatform = create<IShapeDiverStorePlatform>()(devtools((set, get) => ({

	clientRef: undefined,
	user: undefined,
	modelStore: {},
	promiseCache: {},
	
	authenticate: async (forceReAuthenticate?: boolean) => {
		if (!shouldUsePlatform()) return;

		const { clientRef, cachePromise } = get();

		if (!forceReAuthenticate && clientRef) 
			return clientRef;

		return cachePromise(PlatformCacheTypeEnum.Authenticate, "", forceReAuthenticate ?? false, async () => {
			const platformUrl = getDefaultPlatformUrl();
			const client = createSdk({ clientId: getPlatformClientId(), baseUrl: platformUrl });
			try {
				const result = await client.authorization.refreshToken();
		
				const sdkRef = {
					platformUrl,
					jwtToken: result.access_token!,
					client
				};

				set(() => ({ 
					clientRef: sdkRef
				}), false, "authenticate");

				return sdkRef;
				
			} catch (error) {
				if (
					isPBInvalidRequestOAuthResponseError(error) // <-- thrown if the refresh token is not valid anymore or there is none
					|| isPBInvalidGrantOAuthResponseError(error) // <-- thrown if the refresh token is generally invalid
				) {
					if (window.location.origin === "https://shapediver.com") {
						// redirect to www.shapediver.com, because 3rd party auth requires it
						window.location.href = `https://www.shapediver.com${window.location.pathname}${window.location.search}`;
					}
					else {
						// redirect to platform login
						window.location.href = `${platformUrl}/app/login?redirect=${window.location.origin}${window.location.pathname}${window.location.search}`;
					}
				}

				throw error;
			}
		});
	},

	getUser: async (forceRefresh?: boolean) => {
		if (!shouldUsePlatform()) return;

		const { user, cachePromise } = get();

		if (!forceRefresh && user)
			return user;

		return cachePromise(PlatformCacheTypeEnum.GetUser, "", forceRefresh ?? false, async () => {
			const clientRef = await get().authenticate();
			if (!clientRef) return;

			const userId = clientRef.client.authorization.authData.userId;
			if (!userId) return;

			const result = await clientRef.client.users.get<SdPlatformResponseUserSelf>(userId, [
				SdPlatformUserGetEmbeddableFields.BackendSystem,
				SdPlatformUserGetEmbeddableFields.GlobalAccessDomains,
				SdPlatformUserGetEmbeddableFields.Organization,
			]);
			
			const user = result.data;

			set(() => ({ user }), false, "getUser");
			
			return user;
		});
	},

	async addModel(item: IPlatformItemDataModel) {
		const { clientRef, pruneCachedPromise } = get();
		if (!clientRef) return;

		const actions = {
			bookmark: async () => {
				await clientRef.client.bookmarks.create({model_id: item.id});
				set(state => produce(state, draft => { draft.modelStore[item.id].data.bookmark = { bookmarked: true }; }), false, `bookmark ${item.id}`);
				pruneCachedPromise(PlatformCacheTypeEnum.FetchModels, PlatformCacheKeyEnum.BookmarkedModels);
			},
			unbookmark: async () => {
				await clientRef.client.bookmarks.delete(item.id);
				set(state => produce(state, draft => { draft.modelStore[item.id].data.bookmark = { bookmarked: false }; }), false, `unbookmark ${item.id}`);
				pruneCachedPromise(PlatformCacheTypeEnum.FetchModels, PlatformCacheKeyEnum.BookmarkedModels);
			}
		};
		
		set(state => ({
			modelStore: {
				...state.modelStore,
				[item.id]: {
					data: item,
					actions
				}
			}
		}), false, `addModel ${item.id}`);
	},

	fetchModels: async (params?: SdPlatformModelQueryParameters, cacheKey?: string, forceRefresh?: boolean) => {
		if (!shouldUsePlatform()) return;
		
		const { addModel, authenticate, cachePromise } = get();
		const clientRef = await authenticate();
		if (!clientRef) return;

		const requestParams = {
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
			...params,
		};

		const _cacheKey = `${cacheKey}-${JSON.stringify(requestParams)}`;

		return cachePromise(PlatformCacheTypeEnum.FetchModels, _cacheKey, forceRefresh ?? false, async () => {
			const clientRef = await get().authenticate();
			if (!clientRef) return;

			const response = await clientRef.client.models.query(requestParams);
			const pagination = response.data.pagination;
			const items: IPlatformQueryResponseItemModel[] = response.data.result.map(item => {
				addModel(item);

				return item.id;
			});

			return {
				items,
				pagination
			};
		});
	},

	cachePromise: async <T>(cacheType: PlatformCacheTypeEnum, cacheKey: string, flush: boolean, initializer: () => Promise<T>): Promise<T> => {
		const key = `${cacheType}-${cacheKey}`;
		const { promiseCache } = get();
		const promise = promiseCache[key];

		if (!promise || flush) {
			const _promise = initializer();
			set(() => ({ promiseCache: { ...promiseCache, ...({[key]: _promise}) }}), false, `cachePromise ${key}`);
			
			return _promise;
		}
		
		return promise;
	},

	pruneCachedPromise: (cacheType: PlatformCacheTypeEnum, cacheKey: string) => {
		const key = `${cacheType}-${cacheKey}`;
		const { promiseCache } = get();
		const _promiseCache = { ...promiseCache };
		for (const _key in promiseCache) {
			if (_key.startsWith(key)) {
				delete _promiseCache[_key];
			}	
		}
		if (Object.keys(_promiseCache).length !== Object.keys(promiseCache).length)
			set(() => ({ promiseCache: _promiseCache }), false, `pruneCachedPromise ${key}`);
	},

}), { ...devtoolsSettings, name: "ShapeDiver | Platform" }));
