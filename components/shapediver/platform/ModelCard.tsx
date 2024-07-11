import { Anchor, Card, Group, Image, Pill, px, Text, Tooltip } from "@mantine/core";
import { SdPlatformModelVisibility, SdPlatformResponseModelPublic } from "@shapediver/sdk.platform-api-sdk-v1";
import { Icon, IconLockSquare, IconProps, IconUserCheck, IconUserQuestion, IconUsersGroup, IconWorld } from "@tabler/icons-react";
import classes from "./ModelCard.module.css";
import React, { useMemo } from "react";
import ModelCardOverlay from "./ModelCardOverlay";
import { IPlatformItemModel } from "../../../types/store/shapediverStorePlatform";

export interface IModelCardProps {
	/** If true, show information about the owner of the model. Defaults to true. */
	showUser?: boolean
	/** If true, show the model's confirmation status. Defaults to false. */
	showConfirmationStatus?: boolean
	/** If true, show the model's tags. Defaults to true. */
	showTags?: boolean
	/** If true, show the model's bookmark status. Defaults to false. */
	showBookmark?: boolean
}

interface Props extends IModelCardProps {
	/** Model to be displayed */
	item: IPlatformItemModel,
	/** Optional link */
	href?: string
	/** Target for the link */
	target?: string
}

const createStatusDescription = (icon: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<Icon>>, description: string) => ({ icon, description });

const StatusDescriptionMap = {
	"private": createStatusDescription(IconLockSquare, "Private"),
	"organization": createStatusDescription(IconUsersGroup, "Visible to organization"),
	"organization_pending": createStatusDescription(IconUserQuestion, "Pending confirmation"),
	"organization_confirmed": createStatusDescription(IconUserCheck, "Visible to organization"),
	"public": createStatusDescription(IconWorld, "Public"),
};

const getStatusDescription = (model: SdPlatformResponseModelPublic, showConfirmationStatus?: boolean) => {
	if (model.visibility === SdPlatformModelVisibility.Private) 
		return StatusDescriptionMap["private"];
	else if (model.visibility === SdPlatformModelVisibility.Public) 
		return StatusDescriptionMap["public"];
	else if (model.visibility === SdPlatformModelVisibility.Organization) {
		if (showConfirmationStatus) {
			if (model.organization_settings?.confirmed) 
				return StatusDescriptionMap["organization_confirmed"];
			else
				return StatusDescriptionMap["organization_pending"];
		}
		
		return StatusDescriptionMap["organization"];
	}
};


export default function ModelCard(props: Props) {
	
	const { 
		item, 
		href, 
		target,
		showUser = true,
		showConfirmationStatus = false,
		showTags = true,
		showBookmark,
	} = props;

	const model = item.data;

	const username = useMemo(() => {
		const user = model.user;
		if (!user) return "unknown user";

		if (user.first_name && user.last_name) {
			return `${user.first_name} ${user.last_name}`;
		}

		return user.username;
	}, [model.user]);

	const statusDescription = useMemo(() => getStatusDescription(model, showConfirmationStatus), [model, showConfirmationStatus]);

	return <Card w="18em">
		<Card.Section>
			<Anchor href={href} target={target}>
				<Image
					src={model.thumbnail_url}
					height={px("12em")}
					alt={model.title}
					fallbackSrc="data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjREREREREIi8+PHBhdGggZmlsbD0iIzk5OTk5OSIgZD0ibTEwLjgzIDkuODY1IDEuNzUgMi43aC0xLjE5cS0uMTMgMC0uMjItLjA3LS4wOC0uMDctLjEzLS4xNmwtMS4wOS0xLjc5cS0uMDIuMDktLjA2LjE3LS4wMy4wNy0uMDcuMTNsLS45NiAxLjQ5cS0uMDUuMDktLjEzLjE2dC0uMi4wN0g3LjQybDEuNzYtMi42NS0xLjY5LTIuNDhoMS4xOXEuMTQgMCAuMi4wNC4wNy4wNC4xMi4xMmwxLjA3IDEuNzFxLjA2LS4xNy4xNi0uMzRsLjg2LTEuMzVxLjExLS4xOC4yOS0uMThoMS4xM2wtMS42OCAyLjQzWiIvPjwvc3ZnPg=="
				/>
				<ModelCardOverlay model={model} showBookmark={showBookmark} showUser={showUser} />
			</Anchor>
		</Card.Section>
		<Group justify="space-between" pt="sm" wrap="nowrap">
			<Anchor href={href} target={target} underline="never">
				<Text size="md" fw={500} lineClamp={1} className={classes.title}>{model.title}</Text>
			</Anchor>
			{ statusDescription ? <Tooltip label={statusDescription.description} position="left">
				<statusDescription.icon size="1.5rem" stroke={1} className={classes.icon} /> 
			</Tooltip> : undefined }
		</Group>
		{ showUser ?	
			<Group justify="space-between" wrap="nowrap">
				<Text lineClamp={1} size="sm">
					by {username}
				</Text>
			</Group> : undefined 
		}
		{ showTags && model.tags?.length ?
			<Group justify="flex-start" wrap="nowrap" pt="sm" className={classes.tagsContainer} >
				{model.tags.map((tag, index) => <Pill key={index} size="sm">{tag.name}</Pill>)}
			</Group> : undefined
		}
	</Card>;
}
