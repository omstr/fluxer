// SPDX-License-Identifier: AGPL-3.0-or-later

import styles from '@app/features/channel/components/CompactMemberActivityStatus.module.css';
import {usePresenceActivities} from '@app/features/presence/hooks/usePresenceActivities';
import {usePresenceCustomStatus} from '@app/features/presence/hooks/usePresenceCustomStatus';
import {
	type ActivityMemberListKind,
	formatActivityMemberListLine,
} from '@app/features/presence/utils/formatActivityDisplay';
import {useTextOverflow} from '@app/features/ui/hooks/useTextOverflow';
import {Tooltip} from '@app/features/ui/tooltip/Tooltip';
import type {CustomStatus} from '@app/features/user/state/CustomStatus';
import {isCustomStatusExpired, normalizeCustomStatus} from '@app/features/user/state/CustomStatus';
import {msg} from '@lingui/core/macro';
import {useLingui} from '@lingui/react/macro';
import {GameControllerIcon, HeadphonesIcon, TelevisionIcon, TrophyIcon} from '@phosphor-icons/react';
import clsx from 'clsx';
import {useMemo, useRef} from 'react';

interface CompactMemberActivityStatusProps {
	className?: string;
	customStatus?: CustomStatus | null;
	userId: string;
}

export interface MemberActivityLine {
	kind: ActivityMemberListKind;
	text: string;
}

interface UseMemberActivityLineOptions {
	customStatus?: CustomStatus | null;
	enabled?: boolean;
	userId: string;
}

interface CompactActivityLineProps {
	className?: string;
	line: MemberActivityLine;
}

const LISTENING_TO_ACTIVITY_DESCRIPTOR = msg({
	message: 'Listening to {activityName}',
	comment: 'Member list tooltip for a listening activity. {activityName} is the activity name.',
});

const WATCHING_ACTIVITY_DESCRIPTOR = msg({
	message: 'Watching {activityName}',
	comment: 'Member list tooltip for a watching activity. {activityName} is the activity name.',
});

const COMPETING_IN_ACTIVITY_DESCRIPTOR = msg({
	message: 'Competing in {activityName}',
	comment: 'Member list tooltip for a competing activity. {activityName} is the activity name.',
});

const PLAYING_ACTIVITY_DESCRIPTOR = msg({
	message: 'Playing {activityName}',
	comment: 'Member list tooltip for a playing activity. {activityName} is the activity name.',
});

function hasVisibleCustomStatus(status: CustomStatus | null | undefined): boolean {
	const normalized = normalizeCustomStatus(status ?? null);
	if (!normalized || isCustomStatusExpired(normalized)) {
		return false;
	}
	return Boolean(normalized.text?.trim() || normalized.emojiName || normalized.emojiId);
}

function ActivityKindIcon({kind}: {kind: ActivityMemberListKind}) {
	const iconClassName = styles.activityIcon;
	switch (kind) {
		case 'listening':
			return <HeadphonesIcon className={iconClassName} weight="fill" aria-hidden />;
		case 'watching':
			return <TelevisionIcon className={iconClassName} weight="fill" aria-hidden />;
		case 'competing':
			return <TrophyIcon className={iconClassName} weight="fill" aria-hidden />;
		default:
			return <GameControllerIcon className={iconClassName} weight="fill" aria-hidden />;
	}
}

export function useMemberActivityLine({
	customStatus,
	enabled = true,
	userId,
}: UseMemberActivityLineOptions): MemberActivityLine | null {
	const shouldFetchCustomStatus = customStatus === undefined;
	const presenceCustomStatus = usePresenceCustomStatus({
		userId,
		enabled: shouldFetchCustomStatus,
	});
	const resolvedCustomStatus = shouldFetchCustomStatus ? presenceCustomStatus : (customStatus ?? null);
	const activities = usePresenceActivities({
		userId,
		enabled: enabled && !hasVisibleCustomStatus(resolvedCustomStatus),
	});
	const activity = activities[0] ?? null;
	return useMemo(() => (activity ? formatActivityMemberListLine(activity) : null), [activity]);
}

export function CompactMemberActivityStatus({className, customStatus, userId}: CompactMemberActivityStatusProps) {
	const line = useMemberActivityLine({customStatus, userId});
	if (!line) {
		return null;
	}
	return <CompactActivityLine className={className} line={line} />;
}

export function CompactActivityLine({className, line}: CompactActivityLineProps) {
	const {i18n} = useLingui();
	const containerRef = useRef<HTMLDivElement>(null);
	const tooltipText = useMemo(() => {
		switch (line.kind) {
			case 'listening':
				return i18n._(LISTENING_TO_ACTIVITY_DESCRIPTOR, {activityName: line.text});
			case 'watching':
				return i18n._(WATCHING_ACTIVITY_DESCRIPTOR, {activityName: line.text});
			case 'competing':
				return i18n._(COMPETING_IN_ACTIVITY_DESCRIPTOR, {activityName: line.text});
			default:
				return i18n._(PLAYING_ACTIVITY_DESCRIPTOR, {activityName: line.text});
		}
	}, [i18n, line]);
	const isOverflowing = useTextOverflow(containerRef, {content: line.text, measureTextRange: true});

	const content = (
		<div
			ref={containerRef}
			className={clsx(styles.root, className)}
			data-flx="channel.compact-member-activity-status.content"
		>
			<ActivityKindIcon kind={line.kind} />
			<span className={styles.text} data-flx="channel.compact-member-activity-status.text">
				{line.text}
			</span>
		</div>
	);

	if (tooltipText && isOverflowing) {
		return (
			<Tooltip text={tooltipText} data-flx="channel.compact-member-activity-status.tooltip">
				{content}
			</Tooltip>
		);
	}

	return content;
}
