// SPDX-License-Identifier: AGPL-3.0-or-later

import {ExternalLink} from '@app/features/app/components/shared/ExternalLink';
import {isKeyboardActivationKey} from '@app/features/input/utils/KeyboardUtils';
import {ActivityCoverImage} from '@app/features/presence/components/ActivityCoverImage';
import {usePresenceActivities} from '@app/features/presence/hooks/usePresenceActivities';
import {formatActivityDisplay} from '@app/features/presence/utils/formatActivityDisplay';
import styles from '@app/features/user/components/profile/ProfileRichPresence.module.css';
import SomethingChudIcon from '@app/media/images/SomethingChudIcon.svg?react';
import type {UserActivity} from '@fluxer/schema/src/domains/user/UserResponseSchemas';
import type {I18n} from '@lingui/core';
import {msg} from '@lingui/core/macro';
import {useLingui} from '@lingui/react';
import {Trans} from '@lingui/react/macro';
import {CaretLeftIcon, CaretRightIcon, GameControllerIcon, HeadphonesIcon, MoonStarsIcon} from '@phosphor-icons/react';
import {clsx} from 'clsx';
import type React from 'react';
import {useEffect, useMemo, useState} from 'react';

interface ProfileRichPresenceProps {
	userId: string;
	onOpenProfile?: () => void;
	listeningSourceMaxLength?: number;
	showEmptyState?: boolean;
}
type DurationDirectionType = 'elapsed' | 'remaining' | 'total';

const LISTENING_SOURCE_MAX_LENGTH = 240;
export const LISTENING_SOURCE_MAX_LENGTH_POPOUT = 50;

const LISTENING_DESCRIPTOR = msg({
	message: 'Listening to Music',
	comment: 'Rich presence header when listening to music with no app name.',
});
const LISTENING_SOURCE_DESCRIPTOR = msg({
	message: 'Listening to {listeningSource}',
	comment:
		'Rich presence header when listening to a music app or album. Preserve {listeningSource}; it is inserted by code.',
});
const WATCHING_DESCRIPTOR = msg({
	message: 'Watching',
	comment: 'Rich presence header when watching something.',
});
const COMPETING_DESCRIPTOR = msg({
	message: 'Competing in',
	comment: 'Rich presence header when competing in a game.',
});
const PLAYING_DESCRIPTOR = msg({
	message: 'Playing',
	comment: 'Rich presence header on user profile.',
});

function trimListeningSource(source: string, maxLength: number): string {
	if (source.length <= maxLength) return source;
	return `${source.slice(0, Math.max(maxLength - 1, 1)).trimEnd()}…`;
}

function getActivityHeader(
	activity: UserActivity,
	listeningSource: string | null,
	i18n: I18n,
	listeningSourceMaxLength: number,
): string {
	switch (activity.type) {
		case 2:
			return listeningSource
				? i18n._(LISTENING_SOURCE_DESCRIPTOR, {
						listeningSource: trimListeningSource(listeningSource, listeningSourceMaxLength),
					})
				: i18n._(LISTENING_DESCRIPTOR);
		case 3:
			return i18n._(WATCHING_DESCRIPTOR);
		case 5:
			return i18n._(COMPETING_DESCRIPTOR);
		default:
			return i18n._(PLAYING_DESCRIPTOR);
	}
}

function ProfilePresenceEmptyState() {
	return (
		<div className={styles.emptyState}>
			<MoonStarsIcon className={styles.emptyStateIcon} size={48} weight="light" aria-hidden style={{opacity: 0.7}}/>
			<span className={styles.emptyStateTitle}>
				<Trans>All quiet for now</Trans>
			</span>
			<span className={styles.emptyStateBody}>
				<Trans>When something<span style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', right:80, bottom:50, flexDirection: 'row', gap: 0.5, opacity: 0.15, zIndex: -1, pointerEvents: 'none'}}><SomethingChudIcon style={{width: 48, height: 36, zIndex: -1}} aria-hidden/></span> happens, it'll show up here.</Trans>
			</span>
		</div>
	);
}

function normalizeStartTimestamp(start?: number): number | undefined {
	if (start == null || !Number.isFinite(start)) return undefined;
	if (start > 10_000_000_000) return Math.floor(start / 1000);
	return start;
}

function formatDuration(timestampSeconds: number, nowMs: number, direction: DurationDirectionType): string {
	const nowSeconds = Math.floor(nowMs / 1000);
	const directionCalc =
		direction === 'elapsed'
			? nowSeconds - timestampSeconds
			: direction === 'remaining'
				? timestampSeconds - nowSeconds
				: timestampSeconds;
	const duration = Math.max(0, directionCalc);
	const hours = Math.floor(duration / 3600);
	const minutes = Math.floor((duration % 3600) / 60);
	const seconds = duration % 60;
	if (hours > 0) {
		return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	}
	return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getProgressPercent(startSeconds: number, endSeconds: number, nowMs: number): number {
	const nowSeconds = Math.floor(nowMs / 1000);
	const duration = endSeconds - startSeconds;
	if (duration <= 0) return 0;
	const elapsed = nowSeconds - startSeconds;
	return Math.max(0, Math.min(100, (elapsed / duration) * 100));
}

function normalizeEndTimestamp(end?: number): number | undefined {
	if (end == null || !Number.isFinite(end)) return undefined;
	if (end > 10_000_000_000) return Math.floor(end / 1000);
	return end;
}

function ActivityTimer({start, end}: {start?: number; end?: number}) {
	const startSeconds = normalizeStartTimestamp(start);
	const endSeconds = normalizeEndTimestamp(end);
	const [now, setNow] = useState(Date.now());
	useEffect(() => {
		if (!startSeconds && !endSeconds) return;
		const id = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(id);
	}, [endSeconds, startSeconds]);
	if (startSeconds && endSeconds) {
		return null;
	}
	if (startSeconds) {
		return <div className={styles.activityTimer}>{formatDuration(startSeconds, now, 'elapsed')} elapsed</div>;
	}
	if (endSeconds && endSeconds > Math.floor(now / 1000)) {
		return <div className={styles.activityTimer}>{formatDuration(endSeconds, now, 'total')}</div>;
	}
	return null;
}

function ActivityProgress({start, end}: {start?: number; end?: number}) {
	const startSeconds = normalizeStartTimestamp(start);
	const endSeconds = normalizeEndTimestamp(end);
	const [now, setNow] = useState(Date.now());
	useEffect(() => {
		if (!startSeconds || !endSeconds) return;
		const id = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(id);
	}, [endSeconds, startSeconds]);
	if (!startSeconds || !endSeconds || endSeconds <= startSeconds) return null;
	return (
		<div className={styles.activityProgressRow}>
			<span className={styles.activityProgressTime}>{formatDuration(startSeconds, now, 'elapsed')}</span>
			<div className={styles.activityProgress} aria-hidden>
				<div
					className={styles.activityProgressFill}
					style={{width: `${getProgressPercent(startSeconds, endSeconds, now)}%`}}
				/>
			</div>
			<span className={styles.activityProgressTime}>{formatDuration(endSeconds - startSeconds, now, 'total')}</span>
		</div>
	);
}

function ActivityFallbackIcon({type}: {type: number}) {
	if (type === 2) {
		return <HeadphonesIcon className={styles.activityIconFallback} weight="fill" aria-hidden />;
	}
	return <GameControllerIcon className={styles.activityIconFallback} weight="fill" aria-hidden />;
}

function ActivityLine({className, href, children}: {className: string; href?: string; children: React.ReactNode}) {
	if (!href) return <div className={className}>{children}</div>;
	return (
		<ExternalLink href={href} className={`${className} ${styles.activityLink}`}>
			{children}
		</ExternalLink>
	);
}

export const ProfileRichPresence: React.FC<ProfileRichPresenceProps> = ({
	userId,
	onOpenProfile,
	listeningSourceMaxLength = LISTENING_SOURCE_MAX_LENGTH,
	showEmptyState = false,
}) => {
	const {i18n} = useLingui();
	const activities = usePresenceActivities({userId});
	const [activityIndex, setActivityIndex] = useState(0);
	useEffect(() => {
		setActivityIndex((currentIndex) => Math.min(currentIndex, Math.max(activities.length - 1, 0)));
	}, [activities.length]);
	const hasMultipleActivities = activities.length > 1;
	const activity = useMemo(() => activities[activityIndex] ?? null, [activities, activityIndex]);
	const display = useMemo(() => (activity ? formatActivityDisplay(activity) : null), [activity]);
	if (activities.length === 0) {
		return showEmptyState ? <ProfilePresenceEmptyState /> : null;
	}
	if (!activity || !display) return null;
	const cardContent = (
		<>
			<div className={styles.headerRow}>
				<span className={styles.activityLabel}>
					{getActivityHeader(activity, display.listeningSource, i18n, listeningSourceMaxLength)}
				</span>
				{hasMultipleActivities ? (
					<div className={styles.activityCarouselControls}>
						<button
							type="button"
							className={styles.activityCarouselButton}
							onClick={(event) => {
								event.stopPropagation();
								setActivityIndex((currentIndex) => Math.max(currentIndex - 1, 0));
							}}
							disabled={activityIndex === 0}
							aria-label="Show previous activity"
						>
							<CaretLeftIcon size={14} weight="bold" aria-hidden />
						</button>
						<span className={styles.activityCarouselCount}>
							{activityIndex + 1}/{activities.length}
						</span>
						<button
							type="button"
							className={styles.activityCarouselButton}
							onClick={(event) => {
								event.stopPropagation();
								setActivityIndex((currentIndex) => Math.min(currentIndex + 1, activities.length - 1));
							}}
							disabled={activityIndex >= activities.length - 1}
							aria-label="Show next activity"
						>
							<CaretRightIcon size={14} weight="bold" aria-hidden />
						</button>
					</div>
				) : null}
			</div>
			<div className={styles.activityRow}>
				<div className={styles.activityArt}>
					<ActivityCoverImage
						activity={activity}
						className={styles.activityIcon}
						fallback={<ActivityFallbackIcon type={activity.type} />}
					/>
				</div>
				<div className={styles.activityBody}>
					<ActivityLine className={styles.activityPrimary} href={activity.details_url}>
						{display.secondary } {/* [OM] return to this block. May require displaying seperate information depending on the type of activity*/}
					</ActivityLine>
					{display.primary ? (
						<ActivityLine className={styles.activitySecondary} href={activity.state_url}>
							{display.primary}
						</ActivityLine>
					) : null}
					<ActivityProgress start={activity.timestamps?.start} end={activity.timestamps?.end} />
					<ActivityTimer start={activity.timestamps?.start} end={activity.timestamps?.end} />
					{activity?.state && activity.state !== display.primary ? (
						<ActivityLine className={styles.activitySecondary} href={activity.state}>
							{activity.state}
						</ActivityLine>
					) : null}
					{activity.buttons?.length
						? null
						: // ( [OM] prefer icons if we can somewhere.
							// 	<div className={styles.activityButtons}>
							// 		{activity.buttons.map((button) => (
							// 			<ExternalLink
							// 				key={`${button.label}:${button.url}`}
							// 				href={button.url}
							// 				className={styles.activityButton}
							// 			>
							// 				{button.label}
							// 			</ExternalLink>
							// 		))}
							// 	</div>
							// )
							null}
				</div>
			</div>
		</>
	);
	if (!onOpenProfile) {
		return (
			<div className={styles.activityCard} data-flx="user.profile.profile-rich-presence">
				{cardContent}
			</div>
		);
	}
	return (
		<div
			className={clsx(styles.activityCard, styles.activityCardInteractive)}
			onClick={onOpenProfile}
			onKeyDown={(event) => {
				if (!isKeyboardActivationKey(event.key)) return;
				event.preventDefault();
				onOpenProfile();
			}}
			role="button"
			tabIndex={0}
		>
			{cardContent}
		</div>
	);
};
