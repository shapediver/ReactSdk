import { 
	SdPlatformModelQueryParameters, 
	SdPlatformQueryResponse, 
	SdPlatformResponseModelPublic, 
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
 * Platform pagination data.
 * TODO replace by type exported from SDK
 */
export type IPlatformPagination = Pick<SdPlatformQueryResponse<any>, "data">["data"]["pagination"];

/**
 * A generic item stored on the platform (a model, a user, etc).
 */
export interface IPlatformItem<Tdata, Tactions> {
    /** The item's data. */
    data: Tdata
    /** Actions that can be taken on the item. */
    actions: Tactions
}

/**
 * Generic response to a platform query.
 */
export interface IPlatformQueryResponse<Titem> {
    /** The items. */
    items: Array<Titem>
    /** Pagination data. */
    pagination: IPlatformPagination
}

/**
 * Actions that can be taken on a platform model.
 */
export interface IPlatformItemActionsModel {
    /** Bookmark the model. */
    bookmark: () => Promise<unknown>
    /** Un-bookmark the model. */
    unbookmark: () => Promise<unknown>
}

/** The data type for model items. */
export type IPlatformItemDataModel = SdPlatformResponseModelPublic;

/** The data type for model query response items (for now just the model id). */
export type IPlatformQueryResponseItemModel = string;

/** The model item type. */
export type IPlatformItemModel = IPlatformItem<IPlatformItemDataModel, IPlatformItemActionsModel>;

/** The model query response type. */
export type IPlatformQueryResponseModel = IPlatformQueryResponse<IPlatformQueryResponseItemModel>;

/** The model store type. */
export type IPlatformModelStore = { [modelId: string]: IPlatformItemModel }

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

    /** The model store. */
    modelStore: IPlatformModelStore

    /** Cache for diverse promises */
    promiseCache: { [key: string]: Promise<any> }

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
     * Add a model to the store.
     */
    addModel: (item: IPlatformItemDataModel) => Promise<void>

    /**
     * Fetch models. 
     * This queries models from the platform, adds the models to the store, 
     * and returns the ids of the resulting models. 
     * The query result is stored in the promise cache.
     */
    fetchModels: (params?: SdPlatformModelQueryParameters, cacheKey?: string, forceRefresh?: boolean) => Promise<IPlatformQueryResponseModel | undefined>

    /**
     * Cache a promise in the store.
     * @param cacheType type of cache
     * @param cacheKey key of the cache  
     * @param flush force flushing of the cache
     * @param initializer 
     * @returns 
     */
    cachePromise: <T>(cacheType: PlatformCacheTypeEnum, cacheKey: string, flush: boolean, initializer: () => Promise<T>) => Promise<T>

    /**
     * Prune cached promise from the store by type and key.
     * @param cacheType type of cache
     * @param cacheKey key of the cache  
     */
    pruneCachedPromise: (cacheType: PlatformCacheTypeEnum, cacheKey: string) => void
}
