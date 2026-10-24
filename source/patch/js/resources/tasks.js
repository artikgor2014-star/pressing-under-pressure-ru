/**
 * @file tasks.js
 * Реестр заданий. Каждая фабрика получает кнопку и общий объект запуска,
 * поэтому обращается к кнопке только через параметр — без привязки `this`.
 */

import AudioManager from '../framework/audiomanager.class.js';

import { tr, remaining, aboutRemaining, pressTimes } from './lang.js';

/**
 * id -> factory(button, state)
 *
 * state — общий на весь запуск: { cats, subtracted, isHuman, likeJumpscares, jumpscareDone }.
 */
export const TASKS = {
    // Group 0 — титульный экран
    'title': (button) => ({
        id: 'title',
        points: 0,
        counts: false,
        setup() {
            button._drawSprite(10, 0, 0, 500, 500); // Title
        },
        update(lastSeconds, seconds, presses) {
            if (lastSeconds > -4 && seconds <= -4) {
                button._drawText(tr('press'), 0, 185, 40);
            }
        },
        getState: (timeout, presses) => presses === 0 ? null : true,
    }),

    // Group 1
    'press': (button) => ({
        id: 'press',
        points: 100,
        presses: 1,
        setup() {
            button._commandDuration = 6;

            button._drawText(tr('press'));
        },
        getState: (timeout, presses) => presses === 0 && !timeout ? null : presses > 0,
    }),

    'do-not-press': (button) => ({
        id: 'do-not-press',
        points: 100,
        presses: 0,
        setup() {
            button._commandDuration = 6 * 0.75;

            button._drawText(tr('do not press'));
        },
        getState: (timeout, presses) => presses === 0 && !timeout ? null : presses === 0,
    }),

    // Group 2
    'word-count': (button) => ({
        id: 'word-count',
        points: 100,
        presses: 8,
        setup() {
            button._commandDuration = 6 * 2.5;

            button._drawText(tr('press once for each'), 0, -32, 39);
            button._drawText(tr('word in this sentence'), 0, 32, 37);
        },
        getState: (timeout, presses) => !timeout ? null : presses === 8,
    }),

    'less-than-2': (button) => ({
        id: 'less-than-2',
        points: 100,
        setup() {
            button._commandDuration = 6;

            button._drawText(tr('press less than 2 times'), 0, 0, 34);
        },
        getState: (timeout, presses) => !timeout ? null : presses < 2,
    }),

    'more-than-5': (button) => ({
        id: 'more-than-5',
        points: 100,
        setup() {
            button._commandDuration = 6 * 1.5;

            button._drawText(tr('press more than 5 times'), 0, 0, 35);
        },
        getState: (timeout, presses) => !timeout ? null : presses > 5,
    }),

    // Group 3
    'corners-circle': (button) => ({
        id: 'corners-circle',
        points: 100,
        presses: 0,
        setup() {
            button._commandDuration = 6 * 1.2;

            button._drawText(tr('press once per corner'), 0, -36, 38);
            button._drawSprite(6, 0, 68); // Circle
        },
        getState: (timeout, presses) => !timeout ? null : presses === 0,
    }),

    'corners-triangle': (button) => ({
        id: 'corners-triangle',
        points: 100,
        presses: 3,
        setup() {
            button._commandDuration = 6 * 1.2;

            button._drawText(tr('press once per corner'), 0, -36, 38);
            button._drawSprite(5, 0, 68); // Triangle
        },
        getState: (timeout, presses) => !timeout ? null : presses === 3,
    }),

    'corners-square': (button) => ({
        id: 'corners-square',
        points: 100,
        presses: 4,
        setup() {
            button._commandDuration = 6 * 1.5;

            button._drawText(tr('press once per corner'), 0, -36, 38);
            button._drawSprite(4, 0, 68); // Square
        },
        getState: (timeout, presses) => !timeout ? null : presses === 4,
    }),

    'corners-star': (button) => ({
        id: 'corners-star',
        points: 150,
        presses: 10,
        setup() {
            button._commandDuration = 6 * 2.5;

            button._drawText(tr('press once per corner'), 0, -44, 38);
            button._drawSprite(7, 0, 86); // Star
        },
        getState: (timeout, presses) => !timeout ? null : presses === 10,
    }),

    // Group 4
    'human': (button, state) => ({
        id: 'human',
        points: 100,
        setup() {
            button._commandDuration = 6;

            button._drawText(tr('press if you\'re a human'), 0, 0, 36);
        },
        getState: (timeout, presses) => {
            if (presses === 0 && !timeout) {
                return null;
            }

            if (state.isHuman === null) {
                state.isHuman = presses > 0 ? true : null;
                return true;
            }

            return state.isHuman === (presses > 0);
        },
    }),

    'robot': (button, state) => ({
        id: 'robot',
        points: 100,
        setup() {
            button._commandDuration = 6;

            button._drawText(tr('press if you\'re a robot'), 0, 0, 36);
        },
        getState: (timeout, presses) => {
            if (presses === 0 && !timeout) {
                return null;
            }

            if (state.isHuman === null) {
                state.isHuman = presses > 0 ? false : null;
                return true;
            }

            return state.isHuman === (presses === 0);
        },
    }),

    // Group 5
    'double-press': (button) => ({
        id: 'double-press',
        points: 100,
        presses: 2,
        setup() {
            button._commandDuration = 6;

            button._drawText(tr('double press'));
        },
        getState: (timeout, presses) => presses < 2 && !timeout ? null : presses === 2,
    }),

    'press-twice': (button) => ({
        id: 'press-twice',
        points: 100,
        presses: 2,
        setup() {
            button._commandDuration = 6;

            button._drawText(tr('press twice'));
        },
        getState: (timeout, presses) => presses < 2 && !timeout ? null : presses === 2,
    }),

    'would-you-kindly': (button) => ({
        id: 'would-you-kindly',
        points: 100,
        presses: 0,
        setup() {
            button._commandDuration = 6 * 0.5;

            button._drawText(tr('would you kindly not press'), 0, 0, 32);
        },
        getState: (timeout, presses) => presses === 0 && !timeout ? null : presses === 0,
    }),

    'press-and-hold': (button) => ({
        id: 'press-and-hold',
        points: 100,
        presses: 1,
        setup() {
            button._commandDuration = 6;

            button._drawText(tr('press and hold'));
        },
        getState: (timeout, presses, pressed) => !timeout ? null : pressed,
    }),

    'press-times': (button, state) => ({
        id: 'press-times',
        points: 100,
        setup() {
            button._commandDuration = 6 * 2;

            button._drawText(pressTimes(state.subtracted), 0, 0, 42);
        },
        getState: (timeout, presses) => !timeout ? null : presses === 6 - state.subtracted,
    }),

    'quickly-do-not-press': (button) => ({
        id: 'quickly-do-not-press',
        points: 100,
        presses: 0,
        setup() {
            button._commandDuration = 6 / 2;

            button._drawText(tr('quickly don\'t press!!!'), 0, 0, 40);
        },
        getState: (timeout, presses) => presses === 0 && !timeout ? null : presses === 0,
    }),

    'remaining-counter': (button) => {
        let pressesRemaining = 0;

        return {
            id: 'remaining-counter',
            points: 150,
            setup() {
                pressesRemaining = 2 + Math.floor(Math.random() * 5);

                button._commandDuration = 6;
            },
            update(lastSeconds, seconds, presses, pressed, pressChange) {
                if (pressChange) {
                    button._clearCanvas();

                    button._drawText(remaining(pressesRemaining - presses), 0, 0, 40);
                }
            },
            getState: (timeout, presses) => !timeout ? null : presses === pressesRemaining,
        };
    },

    // Group 6
    'spider-counter': (button) => {
        let pressesRemaining = 0;

        return {
            id: 'spider-counter',
            points: 150,
            presses: 0,
            setup() {
                pressesRemaining = 4 + Math.floor(Math.random() * 8);

                button._commandDuration = 6;
            },
            update(lastSeconds, seconds, presses, pressed, pressChange) {
                if (pressChange) {
                    button._clearCanvas();

                    button._drawText(remaining(pressesRemaining - presses), 0, 0, 40);

                    button._drawSprite(1); // Spider
                }
            },
            getState: (timeout, presses) => presses === 0 && !timeout ? null : presses === 0,
        };
    },

    // Group 7
    'hold-2s': (button) => {
        let holdingDuration = 0;

        return {
            id: 'hold-2s',
            points: 100,
            presses: 1,
            setup() {
                holdingDuration = 0;

                button._commandDuration = 6 * 1.5;

                button._drawText(tr('press and hold'), 0, -32, 43);
                button._drawText(tr('longer than 2 seconds'), 0, 32, 37);
            },
            update(lastSeconds, seconds, presses, pressed) {
                if (pressed) {
                    holdingDuration += lastSeconds - seconds;
                }
            },
            getState: (timeout, presses, pressed) => !timeout && holdingDuration <= 2 ? null : holdingDuration > 2,
        };
    },

    'hold-until-spider': (button) => {
        let timeUntilSpider = null;

        return {
            id: 'hold-until-spider',
            points: 150,
            setup() {
                timeUntilSpider = null;

                button._drawText(tr('press and hold until'), 0, -32, 38);
                button._drawText(tr('you see a spider'), 0, 32, 40);
            },
            update(lastSeconds, seconds, presses, pressed) {
                if (timeUntilSpider === null) {
                    if (pressed) {
                        timeUntilSpider = 15;

                        button._clearCanvas();
                    }
                } else {
                    const last = timeUntilSpider;
                    timeUntilSpider -= lastSeconds - seconds;

                    if (timeUntilSpider < 10 && last >= 10) {
                        button._drawText(tr('release'));
                    }

                    if (timeUntilSpider < 7 && last >= 7) {
                        button._clearCanvas();
                    }

                    if (timeUntilSpider < 5 && last >= 5) {
                        button._drawText(tr('stop!'));
                    }

                    if (timeUntilSpider < 2 && last >= 2) {
                        button._clearCanvas();
                    }

                    if (timeUntilSpider < 0 && last >= 0) {
                        button._drawSprite(1); // Spider
                    }
                }
            },
            getState: (timeout, presses, pressed) => timeUntilSpider === null || pressed ? null : timeUntilSpider <= 0,
        };
    },

    'reveal-press': (button) => ({
        id: 'reveal-press',
        points: 150,
        setup() {
            button._commandDuration = 8;

            button._drawText('н____');
        },
        update(lastSeconds, seconds) {
            if (seconds < 6 && lastSeconds >= 6) {
                button._clearCanvas();
                button._drawText('н___и');
            }

            if (seconds < 5 && lastSeconds >= 5) {
                button._clearCanvas();
                button._drawText('на__и');
            }

            if (seconds < 4 && lastSeconds >= 4) {
                button._clearCanvas();
                button._drawText('наж_и');
            }

            if (seconds < 3 && lastSeconds >= 3) {
                button._clearCanvas();
                button._drawText('нажми');
            }
        },
        getState: (timeout, presses) => presses === 0 && !timeout ? null
            : button._commandSeconds < 3 && presses > 0,
    }),

    // Group 8
    'same-as-last': (button) => ({
        id: 'same-as-last',
        points: 100,
        setup() {
            button._commandDuration = 6 * 0.75;

            button._drawText(tr('same as last'));

            button._animations.animateRat('RatWalk');
        },
        getState: (timeout, presses) => presses === 0 && !timeout ? null
            : button._lastCommand.presses > 0 ? presses > 0 : presses === 0,
    }),

    // Group 9
    'rule-rat': (button) => ({
        id: 'rule-rat',
        points: 0,
        setup() {
            button._commandDuration = 6 * 0.75;

            button._drawText(tr('always press when'), 0, -32, 40);
            button._drawText(tr('you see a rat'), 0, 32, 40);
        },
    }),

    // Group 10
    'do-not-press-rat': (button) => ({
        id: 'do-not-press-rat',
        points: 150,
        presses: 1,
        setup() {
            button._commandDuration = 6;

            button._drawText(tr('do not press'));
            button._drawSprite(0, 0, 64, 160, 160); // Rat
        },
        getState: (timeout, presses) => presses === 0 && !timeout ? null : presses > 0,
    }),

    // Group 11
    'rule-cats-even': (button) => ({
        id: 'rule-cats-even',
        points: 0,
        setup() {
            button._commandDuration = 6 * 0.75;

            button._drawText(tr('press when cats are even'), 0, 0, 33);
        },
    }),

    // Group 12
    'cats-even': (button, state) => ({
        id: 'cats-even',
        points: 150,
        setup() {
            button._commandDuration = 6 * 1.2;

            this.presses = state.cats % 2 === 0 ? 1 : 0;

            for (let i = 0; i < state.cats; i++) {
                button._drawSprite(2, -state.cats * 32 + i * 64 + 32, 0, 80, 80); // Cat
            }
        },
        getState: (timeout, presses) => presses === 0 && !timeout ? null
            : state.cats % 2 === 0 ? presses > 0 : presses === 0,
    }),

    // Group 13
    'rule-spider': (button) => ({
        id: 'rule-spider',
        points: 0,
        setup() {
            button._commandDuration = 6 * 0.75;

            button._drawText(tr('never press when'), 0, -32, 43);
            button._drawText(tr('when you see a spider'), 0, 32, 43);
        },
    }),

    // Group 14
    'cat-count': (button, state) => ({
        id: 'cat-count',
        points: 150,
        setup() {
            button._commandDuration = 6 * 1.5;

            button._drawText(tr('press once per cat earlier'), 0, 0, 32);
        },
        getState: (timeout, presses) => !timeout ? null : presses === state.cats,
    }),

    // Group 15
    'rule-lie': (button) => ({
        id: 'rule-lie',
        points: 0,
        setup() {
            button._commandDuration = 6 * 0.75;

            button._drawText(tr('the next statement is a lie'), 0, 0, 32);
        },
    }),

    // Group 16
    'do-press': (button) => ({
        id: 'do-press',
        points: 100,
        presses: 1,
        setup() {
            button._commandDuration = 6 * 2;

            button._drawText(tr('do press'));
        },
        getState: (timeout, presses) => presses === 0 && !timeout ? null : presses === 1,
    }),

    // Group 17
    'pay-respect': (button) => ({
        id: 'pay-respect',
        points: 100,
        presses: 1,
        setup() {
            button._commandDuration = 6;

            button._drawText(tr('press to pay respect'), 0, 0, 41);
        },
        getState: (timeout, presses) => presses === 0 && !timeout ? null : true,
    }),

    // Group 18
    'do-not-press-rat-stand': (button) => ({
        id: 'do-not-press-rat-stand',
        points: 150,
        presses: 1,
        setup() {
            button._commandDuration = 6 * 1.25;

            button._drawText(tr('do not press'));

            button._animations.animateRat('RatStandButton', true);
        },
        getState: (timeout, presses) => {
            const state = presses === 0 && !timeout ? null : presses === 1;

            if (state) {
                button._animations.animateRat('RatLeaveButton');
            }

            return state;
        },
    }),

    // Group 19
    'press-200': (button) => {
        let pressesRemaining = 200;

        return {
            id: 'press-200',
            points: 200,
            presses: 200,
            disableFlash: true,
            setup() {
                pressesRemaining = 200;

                button._commandDuration = 6 * 3;
            },
            update(lastSeconds, seconds, presses, pressed, pressChange) {
                if (pressChange || seconds < 1 && lastSeconds >= 1) {
                    button._clearCanvas();

                    if (presses === 200) {
                        button._drawText(tr('are you a wizard'), 0, 0, 40);
                    } else if (seconds < 1) {
                        button._drawText(tr('close enough'));
                    } else {
                        button._drawText(aboutRemaining(pressesRemaining - presses), 0, 0, 30);
                    }
                }
            },
            getState: (timeout, presses) => !timeout ? null : true,
        };
    },

    // Group 20
    'spider-scare-half': (button) => ({
        id: 'spider-scare-half',
        points: 200,
        presses: 0,
        setup() {
            button._commandDuration = 20;

            button._drawText(tr('press after half-time'), 0, 0, 38);
        },
        update(lastSeconds, seconds) {
            if (seconds < 13 && lastSeconds >= 13) {
                button._animations.spiderScare();
                button._player.spiderScare();
            }

            if (seconds < 12 && lastSeconds >= 12) {
                button.getScene().setBlurAmount(0.03, 0.02);
            }

            if (seconds < 12 && lastSeconds >= 12) {
                AudioManager.play('sound__spider');
            }

            if (seconds < 8 && lastSeconds >= 8) {
                button._animations.hideSpider();
            }
        },
        getState: (timeout, presses) => !timeout ? null : presses === 0,
    }),

    // Group 21
    'press-corners-16': (button) => ({
        id: 'press-corners-16',
        points: 200,
        presses: 16,
        disableFlash: true,
        setup() {
            button._commandDuration = 6 * 4;
        },
        update(lastSeconds, seconds) {
            if (Math.floor(seconds * 4) !== Math.floor(lastSeconds * 4)) {
                button._clearCanvas();

                button._drawText(tr('press more than'), 0, -128, 38);
                button._drawText(tr('once per corner'), 0, -74, 38);

                let firstX = null;
                let firstY = null;
                let lastX = null;
                let lastY = null;

                for (let i = 0; i < 10; i++) {
                    const a = Math.random() * Math.PI * 2;
                    const r = 120 + Math.random();

                    const x = Math.cos(a) * r;
                    const y = 80 + Math.sin(a) * r;
                    if (i === 0) {
                        firstX = x;
                        firstY = y;
                        lastX = x;
                        lastY = y;
                    } else {
                        button._drawLine(x, y, lastX, lastY, 5);
                        lastX = x;
                        lastY = y;
                    }

                    if (i === 9) {
                        button._drawLine(x, y, firstX, firstY, 5);
                    }
                }
            }
        },
        getState: (timeout, presses) => !timeout ? null : presses >= 16,
    }),

    // Group 22
    'press-ascend': (button) => ({
        id: 'press-ascend',
        points: 100,
        presses: 1,
        isFinal: true,
        setup() {
            button._drawText(tr('press to ascend'));
        },
        getState: (timeout, presses) => presses === 0 ? null : true,
    }),

    // Group 23
    'clock': (button) => {
        let targetHour = 3;

        return {
            id: 'clock',
            points: 200,
            setup() {
                targetHour = 3 + Math.floor(Math.random() * 6);

                this.presses = targetHour;

                button._commandDuration = 6 * 1.75;
            },
            update(lastSeconds, seconds, presses, pressed, pressChange) {
                if (pressChange) {
                    button._clearCanvas();

                    button._drawText(tr('what time is it?'), 0, 40, 30);

                    button._drawCircle(0, 0, 228, 5);

                    for (let i = 0; i < 12; i++) {
                        const a = i / 12 * Math.PI * 2;
                        const x = Math.sin(a) * 180;
                        const y = -Math.cos(a) * 180;

                        button._drawSprite(targetHour === i ? 9 : 3, x, y, 96, 96); // Skull or smile

                        if (presses % 12 === i) {
                            button._drawLine(0, 0, x * 0.8, y * 0.8, 8);
                        }
                    }
                }
            },
            getState: (timeout, presses) => !timeout ? null : (presses % 12) === targetHour,
        };
    },

    // Group 24
    'rule-next-wrong': (button) => ({
        id: 'rule-next-wrong',
        points: 0,
        setup() {
            button._commandDuration = 6 * 0.75;

            button._drawText(tr('the next command is wrong'), 0, 0, 32);
        },
    }),

    // Group 25
    'remember-number': (button) => ({
        id: 'remember-number',
        points: 0,
        setup() {
            button._commandDuration = 6 * 0.75;

            button._drawText(tr('remember this number'), 0, -32, 37);
            button._drawText(Math.floor(Math.random() * 100).toString(), 0, 32, 50);
        },
    }),

    // Group 26
    'recall-number': (button) => ({
        id: 'recall-number',
        points: 100,
        setup() {
            button._commandDuration = 6;

            button._drawText(tr('press if you'), 0, -32, 40);
            button._drawText(tr('remember the number'), 0, 32, 39);
        },
        update(lastSeconds, seconds, presses, pressed, pressChange) {
            if (pressChange && presses > 0) {
                button._clearCanvas();

                button._drawText(tr('good memory'), 0, 0, 40);

                button._commandSeconds = Math.min(button._commandSeconds, 2);
            }
        },
        getState: (timeout, presses) => !timeout ? null : true,
    }),

    // Group 27
    'jumpscares': (button, state) => ({
        id: 'jumpscares',
        points: 100,
        setup() {
            button._commandDuration = 6;

            button._drawText(tr('press if you like'), 0, -32, 40);
            button._drawText(tr('jumpscares'), 0, 32, 45);
        },
        update(lastSeconds, seconds, presses, pressed, pressChange) {
            if (pressChange && presses > 0) {
                state.likeJumpscares = true;
            }
        },
        getState: (timeout, presses) => {
            if (presses > 0 || timeout) {
                state.likeJumpscares = presses > 0;

                if (!state.jumpscareDone && presses > 0) {
                    AudioManager.stop('music');
                }

                return true;
            }

            return null;
        },
        getDelay: () => {
            return state.likeJumpscares && !state.jumpscareDone ? 8000 : 2000;
        },
    }),

    // Group 28
    'jumpscare-counter': (button, state) => {
        let pressesRemaining = 10;

        return {
            id: 'jumpscare-counter',
            points: 200,
            presses: 10,
            setup() {
                pressesRemaining = 10;

                button._commandDuration = 6 * 2;
            },
            update(lastSeconds, seconds, presses, pressed, pressChange) {
                if (pressChange) {
                    button._clearCanvas();

                    button._drawText(remaining(pressesRemaining - presses), 0, 0, 39);
                }
            },
            getState: (timeout, presses) => {
                if (state.likeJumpscares && presses > 7) {
                    button._animations.jumpscare();
                    button.getScene().setBlurAmount(0.05, 0.5);
                    state.jumpscareDone = true;

                    return true;
                }

                return !timeout ? null : presses === pressesRemaining;
            },
            getDelay: () => {
                return state.likeJumpscares ? 5000 : 2000;
            },
        };
    },

    // --- Новые задания ---

    'press-range': (button) => ({
        id: 'press-range',
        points: 100,
        setup() {
            button._commandDuration = 8;

            button._drawText(tr('press 3 to 5 times'), 0, 0, 36);
        },
        getState: (timeout, presses) => !timeout ? null : presses >= 3 && presses <= 5,
    }),

    'press-not-consecutive': (button) => {
        let seen = 0;
        let lastAt = null;
        let minGap = Infinity;

        return {
            id: 'press-not-consecutive',
            points: 200,
            presses: 3,
            setup() {
                seen = 0;
                lastAt = null;
                minGap = Infinity;

                button._commandDuration = 10;

                button._drawText(tr('press 3 times, but not in a row'), 0, 0, 36);
            },
            update(lastSeconds, seconds, presses) {
                if (presses > seen) {
                    const at = button._commandDuration - seconds;

                    while (seen < presses) {
                        if (lastAt !== null) {
                            minGap = Math.min(minGap, at - lastAt);
                        }

                        lastAt = at;
                        seen++;
                    }
                }
            },
            getState: (timeout, presses) => !timeout ? null : presses === 3 && minGap >= 0.4,
        };
    },

    'press-after-half': (button) => {
        let firstAt = null;

        return {
            id: 'press-after-half',
            points: 100,
            presses: 1,
            setup() {
                firstAt = null;

                button._commandDuration = 8;

                button._drawText(tr('press once after half-time'), 0, 0, 34);
            },
            update(lastSeconds, seconds, presses) {
                if (presses > 0 && firstAt === null) {
                    firstAt = button._commandDuration - seconds;
                }
            },
            getState: (timeout, presses) => !timeout ? null
                : presses === 1 && firstAt !== null && firstAt >= button._commandDuration / 2,
        };
    },

    'press-twice-quick': (button) => {
        let times = [];

        return {
            id: 'press-twice-quick',
            points: 100,
            presses: 2,
            setup() {
                times = [];

                button._commandDuration = 8;

                button._drawText(tr('press twice within 4 seconds'), 0, 0, 34);
            },
            update(lastSeconds, seconds, presses) {
                while (times.length < presses) {
                    times.push(button._commandDuration - seconds);
                }
            },
            getState: (timeout, presses) => !timeout ? null
                : presses === 2 && times.length === 2 && times[1] - times[0] <= 4,
        };
    },

    'press-if-odd': (button) => {
        let number = 1;

        return {
            id: 'press-if-odd',
            points: 150,
            setup() {
                number = 1 + Math.floor(Math.random() * 9);

                button._commandDuration = 6;

                button._drawText(tr('press if the number is odd'), 0, -80, 30);
                button._drawText(number.toString(), 0, 60, 120);
            },
            getState: (timeout, presses) => !timeout ? null
                : number % 2 === 1 ? presses > 0 : presses === 0,
        };
    },

    'press-if-greater': (button) => {
        let first = 1;
        let second = 2;

        return {
            id: 'press-if-greater',
            points: 150,
            setup() {
                first = 1 + Math.floor(Math.random() * 9);

                do {
                    second = 1 + Math.floor(Math.random() * 9);
                } while (second === first);

                button._commandDuration = 7;

                button._drawText(tr('press if the first is greater'), 0, -80, 30);
                button._drawText(`${first}   ${second}`, 0, 60, 110);
            },
            getState: (timeout, presses) => !timeout ? null
                : first > second ? presses > 0 : presses === 0,
        };
    },

    'press-when-green': (button) => {
        let firstAt = null;
        let greenAt = null;

        return {
            id: 'press-when-green',
            points: 200,
            presses: 1,
            initialLightTheme: 'off',
            setup() {
                firstAt = null;
                greenAt = null;

                button._commandDuration = 8;

                button._drawText(tr('press when the button turns green'), 0, 0, 32);
            },
            update(lastSeconds, seconds, presses) {
                if (greenAt === null && seconds <= 3) {
                    greenAt = button._commandDuration - seconds;

                    button._setLightTheme('on');
                }

                if (presses > 0 && firstAt === null) {
                    firstAt = button._commandDuration - seconds;
                }
            },
            getState: (timeout, presses) => {
                if (presses > 0 && firstAt !== null && greenAt !== null) {
                    return firstAt >= greenAt;
                }

                return timeout ? false : null;
            },
        };
    },

    'do-not-press-trap': (button) => {
        let stage = 0;

        return {
            id: 'do-not-press-trap',
            points: 150,
            presses: 0,
            setup() {
                stage = 0;

                button._commandDuration = 8;

                button._drawText(tr('do not press, whatever happens'), 0, 0, 30);
            },
            update(lastSeconds, seconds) {
                const elapsed = button._commandDuration - seconds;

                if (stage === 0 && elapsed >= 4) {
                    stage = 1;

                    button._clearCanvas();
                    button._drawText(tr('press'), 0, 0, 60);
                }

                if (stage === 1 && elapsed >= 6) {
                    stage = 2;

                    button._clearCanvas();
                    button._drawText(tr('do not press'), 0, 0, 50);
                }
            },
            getState: (timeout, presses) => !timeout ? null : presses === 0,
        };
    },

    'press-even-count': (button) => ({
        id: 'press-even-count',
        points: 100,
        setup() {
            button._commandDuration = 8;

            button._drawText(tr('press an even number of times'), 0, 0, 34);
        },
        getState: (timeout, presses) => !timeout ? null : presses > 0 && presses % 2 === 0,
    }),

    'press-letter-count': (button) => ({
        id: 'press-letter-count',
        points: 150,
        presses: 8,
        setup() {
            button._commandDuration = 12;

            button._drawText(tr('press once for each letter'), 0, -32, 32);
            button._drawText(tr('in the word pressure'), 0, 32, 32);
        },
        getState: (timeout, presses) => !timeout ? null : presses === 8,
    }),

    'hold-until-star': (button) => {
        let starShown = false;
        let heldBeforeStar = false;
        let releasedAfterStar = false;

        return {
            id: 'hold-until-star',
            points: 200,
            presses: 1,
            setup() {
                starShown = false;
                heldBeforeStar = false;
                releasedAfterStar = false;

                button._commandDuration = 10;

                button._drawText(tr('press and hold until you see a star'), 0, -32, 32);
            },
            update(lastSeconds, seconds, presses, pressed) {
                if (pressed && !starShown) {
                    heldBeforeStar = true;
                }

                const elapsed = button._commandDuration - seconds;

                if (!starShown && elapsed >= 4) {
                    starShown = true;

                    button._clearCanvas();
                    button._drawSprite(7, 0, 0, 180, 180);
                    button._drawText(tr('release'), 0, -120, 36);
                }

                if (starShown && heldBeforeStar && !pressed) {
                    releasedAfterStar = true;
                }
            },
            getState: (timeout, presses, pressed) => {
                if (starShown && heldBeforeStar && !pressed) {
                    return true;
                }

                return timeout ? (heldBeforeStar && releasedAfterStar) : null;
            },
        };
    },

    'press-five-in-four': (button) => ({
        id: 'press-five-in-four',
        points: 150,
        presses: 5,
        setup() {
            button._commandDuration = 4;

            button._drawText(tr('press 5 times in 4 seconds'), 0, 0, 34);
        },
        getState: (timeout, presses) => !timeout ? null : presses === 5,
    }),
};

export function createTask(id, button, state) {
    const factory = TASKS[id];

    if (factory === undefined) {
        throw new Error(`Unknown task "${id}"`);
    }

    return factory(button, state);
}
