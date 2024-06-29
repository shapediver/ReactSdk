import React from "react";
import { Alert, Loader, SimpleGrid } from "@mantine/core";
import ModelCard, { IModelCardProps } from "./ModelCard";
import useModelQuery, { IUseModelQueryProps } from "shared/hooks/shapediver/platform/useModelQuery";
import useInfiniteScroll from "react-infinite-scroll-hook";

export interface IModelLibraryProps extends IUseModelQueryProps {
	/** 
	 * Base URL for model view pages
	 */
	modelViewBaseUrl: string,
	/**
	 * Properties of the model cards
	 */
	modelCardProps?: IModelCardProps,
}

export default function ModelLibrary(props: IModelLibraryProps) {

	const { modelViewBaseUrl, modelCardProps, ...rest } = props;
	const { loading, error, items, hasNextPage, loadMore } = useModelQuery(rest);
	
	/**
	 * see https://www.npmjs.com/package/react-infinite-scroll-hook
	 */
	const [sentryRef] = useInfiniteScroll({
		loading,
		hasNextPage,
		onLoadMore: loadMore,
		// When there is an error, we stop infinite loading.
		// It can be reactivated by setting "error" state as undefined.
		disabled: !!error,
		// `rootMargin` is passed to `IntersectionObserver`.
		// We can use it to trigger 'onLoadMore' when the sentry comes near to become
		// visible, instead of becoming fully visible on the screen.
		rootMargin: "0px 0px 400px 0px",
	});
	
	return (
		error ? <Alert title="Error">{error.message}</Alert> :
			items.length === 0 && !hasNextPage ? <Alert>No models found.</Alert> :
				<SimpleGrid cols={3}>
					{items.map((model, index) => (
						<ModelCard 
							key={index} 
							model={model} 
							href={`${modelViewBaseUrl}?slug=${model.slug}`}
							target="_blank"
							{...modelCardProps}
						/>
					))}
					{(loading || hasNextPage) && <Loader ref={sentryRef}/>}
				</SimpleGrid>
	);
}
