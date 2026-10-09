// SPDX-License-Identifier: AGPL-3.0-or-later

import {SettingsSection} from '@app/features/app/components/dialogs/shared/SettingsSection';
import {SettingsTabSection} from '@app/features/app/components/dialogs/shared/SettingsTabLayout';
import {GuildRow} from '@app/features/guild/components/GuildRow';
import Guilds from '@app/features/guild/state/Guilds';
import {Logger} from '@app/features/platform/utils/AppLogger';
import * as PresenceCommands from '@app/features/presence/commands/PresenceCommands';
import { Button } from '@app/features/ui/button/Button';
import {Checkbox} from '@app/features/ui/checkbox/Checkbox';
import {Combobox, type ComboboxOption} from '@app/features/ui/components/form/FormCombobox';
import {Switch} from '@app/features/ui/components/form/FormSwitch';
import FocusRing from '@app/features/ui/focus_ring/FocusRing';
import {RadioGroup, type RadioOption} from '@app/features/ui/radio_group/RadioGroup';
import styles from '@app/features/user/components/modals/tabs/ActivityGamesTab.module.css';
import UserSettings from '@app/features/user/state/UserSettings';
import {
	type ActivityVisibilityLevel,
	ActivityVisibilityLevels,
	type RpcActivityType,
	RpcActivityTypes,
} from '@fluxer/constants/src/UserConstants';
import {msg} from '@lingui/core/macro';
import {useLingui} from '@lingui/react/macro';
import {clsx} from 'clsx';
import {observer} from 'mobx-react-lite';
import type React from 'react';
import {useState} from 'react';

const ACTIVITY_DETECTION_DESCRIPTOR = msg({
	message: 'Activity detection',
	comment: 'Section label in the Activity & Games settings tab.',
});

const SHARE_DETECTED_ACTIVITIES_DESCRIPTOR = msg({
	message: 'Share detected activities',
	comment: 'Switch label in the Activity Detection section of the Activity & Games settings tab.',
});

const SHARE_DETECTED_ACTIVITIES_DESCRIPTION = msg({
	message: 'Detect games and apps and show them as your status.',
	comment: 'Switch description in the Activity Detection section of the Activity & Games settings tab.',
});

const ACTIVITY_VISIBILITY_DESCRIPTOR = msg({
	message: 'Who can see your activity',
	comment: 'Propagation of the users activity to various gateway levels',
});

const ACTIVITY_VISIBILITY_EVERYONE_DESCRIPTOR = msg({
	message: 'Everyone',
	comment: 'Activity presence is displayed unrestricted',
});

const ACTIVITY_VISIBILITY_EVERYONE_DESCRIPTION = msg({
	message: 'Activity presence is displayed to friends and joined communities',
});

const ACTIVITY_VISIBILITY_NO_ONE_DESCRIPTOR = msg({
	message: 'No one',
	comment:
		'The users activity is only visible locally, and is therefore not part of the api schema because it does not affect anything on the gateway',
});
const ACTIVITY_VISIBILITY_NO_ONE_DESCRIPTION = msg({
	message: 'Your activity is visible only to yourself',
});

const ACTIVITY_VISIBILITY_FRIENDS_DESCRIPTOR = msg({
	message: 'Friends',
	comment: 'Your activity is only displayed to users on your friends list',
});
const ACTIVITY_VISIBILITY_FRIENDS_DESCRIPTION = msg({
	message: 'Your activity is only displayed to users on your friends list',
});

const ACTIVITY_GUILD_EXCLUSION_DESCRIPTOR = msg({
	message: 'Exclude Communities',
});

const ACTIVITY_GUILD_EXCLUSION_DESCRIPTION = msg({
	message: 'Members in selected communities are forbidden from seeing your activity. Excluding a community also excludes friends who are *only* present in your excluded communities.',
	comment: '',
});

const SAVE_SELECTION_DESCRIPTOR = msg({
	message: 'Save Selection',
	comment: 'Button in the Exclude Communities section of the Activity & Games settings tab.',
});

const SELECT_ALL_DESCRIPTOR = msg({
	message: 'Select all',
	comment: 'Link in the Exclude Communities section of the Activity & Games settings tab.',
});

const SELECT_NONE_DESCRIPTOR = msg({
	message: 'Select none',
	comment: 'Link in the Exclude Communities section of the Activity & Games settings tab.',
});

const ACTIVITY_MANAGE_DETECTION_DESCRIPTOR = msg({
	message: 'Manage Activity Detection',
});

const ACTIVITY_MANAGE_DETECTION_DESCRIPTION = msg({
	message: 'Add new processes to capture for your activity and manage your preferences.',
});

const ACTIVITY_TYPE_LABEL_DESCRIPTOR = msg({
	message: 'Preference for highest display priority for an activity',
	comment: 'Combobox Label in the Manage Activity Detection section of the Activity & Games settings tab.',
});

const ACTIVITY_TYPE_PLACEHOLDER_DESCRIPTOR = msg({
	message: 'Select an activity type',
	comment: 'Combobox placeholder in the Manage Activity Detection section of the Activity & Games settings tab.',
});

const ACTIVITY_TYPE_NONE_DESCRIPTOR = msg({
	message: 'No preference (default)',
	comment: 'Combobox default in the Manage Activity Detection section of the Activity & Games settings tab.',
});

const ACTIVITY_TYPE_PLAYING_DESCRIPTOR = msg({
	message: 'Playing',
	comment: 'RPC activity type option.',
});
const ACTIVITY_TYPE_LISTENING_DESCRIPTOR = msg({
	message: 'Listening',
	comment: 'RPC activity type option.',
});
const ACTIVITY_TYPE_WATCHING_DESCRIPTOR = msg({
	message: 'Watching',
	comment: 'RPC activity type option.',
});
const ACTIVITY_TYPE_COMPETING_DESCRIPTOR = msg({
	message: 'Competing',
	comment: 'RPC activity type option.',
});

const ACTIVITY_TYPE_OPTIONS = [
	{value: null, label: ACTIVITY_TYPE_NONE_DESCRIPTOR},
	{value: RpcActivityTypes.PLAYING, label: ACTIVITY_TYPE_PLAYING_DESCRIPTOR},
	{value: RpcActivityTypes.LISTENING, label: ACTIVITY_TYPE_LISTENING_DESCRIPTOR},
	{value: RpcActivityTypes.WATCHING, label: ACTIVITY_TYPE_WATCHING_DESCRIPTOR},
	{value: RpcActivityTypes.COMPETING, label: ACTIVITY_TYPE_COMPETING_DESCRIPTOR},
] as const;

export const ActivityTabContent: React.FC = observer(() => {
	const {i18n} = useLingui();
	const activityDetectionEnabled = UserSettings.getActivityDetectionEnabled();
	const activityVisibility = UserSettings.getActivityVisibility();

	const disabled = !activityDetectionEnabled;
	const visibilityOptions: Array<RadioOption<ActivityVisibilityLevel>> = [
		{
			value: ActivityVisibilityLevels.EVERYONE,
			name: i18n._(ACTIVITY_VISIBILITY_EVERYONE_DESCRIPTOR),
			desc: i18n._(ACTIVITY_VISIBILITY_EVERYONE_DESCRIPTION),
		},
		{
			value: ActivityVisibilityLevels.FRIENDS,
			name: i18n._(ACTIVITY_VISIBILITY_FRIENDS_DESCRIPTOR),
			desc: i18n._(ACTIVITY_VISIBILITY_FRIENDS_DESCRIPTION),
		},
		{
			value: ActivityVisibilityLevels.NO_ONE,
			name: i18n._(ACTIVITY_VISIBILITY_NO_ONE_DESCRIPTOR),
			desc: i18n._(ACTIVITY_VISIBILITY_NO_ONE_DESCRIPTION),
		},
	];

	const userGuilds = Guilds.getGuilds();
	const [excludedGuildIds, setExcludedGuildIds] = useState<ReadonlySet<string>>(() => new Set());
	const [selectedActivityType, setSelectedActivityType] = useState<RpcActivityType | null>(null);
	const activityTypeOptions: Array<ComboboxOption<RpcActivityType | null>> = ACTIVITY_TYPE_OPTIONS.map((option) => ({
		value: option.value,
		label: i18n._(option.label),
	}));
	const toggleGuildExclusion = (guildId: string, next: boolean): void => {
		setExcludedGuildIds((previous) => {
			const updated = new Set(previous);
			if (next) {
				updated.add(guildId);
			} else {
				updated.delete(guildId);
			}
			return updated;
		});
	};
	const selectAllGuilds = (): void => {
		setExcludedGuildIds(new Set(userGuilds.map((guild) => guild.id)));
	};
	const selectNoGuilds = (): void => {
		setExcludedGuildIds(new Set());
	};
	const handleSaveSelection = (): void => {
		// [OM]: persist once UserSettings exposes an activity guild-exclusion field.
		// [OM]: if the user has selected all, and saves it, reject the save and tell them that they may as well turn off activity detection
		Logger.create('ActivityGamesTab').debug('save selection', Array.from(excludedGuildIds));
	};
	return (
		<SettingsSection id="activity-detection" title={i18n._(ACTIVITY_DETECTION_DESCRIPTOR)}>
			<Switch
				label={i18n._(SHARE_DETECTED_ACTIVITIES_DESCRIPTOR)}
				description={i18n._(SHARE_DETECTED_ACTIVITIES_DESCRIPTION)}
				value={activityDetectionEnabled}
				onChange={PresenceCommands.setActivityDetectionEnabled}
			/>
			<div
				className={clsx(styles.activityDetectionWrapper, disabled && styles.activityDetectionDisabled)}
				inert={disabled ? true : undefined}
			>
				<div>
					<span style={{fontWeight: 400, fontSize: '0.9rem'}}>
						{i18n._(ACTIVITY_VISIBILITY_DESCRIPTOR)}
					</span>
					<RadioGroup
						options={visibilityOptions}
						value={activityVisibility}
						onChange={PresenceCommands.setActivityVisibility}
						disabled={disabled}
					/>
				</div>
				<SettingsTabSection
					title={i18n._(ACTIVITY_GUILD_EXCLUSION_DESCRIPTOR)}
					description={i18n._(ACTIVITY_GUILD_EXCLUSION_DESCRIPTION)}
				>
					<div className={styles.selectionActions}>
						<FocusRing>
							<button type="button" className={styles.linkButton} onClick={selectAllGuilds}>
								{i18n._(SELECT_ALL_DESCRIPTOR)}
							</button>
						</FocusRing>
						<FocusRing>
							<button type="button" className={styles.linkButton} onClick={selectNoGuilds}>
								{i18n._(SELECT_NONE_DESCRIPTOR)}
							</button>
						</FocusRing>
					</div>
					<div className={styles.guildListWrapper}>
						<div className={styles.guildList}>
							{userGuilds.map((guild) => {
								const isExcluded = excludedGuildIds.has(guild.id);
								return (
									<div className={styles.guildRow} key={guild.id}>
										<Checkbox
											aria-label={guild.name}
											size="small"
											checked={isExcluded}
											onChange={(next) => toggleGuildExclusion(guild.id, next)}
										/>
										<GuildRow
											guild={guild}
											className={clsx(styles.guildRowContent, !isExcluded && styles.guildRowUnchecked)}
										/>
									</div>
								);
							})}
						</div>
						{excludedGuildIds.size > 0 && (
							<FocusRing>
								<Button className={styles.saveSelectionButton} onClick={handleSaveSelection} >
									{i18n._(SAVE_SELECTION_DESCRIPTOR)}
								</Button>
							</FocusRing>
						)}
					</div>
				</SettingsTabSection>
				<SettingsTabSection
					title={i18n._(ACTIVITY_MANAGE_DETECTION_DESCRIPTOR)}
					description={i18n._(ACTIVITY_MANAGE_DETECTION_DESCRIPTION)}
				>
					<Combobox<RpcActivityType | null>
						label={i18n._(ACTIVITY_TYPE_LABEL_DESCRIPTOR)}
						placeholder={i18n._(ACTIVITY_TYPE_PLACEHOLDER_DESCRIPTOR)}
						isSearchable={false}
						value={selectedActivityType}
						options={activityTypeOptions}
						onChange={setSelectedActivityType}
					/>
				</SettingsTabSection>
			</div>
		</SettingsSection>
	);
});
