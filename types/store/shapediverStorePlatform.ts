import { SdPlatformModelQueryParameters, SdPlatformQueryResponse, SdPlatformResponseModelPublic, SdPlatformResponseUserSelf, SdPlatformSdk } from "@shapediver/sdk.platform-api-sdk-v1";

/**
 * Reference to the authenticated platform client.
 */
export interface IPlatformClientRef {
    /** Token */
    jwtToken: string,
    /** Base URL of the platform */
    platformUrl: string
    /** Authenticated platform client */
    client: SdPlatformSdk
}

/**
 * Interface of the store for platform-related data.
 */
export interface IShapeDiverStorePlatform {

    /** Reference to the authenticated platform client. */
    clientRef: IPlatformClientRef | undefined

    /**
     * Authenticate the platform client.
     * In case the application is not running on the platform, this function returns undefined.
     * @returns The authenticated platform client.
     */
    authenticate: (forceReAuthenticate?: boolean) => Promise<IPlatformClientRef | undefined>

    /**
     * Information about the current user.
     */
    user: SdPlatformResponseUserSelf | undefined

    /**
     * Load information about the current user.
     */
    getUser: (forceRefresh?: boolean) => Promise<SdPlatformResponseUserSelf | undefined>

    /**
     * Fetch models.
     */
    fetchModels: (params?: SdPlatformModelQueryParameters, forceRefresh?: boolean) => Promise<SdPlatformQueryResponse<SdPlatformResponseModelPublic> | undefined>
}

