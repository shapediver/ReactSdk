import React, { useMemo } from "react";
import ModelCardOverlayWrapper from "./ModelCardOverlayWrapper";
import { Avatar, Tooltip } from "@mantine/core";
import { IconTypeEnum } from "../../../types/shapediver/icons";
import ToggleIcon from "../../ui/ToggleIcon";
import { TModelItem } from "../../../types/store/shapediverStorePlatformModels";

export interface IModelCardOverlayProps {
	/** If true, show the model's bookmark status. Defaults to false. */
	showBookmark?: boolean,
	/** If true, show information about the owner of the model. Defaults to true. */
	showUser?: boolean,
}

interface Props extends IModelCardOverlayProps {
	/** Model to be displayed */
	item: TModelItem
}

export default function ModelCardOverlay(props: Props) {
	
	const {
		item: { data: model, actions },
		showBookmark = false, 
		showUser = true,
	}	= props;

	const displayBookmark = showBookmark;// && model.bookmark?.bookmarked;
	const displayUser = showUser && model.user;

	const username = useMemo(() => {
		const user = model.user;
		if (!user) return "unknown user";

		if (user.first_name && user.last_name) {
			return `${user.first_name} ${user.last_name}`;
		}

		return user.username;
	}, [model.user]);

	const userInitials = useMemo(() => {
		const user = model.user;
		if (!user) return "?";

		if (user.first_name && user.last_name) {
			return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
		}

		if (user.username)
			return user.username.charAt(0);

		return "?";
	}, [model.user]);

	return <>
		{ displayBookmark ? 
			<ModelCardOverlayWrapper position="top-left">
				<ToggleIcon 
					value={model.bookmark?.bookmarked ?? false} 
					iconActive={IconTypeEnum.Bookmark} 
					iconInactive={IconTypeEnum.BookmarkOff} 
					onActivate={actions.bookmark} 
					onDeactivate={actions.unbookmark}
					tooltipActive="Remove bookmark"
					tooltipInactive="Add bookmark"
					hideInactive={true}
				/>
			</ModelCardOverlayWrapper> : undefined }
		{ displayUser ? 
			<ModelCardOverlayWrapper position="top-right">
				<Tooltip label={username} >
					{ model.user.avatar_url ? 
						<Avatar src={model.user.avatar_url} alt={username}/> : 
						<Avatar>{userInitials}</Avatar> }
				</Tooltip>
			</ModelCardOverlayWrapper> : undefined }
	</>;
}
