import useAsync from "../../misc/useAsync";
import { IAppBuilderSettings } from "../../../types/shapediver/appbuilder";
import { SdPlatformModelGetEmbeddableFields, create } from "@shapediver/sdk.platform-api-sdk-v1";
import { getPlatformClientId, shouldUsePlatform } from "../../../utils/platform/environment";
import { useShapeDiverStorePlatform } from "shared/store/useShapeDiverStorePlatform";

/**
 * In case the session settings contain a slug and a platformUrl, 
 * resolve the ticket, modelViewUrl and token from the platform.
 */
export default function useResolveAppBuilderSettings(settings : IAppBuilderSettings|undefined) {

	const { authenticate } = useShapeDiverStorePlatform();

	// when running on the platform, try to get a token (refresh token grant)
	const { value: sdkRef, error: platformError } = useAsync(async () => {
		return await authenticate();
	});

	// resolve session data using iframe embedding or token
	const { value, error, loading } = useAsync(async () => {
		if (shouldUsePlatform() && !sdkRef) return;
		if (!settings) return;
		
		const sessions = await Promise.all(settings.sessions.map(async session => {
			if (!session.slug || !session.platformUrl)
				return session;
			
			// in case we are running on the platform and the session is on the same platform,
			// use a model get call to get ticket, modelViewUrl and token
			if (shouldUsePlatform() && sdkRef?.platformUrl === session.platformUrl) {
				const result = await sdkRef?.client.models.get(session.slug, [
					SdPlatformModelGetEmbeddableFields.BackendSystem,
					SdPlatformModelGetEmbeddableFields.Ticket,
					SdPlatformModelGetEmbeddableFields.TokenExportFallback,
				]);
				const model = result?.data;
				document.title = `${model?.title ?? model?.slug} | ShapeDiver App Builder`;
			
				return {
					...session, 
					ticket: model!.ticket!.ticket,
					modelViewUrl: model!.backend_system!.model_view_url,
					jwtToken: model?.access_token
				};
			}
			// otherwise try to use iframe embedding
			else {
				const client = create({ clientId: getPlatformClientId(), baseUrl: session.platformUrl });
				const result = await client.models.iframeEmbedding(session.slug);
				const iframeData = result.data;

				return {
					...session, 
					ticket: iframeData.ticket,
					modelViewUrl: iframeData.model_view_url,
					jwtToken: iframeData.token
				};
			}
		}));

		const settingsResolved: IAppBuilderSettings = { 
			...settings, 
			sessions, 
		};

		return settingsResolved;
	}, [settings, sdkRef]);

	return {
		settings: value, 
		error: platformError ?? error, 
		loading
	};
}
