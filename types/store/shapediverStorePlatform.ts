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

/**
 * Interface of the store for basic platform interaction (authentication, user information).
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
}

/** Type of cache. */
export enum PlatformCacheKeyEnum {
    Authenticate = "authenticate",
    GetUser = "getUser",
}

/**
 * Extended store for basic platform interaction, including functionality used by the store implementation
 */
export interface IShapeDiverStorePlatformExtended extends IShapeDiverStorePlatform {

        /** Cache for diverse stuff */
    genericCache: { [key: string]: any }

    /**
     * Cache a promise in the store.
     * @param cacheType type of cache
     * @param flush force flushing of the cache
     * @param initializer 
     * @returns 
     */
    cachePromise: <T>(cacheType: PlatformCacheKeyEnum, flush: boolean, initializer: () => Promise<T>) => Promise<T>
}
