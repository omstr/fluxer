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
import type {UserActivity} from '@fluxer/schema/src/domains/user/UserResponseSchemas';
import type {I18n} from '@lingui/core';
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

export interface MemberActivityIcon {
	kind: ActivityMemberListKind;
	label: string;
}

export interface MemberActivityLine {
	extraCount: number;
	icons: Array<MemberActivityIcon>;
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

const MAX_DISPLAY_ACTIVITIES = 4;
const MAX_ACTIVITY_ICONS = 2;

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

function activityTooltipText(i18n: I18n, kind: ActivityMemberListKind, activityName: string): string {
	switch (kind) {
		case 'listening':
			return i18n._(LISTENING_TO_ACTIVITY_DESCRIPTOR, {activityName});
		case 'watching':
			return i18n._(WATCHING_ACTIVITY_DESCRIPTOR, {activityName});
		case 'competing':
			return i18n._(COMPETING_IN_ACTIVITY_DESCRIPTOR, {activityName});
		default:
			return i18n._(PLAYING_ACTIVITY_DESCRIPTOR, {activityName});
	}
}

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

function buildMemberActivityLine(activities: Array<UserActivity>): MemberActivityLine | null {
	const shown = activities.slice(0, MAX_DISPLAY_ACTIVITIES);
	if (shown.length === 0) {
		return null;
	}
	const line = formatActivityMemberListLine(shown[0]);
	// [OM] Newest icon first and "oldest" last, so the oldest activity's icon is the one next to its text. Keep activity line for icon to be used in tooltip
	const icons = shown
		.slice(0, MAX_ACTIVITY_ICONS)
		.map((activity, index) => {
			const ownLine = index === 0 ? line : formatActivityMemberListLine(activity);
			return {kind: ownLine.kind, label: ownLine.text};
		})
		.reverse();
	return {...line, extraCount: Math.max(0, shown.length - MAX_ACTIVITY_ICONS), icons};
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
	const presenceActivities = usePresenceActivities({
		userId,
		enabled: enabled && !hasVisibleCustomStatus(resolvedCustomStatus),
	});
	return useMemo(() => buildMemberActivityLine(presenceActivities), [presenceActivities]);
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
	const tooltipText = useMemo(() => activityTooltipText(i18n, line.kind, line.text), [i18n, line]);
	const isOverflowing = useTextOverflow(containerRef, {content: line.text, measureTextRange: true});

	const newestIcon = line.icons.length > 1 ? line.icons[0] : null;
	const lineIcons = newestIcon ? line.icons.slice(1) : line.icons;
	const lineContent = (
		<span className={styles.lineGroup}>
			{lineIcons.map((icon, index) => (
				<ActivityKindIcon key={`${icon.kind}:${index}`} kind={icon.kind} />
			))}
			<span className={styles.text}>{line.text}</span>
			{line.extraCount > 0 && <span className={styles.extraCount}>{`+${line.extraCount}`}</span>}
		</span>
	);

	return (
		<div ref={containerRef} className={clsx(styles.root, className)}>
			{newestIcon && (
				<Tooltip text={activityTooltipText(i18n, newestIcon.kind, newestIcon.label)}>
					<span className={styles.activityIconSlot}>
						<ActivityKindIcon kind={newestIcon.kind} />
					</span>
				</Tooltip>
			)}
			{tooltipText && isOverflowing ? (
				<Tooltip text={tooltipText} data-flx="channel.compact-member-activity-status.tooltip">
					{lineContent}
				</Tooltip>
			) : (
				lineContent
			)}
		</div>
	);
}
