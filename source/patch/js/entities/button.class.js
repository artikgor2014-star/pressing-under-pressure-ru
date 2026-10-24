/**
 * @file button.class.js
 * @version 1.0.0
 */

import AudioManager from '../framework/audiomanager.class.js';
import Entity from '../framework/entity.class.js';

import CanvasPlane from '../framework/three.js/canvasplane.class.js';

import App from '../game/app.class.js';

import UI from '../game/ui.class.js';

import { markLevelComplete } from '../game/storage.js';

import { tr } from '../resources/lang.js';
import { ENDLESS_POOL, speedBonus } from '../resources/levels.js';
import { createTask } from '../resources/tasks.js';

import * as THREE from '../lib/three.js/three.module.js';

export default class Button extends Entity {
    static _init() {
        Button._materialIndicatorOn = new THREE.MeshPhongMaterial({
            color: new THREE.Color(0x00c000),
            emissive: new THREE.Color(0x00c000),
            emissiveIntensity: 0.8,
        });
        Button._materialIndicatorOff = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0),
        });
        Button._materialIndicatorAlarm = new THREE.MeshPhongMaterial({
            color: new THREE.Color(0xff0000),
            emissive: new THREE.Color(0xff0000),
            emissiveIntensity: 0.8,
        });
        Button._materialButtonOn = new THREE.MeshPhongMaterial({
            color: new THREE.Color(0x00ff00),
            emissive: new THREE.Color(0x00ff00),
            emissiveIntensity: 0.15,
        });
        Button._materialButtonOff = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0),
        });
        Button._materialButtonAlarm = new THREE.MeshPhongMaterial({
            color: new THREE.Color(0xff0000),
            emissive: new THREE.Color(0xff0000),
            emissiveIntensity: 0.5,
        });
        Button._materialButtonInfo = new THREE.MeshPhongMaterial({
            color: new THREE.Color(0x008800),
            emissive: new THREE.Color(0x008800),
            emissiveIntensity: 0.5,
        });

        Button._gameOverMessages = ['fatal failure', 'deadly deviation', 'baneful blunder', 'mortal miss',
            'final flub', 'grave goof', 'terminal trap'].map(tr);
        Button._lightIntensity = 2;
    }

    constructor(context, scene, options) {
        super(context, scene, options);

        this._sprites = document.querySelector('.sprites');

        this._player = scene.findEntityOfType(Entity.getTypeByName('Player'));
        this._animations = scene.findEntityOfType(Entity.getTypeByName('Animations'));

        this._mouseHeld = false;

        const buttonElement = document.querySelector('.button');

        buttonElement.addEventListener('mousedown', e => {
            if (e.button === 0) {
                this._mouseHeld = true;
            }
        }, false);

        buttonElement.addEventListener('mouseup', e => {
            if (e.button === 0) {
                this._mouseHeld = false;
            }
        }, false);

        buttonElement.addEventListener('touchstart', e => {
            this._mouseHeld = true;
        }, false);

        buttonElement.addEventListener('touchend', e => {
            this._mouseHeld = false;
        }, false);

        buttonElement.addEventListener('touchcancel', () => {
            this._mouseHeld = false;
        }, false);

        const tScene = scene.getThreeScene();

        this._button = tScene.getObjectByName('Button');
        const indicator = tScene.getObjectByName('Indicator');

        this._indicators = [indicator];

        for (let i = 1; i < 40; i++) {
            const newIndicator = indicator.clone();
            newIndicator.rotation.set(0, Math.PI * 2 / 40 * i, 0);
            this._indicators.push(newIndicator);
            tScene.add(newIndicator);
        }

        this._light0 = tScene.getObjectByName('Light000_Orientation');
        this._light1 = tScene.getObjectByName('Light001_Orientation');

        this._light0.decay = 6;

        this._light0.originalColor = this._light0.color.clone();
        this._light1.originalColor = this._light1.color.clone();
        this._light1.originalDecay = this._light1.decay;

        this._canvasPlane = new CanvasPlane(512, 512, 0.66 / 512, 0.66 / 512, -256, -256);
        this._canvasPlane.rotateX(Math.PI / 2);
        this._canvasPlane.rotateZ(Math.PI);
        this._canvasPlane.rotateY(Math.PI);
        this._canvasPlane.position.y = 0.32;
        this._button.add(this._canvasPlane);

        this._targetLightIntensity = null;

        this._commands = null;
        this._command = null;
        this._lastCommand = null;
        this._commandDuration = null;
        this._commandSeconds = null;
        this._firstCommandUpdate = null;

        this._presses = null;
        this._pressed = null;

        this._lightTheme = null;

        this._level = null;
        this._state = null;
        this._run = undefined;

        this._endlessPool = [];
        this._endlessStep = 0;
        this._endlessId = null;

        this._hudTimer = 0;
    }

    update(context) {
        super.update(context);

        const dt = context.time.elapsedSeconds;

        this._light1.intensity = this._targetLightIntensity < this._light1.intensity ?
            Math.max(this._targetLightIntensity, this._light1.intensity - 20 * dt * Button._lightIntensity) :
            Math.min(this._targetLightIntensity, this._light1.intensity + 20 * dt * Button._lightIntensity);

        Button._materialButtonOn.emissiveIntensity = this._command !== null && this._command.disableFlash ? 0.15
            : 0.35 - this._animations.getButtonHeight() * 0.2;

        this._updateTimer(context);

        this._updateHud(context);

        if (this._command === null) {
            return;
        }

        const lastCommandSeconds = this._commandSeconds;

        const i0 = Math.floor(this._commandSeconds / this._commandDuration / 0.1);
        this._commandSeconds = this._commandSeconds - dt;
        const i1 = Math.floor(this._commandSeconds / this._commandDuration / 0.1);

        if (this._commandSeconds > 0 && i0 !== i1) {
            AudioManager.play('sound__countdown');
        }

        let pressChange = this._firstCommandUpdate;

        if (this._command.getState === undefined) {
            this._mouseHeld = false;
        }

        if (this._mouseHeld !== this._pressed) {
            this._pressed = this._mouseHeld;

            pressChange = true;

            if (this._pressed) {
                AudioManager.play('sound__button_press');

                this._animations.buttonPress();
            } else {
                AudioManager.play('sound__button_release');

                this._animations.buttonRelease();
            }
        }

        if (this._animations.wasButtonFullyDepressed()) {
           this._presses++;

           pressChange = true;
        }

        if (this._command.update !== undefined) {
            this._command.update(lastCommandSeconds, this._commandSeconds, this._presses, this._pressed, pressChange);
            this._firstCommandUpdate = false;
        }

        const timeout = this._commandSeconds <= 0;
        const state = this._command.getState === undefined ? timeout ? true : null
            : this._command.getState(timeout, this._presses, this._pressed);

        if (state !== null) {
            this._setLightTheme('off');

            this._clearCanvas();

            AudioManager.play('sound__switch');

            this._animations.buttonRelease();

            const command = this._command;
            const delay = command.getDelay === undefined ? 1000 + Math.random() * 1500 : command.getDelay();
            this._lastCommand = command;
            this._command = null;

            if (state) {
                this._completeCommand(command, context);
            } else if (this._run !== undefined) {
                this._run.failedAt = context.time.totalSeconds;
            }

            context.time.setTimeout(() => {
                if (command.isFinal) {
                    this._win(context);
                } else if (state) {
                    AudioManager.play('sound__correct');

                    this._nextCommand();
                } else {
                    this._lose(context);
                }
            }, delay);
        }
    }

    reset(context, level) {
        this._createCommands(context, level);

        this._mouseHeld = false;
        this._pressed = false;
        this._presses = 0;

        this._light0.color.copy(this._light0.originalColor);
        this._light1.color.copy(this._light1.originalColor);

        this._light1.intensity = 0;
        this._light1.decay = this._light1.originalDecay;
        this._light1.position.set(0, 0.5, 0);
        this._light1.distance = 9;

        this._targetLightIntensity = 0;

        this._setLightTheme('off');

        this._clearCanvas();

        context.time.setTimeout(() => {
            this._nextCommand(true);
        }, 2000);
    }

    stop(context) {
        this._command = null;
        this._commands = null;
        this._run = undefined;
        this._mouseHeld = false;
        this._pressed = false;

        this._setLightTheme('off');

        this._clearCanvas();

        this._targetLightIntensity = 0;
        this._light1.intensity = 0;
    }

    _updateTimer(context) {
        const t = this._lightTheme === 'off' || this._commandSeconds <= 0 ? 0
            : this._commandSeconds / this._commandDuration;
        const n = Math.floor(t * this._indicators.length);

        this._indicators.forEach((indicator, i) => {
            if (this._lightTheme === 'alarm') {
                indicator.material = ((context.time.totalSeconds * 20 + i) % 10) < 4
                    ? Button._materialIndicatorOff : Button._materialIndicatorAlarm;
            } else {
                indicator.material = n <= i ? Button._materialIndicatorOff : Button._materialIndicatorOn;
            }
        });
    }

    _setLightTheme(theme) {
        if (theme === this._lightTheme) {
            return;
        }

        this._lightTheme = theme;

        this._light0.intensity = theme === 'off' ? 0 : 2;

        this._button.material = theme === 'off' ? Button._materialButtonOff : theme === 'on' ?
            Button._materialButtonOn : theme === 'info' ? Button._materialButtonInfo : Button._materialButtonAlarm;
    }

    _lose(context) {
        AudioManager.play('sound__wrong');

        this._setLightTheme('alarm');

        this._clearCanvas();

        const message = Button._gameOverMessages[Math.floor(Math.random() * Button._gameOverMessages.length)];

        this._drawText(message, 0, -34);
        this._drawSprite(3, 0, 68); // Skull

        this._targetLightIntensity = 30 * Button._lightIntensity;

        this._light0.color.setHex(0xff0000);
        this._light1.color.setHex(0xff0000);

        this._player.lose(context);
        this._animations.lose();

        context.time.setTimeout(() => {
            this._targetLightIntensity = 0;
        }, 7000);

        context.time.setTimeout(() => {
            UI.showResult(this._buildResult(false));
        }, 7000);
    }

    _win(context) {
        const result = this._buildResult(true);

        if (!result.endless) {
            markLevelComplete(result.levelId, result.score, result.timeMs);
        }

        if (this._level.id === 'level3') {
            this._winFinal(context, result);
        } else {
            this._winLevel(context, result);
        }
    }

    _winLevel(context, result) {
        AudioManager.stop('music');

        AudioManager.play('sound__correct');

        this._player.win();

        this._setLightTheme('on');

        this._clearCanvas();

        this._drawText(tr('level complete'), 0, -40);
        this._drawText(`${result.score}`, 0, 40, 44);

        context.time.setTimeout(() => {
            UI.showResult(result);
        }, 3500);
    }

    _winFinal(context, result) {
        AudioManager.stop('music');

        context.time.setTimeout(() => {
            AudioManager.play('sound__flood');
        }, 1000);

        context.time.setTimeout(() => {
            this._light0.color.setHex(0xff0000);
            this._light1.color.setHex(0xff0000);

            this._setLightTheme('alarm');

            this._player.win();
        }, 2000);

        for (let i = 0; i < 14; i++) {
            context.time.setTimeout(() => {
                this._clearCanvas();

                AudioManager.play('sound__countdown');

                this._drawText(tr('ascending'), 0, -32);
                this._drawText(`${'='.repeat(i)}>`, 0, 32);
            }, 2000 + i * 500);
        }

        context.time.setTimeout(() => {
            this._clearCanvas();

            this._drawText(tr('you did great!'), 0, -40);

            this._drawSprite(9, 0, 64); // Skull or smile
        }, 10000);

        context.time.setTimeout(() => {
            this._clearCanvas();

            this._drawText(tr('shutting down'));
        }, 13000);

        context.time.setTimeout(() => {
            this._clearCanvas();

            this._setLightTheme('off');

            this._light0.intensity = 0;
            this._targetLightIntensity = 0;
        }, 18000);

        context.time.setTimeout(() => {
            AudioManager.play('sound__surface');
        }, 21000);

        context.time.setTimeout(() => {
            this._animations.win();
        }, 24000);

        context.time.setTimeout(() => {
            AudioManager.play('sound__creak');

            this.getScene().setBlurAmount(0.05, 0.007);
        }, 25000);

        context.time.setTimeout(() => {
            this._targetLightIntensity = 40 * Button._lightIntensity;

            this._light1.decay = 0.001;
            this._light1.position.set(-5, 5, 0);
            this._light1.color.setHex(0xffd065);
        }, 28000);

        context.time.setTimeout(() => {
            AudioManager.play('music__ending', 1, true);
        }, 30000);

        context.time.setTimeout(() => {
            this._animations.animateRat('RatEnding');
        }, 36000);

        context.time.setTimeout(() => {
            document.querySelector('.the-end').style.visibility = 'visible';

            UI.showResult(result);
        }, 46000);
    }


    _nextCommand(first = false) {
        if (!first) {
            App.hideCredits();

            AudioManager.play('music__ingame', 1, true, false, 'music');
        }

        this._animations.wasButtonFullyDepressed();

        this._clearCanvas();

        if (this._commands.length === 0) {
            if (this._level === null || !this._level.endless) {
                return;
            }

            this._commands.push(createTask(this._nextEndlessId(), this, this._state));
        }

        this._command = this._commands.shift();
        this._commandDuration = 0;
        this._command.setup();

        if (this._level !== null && this._level.endless) {
            const scale = Math.max(0.55, 1 - Math.floor(this._endlessStep / 5) * 0.07);

            this._commandDuration *= scale;
            this._endlessStep++;
        }

        this._commandSeconds = this._commandDuration;
        this._firstCommandUpdate = true;

        this._mouseHeld = false;

        this._presses = 0;
        this._pressed = false;

        if (first) {
            this._light1.position.set(0, 0.5, 0);
            this._light1.distance = 9;
        } else {
            this._light1.position.set(0, 0, -0.5);
            this._light1.distance = 0;
        }

        this._targetLightIntensity = 20 * Button._lightIntensity;

        this._setLightTheme(this._command.initialLightTheme ?? (this._command.getState === undefined ? 'info' : 'on'));

        AudioManager.play('sound__switch');
    }

    _nextEndlessId() {
        if (this._endlessPool.length === 0) {
            this._endlessPool = ENDLESS_POOL.slice();

            for (let i = this._endlessPool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this._endlessPool[i], this._endlessPool[j]] = [this._endlessPool[j], this._endlessPool[i]];
            }

            if (this._endlessId !== null && this._endlessPool[this._endlessPool.length - 1] === this._endlessId
                && this._endlessPool.length > 1) {
                const swap = this._endlessPool.length - 2;
                [this._endlessPool[swap], this._endlessPool[this._endlessPool.length - 1]] =
                    [this._endlessPool[this._endlessPool.length - 1], this._endlessPool[swap]];
            }
        }

        this._endlessId = this._endlessPool.pop();

        return this._endlessId;
    }

    _createCommands(context, level) {
        this._level = level;
        this._context = context;

        this._state = {
            cats: 2 + Math.floor(Math.random() * 5),
            subtracted: Math.floor(Math.random() * 5),
            isHuman: null,
            likeJumpscares: false,
            jumpscareDone: false,
        };

        this._commands = [];

        if (level.intro !== undefined) {
            this._commands.push(createTask(level.intro, this, this._state));
        }

        level.tasks.forEach(id => this._commands.push(createTask(id, this, this._state)));

        this._endlessPool = [];
        this._endlessStep = 0;
        this._endlessId = null;

        if (level.endless) {
            this._commands.push(createTask(this._nextEndlessId(), this, this._state));
        }

        this._run = {
            level,
            startedAt: context.time.totalSeconds,
            completed: 0,
            score: 0,
            finishedAt: null,
            failedAt: null,
            total: level.endless ? null : level.tasks.length,
        };

        this._hudTimer = 0;
    }

    _completeCommand(command, context) {
        if (command.counts === false || this._run === undefined) {
            return;
        }

        this._run.completed++;
        this._run.score += command.points || 0;

        if (command.isFinal) {
            this._run.finishedAt = context.time.totalSeconds;
        }
    }

    _buildResult(success) {
        const end = success ? this._run.finishedAt : this._run.failedAt;
        const elapsed = Math.max(0, (end ?? this._context.time.totalSeconds) - this._run.startedAt);
        const timeMs = Math.round(elapsed * 1000);
        const bonus = success && !this._level.endless ? speedBonus(this._level, timeMs) : 0;

        return {
            levelId: this._level.id,
            levelTitle: this._level.title,
            success,
            endless: !!this._level.endless,
            score: this._run.score + bonus,
            timeMs,
            tasks: this._run.completed,
            total: this._run.total,
        };
    }

    _updateHud(context) {
        if (this._run === undefined || this._run.finishedAt !== null || this._run.failedAt !== null) {
            return;
        }

        this._hudTimer += context.time.elapsedSeconds;

        if (this._hudTimer < 0.1) {
            return;
        }

        this._hudTimer = 0;

        const elapsed = Math.max(0, context.time.totalSeconds - this._run.startedAt);
        const pending = this._command !== null && this._command.counts !== false ? 1 : 0;
        const taskNumber = this._level.endless ? this._run.completed + 1 : this._run.completed + pending;
        const liveBonus = this._level.endless ? 0 : speedBonus(this._level, elapsed * 1000);

        UI.updateHud({
            levelTitle: this._level.title,
            taskNumber,
            taskTotal: this._run.total,
            elapsedSeconds: elapsed,
            score: this._run.score + liveBonus,
        });
    }


    _clearCanvas() {
        const ctx = this._canvasPlane.getContext2D();

        ctx.clearRect(0, 0, 512, 512);

        this._canvasPlane.updateTexture();
    }

    _drawText(text, offsetX = 0, offsetY = 0, fontSize = 50) {
        const ctx = this._canvasPlane.getContext2D();

        const upperCase = text.toUpperCase();

        // русские строки шире английских: ужимаем кегль, пока текст не влезет в плиту
        const maxWidth = 470 - Math.abs(offsetX) * 2;

        let size = fontSize;

        ctx.font = `${size}px DefaultFont`;

        while (size > 10 && ctx.measureText(upperCase).width > maxWidth) {
            size -= 1;
            ctx.font = `${size}px DefaultFont`;
        }

        ctx.textAlign = 'center';
        ctx.strokeStyle = '#ffffff10';
        ctx.lineJoin = 'round';

        for (let i = 0; i < 5; i++) {
            ctx.lineWidth = 4 + i * i;
            ctx.strokeText(upperCase, 256 + offsetX, 268 + offsetY);
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillText(upperCase, 256 + offsetX, 268 + offsetY);

        this._canvasPlane.updateTexture();
    }

    _drawSprite(index, offsetX = 0, offsetY = 0, sizeX = 256, sizeY = 256) {
        const ctx = this._canvasPlane.getContext2D();

        const sx = index % 4 * 512;
        const sy = Math.floor(index / 4) * 512;

        ctx.drawImage(this._sprites, sx, sy, 512, 512, 256 - sizeX / 2 + offsetX, 256 - sizeY / 2 + offsetY, sizeX, sizeY);

        this._canvasPlane.updateTexture();
    }

    _drawLine(x0, y0, x1, y1, lineWidth) {
        const ctx = this._canvasPlane.getContext2D();

        ctx.strokeStyle = '#ffffff10';

        ctx.beginPath();

        ctx.moveTo(x0 + 256, y0 + 256);
        ctx.lineTo(x1 + 256, y1 + 256);

        for (let i = 0; i < 5; i++) {
            ctx.lineWidth = lineWidth + 4 + i * i;
            ctx.stroke();
        }

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        this._canvasPlane.updateTexture();
    }

    _drawCircle(x, y, radius, lineWidth) {
        const ctx = this._canvasPlane.getContext2D();

        ctx.strokeStyle = '#ffffff10';

        ctx.beginPath();

        ctx.arc(x + 256, y + 256, radius, 0, Math.PI * 2);

        for (let i = 0; i < 5; i++) {
            ctx.lineWidth = lineWidth + 4 + i * i;
            ctx.stroke();
        }

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        this._canvasPlane.updateTexture();
    }
}

Button._init();
Button.p_register();
