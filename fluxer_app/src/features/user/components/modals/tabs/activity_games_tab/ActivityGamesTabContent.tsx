// SPDX-License-Identifier: AGPL-3.0-or-later

import {SettingsSection} from '@app/features/app/components/dialogs/shared/SettingsSection';
import {SettingsTabSection} from '@app/features/app/components/dialogs/shared/SettingsTabLayout';
import {ACTIVITY_DETECTION_DESCRIPTOR} from '@app/features/i18n/utils/CommonMessageDescriptors';
import * as PresenceCommands from '@app/features/presence/commands/PresenceCommands';
import {Switch} from '@app/features/ui/components/form/FormSwitch';
import {RadioGroup, type RadioOption} from '@app/features/ui/radio_group/RadioGroup';
import UserSettings from '@app/features/user/state/UserSettings';
import {type ActivityVisibilityLevel, ActivityVisibilityLevels} from '@fluxer/constants/src/UserConstants';
import {msg} from '@lingui/core/macro';
import {useLingui} from '@lingui/react/macro';
import {observer} from 'mobx-react-lite';
import type React from 'react';

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
	message: 'Activity presence is displayed unrestricted',
});

// [OM]
// const ACTIVITY_VISIBILITY_SMALL_COMMUNITIES_DESCRIPTOR = msg({
// 	message: 'Small Communities',
// 	comment: 'Your activity is visible to small communities and friends',
// });
// const ACTIVITY_VISIBILITY_SMALL_COMMUNITIES_DESCRIPTION = msg({
// 	message: 'Your activity is visible to small communities and friends',
// });

const ACTIVITY_VISIBILITY_FRIENDS_DESCRIPTOR = msg({
	message: 'Friends',
	comment: 'Your activity is only displayed to users on your friends list',
});
const ACTIVITY_VISIBILITY_FRIENDS_DESCRIPTION = msg({
	message: 'Your activity is only displayed to users on your friends list',
});

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
		// { [OM]
		// 	value: ActivityVisibilityLevels.SMALL_GUILDS_ONLY,
		// 	name: i18n._(ACTIVITY_VISIBILITY_SMALL_COMMUNITIES_DESCRIPTOR),
		// 	desc: i18n._(ACTIVITY_VISIBILITY_SMALL_COMMUNITIES_DESCRIPTION),
		// },
		{
			value: ActivityVisibilityLevels.FRIENDS,
			name: i18n._(ACTIVITY_VISIBILITY_FRIENDS_DESCRIPTOR),
			desc: i18n._(ACTIVITY_VISIBILITY_FRIENDS_DESCRIPTION),
		},
	];
	return (
		<SettingsSection id="activity-detection" title={i18n._(ACTIVITY_DETECTION_DESCRIPTOR)}>
			<Switch
				label={i18n._(SHARE_DETECTED_ACTIVITIES_DESCRIPTOR)}
				description={i18n._(SHARE_DETECTED_ACTIVITIES_DESCRIPTION)}
				value={activityDetectionEnabled}
				onChange={PresenceCommands.setActivityDetectionEnabled}
			/>

				<SettingsTabSection
					title={
						<span style={{opacity: disabled ? 0.45 : 1, fontWeight: 400, fontSize: '0.85rem'}}>
							{i18n._(ACTIVITY_VISIBILITY_DESCRIPTOR)}
						</span>
					}
				>

					<RadioGroup
						options={visibilityOptions}
						value={activityVisibility}
						onChange={PresenceCommands.setActivityVisibility}
						disabled={disabled}
					/>
				</SettingsTabSection>

		</SettingsSection>
	);
});
