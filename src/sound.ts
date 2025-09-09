import moveSelf from './assets/sound_effects/move-self.mp3';
import capture from './assets/sound_effects/capture.mp3';
import castle from './assets/sound_effects/castle.mp3';
import bgMenu from './assets/sound_effects/Treasure Trove Tango.mp3';
import bgGame from './assets/sound_effects/pigeon-chess-inGame.mp3';
import clickSfx from './assets/sound_effects/Button Click.mp3';

const sounds: Record<string, HTMLAudioElement> = {
  move: new Audio(moveSelf),
  capture: new Audio(capture),
  castle: new Audio(castle),
  click: new Audio(clickSfx),
};

let bgm: HTMLAudioElement | null = null;
let currentScene: 'menu'|'game'|null = null;
let opts = { sfxEnabled: true, sfxVolume: 0.7, bgmEnabled: true, bgmVolume: 0.5 };

function applyVolumes() {
  try {
    for (const k of Object.keys(sounds)) {
      sounds[k].volume = opts.sfxEnabled ? opts.sfxVolume : 0;
    }
    if (bgm) {
      bgm.volume = opts.bgmEnabled ? opts.bgmVolume : 0;
    }
  } catch {}
}

export function setSoundOptions(o: Partial<typeof opts>) {
  opts = { ...opts, ...o };
  applyVolumes();
  try {
    if (bgm && opts.bgmEnabled && bgm.paused) bgm.play();
  } catch {}
}

export function playMove() { try { applyVolumes(); sounds.move.currentTime = 0; if (opts.sfxEnabled) sounds.move.play(); } catch {} }
export function playCapture() { try { applyVolumes(); sounds.capture.currentTime = 0; if (opts.sfxEnabled) sounds.capture.play(); } catch {} }
export function playCastle() { try { applyVolumes(); sounds.castle.currentTime = 0; if (opts.sfxEnabled) sounds.castle.play(); } catch {} }
export function playClick() { try { applyVolumes(); sounds.click.currentTime = 0; if (opts.sfxEnabled) sounds.click.play(); } catch {} }

function setBgmScene(scene: 'menu'|'game') {
  try {
    if (!bgm || currentScene !== scene) {
      if (bgm) { bgm.pause(); bgm = null; }
      bgm = new Audio(scene === 'menu' ? bgMenu : bgGame);
      bgm.loop = true;
      currentScene = scene;
    }
    applyVolumes();
    if (opts.bgmEnabled) bgm!.play();
  } catch {}
}

export function playMenuBgm() { setBgmScene('menu'); }
export function playGameBgm() { setBgmScene('game'); }

export function stopBgm() { try { if (bgm) { bgm.pause(); bgm = null; currentScene = null; } } catch {} }

// Attempt to satisfy browser autoplay policies by starting playback from a user gesture
export function unlockBgm(scene: 'menu'|'game' = 'menu') { setBgmScene(scene); }
