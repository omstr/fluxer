// SPDX-License-Identifier: AGPL-3.0-or-later

import {ACTIVITY_DETECTION_DESCRIPTOR} from '@app/features/i18n/utils/CommonMessageDescriptors';
import type {SectionDefinition} from '@app/features/user/components/settings_utils/section_registry/SectionRegistryTypes';

export const activityGamesSections = [
	{
		id: 'activity-detection',
		label: ACTIVITY_DETECTION_DESCRIPTOR,
		tabType: 'activity_games',
		keywords: ['activity', 'detection', 'presence', 'rich presence', 'games', 'share activity', 'status'],
		isAdvanced: false,
	},
] as const satisfies ReadonlyArray<SectionDefinition>;
