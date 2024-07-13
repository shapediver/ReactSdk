import { 
	SdPlatformQueryParameters,
	SdPlatformQueryResponse, 
} from "@shapediver/sdk.platform-api-sdk-v1";
import { IPlatformClientRef } from "./shapediverStorePlatform";

/**
 * Platform pagination data.
 * TODO replace by type exported from SDK
 */
export type SdPlatformQueryResponsePagination = Pick<SdPlatformQueryResponse<any>, "data">["data"]["pagination"];

/**
 * A generic item stored on the platform (a model, a user, etc).
 */
export interface IPlatformItem<TData, TActions> {
    /** The item's data. */
    data: TData
    /** Actions that can be taken on the item. */
    actions: TActions
}

/**
 * Interface common to all paged platform items.
 */
export interface IPlatformPaging {
    /** Load more items. */
    loadMore: () => Promise<unknown>
    /** Whether more items are available. */
    hasMore: boolean
    /** Whether loading is currently going on. */
    loading: boolean
    /** Potential error. */
    error?: Error
}

/** 
 * Generic interface for paged platform items. 
 */
export interface IPlatformPagedItems<TItem> extends IPlatformPaging {
    /** 
     * The items that have been fetched so far. 
     * We typically do not return the items directly, but rather their IDs.
     */
    items: Array<TItem>
}

/** 
 * Generic paged platform item query props. 
 */
export type IPlatformPagedItemQueryProps<TEmbed, TQueryPropsExt> = 
    { queryParams: Pick<SdPlatformQueryParameters<TEmbed>, "embed" | "filters" | "sorters"> } & 
    TQueryPropsExt &
    { cacheKey?: string }

/**
 * Generic store for platform items.
 */
export interface IShapeDiverStorePlatformGeneric<TData, TActions, TEmbed, TQueryItem, TQueryPropsExt> {

    /** The items in the store. */
    items: { [id: string]: IPlatformItem<TData, TActions> }

    /** Query items and add them to the store. */
    useQuery: (params: IPlatformPagedItemQueryProps<TEmbed, TQueryPropsExt>) => IPlatformPagedItems<TQueryItem>
}

/**
 * Cache for paged items.
 */
export interface IPlatformPagedItemsCache<TQueryItem> {

    /** 
     * The items already fetched. 
     */
    items: Array<TQueryItem>

    /** Pagination data. If unset, no data has been fetched yet. */
    pagination?: SdPlatformQueryResponsePagination
}

/**
 * Extended generic store for platform items, including functionality used by the store implementation.
 */
export interface IShapeDiverStorePlatformGenericExtended<TData, TActions, TEmbed, TQueryItem, TQueryPropsExt> 
    extends IShapeDiverStorePlatformGeneric<TData, TActions, TEmbed, TQueryItem, TQueryPropsExt> 
{
    /** Add an item to the store. */
    addItem: (clientRef: IPlatformClientRef, data: TData) => void

    /** Query cache. */
    queryCache: { [key: string]: IPlatformPagedItemsCache<TQueryItem> }
}
