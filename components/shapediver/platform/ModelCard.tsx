import { Anchor, Card, Group, Image, px, Text } from "@mantine/core";
import { SdPlatformModelVisibility, SdPlatformResponseModelPublic } from "@shapediver/sdk.platform-api-sdk-v1";
import { IconLockSquare } from "@tabler/icons-react";
import React, { useMemo } from "react";

interface Props {
	model: SdPlatformResponseModelPublic,
	href?: string
	target?: string
}

export default function ModelCard(props: Props) {
	
	const { model, href, target }	= props;

	const username = useMemo(() => {
		const user = model.user;
		if (!user) return "unknown user";

		if (user.first_name && user.last_name) {
			return `${user.first_name} ${user.last_name}`;
		}

		return user.username;
	}, [model.user]);

	return <Card w="18em">
		<Card.Section>
			<Anchor href={href} target={target}>
				<Image
					src={model.thumbnail_url}
					height={px("10em")}
					alt={model.title}
					fallbackSrc="data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjREREREREIi8+PHBhdGggZmlsbD0iIzk5OTk5OSIgZD0ibTEwLjgzIDkuODY1IDEuNzUgMi43aC0xLjE5cS0uMTMgMC0uMjItLjA3LS4wOC0uMDctLjEzLS4xNmwtMS4wOS0xLjc5cS0uMDIuMDktLjA2LjE3LS4wMy4wNy0uMDcuMTNsLS45NiAxLjQ5cS0uMDUuMDktLjEzLjE2dC0uMi4wN0g3LjQybDEuNzYtMi42NS0xLjY5LTIuNDhoMS4xOXEuMTQgMCAuMi4wNC4wNy4wNC4xMi4xMmwxLjA3IDEuNzFxLjA2LS4xNy4xNi0uMzRsLjg2LTEuMzVxLjExLS4xOC4yOS0uMThoMS4xM2wtMS42OCAyLjQzWiIvPjwvc3ZnPg=="
				/>
			</Anchor>
		</Card.Section>
		<Group justify="space-between" pt="sm" wrap="nowrap">
			<Anchor href={href} target={target} underline="never">
				<Text size="md" fw={500} lineClamp={1}>{model.title}</Text>
			</Anchor>
			{model.visibility === SdPlatformModelVisibility.Private ? <IconLockSquare size="1.5rem" stroke={1}/> : <></>}
		</Group>
		<Group justify="space-between" wrap="nowrap">
			<Text lineClamp={1} size="sm">
				by {username}
			</Text>
		</Group>
	</Card>;
}
