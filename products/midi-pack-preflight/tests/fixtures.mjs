import { zipSync } from "fflate";

function flatten(parts) {
  const bytes = [];
  function append(part) {
    if (typeof part === "number") bytes.push(part);
    else if (part instanceof Uint8Array) bytes.push(...part);
    else for (const value of part) append(value);
  }
  append(parts);
  return Uint8Array.from(bytes);
}

function be16(value) {
  return [(value >> 8) & 0xff, value & 0xff];
}

function be32(value) {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

export function vlq(value) {
  if (!Number.isInteger(value) || value < 0 || value > 0x0fffffff) throw new Error("Invalid VLQ value");
  const bytes = [value & 0x7f];
  for (let remaining = value >> 7; remaining; remaining >>= 7) bytes.unshift((remaining & 0x7f) | 0x80);
  return bytes;
}

export function midiEvent(delta, status, ...data) {
  return [...vlq(delta), status, ...data];
}

export function runningEvent(delta, ...data) {
  return [...vlq(delta), ...data];
}

export function metaEvent(delta, type, data = []) {
  return [...vlq(delta), 0xff, type, ...vlq(data.length), ...data];
}

export function sysexEvent(delta, data = [0x7d, 0x01, 0xf7]) {
  return [...vlq(delta), 0xf0, ...vlq(data.length), ...data];
}

export function textBytes(value) {
  return [...new TextEncoder().encode(value)];
}

export function makeTrack(events, { end = true } = {}) {
  const data = flatten([...events, ...(end ? [metaEvent(0, 0x2f)] : [])]);
  return flatten([[0x4d, 0x54, 0x72, 0x6b], be32(data.length), data]);
}

export function makeMidi({ format = 0, division = 480, tracks, declaredTrackCount = tracks.length, headerLength = 6 }) {
  const headerData = flatten([be16(format), be16(declaredTrackCount), be16(division)]);
  const declaredHeader = headerLength === 6 ? headerData : headerData.subarray(0, Math.min(headerLength, headerData.length));
  return flatten([[0x4d, 0x54, 0x68, 0x64], be32(headerLength), declaredHeader, tracks]);
}

export function cleanFormat0(trackName = "Lead A") {
  return makeMidi({
    tracks: [makeTrack([
      metaEvent(0, 0x03, textBytes(trackName)),
      metaEvent(0, 0x51, [0x07, 0xa1, 0x20]),
      metaEvent(0, 0x58, [4, 2, 24, 8]),
      metaEvent(0, 0x59, [0, 0]),
      midiEvent(0, 0xc0, 10),
      midiEvent(0, 0xb0, 7, 100),
      midiEvent(0, 0x90, 60, 100),
      runningEvent(120, 64, 90),
      midiEvent(360, 0x80, 60, 0),
      runningEvent(0, 64, 0),
    ])],
  });
}

export function cleanFormat1() {
  return makeMidi({
    format: 1,
    tracks: [
      makeTrack([
        metaEvent(0, 0x03, textBytes("Conductor")),
        metaEvent(0, 0x51, [0x07, 0xa1, 0x20]),
        metaEvent(0, 0x58, [3, 2, 24, 8]),
        metaEvent(0, 0x59, [0xff, 1]),
      ]),
      makeTrack([
        metaEvent(0, 0x03, textBytes("Bass")),
        midiEvent(0, 0xc1, 32),
        midiEvent(0, 0xb1, 10, 64),
        midiEvent(0, 0x91, 36, 110),
        midiEvent(960, 0x81, 36, 0),
      ]),
    ],
  });
}

export function distinctPerformance() {
  return makeMidi({
    tracks: [makeTrack([
      metaEvent(0, 0x03, textBytes("Distinct")),
      midiEvent(0, 0x90, 72, 70),
      midiEvent(240, 0x80, 72, 0),
    ])],
  });
}

export const MALFORMED_MIDI = Object.freeze({
  "bad/invalid-header.mid": Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]),
  "bad/header-length.mid": makeMidi({ tracks: [makeTrack([])], declaredTrackCount: 1, headerLength: 5 }),
  "bad/invalid-format.mid": makeMidi({ format: 3, tracks: [makeTrack([])] }),
  "bad/format-zero-tracks.mid": makeMidi({ format: 0, tracks: [makeTrack([]), makeTrack([])] }),
  "bad/track-mismatch.mid": makeMidi({ format: 1, tracks: [makeTrack([])], declaredTrackCount: 2 }),
  "bad/truncated-track.mid": flatten([
    [0x4d,0x54,0x68,0x64], be32(6), be16(0), be16(1), be16(480),
    [0x4d,0x54,0x72,0x6b], be32(20), [0x00,0xff,0x2f,0x00],
  ]),
  "bad/overlong-vlq.mid": makeMidi({ tracks: [makeTrack([[0x81,0x81,0x81,0x81,0x00,0x90,60,100]], { end: false })] }),
  "bad/running-status.mid": makeMidi({ tracks: [makeTrack([[0x00,60,100]], { end: false })] }),
  "bad/data-byte.mid": makeMidi({ tracks: [makeTrack([[0x00,0x90,0x80,0x40]], { end: false })] }),
  "bad/meta-event.mid": makeMidi({ tracks: [makeTrack([[0x00,0xff,0x01,0x05,0x41]], { end: false })] }),
  "bad/system-event.mid": makeMidi({ tracks: [makeTrack([[0x00,0xf0,0x05,0x7d]], { end: false })] }),
  "bad/missing-eot.mid": makeMidi({ tracks: [makeTrack([midiEvent(0,0x90,60,100), midiEvent(120,0x80,60,0)], { end: false })] }),
});

export const REVIEWABLE_MIDI = Object.freeze({
  "review/no-notes.mid": makeMidi({ tracks: [makeTrack([metaEvent(0, 0x03, textBytes("Empty clip"))])] }),
  "review/unmatched.mid": makeMidi({ tracks: [makeTrack([midiEvent(0, 0x90, 60, 100)])] }),
  "review/format-two.mid": makeMidi({ format: 2, tracks: [
    makeTrack([midiEvent(0, 0x90, 60, 90), midiEvent(120, 0x80, 60, 0)]),
    makeTrack([midiEvent(0, 0x90, 64, 90), midiEvent(120, 0x80, 64, 0)]),
  ] }),
  "review/smpte.mid": makeMidi({ division: 0xe728, tracks: [makeTrack([midiEvent(0,0x90,60,100), midiEvent(1000,0x80,60,0)])] }),
  "review/sysex.mid": makeMidi({ tracks: [makeTrack([sysexEvent(0), midiEvent(0,0x90,60,100), midiEvent(120,0x80,60,0)])] }),
  "review/conflicting.mid": makeMidi({ tracks: [makeTrack([
    metaEvent(0, 0x51, [0x07,0xa1,0x20]),
    metaEvent(0, 0x51, [0x06,0x1a,0x80]),
    metaEvent(0, 0x59, [0,0]),
    metaEvent(0, 0x59, [2,0]),
    metaEvent(0, 0x58, [4,2,24,8]),
    metaEvent(0, 0x58, [3,2,24,8]),
    midiEvent(0,0x90,60,100), midiEvent(120,0x80,60,0),
  ])] }),
  "review/non-ascii.mid": makeMidi({ tracks: [makeTrack([
    metaEvent(0, 0x03, textBytes("Mélodie")), midiEvent(0,0x90,60,100), midiEvent(120,0x80,60,0),
  ])] }),
});

export function zipFromMap(entries) {
  const normalized = Object.fromEntries(
    Object.entries(entries).map(([path, bytes]) => [path, bytes instanceof Uint8Array ? bytes : new TextEncoder().encode(String(bytes))]),
  );
  return zipSync(normalized, { level: 9, mtime: new Date("2026-08-30T00:00:00Z") });
}

export function fileLike(name, bytes, options = {}) {
  const value = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return {
    name,
    size: options.size ?? value.byteLength,
    webkitRelativePath: options.webkitRelativePath || "",
    async arrayBuffer() { return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength); },
  };
}
