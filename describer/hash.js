// A value's hash, the same on every phone: an answer set's id is one (rows.ts), so this function is stored format and
// never changes. Moved here unchanged from record.ts.
// A JSON string with sorted keys, so key order never counts as a change, hashed with cyrb53.
const stable = (v) => {
    if (Array.isArray(v))
        return `[${v.map(stable).join(',')}]`;
    if (v && typeof v === 'object')
        return `{${Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;
    return JSON.stringify(v ?? null);
};
function cyrb53(str) {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
export const hashOf = (v) => cyrb53(stable(v));
