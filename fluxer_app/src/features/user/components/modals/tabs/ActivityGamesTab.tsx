// SPDX-License-Identifier: AGPL-3.0-or-later

import {SettingsTabContainer, SettingsTabContent} from '@app/features/app/components/dialogs/shared/SettingsTabLayout';
import {ActivityTabContent} from '@app/features/user/components/modals/tabs/activity_games_tab/ActivityGamesTabContent';
import {observer} from 'mobx-react-lite';
import type React from 'react';

const ActivityGamesTab: React.FC = observer(() => {
	return (
		<SettingsTabContainer>
			<SettingsTabContent>
				<ActivityTabContent />
			</SettingsTabContent>
		</SettingsTabContainer>
	);
});

export default ActivityGamesTab;
