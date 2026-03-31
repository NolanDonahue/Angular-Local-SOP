import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { resolveSafeImagePath } from './lib/safe-image-path.mjs';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message ?? 'Assertion failed');
  }
}

const testRoot = resolve(tmpdir(), `sop-bundle-path-verify-${process.pid}-${Date.now()}`);
mkdirSync(testRoot, { recursive: true });

try {
  const nested = join(testRoot, 'nested');
  mkdirSync(nested, { recursive: true });
  writeFileSync(join(nested, 'probe.txt'), 'ok');

  assert(resolveSafeImagePath(testRoot, 'nested/probe.txt') !== null, 'valid nested path');
  assert(resolveSafeImagePath(testRoot, join('nested', 'probe.txt')) !== null, 'valid nested path (native sep)');

  assert(resolveSafeImagePath(testRoot, '../../../etc/passwd') === null, 'reject ../ escape');
  assert(resolveSafeImagePath(testRoot, 'nested/../../../etc/passwd') === null, 'reject mid-path ../ escape');
  assert(resolveSafeImagePath(testRoot, '..\\..\\..\\etc\\passwd') === null, 'reject Windows-style escape');

  const assetsPrefix = 'assets/images/../../../package.json';
  assert(resolveSafeImagePath(testRoot, assetsPrefix) === null, 'reject assets-like traversal payload');

  assert(resolveSafeImagePath(testRoot, '') === null, 'reject empty');
  assert(resolveSafeImagePath(testRoot, '   ') === null, 'reject whitespace-only');
  assert(resolveSafeImagePath(testRoot, 'nested\x00/probe.txt') === null, 'reject NUL');

  console.log('verify-bundle-path-safety: ok');
} finally {
  rmSync(testRoot, { recursive: true, force: true });
}
