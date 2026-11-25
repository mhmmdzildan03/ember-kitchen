// Ember Kitchen — the kitchen's state and rules. No drawing here: the renderer
// reads this state, and the input layer calls these actions. Every action a
// player can take is a function below, so the screenshot stager can play the
// same game by calling them.
import {
  BASE_POINTS,
  CHOPS_NEEDED,
  COMBO_WINDOW,
  GRILL_BURN,
  GRILL_COOK,
  HEARTS,
  INGREDIENTS,
  LEVEL,
  ORDER_INTERVAL,
  ORDER_PATIENCE,
  RECIPES,
  SHIFT_SECONDS,
} from './config.js';
import { createRandom } from './random.js';
import * as sfx from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

let nextOrderId = 1;

/** A fresh kitchen: one order on the board, hands empty, grill cold. */
export function createWorld(seed = 1) {
  const rng = createRandom(seed);
  const world = {
    screen: SCREEN_TITLE,
    rng,
    time: 0,
    shiftLeft: SHIFT_SECONDS,
    score: 0,
    coins: 0,
    combo: 0,
    comboLeft: 0,
    bestCombo: 0,
    level: 1,
    levelTime: 0,
    hearts: HEARTS,
    orders: [],
    orderTimer: 7,
    grill: [null, null],
    board: null,
    plate: [],
    held: null,
    stats: { served: 0, missed: 0, wasted: 0 },
    popups: [],
    particles: [],
    best: 0,
    overReason: null,
    muted: false,
  };
  spawnOrder(world);
  return world;
}

/** Start a shift: clear the board, deal the first order, start the clock. */
export function startShift(world) {
  const fresh = createWorld(1);
  Object.assign(world, fresh, { screen: SCREEN_PLAY, best: world.best });
  try {
    world.best = Number(window.localStorage.getItem('ember-kitchen.best') || 0);
  } catch {
    world.best = 0;
  }
}

function popup(world, place, text, color) {
  world.popups.push({ place, text, color, t: 0, life: 1.4 });
}

function puff(world, place, color, count = 8) {
  for (let i = 0; i < count; i += 1) {
    world.particles.push({
      place,
      x: (world.rng() - 0.5) * 60,
      y: (world.rng() - 0.5) * 20,
      vx: (world.rng() - 0.5) * 40,
      vy: -20 - world.rng() * 30,
      color,
      r: 2 + world.rng() * 3,
      t: 0,
      life: 0.7 + world.rng() * 0.5,
    });
  }
}

/** Pick a recipe the current level allows, not one already on the board. */
export function spawnOrder(world) {
  if (world.orders.length >= 3) return;
  const allowed = RECIPES.filter((recipe) => recipe.minLevel <= world.level);
  const fresh = allowed.filter((recipe) => !world.orders.some((order) => order.recipe.id === recipe.id));
  const pool = fresh.length > 0 ? fresh : allowed;
  const recipe = pool[Math.floor(world.rng() * pool.length)];
  const patience = ORDER_PATIENCE[Math.min(world.level, ORDER_PATIENCE.length) - 1];
  world.orders.push({ id: nextOrderId, recipe, left: patience, total: patience });
  nextOrderId += 1;
}

/** The form an ingredient takes when grabbed from its bin. */
function grabForm(id) {
  if (id === 'patty') return 'raw';
  return INGREDIENTS[id].prep === 'chop' ? 'whole' : 'ready';
}

/** Take an ingredient from its bin, hands must be empty. */
export function grabIngredient(world, id) {
  if (world.screen !== SCREEN_PLAY || world.held) return false;
  world.held = { id, form: grabForm(id) };
  sfx.playGrab();
  return true;
}

/** The grill: place a raw patty, or take a cooked (or burnt) one back. */
export function clickGrill(world, slot) {
  if (world.screen !== SCREEN_PLAY) return false;
  const item = world.grill[slot];
  if (world.held && world.held.id === 'patty' && world.held.form === 'raw' && !item) {
    world.grill[slot] = { id: 'patty', stage: 'cooking', t: 0, announced: false };
    world.held = null;
    sfx.playPlace();
    return true;
  }
  if (!world.held && item) {
    if (item.stage === 'cooking') {
      world.held = { id: 'patty', form: 'raw' };
      world.grill[slot] = null;
      return true;
    }
    if (item.stage === 'cooked') {
      world.held = { id: 'patty', form: 'cooked' };
      world.grill[slot] = null;
      sfx.playFlip();
      return true;
    }
    if (item.stage === 'burnt') {
      world.held = { id: 'patty', form: 'burnt' };
      world.grill[slot] = null;
      return true;
    }
  }
  return false;
}

/** The chopping board: place a whole vegetable, chop it, take it chopped. */
export function clickBoard(world) {
  if (world.screen !== SCREEN_PLAY) return false;
  const item = world.board;
  if (world.held && INGREDIENTS[world.held.id].prep === 'chop' && world.held.form === 'whole' && !item) {
    world.board = { id: world.held.id, chops: 0 };
    world.held = null;
    sfx.playPlace();
    return true;
  }
  if (!world.held && item) {
    if (item.chops >= CHOPS_NEEDED) {
      world.held = { id: item.id, form: 'chopped' };
      world.board = null;
      sfx.playFlip();
      return true;
    }
    item.chops += 1;
    puff(world, 'board', '#ffffff', 6);
    sfx.playChop();
    return true;
  }
  return false;
}

/** The assembly plate: add a ready ingredient to the dish being built. */
export function clickPlate(world) {
  if (world.screen !== SCREEN_PLAY) return false;
  if (!world.held) return false;
  const { id, form } = world.held;
  const ready = form === 'ready' || form === 'cooked' || form === 'chopped';
  if (!ready) return false;
  world.plate.push(id);
  world.held = null;
  sfx.playPlace();
  return true;
}

/** Does the plate hold exactly what this order asks for? */
export function plateMatchesOrder(plate, recipe) {
  const counts = {};
  for (const id of plate) counts[id] = (counts[id] || 0) + 1;
  const needs = recipe.needs;
  for (const id of Object.keys(needs)) {
    if ((counts[id] || 0) !== needs[id]) return false;
  }
  for (const id of Object.keys(counts)) {
    if (!needs[id]) return false;
  }
  return true;
}

/** Ring the serve bell: a matching order pays, a wrong plate is wasted. */
export function clickServe(world) {
  if (world.screen !== SCREEN_PLAY) return false;
  if (world.plate.length === 0) return false;
  let match = null;
  for (const order of world.orders) {
    if (plateMatchesOrder(world.plate, order.recipe)) {
      if (!match || order.left < match.left) match = order;
    }
  }
  if (!match) {
    world.plate = [];
    world.combo = 0;
    world.comboLeft = 0;
    world.stats.wasted += 1;
    popup(world, 'serve', 'WRONG DISH!', '#e5534b');
    sfx.playBad();
    return false;
  }
  const timeBonus = Math.round(50 * (match.left / match.total));
  const comboBonus = 25 * world.combo;
  const points = BASE_POINTS + match.recipe.price + timeBonus + comboBonus;
  world.score += points;
  world.coins += Math.floor(points / 10);
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  world.comboLeft = COMBO_WINDOW;
  world.stats.served += 1;
  world.orders = world.orders.filter((order) => order !== match);
  world.plate = [];
  popup(world, 'serve', `+${points}`, '#f2c94c');
  if (world.combo >= 2) popup(world, 'serve', `COMBO x${world.combo}!`, '#ffb03a');
  puff(world, 'serve', '#f2c94c', 14);
  sfx.playServe();
  return true;
}

/** The bin: throw away what is held, or clear the plate when hands are empty. */
export function clickTrash(world) {
  if (world.screen !== SCREEN_PLAY) return false;
  if (world.held) {
    world.held = null;
    sfx.playBad();
    return true;
  }
  if (world.plate.length > 0) {
    world.plate = [];
    world.stats.wasted += 1;
    sfx.playBad();
    return true;
  }
  return false;
}

/** End the shift, remember the best score. */
export function gameOver(world, reason) {
  world.screen = SCREEN_OVER;
  world.overReason = reason;
  world.grill = [null, null];
  world.board = null;
  world.held = null;
  world.popups = [];
  world.particles = [];
  sfx.setSizzle(false);
  if (world.score > world.best) {
    world.best = world.score;
    try {
      window.localStorage.setItem('ember-kitchen.best', String(world.best));
    } catch {
      // Private mode: the best score just lives for this visit.
    }
  }
}

/** One fixed simulation step. */
export function update(world, dt) {
  for (const pop of world.popups) pop.t += dt;
  world.popups = world.popups.filter((pop) => pop.t < pop.life);
  for (const part of world.particles) {
    part.t += dt;
    part.x += part.vx * dt;
    part.y += part.vy * dt;
    part.vy += 60 * dt;
  }
  world.particles = world.particles.filter((part) => part.t < part.life);
  if (world.screen !== SCREEN_PLAY) return;

  world.time += dt;
  world.shiftLeft -= dt;
  world.levelTime += dt;
  if (world.levelTime >= LEVEL.seconds && world.level < LEVEL.max) {
    world.level += 1;
    world.levelTime = 0;
    popup(world, 'serve', `LEVEL ${world.level}!`, '#7bc950');
    sfx.playServe();
  }
  if (world.combo > 0) {
    world.comboLeft -= dt;
    if (world.comboLeft <= 0) world.combo = 0;
  }

  world.orderTimer -= dt;
  if (world.orderTimer <= 0) {
    spawnOrder(world);
    world.orderTimer = ORDER_INTERVAL[Math.min(world.level, ORDER_INTERVAL.length) - 1];
  }
  let lost = false;
  for (const order of world.orders) {
    order.left -= dt;
    if (order.left <= 0) lost = true;
  }
  if (lost) {
    world.orders = world.orders.filter((order) => order.left > 0);
    world.hearts -= 1;
    world.combo = 0;
    world.comboLeft = 0;
    world.stats.missed += 1;
    popup(world, 'orders', 'ORDER LOST!', '#e5534b');
    sfx.playBad();
    if (world.hearts <= 0) {
      gameOver(world, 'hearts');
      return;
    }
  }

  let sizzling = false;
  for (const slot of world.grill) {
    if (!slot) continue;
    sizzling = true;
    slot.t += dt;
    if (slot.stage === 'cooking' && slot.t >= GRILL_COOK) {
      slot.stage = 'cooked';
      slot.t = 0;
      if (!slot.announced) {
        slot.announced = true;
        popup(world, 'grill', 'READY!', '#7bc950');
        sfx.playFlip();
      }
    } else if (slot.stage === 'cooked' && slot.t >= GRILL_BURN) {
      slot.stage = 'burnt';
      popup(world, 'grill', 'BURNT!', '#e5534b');
      puff(world, 'grill', '#555555', 10);
      sfx.playBurn();
    }
  }
  sfx.setSizzle(sizzling);

  if (world.shiftLeft <= 0) {
    world.shiftLeft = 0;
    gameOver(world, 'shift');
  }
}
