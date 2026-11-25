// Ember Kitchen — boot, the fixed-step game loop, and the screenshot scenes.
// Open game/index.html in a desktop browser to play. Add ?shot=title|rush|
// serve|over&seed=1 to stage a deterministic screenshot scene instead.
import { FIELD, STEP } from './config.js';
import { bindInput } from './input.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import { SCREEN_PLAY, createWorld, update } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = FIELD.width;
canvas.height = FIELD.height;

const world = createWorld(1);
try {
  world.best = Number(window.localStorage.getItem('ember-kitchen.best') || 0);
} catch {
  world.best = 0;
}

const controls = { paused: false, muted: false };
bindInput(canvas, world, controls);

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 1);

if (shot) {
  // A staged screenshot: one deterministic frame, no clock running.
  const staged = createWorld(seed);
  try {
    staged.best = Number(window.localStorage.getItem('ember-kitchen.best') || 0);
  } catch {
    staged.best = 0;
  }
  stageShot(shot, staged);
  Object.assign(world, staged);
  render(ctx, world, false);
} else {
  // The live game: fixed 60 Hz steps, rendered every animation frame.
  let last = performance.now();
  let accumulator = 0;
  function frame(now) {
    const elapsed = Math.min(0.25, (now - last) / 1000);
    last = now;
    if (!controls.paused && world.screen === SCREEN_PLAY) {
      accumulator += elapsed;
      while (accumulator >= STEP) {
        update(world, STEP);
        accumulator -= STEP;
      }
    } else {
      // Popups and steam still drift on the title and end screens.
      update(world, 0);
      accumulator = 0;
    }
    render(ctx, world, controls.paused);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
