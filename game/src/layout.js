// Ember Kitchen — every clickable rectangle on the 1280x480 playfield, in one
// place, so the renderer draws a button exactly where the input layer clicks it.
import { BIN_ORDER } from './config.js';

export const HUD = { x: 0, y: 0, w: 1280, h: 48 };
export const ORDERS = { x: 16, y: 56, w: 172, h: 88, gap: 8 };
export const BINS = { x: 16, y: 164, w: 84, h: 78, gap: 6 };
export const BOARD = { x: 16, y: 256, w: 264, h: 150 };
export const GRILL = { x: 292, y: 256, w: 268, h: 150 };
export const PLATE = { x: 580, y: 164, w: 300, h: 242 };
export const SERVE = { x: 900, y: 164, w: 364, h: 242 };
export const HINT = { x: 16, y: 424, w: 1248, h: 44 };

/** The ticket of the i-th order on the rail. */
export function ticketRect(index) {
  return {
    x: ORDERS.x + index * (ORDERS.w + ORDERS.gap),
    y: ORDERS.y,
    w: ORDERS.w,
    h: ORDERS.h,
  };
}

/** The bin of the i-th ingredient on the counter. */
export function binRect(index) {
  return {
    x: BINS.x + index * (BINS.w + BINS.gap),
    y: BINS.y,
    w: BINS.w,
    h: BINS.h,
  };
}

/** The i-th grill slot inside the grill station. */
export function grillSlotRect(index) {
  return {
    x: GRILL.x + 14 + index * 134,
    y: GRILL.y + 26,
    w: 120,
    h: 110,
  };
}

/** The bell that serves the plate. */
export const BELL = { x: 960, y: 210, w: 120, h: 110 };
/** The bin that throws food away. */
export const TRASH = { x: 1140, y: 300, w: 96, h: 96 };
/** The mute and pause buttons in the HUD. */
export const MUTE_BUTTON = { x: 1150, y: 8, w: 56, h: 32 };
export const PAUSE_BUTTON = { x: 1214, y: 8, w: 56, h: 32 };

export function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

/** Which bin, if any, a point falls in; returns the ingredient id or null. */
export function binAt(px, py) {
  for (let i = 0; i < BIN_ORDER.length; i += 1) {
    if (pointInRect(px, py, binRect(i))) return BIN_ORDER[i];
  }
  return null;
}
