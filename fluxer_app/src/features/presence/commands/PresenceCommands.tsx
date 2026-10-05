// SPDX-License-Identifier: AGPL-3.0-or-later

import * as UserSettingsCommands from '@app/features/user/commands/UserSettingsCommands';
import UserSettings from '@app/features/user/state/UserSettings';
import type {ActivityVisibilityLevel} from '@fluxer/constants/src/UserConstants';

export function setActivityDetectionEnabled(enabled: boolean): Promise<void> {
	return UserSettings.setActivityDetectionEnabled(enabled);
}

export function setActivityVisibility(level: ActivityVisibilityLevel): Promise<void> {
	return UserSettingsCommands.update({activityVisibility: level});
}
