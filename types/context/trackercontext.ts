
export interface ITrackerEventData {
    /** The current device's width. Defaults to window.innerWidth */
    deviceWidth?: Window["innerWidth"]
    /** The referrer to bind the event to. Defaults to document.referrer */
    referrer?: Document["referrer"] | null
    /** The URL to bind the event to. Defaults to location.href. */
    url?: Location["href"]
}

export interface ITrackerEventOptions {
    /** Callback called when the event is successfully sent */
    callback?: undefined | (() => void)
    /** Properties to be bound to the event. */
    props?: undefined | {[key: string]: any}
}


export interface ITrackerContext {

    /**
     * Manually tracks a page view. 
     * @param eventData Optional event data to send. Defaults to the current page's data merged with the default options.
     * @param options Optional event options.
     */
    trackPageview(
        eventData?: ITrackerEventData, 
        options?: ITrackerEventOptions,
    ): void

    /**
     * Tracks a custom event.
     * Use it to track your defined goals by providing the goal's name as eventName.
     * @param eventName Name of the event to track.
     * @param options Optional event options.
     * @param eventData Optional event data to send. Defaults to the current page's data merged with the default options.
     */
    trackEvent(
        eventName: string,
        options?: ITrackerEventOptions,
        eventData?: ITrackerEventData,
    ): void

}
