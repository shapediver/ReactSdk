import { 
	SdPlatformResponseUserSelf, 
	SdPlatformSdk 
} from "@shapediver/sdk.platform-api-sdk-v1";

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

/** Type of cache. */
export enum PlatformCacheTypeEnum {
    Authenticate = "authenticate",
    FetchModels = "fetchModels",
    GetUser = "getUser",
}

/** Typically used cache keys. */
export enum PlatformCacheKeyEnum {
    AllModels = "allModels",
    OrganizationModels = "organizationModels",
    MyModels = "myModels",
    TeamModels = "teamModels",
    BookmarkedModels = "bookmarkedModels",
    QualityGateModels = "qualityGateModels",
}

/**
 * Interface of the store for platform-related data.
 */
export interface IShapeDiverStorePlatform {

    /** Reference to the authenticated platform client. */
    clientRef: IPlatformClientRef | undefined

    /** Cache for diverse stuff */
    genericCache: { [key: string]: any }

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
     * Cache a promise in the store.
     * @param cacheType type of cache
     * @param cacheKey key of the cache  
     * @param flush force flushing of the cache
     * @param initializer 
     * @returns 
     */
    cachePromise: <T>(cacheType: PlatformCacheTypeEnum, cacheKey: string, flush: boolean, initializer: () => Promise<T>) => Promise<T>

}
