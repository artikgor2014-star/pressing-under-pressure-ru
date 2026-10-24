/**
 * @file ui.class.js
 * Меню выбора уровня, HUD, экран результата и таблица рейтинга.
 */

import {
    addEntry,
    exportEntries,
    getBest,
    getPlayerName,
    importEntries,
    isLevelUnlocked,
    loadEntries,
    setPlayerName,
} from './storage.js';

import { ENDLESS, LEVELS, nextLevelId } from '../resources/levels.js';

const TAB_ALL = 'all';

const TABS = [
    { id: TAB_ALL, label: 'ВСЕ' },
    ...LEVELS.map(level => ({ id: level.id, label: level.title })),
    { id: ENDLESS.id, label: ENDLESS.title },
];

const TASKS_WORD = ['заданий', 'задание', 'задания'];

function tasksWord(n) {
    const mod100 = Math.abs(n) % 100;
    const mod10 = mod100 % 10;

    if (mod100 >= 11 && mod100 <= 14) {
        return TASKS_WORD[0];
    }

    if (mod10 === 1) {
        return TASKS_WORD[1];
    }

    if (mod10 >= 2 && mod10 <= 4) {
        return TASKS_WORD[2];
    }

    return TASKS_WORD[0];
}

export default class UI {
    static init(scene) {
        UI._scene = scene;

        UI._elements = {
            menu: document.getElementById('menu'),
            levelList: document.getElementById('level-list'),
            openLeaderboard: document.getElementById('open-leaderboard'),

            hud: document.getElementById('hud'),
            hudLevel: document.getElementById('hud-level'),
            hudProgress: document.getElementById('hud-progress'),
            hudTime: document.getElementById('hud-time'),
            hudScore: document.getElementById('hud-score'),

            result: document.getElementById('result'),
            resultTitle: document.getElementById('result-title'),
            resultStats: document.getElementById('result-stats'),
            resultName: document.getElementById('result-name'),
            resultSave: document.getElementById('result-save'),
            resultNext: document.getElementById('result-next'),
            resultMenu: document.getElementById('result-menu'),
            resultStatus: document.getElementById('result-status'),

            leaderboard: document.getElementById('leaderboard'),
            lbTabs: document.getElementById('lb-tabs'),
            lbBody: document.getElementById('lb-body'),
            lbExport: document.getElementById('lb-export'),
            lbImport: document.getElementById('lb-import'),
            lbFile: document.getElementById('lb-file'),
            lbClose: document.getElementById('lb-close'),
            lbStatus: document.getElementById('lb-status'),

            theEnd: document.querySelector('.the-end'),
        };

        UI._resultData = null;
        UI._resultSaved = false;
        UI._activeTab = TAB_ALL;

        UI._buildTabs();
        UI._buildLevelCards();
        UI._bindEvents();
    }

    static _bindEvents() {
        const elements = UI._elements;

        elements.openLeaderboard.addEventListener('click', () => UI.showLeaderboard());

        elements.resultSave.addEventListener('click', () => UI._saveResult());
        elements.resultNext.addEventListener('click', () => UI._nextLevel());
        elements.resultMenu.addEventListener('click', () => UI.showMenu());

        elements.lbClose.addEventListener('click', () => UI.hideLeaderboard());
        elements.lbExport.addEventListener('click', () => UI._export());
        elements.lbImport.addEventListener('click', () => elements.lbFile.click());
        elements.lbFile.addEventListener('change', () => UI._import());
    }

    static _buildTabs() {
        const container = UI._elements.lbTabs;

        container.textContent = '';

        TABS.forEach(tab => {
            const button = document.createElement('button');

            button.type = 'button';
            button.className = 'tab';
            button.dataset.tab = tab.id;
            button.textContent = tab.label;

            button.addEventListener('click', () => {
                UI._activeTab = tab.id;
                UI._renderTable();
            });

            container.appendChild(button);
        });
    }

    static _buildLevelCards() {
        const container = UI._elements.levelList;

        container.textContent = '';

        const levels = [...LEVELS, ENDLESS];

        levels.forEach(level => {
            const card = document.createElement('button');

            card.type = 'button';
            card.className = 'level-card';
            card.dataset.level = level.id;

            const unlocked = isLevelUnlocked(level.id);

            const number = document.createElement('span');
            number.className = 'level-number';
            number.textContent = level.endless ? 'РЕЖИМ' : `УРОВЕНЬ ${level.number}`;

            const title = document.createElement('span');
            title.className = 'level-title';
            title.textContent = level.title;

            const meta = document.createElement('span');
            meta.className = 'level-meta';
            meta.textContent = level.endless ? 'До первой ошибки'
                : `${level.tasks.length} ${tasksWord(level.tasks.length)}`;

            card.appendChild(number);
            card.appendChild(title);
            card.appendChild(meta);

            if (!level.endless) {
                const best = getBest(level.id);

                const bestLine = document.createElement('span');
                bestLine.className = 'level-best';
                bestLine.textContent = best === null ? 'Ещё не пройден'
                    : `Рекорд: ${best.score} очков · ${UI._formatTime(best.timeMs / 1000)}`;

                card.appendChild(bestLine);
            }

            if (!unlocked) {
                const lock = document.createElement('span');
                lock.className = 'level-lock';

                if (level.endless) {
                    lock.textContent = 'ЗАКРЫТО: пройди «КРИЗИС»';
                } else {
                    const previous = LEVELS[LEVELS.indexOf(level) - 1];
                    lock.textContent = `ЗАКРЫТО: пройди «${previous.title}»`;
                }

                card.appendChild(lock);
            }

            card.disabled = !unlocked;

            card.addEventListener('click', () => {
                if (isLevelUnlocked(level.id)) {
                    UI.startLevel(level.id);
                }
            });

            container.appendChild(card);
        });
    }

    static _hideElement(element) {
        element.classList.remove('visible');
    }

    static _showElement(element) {
        element.classList.add('visible');
    }

    static showMenu() {
        const elements = UI._elements;

        UI._hideElement(elements.result);
        UI._hideElement(elements.leaderboard);
        UI._hideElement(elements.hud);

        elements.theEnd.style.visibility = 'hidden';

        UI._scene.stopLevel();

        UI._buildLevelCards();

        UI._showElement(elements.menu);
    }

    static startLevel(levelId) {
        const elements = UI._elements;

        UI._hideElement(elements.menu);
        UI._hideElement(elements.result);
        UI._hideElement(elements.leaderboard);

        elements.theEnd.style.visibility = 'hidden';

        UI._scene.startLevel(levelId);

        UI._showElement(elements.hud);
    }

    static updateHud({ levelTitle, taskNumber, taskTotal, elapsedSeconds, score }) {
        const elements = UI._elements;

        elements.hudLevel.textContent = levelTitle;

        elements.hudProgress.textContent = taskTotal === null ? `ЗАДАНИЕ ${taskNumber}` : `${taskNumber}/${taskTotal}`;

        elements.hudTime.textContent = UI._formatTime(elapsedSeconds);
        elements.hudScore.textContent = `${score}`;
    }

    static hideHud() {
        UI._hideElement(UI._elements.hud);
    }

    static showResult(data) {
        const elements = UI._elements;

        UI._resultData = data;
        UI._resultSaved = false;

        elements.resultTitle.textContent = data.success
            ? (data.endless ? 'БЕСКОНЕЧНОСТЬ' : 'УРОВЕНЬ ПРОЙДЕН')
            : 'ПРОВАЛ';

        const tasks = data.total === null ? `ЗАДАНИЙ ${data.tasks}` : `ЗАДАНИЙ ${data.tasks}/${data.total}`;

        elements.resultStats.textContent = `ОЧКИ ${data.score} · ВРЕМЯ ${UI._formatTime(data.timeMs / 1000)} · ${tasks}`;

        const canSave = data.endless || data.success;

        elements.resultName.parentElement.style.display = canSave ? '' : 'none';
        elements.resultSave.style.display = canSave ? '' : 'none';
        elements.resultSave.disabled = false;
        elements.resultSave.textContent = 'В ТАБЛИЦУ';

        elements.resultNext.textContent = UI._nextLabel(data);

        elements.resultName.value = getPlayerName();
        elements.resultStatus.textContent = '';

        UI._hideElement(elements.hud);
        UI._showElement(elements.result);
    }

    static _nextLabel(data) {
        if (data.endless) {
            return 'ЕЩЁ РАЗ';
        }

        if (!data.success) {
            return 'ПОВТОРИТЬ';
        }

        if (data.levelId === 'level3') {
            return 'БЕСКОНЕЧНОСТЬ';
        }

        return nextLevelId(data.levelId) === null ? 'В МЕНЮ' : 'СЛЕДУЮЩИЙ УРОВЕНЬ';
    }

    static _saveResult() {
        const elements = UI._elements;
        const data = UI._resultData;

        if (data === null || UI._resultSaved) {
            return;
        }

        const name = setPlayerName(elements.resultName.value);

        const saved = addEntry({
            name,
            levelId: data.levelId,
            levelTitle: data.levelTitle,
            score: data.score,
            timeMs: data.timeMs,
            tasks: data.endless ? data.tasks : data.total,
            date: new Date().toISOString(),
        });

        if (saved) {
            UI._resultSaved = true;

            elements.resultSave.disabled = true;
            elements.resultSave.textContent = 'СОХРАНЕНО';
            elements.resultStatus.textContent = 'Результат добавлен в таблицу';
        } else {
            elements.resultStatus.textContent = 'Не удалось сохранить результат';
        }
    }

    static _nextLevel() {
        const data = UI._resultData;

        if (data === null) {
            UI.showMenu();
            return;
        }

        if (data.endless) {
            UI.startLevel(ENDLESS.id);
            return;
        }

        if (!data.success) {
            UI.startLevel(data.levelId);
            return;
        }

        if (data.levelId === 'level3') {
            UI.startLevel(ENDLESS.id);
            return;
        }

        const next = nextLevelId(data.levelId);

        if (next === null) {
            UI.showMenu();
            return;
        }

        UI.startLevel(next);
    }

    static showLeaderboard() {
        UI._activeTab = TAB_ALL;

        UI._hideElement(UI._elements.result);
        UI._hideElement(UI._elements.menu);

        UI._elements.lbStatus.textContent = '';

        UI._renderTable();

        UI._showElement(UI._elements.leaderboard);
    }

    static hideLeaderboard() {
        UI._hideElement(UI._elements.leaderboard);

        if (!UI._elements.result.classList.contains('visible')) {
            UI._showElement(UI._elements.menu);
        }
    }

    static _renderTable() {
        const elements = UI._elements;

        Array.from(elements.lbTabs.children).forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === UI._activeTab);
        });

        const all = loadEntries();

        const filtered = UI._activeTab === TAB_ALL ? all : all.filter(entry => entry.levelId === UI._activeTab);
        const limit = UI._activeTab === TAB_ALL ? 20 : 10;

        elements.lbBody.textContent = '';

        if (filtered.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');

            cell.className = 'empty';
            cell.colSpan = 7;
            cell.textContent = 'Пока нет результатов';

            row.appendChild(cell);
            elements.lbBody.appendChild(row);

            return;
        }

        filtered.slice(0, limit).forEach((entry, index) => {
            const row = document.createElement('tr');

            const values = [
                `${index + 1}`,
                entry.name,
                entry.levelTitle,
                `${entry.score}`,
                UI._formatTime(entry.timeMs / 1000),
                `${entry.tasks}`,
                new Date(entry.date).toLocaleDateString('ru-RU'),
            ];

            values.forEach(value => {
                const cell = document.createElement('td');

                cell.textContent = value;

                row.appendChild(cell);
            });

            elements.lbBody.appendChild(row);
        });
    }

    static _export() {
        const date = new Date().toISOString().slice(0, 10);

        const blob = new Blob([exportEntries()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');

        link.href = url;
        link.download = `pup-ru-rating-${date}.json`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);

        UI._elements.lbStatus.textContent = 'Файл сохранён';
    }

    static async _import() {
        const elements = UI._elements;
        const file = elements.lbFile.files[0];

        if (file === undefined) {
            return;
        }

        try {
            const text = await file.text();
            const result = importEntries(text);

            elements.lbStatus.textContent = `Добавлено ${result.added}, пропущено ${result.skipped}`;
        } catch (e) {
            elements.lbStatus.textContent = 'Ошибка импорта';
        }

        elements.lbFile.value = '';

        UI._renderTable();
        UI._buildLevelCards();
    }

    static _formatTime(seconds) {
        const total = Math.max(0, Math.floor(seconds));

        const hours = Math.floor(total / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const rest = total % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${rest.toString().padStart(2, '0')}`;
        }

        return `${minutes}:${rest.toString().padStart(2, '0')}`;
    }
}
