/**
 * @file lang.js
 * Русские тексты Pressing Under Pressure.
 * Ключ — исходная английская строка, значение — перевод.
 */

export const STRINGS = {
    // экран проигрыша
    'fatal failure': 'СМЕРТЕЛЬНЫЙ ПРОВАЛ',
    'deadly deviation': 'РОКОВОЕ ОТКЛОНЕНИЕ',
    'baneful blunder': 'ГУБИТЕЛЬНАЯ ОШИБКА',
    'mortal miss': 'СМЕРТНЫЙ ПРОМАХ',
    'final flub': 'ПОСЛЕДНИЙ ЛЯП',
    'grave goof': 'ТЯЖКИЙ ПРОМАХ',
    'terminal trap': 'ФАТАЛЬНАЯ ЛОВУШКА',

    // финал
    'ascending': 'ВОЗНЕСЕНИЕ',
    'you did great!': 'ТЫ МОЛОДЕЦ!',
    'shutting down': 'ОТКЛЮЧЕНИЕ',

    // задания
    'press': 'ЖМИ',
    'do press': 'ЖМИ',
    'do not press': 'НЕ ЖМИ',
    'double press': 'ДВОЙНОЕ НАЖАТИЕ',
    'press twice': 'НАЖМИ ДВАЖДЫ',
    'press and hold': 'ЖМИ И ДЕРЖИ',
    'press once for each': 'НАЖМИ ПО РАЗУ ЗА',
    'word in this sentence': 'СЛОВО В ЭТОМ ТЕКСТЕ',
    'press less than 2 times': 'НАЖМИ МЕНЬШЕ 2 РАЗ',
    'press more than 5 times': 'НАЖМИ БОЛЬШЕ 5 РАЗ',
    'press once per corner': 'НАЖМИ ПО РАЗУ ЗА УГОЛ',
    'press if you\'re a human': 'ЖМИ, ЕСЛИ ТЫ ЧЕЛОВЕК',
    'press if you\'re a robot': 'ЖМИ, ЕСЛИ ТЫ РОБОТ',
    'would you kindly not press': 'БУДЬ ЛЮБЕЗЕН, НЕ ЖМИ',
    'quickly don\'t press!!!': 'БЫСТРО НЕ ЖМИ!!!',
    'longer than 2 seconds': 'ДОЛЬШЕ 2 СЕКУНД',
    'press and hold until': 'ЖМИ И ДЕРЖИ, ПОКА',
    'you see a spider': 'НЕ УВИДИШЬ ПАУКА',
    'release': 'ОТПУСТИ',
    'stop!': 'СТОЙ!',
    'same as last': 'КАК В ПРОШЛЫЙ РАЗ',
    'always press when': 'ВСЕГДА ЖМИ, КОГДА',
    'you see a rat': 'ВИДИШЬ КРЫСУ',
    'press when cats are even': 'ЖМИ ПРИ ЧЁТНОМ ЧИСЛЕ КОТОВ',
    'never press when': 'НИКОГДА НЕ ЖМИ,',
    'when you see a spider': 'КОГДА УВИДИШЬ ПАУКА',
    'press once per cat earlier': 'НАЖМИ ПО РАЗУ ЗА КОТА',
    'the next statement is a lie': 'СЛЕДУЮЩАЯ ФРАЗА — ЛОЖЬ',
    'press to pay respect': 'ЖМИ В ЗНАК УВАЖЕНИЯ',
    'are you a wizard': 'ТЫ ЧТО, ВОЛШЕБНИК?',
    'close enough': 'ЛАДНО, СЧИТАЕТСЯ',
    'press after half-time': 'ЖМИ ПОСЛЕ ПОЛОВИНЫ',
    'press more than': 'НАЖМИ БОЛЬШЕ, ЧЕМ',
    'once per corner': 'ПО РАЗУ ЗА УГОЛ',
    'press to ascend': 'ЖМИ, ЧТОБЫ ВОЗНЕСТИСЬ',
    'what time is it?': 'КОТОРЫЙ ЧАС?',
    'the next command is wrong': 'СЛЕДУЮЩАЯ КОМАНДА НЕВЕРНА',
    'remember this number': 'ЗАПОМНИ ЧИСЛО',
    'press if you': 'ЖМИ, ЕСЛИ ТЫ',
    'remember the number': 'ПОМНИШЬ ЧИСЛО',
    'good memory': 'ХОРОШАЯ ПАМЯТЬ',
    'press if you like': 'ЖМИ, ЕСЛИ ЛЮБИШЬ',
    'jumpscares': 'СКРИМЕРЫ',
};

/** Перевод строки; неизвестные строки возвращаются как есть. */
export function tr(text) {
    return STRINGS[text] !== undefined ? STRINGS[text] : text;
}

/** Падеж слова «нажатие» для числа. */
export function pressesWord(n) {
    const mod100 = Math.abs(n) % 100;
    const mod10 = mod100 % 10;
    if (mod100 >= 11 && mod100 <= 14) {
        return 'нажатий';
    }
    if (mod10 === 1) {
        return 'нажатие';
    }
    if (mod10 >= 2 && mod10 <= 4) {
        return 'нажатия';
    }
    return 'нажатий';
}

/** «осталось 5 нажатий» / «осталось 21 нажатие». */
export function remaining(n) {
    const left = Math.max(0, n);
    return `осталось ${left} ${pressesWord(left)}`;
}

/** «ещё около 37 нажатий». */
export function aboutRemaining(n) {
    const left = Math.max(0, n);
    return `ещё около ${left} ${pressesWord(left)}`;
}

/** «нажми 1+2+3-2 раз» — число раз всегда в родительном падеже. */
export function pressTimes(n) {
    return `нажми 1+2+3-${n} раз`;
}
