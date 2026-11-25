// Ember Kitchen — tuning, palette, ingredients and recipes in one place.
// The playfield is a fixed 1280x480 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 480 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** How long one shift lasts, in seconds. */
export const SHIFT_SECONDS = 150;

/** Hearts lost when an order's patience runs out. */
export const HEARTS = 3;

/** Seconds an order waits before the next one arrives, by level. */
export const ORDER_INTERVAL = [14, 12, 10, 9, 8];

/** Seconds of patience an order starts with, by level. */
export const ORDER_PATIENCE = [50, 46, 42, 38, 34];

/** Seconds a served dish keeps the combo alive. */
export const COMBO_WINDOW = 20;

/** How many chops a vegetable needs on the board. */
export const CHOPS_NEEDED = 3;

/** Seconds a patty needs on the grill, then seconds before it burns. */
export const GRILL_COOK = 6;
export const GRILL_BURN = 5;

/** Points for a served dish, before the time bonus and combo. */
export const BASE_POINTS = 100;

export const PALETTE = {
  wall: '#3a2b22',
  wallTop: '#4a362a',
  floor: '#241a14',
  counter: '#8a5a33',
  counterEdge: '#6b4423',
  counterTop: '#a06a3c',
  steel: '#c8ccd2',
  steelDark: '#9aa0a8',
  board: '#d9b380',
  boardEdge: '#b98d54',
  grill: '#2e2a28',
  grillHot: '#e25822',
  ticket: '#fff6dd',
  ticketEdge: '#d8c08a',
  ink: '#2b1d12',
  cream: '#fff3d6',
  text: '#fff3d6',
  muted: '#c9a582',
  accent: '#ffb03a',
  green: '#7bc950',
  red: '#e5534b',
  gold: '#f2c94c',
  panel: '#2e2018',
  panelEdge: '#57402c',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'ember-kitchen.best';

/**
 * Every ingredient the kitchen stocks. `prep` says what it needs before it can
 * go on a plate: none (ready as grabbed), grill (a raw patty cooks, then burns)
 * or chop (a vegetable needs CHOPS_NEEDED chops on the board).
 */
export const INGREDIENTS = {
  bun: { id: 'bun', name: 'Bun', prep: 'none', color: '#f2b25c', dark: '#c98a3a', key: '1' },
  patty: { id: 'patty', name: 'Patty', prep: 'grill', color: '#a85b3f', dark: '#7c3f2a', key: '2' },
  tomato: { id: 'tomato', name: 'Tomato', prep: 'chop', color: '#e5534b', dark: '#b03228', key: '3' },
  lettuce: { id: 'lettuce', name: 'Lettuce', prep: 'chop', color: '#7bc950', dark: '#4d8a2e', key: '4' },
  cheese: { id: 'cheese', name: 'Cheese', prep: 'none', color: '#f2c94c', dark: '#d8a920', key: '5' },
  onion: { id: 'onion', name: 'Onion', prep: 'chop', color: '#c9a0e0', dark: '#8f6bb0', key: '6' },
};

/** The order in which the bins sit on the counter. */
export const BIN_ORDER = ['bun', 'patty', 'tomato', 'lettuce', 'cheese', 'onion'];

/**
 * The menu. `needs` maps a ready ingredient id to how many of it the dish
 * takes; a patty must be cooked, a vegetable chopped. `minLevel` holds the
 * harder dishes back until the kitchen has warmed up.
 */
export const RECIPES = [
  { id: 'classic', name: 'Classic Ember', needs: { bun: 1, patty: 1, lettuce: 1 }, price: 120, patience: 50, minLevel: 1 },
  { id: 'cheesy', name: 'Cheesy Melt', needs: { bun: 1, patty: 1, cheese: 1 }, price: 140, patience: 50, minLevel: 1 },
  { id: 'garden', name: 'Garden Stack', needs: { bun: 1, tomato: 1, lettuce: 1, cheese: 1 }, price: 150, patience: 55, minLevel: 2 },
  { id: 'smash', name: 'Onion Smash', needs: { bun: 1, patty: 1, onion: 1, cheese: 1 }, price: 170, patience: 55, minLevel: 2 },
  { id: 'double', name: 'Double Trouble', needs: { bun: 1, patty: 2, cheese: 1, tomato: 1 }, price: 220, patience: 60, minLevel: 3 },
];

/** Seconds of play per level; level 5 is the last, speeds stop growing there. */
export const LEVEL = { seconds: 30, max: 5 };
