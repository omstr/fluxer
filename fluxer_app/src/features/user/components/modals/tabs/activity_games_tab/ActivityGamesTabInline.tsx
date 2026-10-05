// SPDX-License-Identifier: AGPL-3.0-or-later

import {ActivityTabContent} from '@app/features/user/components/modals/tabs/activity_games_tab/ActivityGamesTabContent';
import {observer} from 'mobx-react-lite';
import type React from 'react';

export const ActivityGamesInlineContent: React.FC = observer(() => {
	return <ActivityTabContent />;
});
