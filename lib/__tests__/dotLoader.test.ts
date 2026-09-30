import { echoBloom, echoDelay, echoOpacity, easeInOut, remapOpacity, ringOf, staticBloomLevel, staticOpacity } from '../dotLoader';

describe('DotLoader: ring mapping', () => {
  it('maps the 5×5 grid to Manhattan rings 0–4', () => {
    const rings = Array.from({ length: 25 }, (_, i) => ringOf(i));
    expect(rings).toEqual([
      4, 3, 2, 3, 4,
      3, 2, 1, 2, 3,
      2, 1, 0, 1, 2,
      3, 2, 1, 2, 3,
      4, 3, 2, 3, 4,
    ]);
  });

  it('delays each ring by 0.14 cycle plus 0.03 for odd rings', () => {
    expect([0, 1, 2, 3, 4].map(echoDelay)).toEqual([0, 0.17, 0.28, 0.45, 0.56].map((v) => expect.closeTo(v, 10)));
  });
});

describe('DotLoader: reduced-motion static opacity', () => {
  it('follows 0.2 + (1 - ring/4) * 0.72', () => {
    expect([0, 1, 2, 3, 4].map(staticOpacity)).toEqual([0.92, 0.74, 0.56, 0.38, 0.2].map((v) => expect.closeTo(v, 10)));
  });

  it('passes through without overrides and remaps into the given triplet', () => {
    expect(remapOpacity(0.56)).toBeCloseTo(0.56);
    expect(remapOpacity(0.94, 0.1, 0.4, 0.95)).toBeCloseTo(0.95);
    expect(remapOpacity(0.34, 0.1, 0.4, 0.95)).toBeCloseTo(0.4);
    expect(remapOpacity(0.2, 0.1, 0.4, 0.95)).toBeGreaterThan(0.1);
  });

  it('blooms only from opacity 0.6 upwards', () => {
    expect(staticBloomLevel(0.56)).toBe(0);
    expect(staticBloomLevel(0.92)).toBeCloseTo(0.8);
  });
});

describe('DotLoader: echo keyframes', () => {
  const [base, mid, peak] = [0.16, 0.32, 1];
  it('hits the dmx-ripple-echo keyframe values', () => {
    expect(echoOpacity(0, base, mid, peak)).toBeCloseTo(0.1);
    expect(echoOpacity(0.28, base, mid, peak)).toBeCloseTo(0.98);
    expect(echoOpacity(0.56, base, mid, peak)).toBeCloseTo(0.32);
    expect(echoOpacity(0.78, base, mid, peak)).toBeCloseTo(0.7824);
    expect(echoOpacity(1, base, mid, peak)).toBeCloseTo(0.1);
    expect(echoOpacity(-0.72, base, mid, peak)).toBeCloseTo(0.98);
  });

  it('uses CSS ease-in-out between keyframes', () => {
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
    expect(easeInOut(0.25)).toBeCloseTo(0.1292, 3);
  });

  it('switches bloom discretely at mid-segment (14 %–42 %)', () => {
    expect([0.1, 0.14, 0.28, 0.41, 0.42].map(echoBloom)).toEqual([0, 0.9, 0.9, 0.9, 0]);
  });
});
