// SPDX-License-Identifier: AGPL-3.0-or-later

import styles from '@app/features/guild/components/GuildRow.module.css';
import {GuildIcon} from '@app/features/guild/components/popouts/GuildIcon';
import type {Guild} from '@app/features/guild/models/Guild';
import {msg} from '@lingui/core/macro';
import {useLingui} from '@lingui/react/macro';
import {formatNumber} from '@pkgs/number_utils/src/NumberFormatting';
import {clsx} from 'clsx';

const GUILD_MEMBER_COUNT_DESCRIPTOR = msg({
	message: '{memberCount} {rawMemberCount, plural, one {member} other {members}}',
	comment:
		'Trailing member count on a community row. Preserve {memberCount} and {rawMemberCount}; they are inserted via code.',
});

interface GuildRowProps {
	readonly guild: Guild;
	readonly iconSizePx?: number;
	readonly className?: string;
}

export function GuildRow({guild, iconSizePx = 28, className}: GuildRowProps) {
	const {i18n} = useLingui();
	return (
		<div className={clsx(styles.row, className)}>
			<GuildIcon id={guild.id} name={guild.name} icon={guild.icon} sizePx={iconSizePx} />
			<span className={styles.name}>{guild.name}</span>
			{guild.memberCount > 0 && (
				<span className={styles.memberCount}>
					{i18n._(GUILD_MEMBER_COUNT_DESCRIPTOR, {
						memberCount: formatNumber(guild.memberCount, i18n.locale),
						rawMemberCount: guild.memberCount,
					})}
				</span>
			)}
		</div>
	);
}
