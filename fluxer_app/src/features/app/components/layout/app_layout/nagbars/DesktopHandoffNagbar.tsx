// SPDX-License-Identifier: AGPL-3.0-or-later

import {Nagbar} from '@app/features/app/components/layout/Nagbar';
import {NagbarButton} from '@app/features/app/components/layout/NagbarButton';
import {NagbarContent} from '@app/features/app/components/layout/NagbarContent';
import {NAGBAR_TONES, NagbarToneKind} from '@app/features/app/components/layout/NagbarTones';
import {OPEN_SETTINGS_DESCRIPTOR} from '@app/features/i18n/utils/CommonMessageDescriptors';
import Users from '@app/features/user/state/Users';
import * as NicknameUtils from '@app/features/user/utils/NicknameUtils';
import * as ModalCommands from '@app/features/ui/commands/ModalCommands';
import {modal} from '@app/features/ui/commands/ModalCommands';
import {msg} from '@lingui/core/macro';
import {useLingui} from '@lingui/react/macro';
import {observer} from 'mobx-react-lite';
import { openExternalUrl } from '@app/features/ui/utils/NativeUtils';
import { buildAppProtocolUrl } from '@app/features/ui/utils/AppProtocol';
import { FAILED_TO_OPEN_IN_DESKTOP_APP_DESCRIPTOR } from '@app/features/auth/flow/DesktopDeepLinkPrompt';
import { useState } from 'react';


const DESKTOP_HANDOFF_NAGBAR_MESSAGE_DESCRIPTOR = msg({
	message: '{displayName}, transfer to our native desktop app?',
	comment: 'Nagbar message shown when the current user has successfully registered, initiating the desktop handoff flow. displayName is the user display name.',
});

const BTN_DESKTOP_HANDOFF_DESCRIPTOR = msg({
	message: 'Go to desktop',
	comment: 'Button descriptor for nagbar shown when user is indicated to handoff to desktop',
});

export const DesktopHandoffNagbar = observer(({isMobile}: {isMobile: boolean}) => {
	const [error, setError] = useState<string | null>(null);
	const {i18n} = useLingui();
	const user = Users.currentUser;
	if (!user) {
		return null;
	}
	// 1. Send the native app a request to show the browser login handoff modal
	// 2. Native app shows the modal in the login screen and initiates the return to the browser
	const handoffToDesktopApp = async () => {
		//TODO: handoff logic

		const handleOpen = async () => {
			setError(null);
			try {
				await openExternalUrl(buildAppProtocolUrl('/auth/handoff'));
			} catch {
				setError(i18n._(FAILED_TO_OPEN_IN_DESKTOP_APP_DESCRIPTOR));
			}
		};
		handleOpen();

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
