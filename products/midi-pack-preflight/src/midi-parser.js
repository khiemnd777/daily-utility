const BLOCKER = "blocker";
const REVIEW = "review";

class ParseFault extends Error {
  constructor(id, message, offset) {
    super(message);
    this.id = id;
    this.offset = offset;
  }
}

function finding(id, severity, evidence, { offset = null, track = null } = {}) {
  return { id, severity, evidence, offset, track };
}

function ascii(bytes, start, length) {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

function u16(bytes, offset) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function u32(bytes, offset) {
  return ((bytes[offset] * 0x1000000) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3]) >>> 0;
}

function hex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function readVariableLength(bytes, state) {
  const start = state.offset;
  let value = 0;
  for (let count = 0; count < 4; count += 1) {
    if (state.offset >= bytes.length) {
      throw new ParseFault("truncated-variable-length", "Variable-length quantity ends before a terminating byte.", start);
    }
    const byte = bytes[state.offset++];
    value = (value << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) return value;
  }
  throw new ParseFault("overlong-variable-length", "Variable-length quantity exceeds the Standard MIDI four-byte limit.", start);
}

function readDataBytes(bytes, state, count, status) {
  if (state.offset + count > bytes.length) {
    throw new ParseFault("truncated-channel-event", `Channel event 0x${status.toString(16)} is truncated.`, state.offset);
  }
  const values = [];
  for (let index = 0; index < count; index += 1) {
    const value = bytes[state.offset++];
    if (value >= 0x80) {
      throw new ParseFault("invalid-data-byte", `Channel event data byte 0x${value.toString(16)} has its status bit set.`, state.offset - 1);
    }
    values.push(value);
  }
  return values;
}

function textFacts(data) {
  const nonAscii = data.some((byte) => byte > 0x7f);
  let value;
  try {
    value = new TextDecoder("utf-8", { fatal: true }).decode(data);
  } catch {
    value = new TextDecoder("windows-1252").decode(data);
  }
  return { value, nonAscii };
}

function parseTrack(bytes, trackIndex) {
  const state = { offset: 0 };
  const findings = [];
  const trackNames = [];
  const channelEvents = [];
  const noteEvents = [];
  const tempoEvents = [];
  const keyEvents = [];
  const timeEvents = [];
  const performanceEvents = [];
  let runningStatus = null;
  let tick = 0;
  let order = 0;
  let endOfTrack = false;
  let sysexCount = 0;
  let nonAsciiText = false;

  try {
    while (state.offset < bytes.length) {
      const eventOffset = state.offset;
      const delta = readVariableLength(bytes, state);
      tick += delta;
      if (!Number.isSafeInteger(tick)) {
        throw new ParseFault("tick-overflow", "Accumulated track time exceeds the safe integer range.", eventOffset);
      }
      if (state.offset >= bytes.length) {
        throw new ParseFault("truncated-event", "Track ends after a delta-time without an event.", state.offset);
      }

      let status = bytes[state.offset];
      if (status >= 0x80) {
        state.offset += 1;
        if (status < 0xf0) runningStatus = status;
      } else if (runningStatus !== null) {
        status = runningStatus;
      } else {
        throw new ParseFault("illegal-running-status", "A data byte appears without a preceding channel status.", state.offset);
      }

      if (status >= 0x80 && status <= 0xef) {
        const kind = status & 0xf0;
        const channel = status & 0x0f;
        const dataLength = kind === 0xc0 || kind === 0xd0 ? 1 : 2;
        const data = readDataBytes(bytes, state, dataLength, status);
        channelEvents.push({ tick, track: trackIndex, order, status, channel, data });
        performanceEvents.push({ tick, track: trackIndex, order, kind: "midi", data: [status, ...data] });
        if (kind === 0x90 && data[1] > 0) {
          noteEvents.push({ tick, track: trackIndex, order, type: "on", channel, note: data[0], velocity: data[1] });
        } else if (kind === 0x80 || (kind === 0x90 && data[1] === 0)) {
          noteEvents.push({ tick, track: trackIndex, order, type: "off", channel, note: data[0], velocity: data[1] });
        }
        order += 1;
        continue;
      }

      if (status === 0xff) {
        if (state.offset >= bytes.length) {
          throw new ParseFault("truncated-meta-event", "Meta event is missing its type byte.", state.offset);
        }
        const type = bytes[state.offset++];
        let length;
        try {
          length = readVariableLength(bytes, state);
        } catch (error) {
          throw new ParseFault("truncated-meta-event", `Meta event 0x${type.toString(16)} has an invalid length: ${error.message}`, error.offset);
        }
        if (state.offset + length > bytes.length) {
          throw new ParseFault("truncated-meta-event", `Meta event 0x${type.toString(16)} declares ${length} bytes beyond the track boundary.`, state.offset);
        }
        const data = bytes.subarray(state.offset, state.offset + length);
        state.offset += length;

        if (type === 0x2f) {
          if (length !== 0) {
            findings.push(finding("invalid-end-of-track-length", BLOCKER, "End-of-track meta event must have zero data bytes.", { offset: eventOffset, track: trackIndex }));
          }
          endOfTrack = true;
          if (state.offset !== bytes.length) {
            findings.push(finding("data-after-end-of-track", BLOCKER, `${bytes.length - state.offset} byte(s) follow the end-of-track event.`, { offset: state.offset, track: trackIndex }));
          }
          break;
        }

        if (type >= 0x01 && type <= 0x07) {
          const decoded = textFacts(data);
          if (decoded.nonAscii) nonAsciiText = true;
          if (type === 0x03) trackNames.push(decoded.value);
        }

        if (type === 0x51) {
          if (length !== 3) {
            findings.push(finding("invalid-tempo-length", BLOCKER, `Tempo meta event has ${length} bytes instead of 3.`, { offset: eventOffset, track: trackIndex }));
          } else {
            const value = (data[0] << 16) | (data[1] << 8) | data[2];
            if (value === 0) {
              findings.push(finding("invalid-tempo-value", BLOCKER, "Tempo value must be greater than zero.", { offset: eventOffset, track: trackIndex }));
            } else {
              tempoEvents.push({ tick, track: trackIndex, value });
              performanceEvents.push({ tick, track: trackIndex, order, kind: "tempo", data: [value] });
            }
          }
        } else if (type === 0x58) {
          if (length !== 4) {
            findings.push(finding("invalid-time-signature-length", BLOCKER, `Time-signature meta event has ${length} bytes instead of 4.`, { offset: eventOffset, track: trackIndex }));
          } else {
            const value = `${data[0]}/${2 ** data[1]}:${data[2]}:${data[3]}`;
            timeEvents.push({ tick, track: trackIndex, value });
            performanceEvents.push({ tick, track: trackIndex, order, kind: "time", data: Array.from(data) });
          }
        } else if (type === 0x59) {
          const signedKey = data[0] >= 128 ? data[0] - 256 : data[0];
          if (length !== 2 || signedKey < -7 || signedKey > 7 || data[1] > 1) {
            findings.push(finding("invalid-key-signature", BLOCKER, "Key-signature meta event has an invalid length or value.", { offset: eventOffset, track: trackIndex }));
          } else {
            const value = `${signedKey}:${data[1]}`;
            keyEvents.push({ tick, track: trackIndex, value });
            performanceEvents.push({ tick, track: trackIndex, order, kind: "key", data: [signedKey, data[1]] });
          }
        }
        order += 1;
        continue;
      }

      if (status === 0xf0 || status === 0xf7) {
        let length;
        try {
          length = readVariableLength(bytes, state);
        } catch (error) {
          throw new ParseFault("truncated-system-event", `System-exclusive event has an invalid length: ${error.message}`, error.offset);
        }
        if (state.offset + length > bytes.length) {
          throw new ParseFault("truncated-system-event", `System-exclusive event declares ${length} bytes beyond the track boundary.`, state.offset);
        }
        const data = bytes.subarray(state.offset, state.offset + length);
        state.offset += length;
        sysexCount += 1;
        performanceEvents.push({ tick, track: trackIndex, order, kind: "sysex", data: [status, hex(data)] });
        order += 1;
        continue;
      }

      throw new ParseFault("illegal-system-status", `Status 0x${status.toString(16)} is not a valid Standard MIDI File event.`, eventOffset);
    }
  } catch (error) {
    if (!(error instanceof ParseFault)) throw error;
    findings.push(finding(error.id, BLOCKER, error.message, { offset: error.offset, track: trackIndex }));
  }

  if (!endOfTrack) {
    findings.push(finding("missing-end-of-track", BLOCKER, "Track has no end-of-track meta event.", { offset: bytes.length, track: trackIndex }));
  }

  return {
    findings,
    trackNames,
    channelEvents,
    noteEvents,
    tempoEvents,
    keyEvents,
    timeEvents,
    performanceEvents,
    tickLength: tick,
    sysexCount,
    nonAsciiText,
  };
}

function conflictFinding(events, id, label) {
  const byTick = new Map();
  for (const event of events) {
    const values = byTick.get(event.tick) || new Set();
    values.add(String(event.value));
    byTick.set(event.tick, values);
  }
  const conflicts = [...byTick.entries()].filter(([, values]) => values.size > 1).map(([tick]) => tick);
  return conflicts.length
    ? finding(id, REVIEW, `${label} declarations conflict at tick(s): ${conflicts.join(", ")}.`)
    : null;
}

function pairNotes(noteEvents) {
  const active = new Map();
  let unmatchedOff = 0;
  const ordered = [...noteEvents].sort((left, right) =>
    left.tick - right.tick || left.track - right.track || left.order - right.order,
  );
  for (const event of ordered) {
    const key = `${event.channel}:${event.note}`;
    const count = active.get(key) || 0;
    if (event.type === "on") active.set(key, count + 1);
    else if (count > 0) active.set(key, count - 1);
    else unmatchedOff += 1;
  }
  return {
    unmatchedOn: [...active.values()].reduce((sum, count) => sum + count, 0),
    unmatchedOff,
  };
}

function durationFor(tickLength, timing, format, tempos) {
  if (format === 2) return null;
  if (timing.mode === "smpte") return tickLength / (timing.framesPerSecond * timing.ticksPerFrame);
  const ordered = [...tempos].sort((left, right) => left.tick - right.tick || left.track - right.track);
  let lastTick = 0;
  let microsecondsPerQuarter = 500000;
  let seconds = 0;
  for (const event of ordered) {
    if (event.tick > tickLength) break;
    if (event.tick > lastTick) {
      seconds += ((event.tick - lastTick) * microsecondsPerQuarter) / (timing.ticksPerQuarter * 1_000_000);
      lastTick = event.tick;
    }
    microsecondsPerQuarter = event.value;
  }
  seconds += ((tickLength - lastTick) * microsecondsPerQuarter) / (timing.ticksPerQuarter * 1_000_000);
  return seconds;
}

function stablePerformancePayload(events, format) {
  const normalized = events.map((event) => ({
    tick: event.tick,
    ...(format === 2 ? { track: event.track } : {}),
    kind: event.kind,
    data: event.data,
  }));
  normalized.sort((left, right) => {
    const tick = left.tick - right.tick;
    if (tick) return tick;
    const track = (left.track ?? 0) - (right.track ?? 0);
    if (track) return track;
    return JSON.stringify(left).localeCompare(JSON.stringify(right));
  });
  return normalized.length ? JSON.stringify(normalized) : null;
}

function emptySnapshot(bytes, findings) {
  return {
    size: bytes.byteLength,
    format: null,
    timing: null,
    declaredTrackCount: null,
    parsedTrackCount: 0,
    trackNames: [],
    channels: [],
    noteOnCount: 0,
    pitchMin: null,
    pitchMax: null,
    velocityMin: null,
    velocityMax: null,
    tickLength: 0,
    durationSeconds: null,
    tempos: [],
    keySignatures: [],
    timeSignatures: [],
    sysexCount: 0,
    performancePayload: null,
    findings,
  };
}

export function parseMidi(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const findings = [];
  if (bytes.length < 14) {
    return emptySnapshot(bytes, [finding("truncated-header", BLOCKER, "File is shorter than the 14-byte Standard MIDI header.", { offset: bytes.length })]);
  }
  if (ascii(bytes, 0, 4) !== "MThd") {
    return emptySnapshot(bytes, [finding("invalid-header-id", BLOCKER, "File does not begin with an MThd header chunk.", { offset: 0 })]);
  }

  const headerLength = u32(bytes, 4);
  if (headerLength !== 6) {
    findings.push(finding("invalid-header-length", BLOCKER, `MThd declares ${headerLength} bytes instead of 6.`, { offset: 4 }));
  }
  if (headerLength < 6 || 8 + headerLength > bytes.length) {
    findings.push(finding("truncated-header", BLOCKER, "MThd data does not contain the required six bytes.", { offset: 8 }));
    return emptySnapshot(bytes, findings);
  }

  const format = u16(bytes, 8);
  const declaredTrackCount = u16(bytes, 10);
  const division = u16(bytes, 12);
  if (![0, 1, 2].includes(format)) findings.push(finding("invalid-format", BLOCKER, `Header format ${format} is outside 0, 1, or 2.`, { offset: 8 }));
  if (declaredTrackCount === 0) findings.push(finding("invalid-track-count", BLOCKER, "Header declares zero tracks.", { offset: 10 }));
  if (format === 0 && declaredTrackCount !== 1) {
    findings.push(finding("format-zero-track-count", BLOCKER, `Format 0 must declare exactly one track, not ${declaredTrackCount}.`, { offset: 10 }));
  }

  let timing;
  if ((division & 0x8000) === 0) {
    const ticksPerQuarter = division & 0x7fff;
    timing = { mode: "ppq", ticksPerQuarter };
    if (ticksPerQuarter === 0) findings.push(finding("invalid-timing-division", BLOCKER, "PPQ timing division must be greater than zero.", { offset: 12 }));
  } else {
    const signedFrames = (division >> 8) - 256;
    const ticksPerFrame = division & 0xff;
    const supportedFrames = new Map([[-24, 24], [-25, 25], [-29, 29.97], [-30, 30]]);
    timing = { mode: "smpte", signedFrames, framesPerSecond: supportedFrames.get(signedFrames) || null, ticksPerFrame };
    if (!supportedFrames.has(signedFrames) || ticksPerFrame === 0) {
      findings.push(finding("invalid-timing-division", BLOCKER, `SMPTE division uses invalid frame code ${signedFrames} or zero ticks per frame.`, { offset: 12 }));
    } else {
      findings.push(finding("smpte-timing", REVIEW, `File uses SMPTE timing at ${timing.framesPerSecond} frames/second and ${ticksPerFrame} ticks/frame.`));
    }
  }
  if (format === 2) findings.push(finding("format-two", REVIEW, "Format 2 stores independent sequences and has narrower DAW support than formats 0 and 1."));

  const tracks = [];
  let cursor = 8 + headerLength;
  while (cursor < bytes.length) {
    if (bytes.length - cursor < 8) {
      findings.push(finding("trailing-bytes", BLOCKER, `${bytes.length - cursor} trailing byte(s) cannot form a chunk header.`, { offset: cursor }));
      break;
    }
    const chunkId = ascii(bytes, cursor, 4);
    const chunkLength = u32(bytes, cursor + 4);
    const dataStart = cursor + 8;
    const dataEnd = dataStart + chunkLength;
    if (dataEnd > bytes.length) {
      findings.push(finding("truncated-track-chunk", BLOCKER, `${chunkId} declares ${chunkLength} bytes beyond the file boundary.`, { offset: cursor }));
      break;
    }
    if (chunkId !== "MTrk") {
      findings.push(finding("invalid-track-chunk", BLOCKER, `Expected MTrk but found ${JSON.stringify(chunkId)}.`, { offset: cursor }));
    } else {
      tracks.push(parseTrack(bytes.subarray(dataStart, dataEnd), tracks.length));
    }
    cursor = dataEnd;
  }

  if (tracks.length !== declaredTrackCount) {
    findings.push(finding("track-count-mismatch", BLOCKER, `Header declares ${declaredTrackCount} track(s), but ${tracks.length} MTrk chunk(s) were parsed.`));
  }

  const all = (key) => tracks.flatMap((track) => track[key]);
  findings.push(...all("findings"));
  const channelEvents = all("channelEvents");
  const noteEvents = all("noteEvents");
  const tempoEvents = all("tempoEvents");
  const keyEvents = all("keyEvents");
  const timeEvents = all("timeEvents");
  const performanceEvents = all("performanceEvents");
  const noteOns = noteEvents.filter((event) => event.type === "on");

  if (noteOns.length === 0) findings.push(finding("no-note-events", REVIEW, "File contains no note-on event with velocity above zero."));
  const pairs = pairNotes(noteEvents);
  if (pairs.unmatchedOn) findings.push(finding("unmatched-note-on", REVIEW, `${pairs.unmatchedOn} note-on event(s) have no matching note-off.`));
  if (pairs.unmatchedOff) findings.push(finding("unmatched-note-off", REVIEW, `${pairs.unmatchedOff} note-off event(s) have no preceding note-on.`));
  const sysexCount = tracks.reduce((sum, track) => sum + track.sysexCount, 0);
  if (sysexCount) findings.push(finding("system-exclusive-events", REVIEW, `${sysexCount} system-exclusive event(s) may depend on specific hardware or software.`));
  if (tracks.some((track) => track.nonAsciiText)) {
    findings.push(finding("non-ascii-text", REVIEW, "Text metadata contains non-ASCII bytes; display encoding can vary between applications."));
  }

  for (const item of [
    conflictFinding(tempoEvents, "conflicting-tempo", "Tempo"),
    conflictFinding(keyEvents, "conflicting-key-signature", "Key-signature"),
    conflictFinding(timeEvents, "conflicting-time-signature", "Time-signature"),
  ]) if (item) findings.push(item);

  const channels = [...new Set(channelEvents.map((event) => event.channel + 1))].sort((a, b) => a - b);
  const pitches = noteOns.map((event) => event.note);
  const velocities = noteOns.map((event) => event.velocity);
  const tickLength = tracks.reduce((maximum, track) => Math.max(maximum, track.tickLength), 0);
  const validTiming = timing.mode === "ppq"
    ? timing.ticksPerQuarter > 0
    : Boolean(timing.framesPerSecond && timing.ticksPerFrame);
  const durationSeconds = validTiming
    ? durationFor(tickLength, timing, format, tempoEvents)
    : null;

  const severityOrder = { blocker: 0, review: 1 };
  findings.sort((left, right) => severityOrder[left.severity] - severityOrder[right.severity] || left.id.localeCompare(right.id));

  return {
    size: bytes.byteLength,
    format,
    timing,
    declaredTrackCount,
    parsedTrackCount: tracks.length,
    trackNames: [...new Set(all("trackNames").filter(Boolean))],
    channels,
    noteOnCount: noteOns.length,
    pitchMin: pitches.length ? Math.min(...pitches) : null,
    pitchMax: pitches.length ? Math.max(...pitches) : null,
    velocityMin: velocities.length ? Math.min(...velocities) : null,
    velocityMax: velocities.length ? Math.max(...velocities) : null,
    tickLength,
    durationSeconds,
    tempos: tempoEvents.map((event) => ({ tick: event.tick, microsecondsPerQuarter: event.value, bpm: 60_000_000 / event.value })),
    keySignatures: keyEvents.map((event) => ({ tick: event.tick, value: event.value })),
    timeSignatures: timeEvents.map((event) => ({ tick: event.tick, value: event.value })),
    sysexCount,
    performancePayload: stablePerformancePayload(performanceEvents, format),
    findings,
  };
}
