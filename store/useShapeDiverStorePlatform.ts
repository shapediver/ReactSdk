import {
	IShapeDiverStorePlatform,
	PlatformCacheTypeEnum,
} from "../types/store/shapediverStorePlatform";
import {
	create as createSdk,
	isPBInvalidGrantOAuthResponseError,
	isPBInvalidRequestOAuthResponseError,
	SdPlatformResponseUserSelf,
	SdPlatformUserGetEmbeddableFields,
} from "@shapediver/sdk.platform-api-sdk-v1";
import { devtools } from "zustand/middleware";
import { devtoolsSettings } from "../store/storeSettings";
import { getDefaultPlatformUrl, getPlatformClientId, shouldUsePlatform } from "../utils/platform/environment";
import { create } from "zustand";

/**
 * Store data related to the ShapeDiver Platform.
 * @see {@link IShapeDiverStorePlatform}
 */
export const useShapeDiverStorePlatform = create<IShapeDiverStorePlatform>()(devtools((set, get) => ({

	clientRef: undefined,
	user: undefined,
	genericCache: {},
	
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

	cachePromise: async <T>(cacheType: PlatformCacheTypeEnum, cacheKey: string, flush: boolean, initializer: () => Promise<T>): Promise<T> => {
		const key = `${cacheType}-${cacheKey}`;
		const { genericCache } = get();
		const promise = genericCache[key];

		if (!promise || flush) {
			const _promise = initializer();
			set(() => ({ genericCache: { ...genericCache, ...({[key]: _promise}) }}), false, `cachePromise ${key}`);
			
			return _promise;
		}
		
		return promise;
	},

	pruneCache: (cacheType: PlatformCacheTypeEnum, cacheKey: string) => {
		const key = `${cacheType}-${cacheKey}`;
		const { genericCache } = get();
		const _promiseCache = { ...genericCache };
		for (const _key in genericCache) {
			if (_key.startsWith(key)) {
				delete _promiseCache[_key];
			}	
		}
		if (Object.keys(_promiseCache).length !== Object.keys(genericCache).length)
			set(() => ({ genericCache: _promiseCache }), false, `pruneCache ${key}`);
	},

}), { ...devtoolsSettings, name: "ShapeDiver | Platform" }));
