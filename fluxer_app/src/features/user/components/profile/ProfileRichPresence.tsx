// SPDX-License-Identifier: AGPL-3.0-or-later

import {ExternalLink} from '@app/features/app/components/shared/ExternalLink';
import {isKeyboardActivationKey} from '@app/features/input/utils/KeyboardUtils';
import {ActivityCoverImage} from '@app/features/presence/components/ActivityCoverImage';
import {usePresenceActivities} from '@app/features/presence/hooks/usePresenceActivities';
import {type ActivityDisplayLines, formatActivityDisplay} from '@app/features/presence/utils/formatActivityDisplay';
import {resolveActivityImageUrl} from '@app/features/presence/utils/resolveActivityImageUrl';
import experimentStyles from '@app/features/user/components/profile/ProfileRichPresence.experiments.module.css';
import styles from '@app/features/user/components/profile/ProfileRichPresence.module.css';
import type {UserActivity} from '@fluxer/schema/src/domains/user/UserResponseSchemas';
import type {I18n} from '@lingui/core';
import {msg} from '@lingui/core/macro';
import {useLingui} from '@lingui/react';
import {Trans} from '@lingui/react/macro';
import {CaretLeftIcon, CaretRightIcon, GameControllerIcon, HeadphonesIcon, MoonStarsIcon} from '@phosphor-icons/react';
import {clsx} from 'clsx';
import type React from 'react';
import {useEffect, useMemo, useRef, useState} from 'react';

interface ProfileRichPresenceProps {
	userId: string;
	onOpenProfile?: () => void;
	listeningSourceMaxLength?: number;
	showEmptyState?: boolean;
	expanded?: boolean | undefined;
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
	message: 'Playing {}',
	comment: 'Rich presence header on user profile.',
});

type PresenceCardExperiment = 'none' | 'glassy' | 'wash' | 'glassy-wash';

/**
 * [OM]
 * ProfileRichPresence.experiments.module.css, experimentStyles import washLayer div, 3 functions below
 */
const PRESENCE_CARD_EXPERIMENT: PresenceCardExperiment = 'none';

function experimentClassNameFor(experiment: PresenceCardExperiment): string | undefined {
	switch (experiment) {
		case 'glassy':
			return experimentStyles.glassy;
		case 'wash':
			return experimentStyles.wash;
		case 'glassy-wash':
			return clsx(experimentStyles.glassy, experimentStyles.wash);
		default:
			return undefined;
	}
}

function experimentWantsImageWash(experiment: PresenceCardExperiment): boolean {
	return experiment === 'wash' || experiment === 'glassy-wash';
}

function resolveActivityWashUrl(activity: UserActivity): string | null {
	const primaryImage = activity.assets?.large_image ?? activity.assets?.small_image;
	return resolveActivityImageUrl(primaryImage, activity.application_id);
}

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
			<MoonStarsIcon className={styles.emptyStateIcon} size={48} weight="light" aria-hidden style={{opacity: 0.7}} />
			<span className={styles.emptyStateTitle}>
				<Trans>All quiet for now</Trans>
			</span>
			<span className={styles.emptyStateBody}>
				<Trans>
					When something happens, it'll show up here.
				</Trans>
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

interface ProfileRichPresenceContentProps {
	activity: UserActivity;
	display: ActivityDisplayLines;
	listeningSourceMaxLength: number;
	headerActions?: React.ReactNode;
}

function ProfileRichPresenceContent({
	activity,
	display,
	listeningSourceMaxLength,
	headerActions,
}: ProfileRichPresenceContentProps) {
	const {i18n} = useLingui();
	return (
		<>
			<div className={styles.headerRow}>
				<span className={styles.activityLabel}>
					{getActivityHeader(activity, display.listeningSource, i18n, listeningSourceMaxLength)}
				</span>
				{headerActions}
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
						{display.primary}
						{/* [OM] return to this block. May require displaying seperate information depending on the type of activity*/}
					</ActivityLine>
					{display.secondary ? (
						<ActivityLine className={styles.activitySecondary} href={activity.state_url}>
							{display.secondary}
						</ActivityLine>
					) : null}
					<ActivityProgress start={activity.timestamps?.start} end={activity.timestamps?.end} />
					<ActivityTimer start={activity.timestamps?.start} end={activity.timestamps?.end} />
					{/* {activity?.state ? (
						<ActivityLine className={styles.activitySecondary} href={activity.state}>
							{activity.state}
						</ActivityLine>
					) : null} */}
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
}

interface ProfileRichPresenceCardProps {
	activity: UserActivity;
	onOpenProfile?: (() => void) | undefined;
	children: React.ReactNode;
}

function ProfileRichPresenceCard({activity, onOpenProfile, children}: ProfileRichPresenceCardProps) {
	const cardRef = useRef<HTMLDivElement | null>(null);
	const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
		const node = cardRef.current;
		if (node == null) return;
		const rect = node.getBoundingClientRect();
		node.style.setProperty('--spotlight-x', `${event.clientX - rect.left}px`);
		node.style.setProperty('--spotlight-y', `${event.clientY - rect.top}px`);
	};
	const washUrl = experimentWantsImageWash(PRESENCE_CARD_EXPERIMENT) ? resolveActivityWashUrl(activity) : null;
	const washStyle =
		washUrl == null ? undefined : ({'--presence-wash-image': `url("${washUrl}")`} as React.CSSProperties);
	const experimentClassName = experimentClassNameFor(PRESENCE_CARD_EXPERIMENT);
	const cardBody = (
		<>
			{washStyle ? <div className={experimentStyles.washLayer} style={washStyle} aria-hidden /> : null}
			<div className={styles.spotlight} aria-hidden />
			{children}
		</>
	);
	if (!onOpenProfile) {
		return (
			<div
				ref={cardRef}
				className={clsx(styles.activityCard, experimentClassName)}
				onPointerMove={handlePointerMove}
			>
				{cardBody}
			</div>
		);
	}
	return (
		<div
			ref={cardRef}
			className={clsx(styles.activityCard, styles.activityCardInteractive, experimentClassName)}
			onPointerMove={handlePointerMove}
			onClick={onOpenProfile}
			onKeyDown={(event) => {
				if (!isKeyboardActivationKey(event.key)) return;
				event.preventDefault();
				onOpenProfile();
			}}
			role="button"
			tabIndex={0}
		>
			{cardBody}
		</div>
	);
}

export const ProfileRichPresence: React.FC<ProfileRichPresenceProps> = ({
	userId,
	onOpenProfile,
	listeningSourceMaxLength = LISTENING_SOURCE_MAX_LENGTH,
	showEmptyState = false,
	expanded = false,
}) => {
	const activities = usePresenceActivities({userId});
	const [activityIndex, setActivityIndex] = useState(0);
	useEffect(() => {
		setActivityIndex((currentIndex) => Math.min(currentIndex, Math.max(activities.length - 1, 0)));
	}, [activities.length]);
	const activityEntries = useMemo(
		() => activities.map((item) => ({activity: item, display: formatActivityDisplay(item)})),
		[activities],
	);
	const activeEntry = activityEntries[activityIndex] ?? null;
	if (activities.length === 0) {
		return showEmptyState ? <ProfilePresenceEmptyState /> : null;
	}
	if (expanded) {
		return (
			<div className={styles.activityStack}>
				{activityEntries.map((entry, index) => (
					<ProfileRichPresenceCard
						key={`${entry.activity.application_id ?? entry.activity.name}:${index}`}
						activity={entry.activity}
						onOpenProfile={onOpenProfile}
					>
						<ProfileRichPresenceContent
							activity={entry.activity}
							display={entry.display}
							listeningSourceMaxLength={listeningSourceMaxLength}
						/>
					</ProfileRichPresenceCard>
				))}
			</div>
		);
	}
	if (activeEntry == null) return null;
	const hasMultipleActivities = activities.length > 1;
	const carouselControls = hasMultipleActivities ? (
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
				<CaretLeftIcon size={11} weight="bold" aria-hidden />
			</button>
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
				<CaretRightIcon size={11} weight="bold" aria-hidden />
			</button>
		</div>
	) : null;
	return (
		<ProfileRichPresenceCard activity={activeEntry.activity} onOpenProfile={onOpenProfile}>
			<ProfileRichPresenceContent
				activity={activeEntry.activity}
				display={activeEntry.display}
				listeningSourceMaxLength={listeningSourceMaxLength}
				headerActions={carouselControls}
			/>
		</ProfileRichPresenceCard>
	);
};
