/**
 * @file levels.js
 * Кампания и бесконечный режим: последовательности заданий, очки за скорость.
 */

export const LEVELS = [
    {
        id: 'level1',
        number: 1,
        title: 'ТРЕНИРОВКА',
        subtitle: 'Разомнись. Ошибка — и всё сначала.',
        parSeconds: 130,
        intro: 'title',
        tasks: ['press', 'do-not-press', 'same-as-last', 'double-press', 'corners-triangle',
            'word-count', 'hold-2s', 'rule-rat', 'do-not-press-rat', 'rule-cats-even',
            'cats-even', 'quickly-do-not-press', 'remember-number', 'recall-number', 'press-ascend'],
    },
    {
        id: 'level2',
        number: 2,
        title: 'ДАВЛЕНИЕ',
        subtitle: 'Заданий больше, времени меньше.',
        parSeconds: 200,
        tasks: ['more-than-5', 'corners-square', 'rule-spider', 'spider-counter',
            'hold-until-spider', 'press-range', 'press-not-consecutive', 'press-after-half',
            'press-twice-quick', 'press-if-odd', 'press-when-green', 'do-not-press-trap',
            'press-even-count', 'press-letter-count', 'human', 'robot', 'clock',
            'rule-lie', 'do-press', 'press-ascend'],
    },
    {
        id: 'level3',
        number: 3,
        title: 'КРИЗИС',
        subtitle: 'Всё, что ты знал, теперь против тебя.',
        parSeconds: 300,
        tasks: ['press-200', 'corners-star', 'press-corners-16', 'rule-spider',
            'spider-scare-half', 'clock', 'press-if-odd', 'press-if-greater',
            'press-range', 'press-not-consecutive', 'press-after-half', 'press-twice-quick',
            'press-when-green', 'do-not-press-trap', 'press-even-count', 'press-letter-count',
            'hold-until-star', 'remember-number', 'recall-number', 'jumpscares',
            'jumpscare-counter', 'rule-lie', 'do-press', 'do-not-press-rat', 'press-ascend'],
    },
];

export const ENDLESS = {
    id: 'endless',
    number: 0,
    title: 'БЕСКОНЕЧНОСТЬ',
    subtitle: 'Одна ошибка. Никакого финала.',
    endless: true,
    tasks: [],
};

export const ENDLESS_POOL = [
    'press', 'do-not-press', 'double-press', 'press-twice', 'would-you-kindly',
    'press-and-hold', 'press-times', 'quickly-do-not-press', 'remaining-counter',
    'spider-counter', 'hold-2s', 'hold-until-spider', 'reveal-press',
    'do-not-press-rat', 'cats-even', 'do-press', 'pay-respect',
    'do-not-press-rat-stand', 'press-200', 'spider-scare-half', 'press-corners-16',
    'clock', 'word-count', 'less-than-2', 'more-than-5', 'corners-circle',
    'corners-triangle', 'corners-square', 'corners-star', 'press-range',
    'press-not-consecutive', 'press-after-half', 'press-twice-quick', 'press-if-odd',
    'press-if-greater', 'press-when-green', 'do-not-press-trap', 'press-even-count',
    'press-letter-count', 'hold-until-star', 'press-five-in-four',
];

export const LEVEL_BY_ID = new Map([...LEVELS, ENDLESS].map(level => [level.id, level]));

export const CAMPAIGN_ORDER = LEVELS.map(level => level.id);

export function getLevel(id) {
    const level = LEVEL_BY_ID.get(id);

    if (level === undefined) {
        throw new Error(`Unknown level "${id}"`);
    }

    return level;
}

export function nextLevelId(id) {
    const index = CAMPAIGN_ORDER.indexOf(id);

    return index >= 0 && index + 1 < CAMPAIGN_ORDER.length ? CAMPAIGN_ORDER[index + 1] : null;
}

export function speedBonus(level, timeMs) {
    if (level.endless) {
        return 0;
    }

    return Math.max(0, Math.round((level.parSeconds - timeMs / 1000) * 10));
}
