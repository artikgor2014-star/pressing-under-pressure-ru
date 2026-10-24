/**
 * @file storage.js
 * Прогресс кампании и локальная таблица рейтинга в localStorage.
 * При недоступном хранилище данные живут в памяти модуля.
 */

const PROGRESS_KEY = 'pup-ru:progress:v1';
const LEADERBOARD_KEY = 'pup-ru:leaderboard:v1';
const PLAYER_NAME_KEY = 'pup-ru:player-name:v1';

const MAX_ENTRIES = 200;
const MAX_NAME_LENGTH = 20;
const DEFAULT_NAME = 'Игрок';

const LEVEL_IDS = ['level1', 'level2', 'level3', 'endless'];
const CAMPAIGN_IDS = ['level1', 'level2', 'level3'];

const memory = new Map();

function storageGet(key) {
    try {
        return globalThis.localStorage.getItem(key);
    } catch (e) {
        return memory.has(key) ? memory.get(key) : null;
    }
}

function storageSet(key, value) {
    try {
        globalThis.localStorage.setItem(key, value);
    } catch (e) {
        memory.set(key, value);
    }
}

function readJson(key) {
    const raw = storageGet(key);

    if (raw === null) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function writeJson(key, value) {
    storageSet(key, JSON.stringify(value));
}

function isNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}

function normalizeName(name) {
    const trimmed = typeof name === 'string' ? name.trim().slice(0, MAX_NAME_LENGTH) : '';

    return trimmed === '' ? DEFAULT_NAME : trimmed;
}

function createId() {
    try {
        return globalThis.crypto.randomUUID();
    } catch (e) {
        return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
}

function normalizeEntry(entry) {
    if (entry === null || typeof entry !== 'object') {
        return null;
    }

    if (!LEVEL_IDS.includes(entry.levelId)) {
        return null;
    }

    if (!isNumber(entry.score) || !isNumber(entry.timeMs) || !isNumber(entry.tasks)) {
        return null;
    }

    if (typeof entry.name !== 'string' || entry.name.trim() === '') {
        return null;
    }

    return {
        id: typeof entry.id === 'string' && entry.id !== '' ? entry.id : createId(),
        name: normalizeName(entry.name),
        levelId: entry.levelId,
        levelTitle: typeof entry.levelTitle === 'string' ? entry.levelTitle : '',
        score: entry.score,
        timeMs: entry.timeMs,
        tasks: entry.tasks,
        date: typeof entry.date === 'string' ? entry.date : new Date().toISOString(),
    };
}

function compareEntries(a, b) {
    if (a.score !== b.score) {
        return b.score - a.score;
    }

    if (a.tasks !== b.tasks) {
        return b.tasks - a.tasks;
    }

    if (a.timeMs !== b.timeMs) {
        return a.timeMs - b.timeMs;
    }

    return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
}

function sortAndTrim(entries) {
    entries.sort(compareEntries);

    if (entries.length > MAX_ENTRIES) {
        entries.length = MAX_ENTRIES;
    }

    return entries;
}

export function getProgress() {
    const stored = readJson(PROGRESS_KEY);

    const progress = {
        unlocked: 1,
        best: {},
    };

    if (stored === null || typeof stored !== 'object') {
        return progress;
    }

    if (isNumber(stored.unlocked)) {
        progress.unlocked = Math.max(1, Math.min(4, Math.floor(stored.unlocked)));
    }

    if (stored.best !== null && typeof stored.best === 'object') {
        LEVEL_IDS.forEach(levelId => {
            const best = stored.best[levelId];

            if (best !== null && typeof best === 'object'
                && isNumber(best.score) && isNumber(best.timeMs)) {
                progress.best[levelId] = { score: best.score, timeMs: best.timeMs };
            }
        });
    }

    return progress;
}

export function saveProgress(progress) {
    writeJson(PROGRESS_KEY, progress);

    return progress;
}

export function markLevelComplete(levelId, score, timeMs) {
    if (!LEVEL_IDS.includes(levelId)) {
        return getProgress();
    }

    const progress = getProgress();

    const index = CAMPAIGN_IDS.indexOf(levelId);

    if (index >= 0) {
        progress.unlocked = Math.max(progress.unlocked, Math.min(4, index + 2));
    }

    const best = progress.best[levelId];

    if (best === undefined || score > best.score || (score === best.score && timeMs < best.timeMs)) {
        progress.best[levelId] = { score, timeMs };
    }

    return saveProgress(progress);
}

export function getBest(levelId) {
    const progress = getProgress();

    return progress.best[levelId] === undefined ? null : progress.best[levelId];
}

export function isLevelUnlocked(levelId) {
    const progress = getProgress();

    if (levelId === 'endless') {
        return progress.unlocked >= 4;
    }

    const index = CAMPAIGN_IDS.indexOf(levelId);

    if (index < 0) {
        return false;
    }

    return index + 1 <= progress.unlocked;
}

export function loadEntries() {
    const stored = readJson(LEADERBOARD_KEY);

    if (!Array.isArray(stored)) {
        return [];
    }

    return sortAndTrim(stored.map(normalizeEntry).filter(entry => entry !== null));
}

export function addEntry(entry) {
    const normalized = normalizeEntry(entry);

    if (normalized === null) {
        return false;
    }

    const entries = loadEntries();

    entries.push(normalized);

    writeJson(LEADERBOARD_KEY, sortAndTrim(entries));

    return true;
}

export function exportEntries() {
    return JSON.stringify({
        version: 1,
        exportedAt: new Date().toISOString(),
        entries: loadEntries(),
    }, null, 2);
}

export function importEntries(text) {
    let parsed = null;

    try {
        parsed = JSON.parse(text);
    } catch (e) {
        throw new Error('Invalid JSON');
    }

    const source = Array.isArray(parsed) ? parsed
        : parsed !== null && typeof parsed === 'object' && Array.isArray(parsed.entries) ? parsed.entries
            : null;

    if (source === null) {
        throw new Error('Invalid leaderboard structure');
    }

    const entries = loadEntries();
    const ids = new Set(entries.map(entry => entry.id));

    let added = 0;
    let skipped = 0;

    source.forEach(item => {
        const normalized = normalizeEntry(item);

        if (normalized === null || ids.has(normalized.id)) {
            skipped++;
            return;
        }

        ids.add(normalized.id);
        entries.push(normalized);
        added++;
    });

    writeJson(LEADERBOARD_KEY, sortAndTrim(entries));

    return { added, skipped };
}

export function getPlayerName() {
    const raw = storageGet(PLAYER_NAME_KEY);

    return typeof raw === 'string' ? raw.slice(0, MAX_NAME_LENGTH) : '';
}

export function setPlayerName(name) {
    const normalized = normalizeName(name);

    storageSet(PLAYER_NAME_KEY, normalized);

    return normalized;
}
