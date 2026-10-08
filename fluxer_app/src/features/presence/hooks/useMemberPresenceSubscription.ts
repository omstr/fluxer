// SPDX-License-Identifier: AGPL-3.0-or-later

import memberPresenceSubscription from '@app/features/presence/state/MemberPresenceSubscription';
import {useEffect} from 'react';

interface UseMemberPresenceSubscriptionOptions {
	guildId: string;
	userId: string;
	enabled?: boolean;
}

export function useMemberPresenceSubscription({
	guildId,
	userId,
	enabled = true,
}: UseMemberPresenceSubscriptionOptions): void {
	useEffect(() => {
		if (!enabled || !guildId) {
			return;
		}
		memberPresenceSubscription.touchMember(guildId, userId);
		return () => memberPresenceSubscription.unsubscribe(guildId, userId);
	}, [guildId, userId, enabled]);
}
