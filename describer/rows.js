import { hashOf } from "./hash.js";
// Each table's key, in the order rows are sent: a row's references are met by rows before it. The server's primary
// keys are these with the lifter in front (describer-rows.sql), and `keyOf` is how a phone knows a row as sent.
export const TABLES = {
    answer_sets: ['id'], answer_set_answers: ['answer_set', 'question', 'n'],
    exercises: ['id'], exercise_answers: ['exercise', 'at'], exercise_filled: ['exercise', 'at', 'n'], exercise_was: ['exercise'],
    exercise_merges: ['exercise'], exercise_names: ['exercise', 'shown_at'],
    trails: ['id'], taps: ['trail', 'n'], trail_marks: ['trail', 'kind', 'question', 'n'],
    edits: ['exercise', 'id'], descriptions: ['id'], description_answers: ['description', 'answer_set'],
    sets: ['id'], set_strikes: ['set_id', 'at'], moves: ['id'], move_sets: ['move', 'n'], offers: ['id'], offer_givers: ['offer', 'n'],
    added_questions: ['question'], added_values: ['question', 'value'], additions: ['at', 'description', 'question'],
};
// The references the server enforces (describer-rows.sql): a row's column, and the table whose id it names. A reference
// to a description is not among them: it is kept as written, since a record need not hold the sitting a thing came from.
export const REFS = [['sets', 'exercise', 'exercises'], ['descriptions', 'exercise', 'exercises'], ['moves', 'from_exercise', 'exercises'], ['moves', 'to_exercise', 'exercises'],
    ['move_sets', 'set_id', 'sets'], ['move_sets', 'move', 'moves'], ['edits', 'exercise', 'exercises'], ['edits', 'merge_from', 'exercises'], ['edits', 'merge_into', 'exercises'], ['offers', 'exercise', 'exercises'],
    ['exercise_merges', 'exercise', 'exercises'], ['exercise_merges', 'into_exercise', 'exercises'], ['exercise_answers', 'exercise', 'exercises'], ['exercise_answers', 'answer_set', 'answer_sets'],
    ['exercise_was', 'exercise', 'exercises'], ['exercise_was', 'answer_set', 'answer_sets'], ['edits', 'before', 'answer_sets'], ['edits', 'after', 'answer_sets'],
    ['description_answers', 'answer_set', 'answer_sets'], ['description_answers', 'description', 'descriptions'], ['answer_set_answers', 'answer_set', 'answer_sets'],
    ['taps', 'trail', 'trails'], ['trail_marks', 'trail', 'trails'], ['edits', 'trail', 'trails'], ['descriptions', 'trail', 'trails'], ['moves', 'trail', 'trails'],
    ['set_strikes', 'set_id', 'sets'], ['exercise_names', 'exercise', 'exercises'], ['exercise_filled', 'exercise', 'exercises'], ['offer_givers', 'offer', 'offers']];
// The rows whose every enforced reference is met by a row before it: what the server would keep. A set whose Exercise
// the record lacks is left out, with what points at it, so it never holds up the rows after it.
export function kept(rows) {
    const seen = new Map();
    return rows.filter((r) => {
        for (const [table, col, into] of REFS)
            if (r.table === table && r[col] !== null && r[col] !== undefined && !seen.get(into)?.has(String(r[col])))
                return false;
        if (TABLES[r.table].length === 1)
            (seen.get(r.table) || seen.set(r.table, new Set()).get(r.table)).add(String(r[TABLES[r.table][0]]));
        return true;
    });
}
export const keyOf = (r) => `${r.table}|${TABLES[r.table].map((k) => String(r[k])).join('|')}`;
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const orNull = (v) => (v === undefined ? null : v);
// A set of answers, stored once: its id is the hash of its answers, so the same answers are the same set on every phone.
function answerSet(rows, seen, coords) {
    if (coords === undefined)
        return null;
    const id = hashOf(coords);
    if (seen.has(id))
        return id;
    seen.add(id);
    rows.push({ table: 'answer_sets', id });
    Object.entries(coords).forEach(([question, values], q) => {
        // A question held with no answer (an emptied muscle role) is a fact of the set too. `q` is the question's place.
        if (!values.length)
            rows.push({ table: 'answer_set_answers', answer_set: id, q, n: -1, question, value: null });
        values.forEach((value, n) => rows.push({ table: 'answer_set_answers', answer_set: id, q, n, question, value }));
    });
    return id;
}
function trail(rows, id, s) {
    rows.push({ table: 'trails', id, started_at: s.startedAt, ended_at: orNull(s.endedAt), key_version: orNull(s.version), app: orNull(s.app), note: orNull(s.note) });
    (s.taps || []).forEach((tap, n) => {
        const { t, kind, attr, ...more } = tap;
        rows.push({ table: 'taps', trail: id, n, at: t, kind, question: orNull(attr), more: more });
    });
    const marks = (kind, by) => {
        if (by === undefined)
            return;
        // The kind was recorded, even with nothing under it: the row whose question is ''.
        rows.push({ table: 'trail_marks', trail: id, kind, question: '', n: -1, value: null });
        for (const [question, values] of Object.entries(by)) {
            if (!values.length)
                rows.push({ table: 'trail_marks', trail: id, kind, question, n: -1, value: null });
            values.forEach((value, n) => rows.push({ table: 'trail_marks', trail: id, kind, question, n, value }));
        }
    };
    const listed = (kind, questions) => {
        if (questions === undefined)
            return;
        rows.push({ table: 'trail_marks', trail: id, kind, question: '', n: -1, value: null });
        questions.forEach((question, n) => rows.push({ table: 'trail_marks', trail: id, kind, question, n, value: null }));
    };
    listed('filled', s.filled);
    listed('skipped', s.skipped);
    listed('defaulted', s.defaulted);
    marks('excluded', s.excluded);
    if (s.ownMarks !== undefined) {
        rows.push({ table: 'trail_marks', trail: id, kind: 'own', question: '', n: -1, value: null });
        for (const [mark, by] of Object.entries(s.ownMarks))
            marks(`own:${mark}`, by);
    }
}
// The last Edit that counts for an Exercise's answers (record.ts, `editedAt`, before the rows): a merge, the desk's, or
// one that changed an answer. A note alone moves no answers, so a stale phone's later note cannot bring old answers back.
const counts = (x) => !!x.merge || x.app === 'desk' || hashOf(x.before) !== hashOf(x.after);
const answersAt = (e) => [...(e.edits || [])].reverse().find(counts)?.t || e.createdAt;
export function rowsOf(s) {
    const rows = [];
    const sets = new Set();
    for (const e of s.exercises) {
        rows.push({ table: 'exercises', id: e.id, description: e.descriptionId || null, move: orNull(e.moveId), created_at: e.createdAt,
            muscle_tapped: orNull(e.muscleTapped), rule: orNull(e.rule), rule_held: has(e, 'rule') });
        // The answers it holds now, and which of them a rule filled. A later change is a later row.
        const at = answersAt(e);
        rows.push({ table: 'exercise_answers', exercise: e.id, at, answer_set: answerSet(rows, sets, e.coords) });
        e.derived.forEach((question, n) => rows.push({ table: 'exercise_filled', exercise: e.id, at, n, question }));
        // Its answers as first stored, kept the first time a re-read line changes them (engine.ts, renamedExercise).
        if (e.was !== undefined)
            rows.push({ table: 'exercise_was', exercise: e.id, answer_set: answerSet(rows, sets, e.was) });
        // No build since 10.81 merges two Exercises; a record made before may hold one.
        if (e.mergedInto !== undefined)
            rows.push({ table: 'exercise_merges', exercise: e.id, into_exercise: e.mergedInto });
        // The name it shows: the lifter's typed one, and the one the app gave and wrote down (name-rows.md).
        if (e.name)
            rows.push({ table: 'exercise_names', exercise: e.id, shown_at: e.name.t, name: e.name.text, source: 'own', told: null });
        if (e.shown)
            rows.push({ table: 'exercise_names', exercise: e.id, shown_at: e.shown.t, name: e.shown.text, source: e.shown.from, told: e.shown.told ?? null });
    }
    // Every Exercise before any Edit, since a merge names two.
    for (const e of s.exercises)
        for (const x of e.edits || []) {
            // A merge's Edit is on both trails (compromise: its taps are stored once per Exercise; no build writes one now).
            const id = `e:${e.id}:${x.id}`;
            trail(rows, id, x);
            rows.push({ table: 'edits', exercise: e.id, id: x.id, trail: id, at: x.t, description: orNull(x.descriptionId),
                before: answerSet(rows, sets, x.before), after: answerSet(rows, sets, x.after), merge_from: orNull(x.merge?.from), merge_into: orNull(x.merge?.into) });
        }
    for (const d of s.descriptions) {
        const id = `d:${d.id}`;
        trail(rows, id, d);
        rows.push({ table: 'descriptions', id: d.id, trail: id, exercise: orNull(d.exerciseId), landed_at: orNull(d.landedAt), landing: orNull(d.landing),
            repeat: orNull(d.repeat), muscle_asked: orNull(d.muscleAsked), incomplete: orNull(d.incomplete), abandoned: orNull(d.abandoned),
            rule: orNull(d.rule), rule_held: has(d, 'rule') });
        // The answers the desk gave it (rewrite.ts); a later rewrite is a later row, and the last to arrive wins.
        if (d.answers !== undefined)
            rows.push({ table: 'description_answers', description: d.id, answer_set: answerSet(rows, sets, d.answers) });
    }
    for (const x of s.sets) {
        rows.push({ table: 'sets', id: x.id, exercise: x.exerciseId, description: orNull(x.descriptionId), at: x.t, session: x.session, weight: x.weight, reps: x.reps });
        if (x.deleted !== undefined)
            rows.push({ table: 'set_strikes', set_id: x.id, at: x.deleted, struck: true });
        if (x.restored !== undefined)
            rows.push({ table: 'set_strikes', set_id: x.id, at: x.restored, struck: false });
    }
    for (const m of s.moves || []) {
        const id = `m:${m.id}`;
        trail(rows, id, m);
        rows.push({ table: 'moves', id: m.id, trail: id, at: m.t, from_exercise: m.from, to_exercise: m.to });
        m.sets.forEach((set, n) => rows.push({ table: 'move_sets', move: m.id, n, set_id: set }));
    }
    for (const o of s.offers || []) {
        rows.push({ table: 'offers', id: o.id, at: o.t, app: o.app, exercise: o.exerciseId, kind: o.kind, text: 'text' in o ? o.text : null });
        if ('givers' in o)
            o.givers.forEach((g, n) => rows.push({ table: 'offer_givers', offer: o.id, n, tester: g.tester, exercise: g.exerciseId }));
    }
    s.attributes.forEach((a, n) => rows.push({ table: 'added_questions', question: a.key, n, ask: a.ask }));
    for (const [question, values] of Object.entries(s.values)) {
        // `n` is the value's place when it was written; a question held with no value is the row whose value is ''.
        if (!values.length)
            rows.push({ table: 'added_values', question, value: '', n: -1 });
        values.forEach((value, n) => rows.push({ table: 'added_values', question, value, n }));
    }
    for (const a of s.additions)
        rows.push({ table: 'additions', at: a.t, description: a.descriptionId, question: a.attr, value: orNull(a.value), ask: orNull(a.ask) });
    return rows;
}
// ---- Back: the record the rows say. Each array is put in the order the merge keeps (record.ts, `sorted`).
const of = (rows, table) => rows.filter((r) => r.table === table);
const group = (rows, key) => {
    const m = new Map();
    for (const r of rows)
        (m.get(String(r[key])) || m.set(String(r[key]), []).get(String(r[key]))).push(r);
    return m;
};
const byN = (rs) => [...(rs || [])].sort((a, b) => Number(a.n) - Number(b.n));
const put = (o, k, v) => { if (v !== null && v !== undefined)
    o[k] = v; };
// `partial` reads rows that came without their sittings (describer_group): a Move's trail is then empty.
export function stateOf(rows, blank, partial = false) {
    const answersBySet = group(of(rows, 'answer_set_answers'), 'answer_set');
    const known = new Set(of(rows, 'answer_sets').map((r) => String(r.id)));
    const coordsOf = (id) => {
        if (id === null || id === undefined)
            return undefined;
        if (!known.has(String(id)))
            throw new Error(`answer set ${id} has no row`);
        const c = {};
        // Questions in the order the set was written; a question's answers by their place.
        const mine = [...(answersBySet.get(String(id)) || [])].sort((x, y) => Number(x.q) - Number(y.q) || Number(x.n) - Number(y.n));
        for (const r of mine) {
            const q = String(r.question);
            c[q] = c[q] || [];
            if (Number(r.n) >= 0)
                c[q].push(String(r.value));
        }
        return c;
    };
    const tapsByTrail = group(of(rows, 'taps'), 'trail');
    const marksByTrail = group(of(rows, 'trail_marks'), 'trail');
    const trails = new Map(of(rows, 'trails').map((r) => [String(r.id), r]));
    const sitting = (id, o, timeKeys) => {
        const t = trails.get(id);
        if (!t) {
            if (!partial)
                throw new Error(`trail ${id} has no row`);
            o.startedAt = '';
            o.taps = [];
            return;
        }
        o.startedAt = t.started_at;
        if (timeKeys.ended)
            put(o, 'endedAt', t.ended_at);
        put(o, 'version', t.key_version);
        put(o, 'app', t.app);
        put(o, 'note', t.note);
        o.taps = byN(tapsByTrail.get(id)).map((r) => { const tap = { t: r.at, kind: r.kind }; put(tap, 'attr', r.question); return { ...tap, ...r.more }; });
        const marks = marksByTrail.get(id) || [];
        const kinds = new Set(marks.filter((r) => r.question === '').map((r) => String(r.kind)));
        const list = (kind) => byN(marks.filter((r) => r.kind === kind && r.question !== '')).map((r) => String(r.question));
        const by = (kind) => {
            const c = {};
            const mine = marks.filter((r) => r.kind === kind && r.question !== '');
            for (const r of mine)
                c[String(r.question)] = c[String(r.question)] || [];
            for (const r of byN(mine))
                if (Number(r.n) >= 0)
                    c[String(r.question)].push(String(r.value));
            return c;
        };
        for (const k of ['filled', 'skipped', 'defaulted'])
            if (kinds.has(k))
                o[k] = list(k);
        if (kinds.has('excluded'))
            o.excluded = by('excluded');
        if (kinds.has('own'))
            o.ownMarks = Object.fromEntries([...kinds].filter((k) => k.startsWith('own:')).map((k) => [k.slice(4), by(k)]));
    };
    const descriptionAnswers = group(of(rows, 'description_answers'), 'description');
    const descriptions = of(rows, 'descriptions').map((r) => {
        const d = { id: r.id };
        sitting(String(r.trail), d, { ended: true });
        put(d, 'exerciseId', r.exercise);
        put(d, 'landedAt', r.landed_at);
        put(d, 'landing', r.landing);
        put(d, 'repeat', r.repeat);
        put(d, 'muscleAsked', r.muscle_asked);
        put(d, 'incomplete', r.incomplete);
        put(d, 'abandoned', r.abandoned);
        if (r.rule_held)
            d.rule = r.rule;
        const a = (descriptionAnswers.get(String(r.id)) || []).slice(-1)[0];
        if (a)
            d.answers = coordsOf(a.answer_set);
        return d;
    });
    const answersOf = group(of(rows, 'exercise_answers'), 'exercise');
    const filledOf = group(of(rows, 'exercise_filled'), 'exercise');
    const editsOf = group(of(rows, 'edits'), 'exercise');
    const namesOf = group(of(rows, 'exercise_names'), 'exercise');
    const wasOf = group(of(rows, 'exercise_was'), 'exercise');
    const mergeOf = group(of(rows, 'exercise_merges'), 'exercise');
    const exercises = of(rows, 'exercises').map((r) => {
        const id = String(r.id);
        const now = [...(answersOf.get(id) || [])].sort((x, y) => String(x.at).localeCompare(String(y.at))).pop();
        if (!now)
            throw new Error(`exercise ${id} has no answers row`);
        const e = { id, coords: coordsOf(now.answer_set), derived: byN((filledOf.get(id) || []).filter((f) => f.at === now.at)).map((f) => String(f.question)), createdAt: r.created_at, descriptionId: r.description ?? '' };
        put(e, 'moveId', r.move);
        put(e, 'muscleTapped', r.muscle_tapped);
        if (r.rule_held)
            e.rule = r.rule;
        const edits = [...(editsOf.get(id) || [])].sort((x, y) => String(x.at).localeCompare(String(y.at)) || String(x.id).localeCompare(String(y.id)));
        if (edits.length)
            e.edits = edits.map((x) => {
                const ed = { id: x.id, t: x.at };
                sitting(String(x.trail), ed, {});
                put(ed, 'descriptionId', x.description);
                ed.before = coordsOf(x.before);
                ed.after = coordsOf(x.after);
                if (x.merge_from !== null)
                    ed.merge = { from: x.merge_from, into: x.merge_into };
                return ed;
            });
        put(e, 'mergedInto', mergeOf.get(id)?.[0].into_exercise);
        // The latest typed name and the latest the app gave; nameOf says which shows.
        const names = [...(namesOf.get(id) || [])].sort((x, y) => String(x.shown_at).localeCompare(String(y.shown_at)));
        const name = names.filter((x) => x.source === 'own').pop();
        const shown = names.filter((x) => x.source !== 'own').pop();
        if (name)
            e.name = { text: name.name, t: name.shown_at };
        if (shown)
            e.shown = { text: shown.name, from: shown.source, ...(shown.told ? { told: shown.told } : {}), t: shown.shown_at };
        put(e, 'was', coordsOf(wasOf.get(id)?.[0].answer_set));
        return e;
    });
    const strikes = group(of(rows, 'set_strikes'), 'set_id');
    const sets = of(rows, 'sets').map((r) => {
        const x = { id: r.id, t: r.at, session: r.session, exerciseId: r.exercise, weight: r.weight, reps: r.reps };
        put(x, 'descriptionId', r.description);
        // The latest row says whether it is crossed out. An Undo leaves the set with `restored` and no `deleted`.
        const latest = (struck) => (strikes.get(String(r.id)) || []).filter((k) => k.struck === struck).map((k) => String(k.at)).sort().pop();
        const out = latest(true);
        const back = latest(false);
        if (out !== undefined && !(back !== undefined && back > out))
            x.deleted = out;
        put(x, 'restored', back);
        return x;
    });
    const moveSets = group(of(rows, 'move_sets'), 'move');
    const moves = of(rows, 'moves').map((r) => {
        const m = { id: r.id, t: r.at };
        sitting(String(r.trail), m, {});
        m.from = r.from_exercise;
        m.to = r.to_exercise;
        m.sets = byN(moveSets.get(String(r.id))).map((x) => String(x.set_id));
        return m;
    });
    const givers = group(of(rows, 'offer_givers'), 'offer');
    const offers = of(rows, 'offers').map((r) => {
        const o = { id: r.id, t: r.at, app: r.app, exerciseId: r.exercise, kind: r.kind };
        put(o, 'text', r.text);
        if (r.kind === 'shown' || r.kind === 'kept')
            o.givers = byN(givers.get(String(r.id))).map((g) => ({ tester: g.tester, exerciseId: g.exercise }));
        return o;
    });
    const values = {};
    for (const r of [...of(rows, 'added_values')].sort((x, y) => Number(x.n) - Number(y.n) || String(x.value).localeCompare(String(y.value)))) {
        const q = String(r.question);
        values[q] = values[q] || [];
        if (Number(r.n) >= 0 && !values[q].includes(String(r.value)))
            values[q].push(String(r.value));
    }
    const attributes = byN(of(rows, 'added_questions')).map((r) => ({ key: String(r.question), ask: String(r.ask) }));
    const additions = [...of(rows, 'additions')].sort((x, y) => String(x.at).localeCompare(String(y.at)) || String(x.description).localeCompare(String(y.description)) || String(x.question).localeCompare(String(y.question))).map((r) => { const a = { t: r.at, descriptionId: r.description, attr: r.question }; put(a, 'value', r.value); put(a, 'ask', r.ask); return a; });
    const s = { ...blank, exercises, descriptions, sets, values, attributes, additions, moves, offers };
    s.moves.sort((a, b) => a.t.localeCompare(b.t));
    s.offers.sort((a, b) => a.t.localeCompare(b.t));
    s.sets.sort((a, b) => a.t.localeCompare(b.t));
    s.descriptions.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    s.exercises.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return s;
}
// Rows in batches for the door in, in the order made, so a row's references are in its batch or an earlier one.
export const batchesOf = (rows, size = 1000) => Array.from({ length: Math.ceil(rows.length / size) }, (_, i) => rows.slice(i * size, (i + 1) * size));
