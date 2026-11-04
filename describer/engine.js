// The terms and claims by name, in the build's order (describer-key.ts reads them for its checks and the Key's format;
// reach.ts reads LOGIC). Each list is the keys of its type, so tsc refuses a term or a claim added to one and not the
// other (describer/typescript-move.md, commit 5; until then describer-key.py held them, beside a scan of App.tsx).
export const LOGIC = ['$and', '$or', '$nor'];
export const FIELD_OPS = ['$eq', '$ne', '$in', '$nin', '$all', '$size', '$exists', '$not', '$elemMatch'];
export const ONE_VALUE_OPS = ['$eq', '$ne', '$in', '$nin', '$not'];
export const ANSWER_PARTS = ['fill', 'skip', 'exclude'];
export const QUESTION_PARTS = ['reveal', 'require', 'order', 'offer'];
const sameTerms = [true, true, true, true];
void sameTerms;
// The Key held, and its version and date as the record and the foot read them (version 10.55): one Key at a time, bound
// with everything worked out from it by holdKey, below, and nowhere else.
export let KEY;
export let VERSION;
// The name a card shows, '' when none (version 10.78).
export const nameOf = (e) => e?.name?.text || '';
// Where each set stands now: the `to` of the latest Move naming it, by `t`; a set no Move names stands where it was saved.
export function placedBy(moves) {
    const at = new Map();
    for (const m of [...moves].sort((a, b) => a.t.localeCompare(b.t)))
        for (const id of m.sets)
            at.set(id, m.to);
    return at;
}
// Version 10.4 named the muscle roles in ExRx's words (the founder's "Adopt them" and "do the rename rn", 2026-10-10):
// primary_muscle became target, assists synergists, and stabilizes stabilizers. A record read from this phone or from
// the server copy is read in the new names, so an Exercise saved before 10.4 still matches its repeat descriptions; the
// rows already on the server keep the names they were written in.
export const RENAMED = { primary_muscle: 'target', assists: 'synergists', stabilizes: 'stabilizers' };
export const renamedKey = (k) => RENAMED[k] || k;
export function renamedKeys(o) {
    return Object.fromEntries(Object.entries(o).map(([k, v]) => [renamedKey(k), v]));
}
// A word the Key renamed (version 10.54, renamed-values.md, the founder's "From the top", 17:45:52 UTC 2026-10-22): an answer read
// from this phone or from the server copy is read in the Key's new word, as the names above are, so an Exercise saved
// with the old word still matches its repeat descriptions; the rows already on the server keep the old word, and a word
// typed into "other…" keeps its record of candidacy as typed. A record is read, never refused: a part it lacks stays
// lacking, and an answer that isn't a list is kept as it is.
// Bound by holdKey from the held Key's renamed.
export let VALUE_RENAMED;
export const renamedValue = (k, v) => VALUE_RENAMED.get(k)?.get(v) ?? v;
export const renamedCoords = (c) => c && Object.fromEntries(Object.entries(c).map(([k, vs]) => {
    const key = renamedKey(k);
    return [key, Array.isArray(vs) ? unique(vs.map((v) => renamedValue(key, v)), (v) => v) : vs];
}));
// The founder's rename of 2026-10-18 (20:52:33 UTC, "Okay let's do Describe"): a find became a description. The rows
// already saved, on a phone and on the server, keep the old names, `finds`, `findId` and the tap kind 'find', and are
// read in the new ones, as the roles are.
export const renamedId = (x) => {
    const { findId, ...y } = x;
    return findId === undefined ? x : { descriptionId: findId, ...y };
};
export const renamedTap = (t) => {
    const attr = t.attr && renamedKey(t.attr);
    const v = t.value;
    return { ...t, kind: t.kind === 'find' ? 'describe' : t.kind, ...(attr ? { attr } : {}), ...(t.matched ? { matched: t.matched.map(renamedKey) } : {}),
        ...(attr && v !== undefined && VALUE_RENAMED.has(attr) ? { value: Array.isArray(v) ? v.map((x) => renamedValue(attr, x)) : renamedValue(attr, v) } : {}) };
};
export const renamedExercise = (e) => renamedId({ ...e, coords: renamedCoords(e.coords), derived: (e.derived || []).map(renamedKey),
    ...(e.edits && { edits: e.edits.map((x) => renamedId({ ...x, before: renamedCoords(x.before), after: renamedCoords(x.after), taps: (x.taps || []).map(renamedTap) })) }) });
export function renamedDescription(f) {
    const g = { ...f, taps: (f.taps || []).map(renamedTap) };
    if (f.filled)
        g.filled = f.filled.map(renamedKey);
    if (f.defaulted)
        g.defaulted = f.defaulted.map(renamedKey);
    if (f.skipped)
        g.skipped = f.skipped.map(renamedKey);
    if (f.excluded)
        g.excluded = renamedCoords(f.excluded);
    if (f.ownMarks)
        g.ownMarks = Object.fromEntries(Object.entries(f.ownMarks).map(([m, c]) => [m, renamedCoords(c || {})]));
    return g;
}
export const renamedAddition = (a) => renamedId({ ...a, attr: renamedKey(a.attr) });
export function unique(xs, key) {
    const seen = new Set();
    return xs.filter((x) => { const k = key(x); if (seen.has(k))
        return false; seen.add(k); return true; });
}
export const additionKey = (a) => [a.t, a.descriptionId, a.attr, a.value].join('\u0000');
export const renamed = ({ finds = [], ...s }) => ({ ...s, exercises: s.exercises.map(renamedExercise),
    descriptions: [...finds, ...s.descriptions].map(renamedDescription), sets: s.sets.map(renamedId),
    values: renamedCoords(s.values),
    additions: unique(s.additions.map(renamedAddition), additionKey) });
export const pad = (n) => (n < 10 ? '0' : '') + n;
export const clock = (iso) => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
// The table, applied forward after each tap.
export const has = (coords, k) => (coords[k] || []).length > 0;
export const isMulti = (k) => !!KEY.attributes.find((a) => a.key === k)?.multi;
// A term the Describer can't read stops it, where it would read as false and leave its line unfired; tsc and the build
// keep the Key from holding one.
export const unreadable = (what) => { throw new Error(`the app can't read ${what} in the Key`); };
// What is left of the terms once each is read by name: nothing, so a term the types gain and this code doesn't read
// fails tsc.
export const readAll = (unread) => { for (const term in unread)
    unreadable(term); };
// One value against the terms inside $elemMatch.
export const valueMeets = (v, terms) => {
    const { $eq, $ne, $in, $nin, $not, ...unread } = terms;
    readAll(unread);
    return ($eq === undefined || v === $eq) && ($ne === undefined || v !== $ne) && ($in === undefined || $in.includes(v))
        && ($nin === undefined || !$nin.includes(v)) && ($not === undefined || !valueMeets(v, $not));
};
// A description's values for one question against its terms, as MongoDB reads an array field.
export const valuesMeet = (vs, terms) => {
    const { $exists, $eq, $ne, $in, $nin, $all, $size, $not, $elemMatch, ...unread } = terms;
    readAll(unread);
    return ($exists === undefined || $exists === vs.length > 0) && ($eq === undefined || vs.includes($eq))
        && ($ne === undefined || !vs.includes($ne)) && ($in === undefined || $in.some((w) => vs.includes(w)))
        && ($nin === undefined || !$nin.some((w) => vs.includes(w))) && ($all === undefined || $all.every((w) => vs.includes(w)))
        && ($size === undefined || (vs.length > 0 && vs.length === $size)) && ($not === undefined || !valuesMeet(vs, $not))
        && ($elemMatch === undefined || vs.some((v) => valueMeets(v, $elemMatch)));
};
// The muscle tree (version 10.70, muscle-tree.md; the founder's tree, 2026-10-31 21:59 UTC): a muscle and every muscle
// under it, at any depth, and every muscle above it, read from the Key's parts. A name the Key holds no parts for, a
// typed one, is a set of one. Bound by holdKey.
export let WITHIN;
export let ABOVE;
export const within = (m) => WITHIN.get(m) ?? new Set([m]);
export const above = (m) => ABOVE.get(m) ?? new Set();
// A role counts upward: a muscle question's answer is read as its muscles and every muscle above them, so a condition on
// a target of back meets a target of lats, and one on lats never meets a target of back (the founder, 20:35 UTC).
export const upward = (vs) => {
    const up = new Set(vs.flatMap((v) => [...above(v)]));
    return [...vs, ...KEY.muscles.filter((m) => up.has(m) && !vs.includes(m))];
};
// Never both (the founder, 21:25:14 UTC): a muscle and one above or below it never both hold a role.
export const nearOf = (a, b) => a !== b && (within(a).has(b) || within(b).has(a));
// A list joins whole conditions, by $and, $or or $nor; anything else is a question's terms.
export const matches = (coords, c) => Object.entries(c).every(([k, x]) => x === undefined ? true
    : !Array.isArray(x) ? valuesMeet(MUSCLE_ROLES.includes(k) ? upward(coords[k] || []) : coords[k] || [], x)
        : k === '$and' ? x.every((s) => matches(coords, s))
            : k === '$or' ? x.some((s) => matches(coords, s))
                : k === '$nor' ? !x.some((s) => matches(coords, s))
                    : unreadable(k));
// A question an offer line names is asked, in the flow or under "more…", only while an offer line naming it matches
// (the founder, 2026-10-13 01:27:25 UTC, "Write as rules": a joint's action once its joint is ticked). Every other
// question can be asked.
// Bound by holdKey from the held Key's lines.
export let offered;
export const canAsk = (coords, k) => !offered.has(k) || KEY.lines.some((l) => (l.offer || []).includes(k) && matches(coords, l.when));
// The synergists and stabilizers (version 8): filled by lines, and answered on the muscle question's screen, where an
// answer wins. No rule or line keys on them, and a card shows the target only: the target is the
// muscle the timed path shows. On that screen a tap moves a muscle one step along target, synergist, stabilizer, then
// off again, so a muscle holds one role at a time (version 10.3, the founder's 16:21 UTC ask, "tapping moves the
// muscle through this loop"); until then the two were questions of their own under "more". Their names are ExRx's
// since version 10.4; until then lead, assist and stabilize.
export const ROLES = ['synergists', 'stabilizers'];
export const isRole = (k) => ROLES.includes(k);
export const MUSCLE_ROLES = ['target', ...ROLES];
// Each role's word for one muscle, as the hint says them, for the count of the muscles a rule leaves only some roles
// (version 10.39, joint-filter.md; until 10.72 also the label over their group).
export const ROLE_WORDS = { target: 'target', synergists: 'synergist', stabilizers: 'stabilizer' };
// The attributes a question answers: the muscle question its three, every other question its own.
export const answersOf = (k) => (MUSCLE_ROLES.includes(k) ? MUSCLE_ROLES : [k]);
// A muscle holds one role at a time, the one the lifter's last tap gave it (version 10.37, one-role.md): a role a tap
// touched is answered, emptied or not, so a fill taken off stays off; any other question is answered by a value.
export const answeredIn = (own, k) => (MUSCLE_ROLES.includes(k) ? own[k] !== undefined : has(own, k));
// A question has a line in the Description when it holds a value, the lifter's or a rule's; the muscle question counts
// a synergist or stabilizer only from the lifter's own answers, since a rule's draw no line (version 10.52, the Technical
// Advisor's review of the row's muscle lines). The Queue's bands, Next, Keep and a struck line's unskip all read it, so a
// question stands in the Queue or in the Description, never both.
export const hasLine = (view, own, k) => has(view, k) || answersOf(k).some((r) => r !== k && has(own, r));
// A muscle the lifter's own answers hold in a role other than k, which a fill of k leaves out (version 10.37).
export const heldElsewhere = (own, k, x) => MUSCLE_ROLES.includes(k) && MUSCLE_ROLES.some((r) => r !== k && (own[r] || []).includes(x));
// A muscle above or below one the lifter's own answers hold in any role, which a fill of a role leaves out (version 10.70,
// muscle-tree.md: Never both, kept by the Describer and by the build, never by a line's guard).
export const heldNear = (own, k, x) => MUSCLE_ROLES.includes(k) && MUSCLE_ROLES.some((r) => (own[r] || []).some((v) => nearOf(v, x)));
// The table's fill lines, applied forward to what was answered: a line whose condition holds fills what is still
// unanswered, until nothing changes (version 2: a curl with the elbow ticked fills the elbow's action, flexion).
// An answer always wins over a fill: under "more" a filled question can be answered, and a role fill leaves out a
// muscle the lifter put in another role (version 10.37).
// A fill can hold several values (version 3), a sideways lunge's hip adduction and extension, and the fills of a
// question that takes several answers add up (version 10.9, writing-rules.md, law 7: a row's elbow and its
// shoulder); a question that takes one keeps its first fill, and the build refuses two lines that disagree.
export function withFills(own) {
    const { coords, filled } = fillsOf(own);
    return { coords, filled };
}
// A muscle carried over from a fill follows the rules, with an answer for each role it leaves or rejoins, and a muscle
// the lifter tapped stays where the tap put it (version 10.47, the Design Advisor's check of 10.45, the founder's "Take
// it off", 2026-10-17 20:07:37 UTC; 10.45 waited for the last muscle the lifter tapped to go). It leaves its role as soon
// as no rule gives it there, staying in `copied` while out, and comes back while a rule gives it again and no role holds
// it, as the carried list did on 10.46: a flat press's chest moved out of the target takes the triceps with it at once,
// a new target brings them back underlined, chest taken off still empties every role so the next tap starts the
// question over as on 10.42, a restart's roles starting from no carried muscle, and no record holds a helper nobody
// tapped and no rule gives (one-role.md). Since version 10.48 it follows them after any change to the description's
// answers, a tap, a typed value or a Back, not only a muscle tap: on 10.47 a press's elbow unticked after "Which
// muscle?" left the triceps a synergist no rule gave, unmarked, and Save stored them (the Technical Advisor's test,
// 2026-10-18). Each writer runs it last, on the answers and `copied` it has just written; opening an edit or a line
// changes no answer.
// An answer leaves when its question stops applying (version 10.48, one-screen.md; the founder's model, "every change
// re-evaluates the rules"): a question an offer line allowed on `before`, the answers as they were before this write,
// and none allows now loses its answer, with a `left` tap, and the rules run again on what is left, until nothing
// else leaves. A pick made where no line allowed the question stays, marked on its own tap (law 4), since it never
// applied before the write either.
export function follow(own, copied, t, before) {
    const coords = { ...own };
    const marks = { ...copied };
    const taps = [];
    const applies = (c, k) => canAsk(withFills(c).coords, k);
    const left = [];
    for (let gone = true; gone;) {
        gone = false;
        for (const k of Object.keys(coords)) {
            if (!answeredIn(coords, k) || applies(coords, k) || !applies(before, k))
                continue;
            delete coords[k];
            delete marks[k];
            left.push(k);
            gone = true;
            taps.push({ t, kind: 'left', attr: k });
        }
    }
    for (const k of MUSCLE_ROLES) {
        if (!marks[k]?.length || !coords[k])
            continue;
        const given = withFills(Object.fromEntries(Object.entries(coords).filter(([x]) => x !== k))).coords[k] || [];
        const held = MUSCLE_ROLES.flatMap((r) => coords[r] || []);
        const back = marks[k].filter((v) => !held.includes(v) && !heldNear(coords, k, v) && given.includes(v));
        const kept = [...coords[k].filter((v) => !marks[k].includes(v) || given.includes(v)), ...back];
        if (kept.length === coords[k].length && !back.length)
            continue;
        coords[k] = kept;
        taps.push({ t, kind: 'answer', by: 'rule', attr: k, value: coords[k] });
    }
    return { coords, copied: marks, left, taps };
}
export function fillsOf(own) {
    const coords = { ...own };
    const filled = [];
    const by = {};
    const fired = [];
    const apply = () => {
        let changed = false;
        KEY.lines.forEach((l, at) => {
            if (!l.fill || !matches(coords, l.when))
                return;
            for (const [k, v = []] of Object.entries(l.fill)) {
                if (answeredIn(own, k) || (has(coords, k) && !isMulti(k)))
                    continue;
                const add = v.filter((x) => !(coords[k] || []).includes(x) && !heldElsewhere(own, k, x) && !heldNear(own, k, x));
                if (!add.length)
                    continue;
                coords[k] = [...(coords[k] || []), ...add];
                if (!filled.includes(k))
                    filled.push(k);
                changed = true;
                if (by[k] === undefined)
                    by[k] = at;
                const f = fired.find((x) => x.at === at) || fired[fired.push({ at, added: {} }) - 1];
                f.added[k] = [...(f.added[k] || []), ...add];
            }
        });
        return changed;
    };
    while (apply())
        ;
    return { coords, filled, by, fired };
}
// The other line kinds, read on the answers with their fills. A skipped question is not asked; an excluded answer is
// not offered in the questions asked (version 4). A revealed question is asked though no rule keys on it; a required
// one is asked, and Save waits for it; an order puts the questions it names, when they are asked, in its order
// (version 5). A line asking for a question, by reveal or require, wins over a line skipping it. Under "more" every
// question and answer stays open, and an answer there wins, marked in the record, as an answer over a fill is: a
// wrong line never stops the true value being logged.
export function effectsOf(coords) {
    const on = KEY.lines.filter((l) => matches(coords, l.when));
    const each = (part) => [...new Set(on.flatMap((l) => l[part] || []))];
    const asks = [...each('reveal'), ...each('require')];
    const named = {};
    for (const l of on)
        for (const [k, vs = []] of Object.entries(l.exclude || {}))
            named[k] = [...new Set([...(named[k] || []), ...vs])];
    const exclude = Object.fromEntries(Object.entries(named).map(([k, vs]) => [k, hidesOf(k, vs)]));
    return {
        skip: each('skip').filter((k) => !asks.includes(k)), exclude, reveal: each('reveal'), require: each('require'),
        order: on.flatMap((l) => (l.order ? [l.order] : [])),
    };
}
// A role's hides on a muscle question, read both ways (version 10.70, muscle-tree.md): a hide of a muscle covers every
// muscle under it, as the build reads the Key's hides; and a muscle every part of which is hidden is hidden too, since a
// role counts upward and no part is left to hold it (the Technical Advisor's review: lower body on a curl). Read over
// all of a role's hides at once, since one line hides the quads and another the calves.
export const hidesOf = (k, vs) => {
    if (!MUSCLE_ROLES.includes(k))
        return vs;
    const down = new Set(vs.flatMap((v) => [...within(v)]));
    const up = (m) => down.has(m) || ((KEY.parts[m] || []).length > 0 && KEY.parts[m].every(up));
    return [...down, ...KEY.muscles.filter((m) => !down.has(m) && up(m))];
};
// The questions a condition names, through $and, $or and $nor.
export const conditionKeys = (c) => Object.entries(c).flatMap(([k, x]) => (x === undefined ? [] : Array.isArray(x) ? x.flatMap(conditionKeys) : [k]));
// A condition less one question's terms: what the rest of a description must meet for that question's answer to decide
// the line.
export const without = (c, q) => Object.fromEntries(Object.entries(c).flatMap(([k, x]) => (k === q || x === undefined ? [] : [[k, Array.isArray(x) ? x.map((s) => without(s, q)) : x]])));
export function chainOf(own) {
    const { coords, by, fired } = fillsOf(own);
    const under = (l, self) => { const k = conditionKeys(l.when).find((q) => by[q] !== undefined && by[q] !== self); return k === undefined ? undefined : by[k]; };
    const links = [
        ...fired.map(({ at, added }) => ({ at, line: KEY.lines[at], added, under: under(KEY.lines[at], at), depth: 0 })),
        ...KEY.lines.flatMap((line, at) => (!line.fill && matches(coords, line.when) ? [{ at, line, under: under(line, at), depth: 0 }] : [])),
    ];
    const out = [];
    const seen = new Set();
    const walk = (parent, depth) => {
        for (const l of links)
            if (l.under === parent && !seen.has(l.at)) {
                seen.add(l.at);
                out.push({ ...l, depth });
                walk(l.at, depth + 1);
            }
    };
    walk(undefined, 0);
    for (const l of links)
        if (!seen.has(l.at)) {
            seen.add(l.at);
            out.push(l);
        }
    return out;
}
// One rule (version 10.40, chain-fold.md, the founder's "One rule", 2026-10-17 03:11:22 UTC): lines one tap of the
// founder's wrote over a table, which the Key names in `one_rule`, the Filter's today. They still run line by line; the
// chain and the why… lists count them once, an item where the first of them stands, its rows every one in the list.
// Bound by holdKey from the held Key's one_rule.
export let RULE_OF;
export function asRules(ls) {
    const out = [];
    const firsts = new Map();
    for (const l of ls) {
        const r = RULE_OF.get(l.at);
        const rows = r === undefined ? undefined : firsts.get(r);
        if (rows)
            rows.push(l);
        else if (r === undefined)
            out.push(l);
        else {
            firsts.set(r, [l]);
            out.push({ ...l, rows: firsts.get(r) });
        }
    }
    return out;
}
// Save waits for every question a require line names that can be asked (version 5): the muscle on strength work, and
// on a stretch the joints and each ticked joint's action, are require lines since the founder's 2026-10-13 01:29:52 UTC
// "Yes fix all of these!"; until then the Key's settings said it by the kind of exercise.
export const saveable = (coords) => effectsOf(coords).require.every((k) => has(coords, k) || !canAsk(coords, k));
// A place (version 10.48, one-screen.md; the founder's model of 2026-10-19, "the latest answer's questions on top"):
// where an answer stands in the order answered. The lifter's own answers by `order` (answerOrder); a filled
// answer at the place of its source, the newest answer among those the lines that gave it read, a read that is itself
// a fill taking that fill's place; a fill whose lines read no answer (a read by presence alone reads none) older than
// them all.
export const OLDEST = -1;
export function placesOf(own, fills, order) {
    const places = {};
    order.filter((k) => k in own).forEach((k, i) => { places[k] = i; });
    for (const { at, added } of fills.fired) {
        const source = Math.max(OLDEST, ...conditionKeys(KEY.lines[at].when).filter((q) => has(fills.coords, q) && places[q] !== undefined).map((q) => places[q]));
        for (const k of Object.keys(added))
            places[k] = Math.max(places[k] ?? OLDEST, source);
    }
    return places;
}
export function queueOf(own, asked, keys, inOrder) {
    const ticking = (k) => isMulti(answersOf(k)[0]) && !asked.includes(answersOf(k)[0]);
    const settled = Object.fromEntries(Object.entries(own).filter(([k]) => !ticking(k)));
    const fills = fillsOf(settled);
    const { coords, filled } = fills;
    // The movement too comes from a line (version 10.22, the founder's 20:54 UTC "this sounds like The Finder owning
    // something that should be owned by and expressed in rules"): the Key's first line asks it wherever a description has none,
    // and its second makes Save wait for it; until then this code asked it before reading the Key.
    const fx = effectsOf(coords);
    // A question of several answers is answered by its Next, or by a fill (version 9: a dip fills its joints, and the
    // joints question is not asked).
    const answered = (k) => asked.includes(k) || fx.skip.includes(k) || filled.includes(k)
        || (has(coords, k) && !isMulti(k));
    // A line asking for the joints asks which joints move, not what each one does (version 10.14): a joint's action is
    // asked when a line reveals it, or when Save waits for one on a stretch, and the lines fill the rest, each joint's
    // question staying in the Queue (the founder, 2026-10-12 02:15 UTC: "the questions that ask joint actions are kind
    // of difficult to answer"; so the Describer asks in a trainer's words and the lines fill the anatomy).
    // A revealed question of several answers is still asked when a fill gave it some (the founder, 2026-10-13 01:09 UTC,
    // the joint ticks as rules): a squat's knee extension ticks the knee, and "Which joints move?" still asks for the hip,
    // with the knee ticked.
    const askedFor = (k) => (isMulti(k) ? asked.includes(k) || fx.skip.includes(k) : answered(k));
    const asks = [...fx.reveal, ...fx.require].filter((k, i, a) => a.indexOf(k) === i && !askedFor(k) && canAsk(coords, k));
    const places = placesOf(settled, fills, inOrder);
    const on = KEY.lines.filter((l) => matches(coords, l.when));
    const read = (l) => Math.max(OLDEST, ...conditionKeys(l.when).filter((q) => has(coords, q) && places[q] !== undefined).map((q) => places[q]));
    const placeOf = (k) => Math.min(...on.filter((l) => (l.reveal || []).includes(k) || (l.require || []).includes(k)).map(read));
    const order = (k) => { const i = KEY.attributes.findIndex((a) => a.key === k); return i < 0 ? KEY.attributes.length : i; };
    // The walk (version 10.23): a question waits while another in play comes before it. The build refuses a circle, so
    // one is always ready.
    const out = [];
    for (const left = new Set(asks); left.size;) {
        const ready = [...left].filter((q) => ![...left].some((p) => p !== q && KEY.after[q].includes(p))).sort((a, b) => placeOf(b) - placeOf(a) || order(a) - order(b));
        const q = ready[0] ?? [...left][0];
        out.push(q);
        left.delete(q);
    }
    for (const o of fx.order) {
        const at = out.flatMap((k, i) => (o.includes(k) ? [i] : []));
        const named = o.filter((k) => out.includes(k));
        at.forEach((i, n) => { out[i] = named[n]; });
    }
    // The synergists and stabilizers are answered with the muscle (version 10.3), so they have no line of their own.
    // Since version 10.52 a question is answered here when it has its line in the Description (hasLine): a row's biceps
    // fill as a synergist before the target, and read as its answer they took the question off every band, with no line
    // to bring it back, while Save set still waited for the target (the Technical Advisor's review of 10.52's lines).
    const valued = (k) => hasLine(coords, settled, k);
    const rest = keys.filter((k, i) => keys.indexOf(k) === i && !isRole(k) && !valued(k) && !out.includes(k)).sort((a, b) => order(a) - order(b));
    const outside = rest.filter((k) => !canAsk(coords, k));
    const struck = rest.filter((k) => !outside.includes(k) && (asked.includes(k) || fx.skip.includes(k))).map((k) => ({ k, hidden: !asked.includes(k) }));
    const also = rest.filter((k) => !outside.includes(k) && !struck.some((s) => s.k === k));
    return { asked: out, also, struck, outside };
}
export const allKeys = (added) => [...KEY.attributes.map((a) => a.key), ...added.map((a) => a.key)];
// A question's label: the Key's, else the words a lifter added it in, else its key, as App.tsx's attribute() gives it.
export const labelOf = (k, added) => KEY.attributes.find((a) => a.key === k)?.label || added.find((a) => a.key === k)?.ask || k;
export function coordKey(coords) {
    return JSON.stringify(Object.keys(coords).filter((k) => coords[k].length).sort().map((k) => [k, [...coords[k]].sort()]));
}
// What Save stores from a description's answers: the answers with their fills, the kind, and the target from the
// rule that fires when none was tapped; the derived are the attributes the description did not answer itself.
export function stored(own) {
    const view = withFills(own);
    return { coords: { ...view.coords }, derived: [...view.filled] };
}
// An edit's coordinates (version 10.6): stored as a description's Save stores them, an answer cleared in the edit left out,
// except a muscle role, kept empty so a fill taken off stays off on the next edit (version 10.37); a value the
// Exercise had derived stays marked derived while the edit leaves it as it was.
export function edited(ex, own) {
    const s = stored(own);
    const coords = Object.fromEntries(Object.entries(s.coords).filter(([k, vs]) => vs.length || MUSCLE_ROLES.includes(k)));
    const unchanged = (k) => coordKey({ [k]: ex.coords[k] || [] }) === coordKey({ [k]: coords[k] || [] });
    const derived = [...ex.derived.filter((k) => has(coords, k) && unchanged(k)), ...s.derived.filter((k) => has(coords, k))];
    return { coords, derived: [...new Set(derived)] };
}
// What a card or a set line shows: every attribute with its value, in the Key's attribute order (version 10.23; until
// then the target first, then the movement, by this code); of the muscles, the target only (version 8). Each line of a
// full card is the attribute's own name in the Key, a colon and its values (version 10.7); a one-line card shows the
// same values in the same order, without the names (version 10.36).
export function cardValues(coords, added) {
    const out = [];
    for (const k of allKeys(added)) {
        if (!has(coords, k) || isRole(k))
            continue;
        if (k === 'activity_type')
            continue;
        out.push([k, coords[k]]);
    }
    return out;
}
// A line's label and the words after its answer, the Description's and a card's (version 10.64, the founder's words of
// 2026-10-28 13:27:06 UTC, "it should say which "muscles: quads as target"", and their "Same", 13:38:09 UTC; the Design
// Advisor's 2.5, rules-bet/ahead/motion/): a question's label is the Key's; a muscle role's row reads "muscles", a word
// of the app (the founder's "App word", 16:21:36 UTC), then the muscles and the role, its word for one muscle and the
// Key's own label for several, which for the target is "target" itself.
export const lineParts = (k, n, added) => MUSCLE_ROLES.includes(k) ? { label: 'muscles', role: ` as ${n === 1 ? ROLE_WORDS[k] : labelOf(k, added)}` } : { label: labelOf(k, added), role: '' };
export function cardLines(coords, added) {
    // The Key's labels, the words the Description uses, not its keys (version 10.48, the Design Advisor: one name per thing),
    // in the Description's form since version 10.64, "load: machine".
    return cardValues(coords, added).map(([k, vs]) => { const { label, role } = lineParts(k, vs.length, added); return `${label}: ${vs.join(', ')}${role}`; });
}
// Every day this phone holds, oldest first, each in the order lifted (the store keeps its sets in time order: merged()
// sorts them, saveSet appends). A set joins the card before it when it is on the same Exercise and no other set sits
// between them. A deleted set is left out unless `struck` names it; one it names joins as if it stood, so its card stays
// as it was until the home screen is left.
// `exerciseOf` gives the Exercise a set stands on now; it is passed the set too (version 10.81), so a Move can place it.
export function daysOf(sets, exerciseOf, struck, today) {
    const days = new Map();
    for (const s of sets) {
        if (s.deleted && !struck.includes(s.id))
            continue;
        const eid = exerciseOf(s.exerciseId, s);
        const cards = days.get(s.session) || days.set(s.session, []).get(s.session);
        const last = cards[cards.length - 1];
        if (last && last.exerciseId === eid)
            last.sets.push(s);
        else
            cards.push({ exerciseId: eid, sets: [s] });
    }
    const earlier = [...days.keys()].filter((d) => d !== today).sort().map((session) => ({ session, cards: days.get(session) }));
    return { earlier, today: days.get(today) || [] };
}
// An Exercise merged into another reads as the one it was merged into, through at most 20 merges (version 10.8):
// `find` gives an Exercise by its id, from a phone's store or the timeline's records.
export function survivorOf(find, id) {
    for (let i = 0; i < 20; i++) {
        const x = find(id);
        if (!x?.mergedInto)
            return id;
        id = x.mergedInto;
    }
    return id;
}
// Borrowed names (version 10.81, bet 6, the founder's rule of 2026-11-04 00:50 UTC, a name keyed to a description's set
// of answers, and his picks in /mnt/project-files/bet-6/edit-scope-picks.md). Generic: no question of the Key is named
// here, only the muscle roles (target, synergists, stabilizers), which never count (his "Leave muscles out", 01:02 UTC). `holdsAll` is the
// test for "inside" and for an offer; Done before's match after the first answer keeps its own test, which compares the target.
const valuesOf = (c) => Object.entries(c || {}).filter(([k]) => !MUSCLE_ROLES.includes(k)).flatMap(([k, vs]) => (vs || []).map((v) => [k, v]));
export const holdsAll = (coords, answers) => valuesOf(answers).every(([k, v]) => (coords[k] || []).includes(v));
// Inside: holds every non-muscle answer of `outer`, and at least one more.
export const inside = (inner, outer) => holdsAll(inner, outer) && valuesOf(inner).length > valuesOf(outer).length;
// An Exercise's own name, else the name of the nearest named Exercise it sits inside (the one with the most answers) with
// the answers beyond it; two or more equally near with different names are a tie (his "Ask for a name", 01:29 UTC); equally
// near with one name lend it from the one named last.
// The nearest of `named`: those with the most non-muscle answers, the one named last first. Shared by nameFor and
// offersFor, so one rule says which name is nearest (version 10.81).
function nearest(named, coords, t) {
    if (!named.length)
        return [];
    const most = Math.max(...named.map((x) => valuesOf(coords(x)).length));
    return named.filter((x) => valuesOf(coords(x)).length === most).sort((a, b) => t(b).localeCompare(t(a)));
}
export function nameFor(ex, live) {
    if (nameOf(ex))
        return { own: nameOf(ex) };
    const near = nearest(live.filter((o) => o.id !== ex.id && !!nameOf(o) && inside(ex.coords, o.coords)), (o) => o.coords, (o) => o.name?.t || '');
    if (!near.length)
        return null;
    if (new Set(near.map(nameOf)).size > 1)
        return { tie: near };
    const from = near[0];
    const extras = {};
    for (const [k, v] of valuesOf(ex.coords))
        if (!(from.coords[k] || []).includes(v))
            (extras[k] = extras[k] || []).push(v);
    return { from, extras };
}
export function offersFor(ex, live, others) {
    if (nameFor(ex, live))
        return [];
    const near = nearest(others.filter((o) => !!nameOf(o.exercise) && holdsAll(ex.coords, o.exercise.coords)), (o) => o.exercise.coords, (o) => o.exercise.name?.t || '');
    const rows = new Map();
    for (const o of near) {
        const givers = rows.get(nameOf(o.exercise)) || rows.set(nameOf(o.exercise), []).get(nameOf(o.exercise));
        if (!givers.some((g) => g.tester === o.tester))
            givers.push({ tester: o.tester, exerciseId: o.exercise.id });
    }
    const byTester = (a, b) => a.tester.localeCompare(b.tester);
    return [...rows].map(([text, givers]) => ({ text, givers: givers.sort(byTester) })).sort((a, b) => byTester(a.givers[0], b.givers[0]));
}
// A name kept or replaced is read case aside and with the spaces at its ends trimmed (the Lean Advisor's ruling on bet
// 6's measure, item 6).
export const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
// A day's heading, "Wednesday, Oct 28, 2026", the Timeline page's own (timeline/index.html), in the phone's language.
export const dayWords = (session) => { const [y, m, d] = session.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }); };
// The order the lifter answered in (version 10.54, the founder's 00:41 UTC 2026-10-22, "Wouldn't it be better to treat
// this consistently across new and existing descriptions?"; the Technical Advisor's one reader): read from the taps, a
// new description's and, in an edit, the saving description's and its edits' before them, never from the order of
// the keys in an object. An answer's place is its last tap the lifter gave, a choice, a typed value or an added
// question, or a skip (version 10.54, so Back finds a skip in its turn), the muscle's three roles one question's
// answer together; a tap a rule wrote (`by: 'rule'`, from 10.54;
// older records hold a few unmarked, a compromise) gives none. An answer no tap gave, from a rule or a Done-before
// card, goes right after the latest answer before it in the Key's order, the order a line comes after the lines it
// reads (version 10.23). Until 10.54 a new description moved a key to the end of its answers on each tap and an edit
// rebuilt the order from the taps, two ways of holding one fact that could disagree. A card's answer held by its Edit
// (`card_answer`, version 10.62) places its answer as the lifter's, in the order the card's Exercise was answered.
export const PLACING_KINDS = ['answer', 'other', 'add_question', 'skip', 'card_answer'];
export function answerOrder(taps, present, keyOrder) {
    const at = {};
    taps.forEach((tap, i) => {
        if (!tap.attr || tap.by === 'rule' || !PLACING_KINDS.includes(tap.kind))
            return;
        for (const k of MUSCLE_ROLES.includes(tap.attr) ? MUSCLE_ROLES : [tap.attr])
            at[k] = i;
    });
    const inKey = [...keyOrder.filter((k) => present.includes(k)), ...present.filter((k) => !keyOrder.includes(k))];
    let latest = -1;
    const place = Object.fromEntries(inKey.map((k) => { if (at[k] !== undefined) {
        latest = Math.max(latest, at[k]);
        return [k, at[k]];
    } return [k, latest + 0.5]; }));
    return inKey.sort((x, y) => place[x] - place[y]);
}
// Lists compared as Python compares tuples: item by item, then the shorter first.
export function compare(a, b) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        const x = a[i], y = b[i];
        const c = Array.isArray(x) && Array.isArray(y) ? compare(x, y) : x === y ? 0 : x < y ? -1 : 1;
        if (c)
            return c;
    }
    return a.length - b.length;
}
export const atLeast = (v, w) => compare(v, w) >= 0;
// The Describer's code a description was made on, "10.48 (2026-10-19)" read as [10, 48]; [0] where none is recorded.
// From 10.55 `app` names the code and `version` the Key the description started on, which can be newer.
export function versionOf(d) {
    const ws = String(d.app || d.version || '').split(' ')[0].split('.');
    const n = ws.filter((w) => /^[0-9]+$/.test(w)).map(Number);
    return n.length ? n : [0];
}
// A description's logged answers, read from its taps as the Describer reads them: an answer tap writes the question's
// whole answer, a typed value is added to a question of several answers and replaces the answer of any other; a Back
// takes off every answer of its question, the muscle's three roles together, unless the question was opened from its
// line since, when it puts back what the question held at that tap. A muscle role emptied stays answered; an emptied
// answer to any other question drops. From 10.48, one screen, a Back always takes its question's answer off, a line's tap
// puts nothing back, and a `left` tap drops the answer of the question it names. From 10.62 an `edit` tap empties the
// answers, and each `card_answer` after it writes its question's answer as an answer tap does. A mark's tap takes no
// answer. Moved from the route read (reach.ts), its known splits with App.tsx kept (describer/typescript-move.md, Risks),
// for its third use, the flags' sort (describer/flags.md). Taps are read as given: a caller renames them first.
export function answersAt(d) {
    const oneScreen = atLeast(versionOf(d), [10, 48]);
    const cardEdits = atLeast(versionOf(d), [10, 62]);
    let coords = {};
    let reopened = {};
    for (const tap of d.taps || []) {
        const q = tap.attr;
        const kind = tap.kind;
        if (cardEdits && kind === 'edit') {
            coords = {};
            reopened = {};
            continue;
        }
        if (!q)
            continue;
        if (tap.mark)
            continue; // a mark's tap, a `back` taking a mark included (10.69), takes no answer
        const value = tap.value;
        if (kind === 'answer' || (cardEdits && kind === 'card_answer'))
            coords[q] = Array.isArray(value) ? [...value] : [value];
        else if (kind === 'other')
            coords[q] = isMulti(q) ? [...(coords[q] || []), value] : [value];
        else if (kind === 'reopen' && !oneScreen) {
            const ks = answersOf(q);
            reopened[ks[0]] = Object.fromEntries(ks.filter((x) => x in coords).map((x) => [x, coords[x]]));
        }
        else if (kind === 'back') {
            const ks = answersOf(q);
            const was = reopened[ks[0]];
            delete reopened[ks[0]];
            for (const x of ks) {
                if (was !== undefined && x in was)
                    coords[x] = was[x];
                else
                    delete coords[x];
            }
        }
        else if (kind === 'left' && oneScreen)
            delete coords[q];
    }
    return Object.fromEntries(Object.entries(coords).filter(([k, v]) => MUSCLE_ROLES.includes(k) || (v.length && !(v.length === 1 && v[0] == null))));
}
// The Key taken when a description starts (version 10.55, describer/key-without-release.md; the founder's "Build it
// now", "Each description" and "File on Pages", 2026-10-27): the file the build writes is served beside the app, and a
// phone takes a newer one of the same format at the next description's start, so a rule ships without a release.
// holdKey binds the Key and everything worked out from it, and is called at open and at the top of startDescribing only:
// Describe exercise is on the Set screen's bar alone, where no description is open, so a description never changes Key
// part-way; a card's Edit from Another set starts its row on the Key held (version 10.62). A value worked out from the
// Key at module level is bound here, or it keeps the old Key's after a swap.
export function holdKey(k) {
    KEY = k;
    VERSION = `${k.version} (${k.date})`;
    VALUE_RENAMED = new Map(Object.entries(k.renamed).map(([q, vs]) => [q, new Map(Object.entries(vs))]));
    offered = new Set(k.lines.flatMap((l) => l.offer || []));
    RULE_OF = new Map(k.one_rule.flatMap((ats, r) => ats.map((at) => [at, r])));
    const down = (m) => [m, ...(k.parts[m] || []).flatMap(down)];
    const up = (m) => k.muscles.filter((p) => (k.parts[p] || []).includes(m)).flatMap((p) => [p, ...up(p)]);
    WITHIN = new Map(k.muscles.map((m) => [m, new Set(down(m))]));
    ABOVE = new Map(k.muscles.map((m) => [m, new Set(up(m))]));
}
export const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
export const isString = (v) => typeof v === 'string';
export const isBoolean = (v) => typeof v === 'boolean';
export const listOf = (ok) => (v) => Array.isArray(v) && v.every(ok);
export const mapOf = (ok) => (v) => isObject(v) && Object.values(v).every(ok);
export const shaped = (shape) => (v) => isObject(v) && Object.entries(shape).every(([f, ok]) => ok(v[f]));
export const ATTRIBUTE_SHAPE = { key: isString, ask: isString, label: isString, about: isString, values: listOf(isString), multi: isBoolean, filled: isBoolean };
export const CLAIM_SHAPE = {
    fill: mapOf(listOf(isString)), exclude: mapOf(listOf(isString)),
    skip: listOf(isString), reveal: listOf(isString), require: listOf(isString), order: listOf(isString), offer: listOf(isString),
};
// A line is a condition and one claim (law 6).
export const isLine = (l) => isObject(l) && isObject(l.when) && Object.keys(l).length === 2
    && Object.entries(CLAIM_SHAPE).some(([c, ok]) => c in l && ok(l[c]));
export const isDefaultLine = (l) => isObject(l) && isObject(l.when) && Object.keys(l).length === 2 && mapOf(listOf(isString))(l.default);
export const KEY_SHAPE = {
    format: isString, version: (v) => isString(v) && /^\d+(\.\d+)*$/.test(v), date: isString,
    attributes: listOf(shaped(ATTRIBUTE_SHAPE)), after: mapOf(listOf(isString)), joints: mapOf(isString), lines: listOf(isLine), defaults: listOf(isDefaultLine),
    muscles: listOf(isString), parts: mapOf(listOf(isString)), one_rule: listOf(listOf((n) => Number.isInteger(n) && n >= 0)),
    retired: listOf(shaped({ attr: isString, value: isString })), renamed: mapOf(mapOf(isString)),
    zero_weight: isObject,
};
// queueOf reads every attribute's `after`, and the chain every line one_rule names. The format is checked as a string
// here; App.tsx's servedKey takes only its own format, and the timeline reads any.
export function readKey(raw) {
    if (!shaped(KEY_SHAPE)(raw))
        return null;
    const k = raw;
    return k.attributes.every((a) => Array.isArray(k.after[a.key])) && k.one_rule.every((ats) => ats.every((at) => at < k.lines.length)) ? k : null;
}
// The questions a condition names; byValue, only those it reads an answer of: a question read by $exists alone is left
// out, since such a term says whether the question is answered, never which answer (the build's fields_of until describer/typescript-move.md, commit 5).
export function fieldsOf(c, byValue = false) {
    const out = [];
    for (const [k, x] of Object.entries(c)) {
        if (x === undefined)
            continue;
        const fs = k === '$and' || k === '$or' || k === '$nor' ? x.flatMap((s) => fieldsOf(s, byValue))
            : byValue && !Array.isArray(x) && Object.keys(x).length === 1 && '$exists' in x ? [] : [k];
        for (const f of fs)
            if (!out.includes(f))
                out.push(f);
    }
    return out;
}
// The learned policy (the founder, 2026-11-03 03:34 UTC: "everything answered so far that already has a default … It
// would just use the default from curl, if valid … kind of an overridey system"): it reads the lifter's own saved
// descriptions and, for a question, looks at the past descriptions that gave the same answers as this one to its first
// k answers in the order given, k from all of them down to one, and takes the first k where one answer was given at
// least twice (law 4: one tap can be a slip) and by more than half of them (the Design Advisor). With no answer given
// yet nothing is picked, so the description's first question never is. A vote is a saved description's answer as at
// Save whose last writing tap was the lifter's own answer or typed value: never a rule's, a card's or a taken default,
// so it never learns from its own guesses. On a question of several answers the set ticked is one answer. Each past description's answers,
// fills and votes are read once, when made; the counts on each call. It names no question (law 8).
export function learned(descriptions) {
    const past = descriptions.filter((d) => d.landedAt).map((d) => {
        const own = answersAt(d);
        const votes = new Set(Object.keys(own).filter((q) => {
            const last = [...d.taps].reverse().find((t) => t.attr === q && !t.mark && ['answer', 'other', 'card_answer', 'back', 'left'].includes(t.kind));
            return !!last && (last.kind === 'answer' || last.kind === 'other') && !last.by;
        }));
        return { own, view: withFills(own).coords, votes };
    });
    const same = (a, b) => JSON.stringify([...(a || [])].sort()) === JSON.stringify([...(b || [])].sort());
    // The question a blank description opens on is never pre-picked: it is a description's root, and a past answer to it
    // says nothing about this one (the founder, 3 Nov 2026 03:23 UTC: it "would need a much cleverer policy").
    const root = queueOf({}, [], KEY.attributes.map((a) => a.key), []).asked[0];
    return (q, view, given) => {
        // Never on the muscle question, whose role keys step (10.74); the Key's `target` takes several answers, so this
        // guard, not isMulti, keeps it out.
        if (q === root || MUSCLE_ROLES.includes(q) || !given.length)
            return null;
        // On a question of several answers the whole set ticked is one vote (version 10.74, the founder's "the default would
        // be that hips, knees, and ankles were the default", 2026-11-03 14:13 UTC): the set ticked most often wins, whole.
        const voters = past.filter((p) => p.votes.has(q) && (p.own[q]?.length === 1 || (isMulti(q) && (p.own[q]?.length ?? 0) > 1)));
        for (let k = given.length; k >= 1; k--) {
            const keys = given.slice(0, k);
            const counts = new Map();
            for (const p of voters)
                if (keys.every((a) => same(p.view[a], view[a]))) {
                    const set = JSON.stringify([...p.own[q]].sort());
                    counts.set(set, (counts.get(set) || 0) + 1);
                }
            const of = [...counts.values()].reduce((a, b) => a + b, 0);
            const [top] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
            if (top && top[1] >= 2 && top[1] * 2 > of)
                return { by: 'learned', value: JSON.parse(top[0]), votes: top[1], of };
        }
        return null;
    };
}
// The written policy (version 10.76, writing-rules.md law 3): the picks of every default line whose condition the answers
// with their fills meet; on a question of several answers they add up, as fills do (law 7), and on a question of one the
// build has made them agree. It names no question (law 8).
export function written(defaults) {
    return (q, view) => {
        const on = defaults.flatMap((l, at) => (l.default[q] && matches(view, l.when) ? [at] : []));
        return on.length ? { by: 'written', value: [...new Set(on.flatMap((at) => defaults[at].default[q] ?? []))], lines: on } : null;
    };
}
// The first policy that picks (law 3: "learned, and where nothing is learned, written").
export const firstOf = (...ps) => (q, view, given) => {
    for (const p of ps) {
        const d = p(q, view, given);
        if (d)
            return d;
    }
    return null;
};
