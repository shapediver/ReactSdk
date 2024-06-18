import { IShapeDiverStorePlatform } from "shared/types/store/shapediverStorePlatform";
import { create as createSdk, isPBInvalidRequestOAuthResponseError, SdPlatformResponseUserSelf, SdPlatformUserGetEmbeddableFields } from "@shapediver/sdk.platform-api-sdk-v1";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { devtoolsSettings } from "../store/storeSettings";
import { getDefaultPlatformUrl, getPlatformClientId, shouldUsePlatform } from "../utils/shapediver";

/**
 * Store data related to the ShapeDiver Platform.
 * @see {@link IShapeDiverStorePlatform}
 */
export const useShapeDiverStorePlatform = create<IShapeDiverStorePlatform>()(devtools((set, get) => ({

	clientRef: undefined,
	user: undefined,
	
	authenticate: async () => {
		if (!shouldUsePlatform()) return;

		if (get().clientRef) 
			return get().clientRef;

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
			if (isPBInvalidRequestOAuthResponseError(error)) {
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
	},

	getUser: async () => {
		if (!shouldUsePlatform()) return;

		const clientRef = await get().authenticate();
		if (!clientRef) return;

		const userId = clientRef.client.authorization.authData.userId;
		if (!userId) return;
		const result = await clientRef.client.users.get<SdPlatformResponseUserSelf>(userId, [
			SdPlatformUserGetEmbeddableFields.BackendSystem,
			SdPlatformUserGetEmbeddableFields.GlobalAccessDomains,
			SdPlatformUserGetEmbeddableFields.Organization,
		]);

		set(() => ({ user: result.data }), false, "getUser");
		
		return result.data;
	}


}), { ...devtoolsSettings, name: "ShapeDiver | Platform" }));
