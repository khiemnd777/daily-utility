import { strToU8, zipSync } from "fflate";

export const VALID_SVGS = {
  "animals/bird.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 50 L50 10 L90 50 Z" fill="#174d3b"/></svg>',
  "animals/fox.svg": '<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="100mm"><path d="M5 5 H95 V95 H5 Z" fill="#bb3e33"/></svg>',
  "letters/a.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M8 56 L32 8 L56 56 Z"/></svg>',
  "shapes/star.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><polygon points="20,2 25,15 39,15 28,24 32,38 20,30 8,38 12,24 1,15 15,15"/></svg>',
};

export const BAD_SVGS = {
  "01-malformed.svg": '<svg xmlns="http://www.w3.org/2000/svg"><path></svg>',
  "02-live-text.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><text x="1" y="5">Live</text></svg>',
  "03-clip.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><defs><clipPath id="c"><circle r="3"/></clipPath></defs><path clip-path="url(#c)" d="M0 0H10V10Z"/></svg>',
  "04-gradient.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><defs><linearGradient id="g"><stop offset="0"/></linearGradient></defs><path fill="url(#g)" d="M0 0H10V10Z"/></svg>',
  "05-pattern.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><defs><pattern id="p" width="2" height="2"><circle r="1"/></pattern></defs><path fill="url(#p)" d="M0 0H10V10Z"/></svg>',
  "06-external.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><image href="https://example.com/art.svg" width="10" height="10"/></svg>',
  "07-bitmap.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><image href="data:image/png;base64,iVBORw0KGgo=" width="10" height="10"/></svg>',
  "08-script.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><script>alert(1)</script><path d="M0 0H10V10Z"/></svg>',
  "09-no-size.svg": '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0H10V10Z"/></svg>',
  "<img src=x onerror=alert(1)>.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0H10V10Z"/></svg>',
};

export function entriesFromMap(map) {
  return Object.entries(map).map(([path, text]) => ({ path, text, bytes: new TextEncoder().encode(text) }));
}

export function zipFromMap(map, extra = {}) {
  const files = {};
  for (const [path, text] of Object.entries({ ...map, ...extra })) files[path] = strToU8(text);
  return zipSync(files, { level: 9, mtime: new Date("2026-08-27T00:00:00Z") });
}

export function fakeFile(name, bytes, extra = {}) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return {
    name,
    size: data.byteLength,
    type: extra.type || "",
    webkitRelativePath: extra.webkitRelativePath || "",
    async arrayBuffer() {
      return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    },
  };
}
