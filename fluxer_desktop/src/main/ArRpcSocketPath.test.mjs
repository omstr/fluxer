// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

const {getIpcSocketPath} = await import('./rpc/RpcUtils.ts');

describe('RPC IPC socket paths', () => {
	test('uses Discord-compatible named pipes on Windows', () => {
		assert.equal(getIpcSocketPath(0, 'discord-ipc', 'win32'), '\\\\.\\pipe\\discord-ipc-0');
		assert.equal(getIpcSocketPath(9, 'discord-ipc', 'win32'), '\\\\.\\pipe\\discord-ipc-9');
	});

	test('uses a unix socket in the runtime directory everywhere else', () => {
		const path = getIpcSocketPath(3, 'discord-ipc', 'linux');
		assert.match(path, /discord-ipc-3$/);
		assert.ok(!path.startsWith('\\\\'), 'unix sockets must not use the named pipe prefix');
	});
});
