// SPDX-License-Identifier: AGPL-3.0-or-later

import {Nagbar} from '@app/features/app/components/layout/Nagbar';
import {NagbarButton} from '@app/features/app/components/layout/NagbarButton';
import {NagbarContent} from '@app/features/app/components/layout/NagbarContent';
import {NAGBAR_TONES, NagbarToneKind} from '@app/features/app/components/layout/NagbarTones';
import {OPEN_SETTINGS_DESCRIPTOR} from '@app/features/i18n/utils/CommonMessageDescriptors';
import Users from '@app/features/user/state/Users';
import * as NicknameUtils from '@app/features/user/utils/NicknameUtils';
import {msg} from '@lingui/core/macro';
import {useLingui} from '@lingui/react/macro';
import {observer} from 'mobx-react-lite';

const DESKTOP_HANDOFF_NAGBAR_MESSAGE_DESCRIPTOR = msg({
	message: '{displayName}, transfer to our native desktop app?',
	comment: 'Nagbar message shown when the current user has successfully registered, initiating the desktop handoff flow. displayName is the user display name.',
});

const BTN_DESKTOP_HANDOFF_DESCRIPTOR = msg({
	message: 'Go to desktop',
	comment: 'Button descriptor for nagbar shown when user is indicated to handoff to desktop',
});

export const DesktopHandoffNagbar = observer(({isMobile}: {isMobile: boolean}) => {
	const {i18n} = useLingui();
	const user = Users.currentUser;
	if (!user) {
		return null;
	}

	const handoffToDesktopApp = () => {
		//TODO: handoff logic

		//TODO: add the download nagbar as like a kind of child that either grays out/visibly overlays
		//the handoff nagbar if we somehow can detect the desktop app is not installed.
	}

	return (
		<Nagbar
			isMobile={isMobile}
			backgroundColor={NAGBAR_TONES[NagbarToneKind.BRAND].backgroundColor}
			textColor={NAGBAR_TONES[NagbarToneKind.BRAND].textColor}
		>
			<NagbarContent
				isMobile={isMobile}
				message={i18n._(DESKTOP_HANDOFF_NAGBAR_MESSAGE_DESCRIPTOR,{
					displayName: NicknameUtils.getDisplayName(user)
				})}
				actions={
					<NagbarButton
						isMobile={isMobile}
						onClick={handoffToDesktopApp}
						>
							{i18n._(BTN_DESKTOP_HANDOFF_DESCRIPTOR)}
					</NagbarButton>
				}
			>

			</NagbarContent>
		</Nagbar>
	)
})
