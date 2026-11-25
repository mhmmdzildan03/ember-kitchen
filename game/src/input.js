// Ember Kitchen — mouse and keyboard. Clicks land on the layout's rectangles
// and call the world's actions; keys mirror the same actions for fast play.
import { BIN_ORDER, INGREDIENTS } from './config.js';
import {
  BELL,
  BOARD,
  MUTE_BUTTON,
  PAUSE_BUTTON,
  PLATE,
  SERVE,
  TRASH,
  binAt,
  grillSlotRect,
  pointInRect,
} from './layout.js';
import {
  SCREEN_OVER,
  SCREEN_PLAY,
  SCREEN_TITLE,
  clickBoard,
  clickGrill,
  clickPlate,
  clickServe,
  clickTrash,
  grabIngredient,
  startShift,
} from './world.js';
import * as sfx from './audio.js';

/** The mouse position in playfield coordinates, for the held-item cursor. */
export const mouse = { x: 640, y: 240, inside: false };

/**
 * Wire the canvas and the keyboard to one world. Returns a small control
 * object the main loop uses for pause and mute.
 */
export function bindInput(canvas, world, controls) {
  function toField(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 480,
    };
  }

  canvas.addEventListener('mousemove', (event) => {
    const point = toField(event);
    mouse.x = point.x;
    mouse.y = point.y;
    mouse.inside = true;
  });
  canvas.addEventListener('mouseleave', () => {
    mouse.inside = false;
  });

  canvas.addEventListener('mousedown', (event) => {
    sfx.ensureAudio();
    const point = toField(event);
    mouse.x = point.x;
    mouse.y = point.y;
    handleClick(world, controls, point.x, point.y);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === 'm') {
      controls.muted = !controls.muted;
      sfx.setMuted(controls.muted);
      world.muted = controls.muted;
      return;
    }
    if (key === 'p' || key === 'escape') {
      if (world.screen === SCREEN_PLAY) controls.paused = !controls.paused;
      return;
    }
    if (key === 'enter' || key === ' ') {
      if (world.screen === SCREEN_TITLE || world.screen === SCREEN_OVER) {
        sfx.ensureAudio();
        startShift(world);
        controls.paused = false;
      } else if (key === ' ' && world.screen === SCREEN_PLAY) {
        clickServe(world);
      }
      event.preventDefault();
      return;
    }
    if (world.screen !== SCREEN_PLAY || controls.paused) return;
    if (key >= '1' && key <= '6') {
      grabIngredient(world, BIN_ORDER[Number(key) - 1]);
      return;
    }
    if (key === 'g') {
      clickGrill(world, 0);
      return;
    }
    if (key === 'c') {
      clickBoard(world);
      return;
    }
    if (key === 's') {
      clickServe(world);
      return;
    }
    if (key === 't') {
      clickTrash(world);
    }
  });
}

/** Route one click to the station it landed on. */
export function handleClick(world, controls, x, y) {
  if (pointInRect(x, y, MUTE_BUTTON)) {
    controls.muted = !controls.muted;
    sfx.setMuted(controls.muted);
    world.muted = controls.muted;
    return;
  }
  if (pointInRect(x, y, PAUSE_BUTTON)) {
    if (world.screen === SCREEN_PLAY) controls.paused = !controls.paused;
    return;
  }
  if (world.screen === SCREEN_TITLE || world.screen === SCREEN_OVER) {
    if (world.screen === SCREEN_TITLE || world.screen === SCREEN_OVER) {
      startShift(world);
      controls.paused = false;
    }
    return;
  }
  if (world.screen !== SCREEN_PLAY || controls.paused) return;

  const bin = binAt(x, y);
  if (bin) {
    grabIngredient(world, bin);
    return;
  }
  for (let slot = 0; slot < 2; slot += 1) {
    if (pointInRect(x, y, grillSlotRect(slot))) {
      clickGrill(world, slot);
      return;
    }
  }
  if (pointInRect(x, y, BOARD)) {
    clickBoard(world);
    return;
  }
  if (pointInRect(x, y, PLATE)) {
    clickPlate(world);
    return;
  }
  if (pointInRect(x, y, BELL) || pointInRect(x, y, SERVE)) {
    clickServe(world);
    return;
  }
  if (pointInRect(x, y, TRASH)) {
    clickTrash(world);
  }
}

/** The name of the ingredient under the cursor, for the tooltip line. */
export function hoverName(x, y) {
  const bin = binAt(x, y);
  return bin ? INGREDIENTS[bin].name : null;
}
