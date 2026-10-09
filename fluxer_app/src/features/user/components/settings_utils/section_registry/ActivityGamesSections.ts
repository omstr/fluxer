// SPDX-License-Identifier: AGPL-3.0-or-later

import type {SectionDefinition} from '@app/features/user/components/settings_utils/section_registry/SectionRegistryTypes';
import {msg} from '@lingui/core/macro';

const ACTIVITY_DETECTION_DESCRIPTOR = msg({
	message: 'Activity detection',
	comment: 'Section label in the Activity & Games settings tab.',
});

export const activityGamesSections = [
	{
		id: 'activity-detection',
		label: ACTIVITY_DETECTION_DESCRIPTOR,
		tabType: 'activity_games',
		keywords: ['activity', 'detection', 'presence', 'rich presence', 'games', 'share activity', 'status'],
		isAdvanced: false,
	},
] as const satisfies ReadonlyArray<SectionDefinition>;
