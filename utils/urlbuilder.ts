
/**
 * Data for building a ShapeDiver App Builder URL.
 */
export interface IAppBuilderUrlBuilderData {
    /**
     * The base URL to use (origin and path).
     */
    baseUrl: string;

    /**
     * The model view URL of the model to use. 
     * Provide this and a ticket, or provide a slug.
     */
    modelViewUrl?: string;

    /**
     * The ShapeDiver ticket for embedding. 
     * Provide this and a modelViewUrl, or provide a slug.
     */
    ticket?: string;

    /**
     * The slug of the model on the ShapeDiver platform.
     */
    slug?: string;

    /**
     * The optional model state id.
     */
    modelStateId?: string;

    /**
     * Optional URL (relative or absolute) to a settings JSON file.
     */
    settingsUrl?: string
}

/**
 * Build a ShapeDiver App Builder URL from the given data.
 * @param data 
 * @returns 
 */
export function buildAppBuilderUrl(data: IAppBuilderUrlBuilderData): string {

	const { baseUrl, ticket, modelViewUrl, slug, settingsUrl, ...rest } = data;

	const url = new URL(baseUrl);
	const searchParams = new URLSearchParams();
	if (slug) {
		searchParams.append("slug", slug);
	}
	else if (ticket && modelViewUrl) {
		searchParams.append("ticket", ticket);
		searchParams.append("modelViewUrl", modelViewUrl);
	}
	else if (!settingsUrl) {
		throw new Error("Either settingsUrl or slug or both ticket and modelViewUrl must be provided.");
	}

	if (settingsUrl) {
		searchParams.append("g", settingsUrl);
	}

	for (const [key, value] of Object.entries(rest)) {
		if (value) {
			searchParams.append(key, value);
		}
	}

	url.search = searchParams.toString();
	
	return url.toString();
}
