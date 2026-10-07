import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { SOUNDS, synth, encodeWav, SAMPLE_RATE } from '../gen-sounds.mjs';

const NAMES = ['tick', 'select', 'snap', 'unlock', 'success', 'error', 'swoosh', 'pop', 'levelUp'];

test('paleta má všech 9 zvuků ze spec', () => assert.deepEqual(Object.keys(SOUNDS).sort(), [...NAMES].sort()));

test('generátor je deterministický', () => {
  for (const name of NAMES) {
    const a = createHash('sha1').update(encodeWav(synth(SOUNDS[name]))).digest('hex');
    const b = createHash('sha1').update(encodeWav(synth(SOUNDS[name]))).digest('hex');
    assert.equal(a, b, name);
  }
});

test('délka odpovídá spec ±5 ms a nic neklipuje', () => {
  for (const name of NAMES) {
    const s = synth(SOUNDS[name]);
    const ms = (s.length / SAMPLE_RATE) * 1000;
    assert.ok(Math.abs(ms - SOUNDS[name].ms) <= 5, `${name}: ${ms} ms`);
    const peak = s.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    assert.ok(peak <= 0.99 && peak > 0.05, `${name}: peak ${peak}`);
  }
});

test('WAV hlavička: RIFF/WAVE, PCM 16-bit mono 44.1 kHz', () => {
  const buf = encodeWav(synth(SOUNDS.tick));
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buf.toString('ascii', 8, 12), 'WAVE');
  assert.equal(buf.readUInt16LE(20), 1);
  assert.equal(buf.readUInt16LE(22), 1);
  assert.equal(buf.readUInt32LE(24), SAMPLE_RATE);
  assert.equal(buf.readUInt16LE(34), 16);
  assert.equal(buf.readUInt32LE(4), buf.length - 8);
});
