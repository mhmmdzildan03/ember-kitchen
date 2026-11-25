// Ember Kitchen — the screenshot scenes behind ?shot=title|rush|serve|over.
// Each scene plays the real rules forward from a fresh world with seed 1: it
// grabs, grills, chops and plates through the world's own actions, stepping
// the simulation in fixed steps, so the frame is what a short game really
// looks like and the same seed always gives the same frame.
import { GRILL_COOK, STEP } from './config.js';
import {
  clickBoard,
  clickGrill,
  clickPlate,
  clickServe,
  gameOver,
  grabIngredient,
  spawnOrder,
  startShift,
  update,
} from './world.js';

/** Advance the simulation by whole fixed steps. */
function step(world, seconds) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) update(world, STEP);
}

function grillPatty(world, slot) {
  grabIngredient(world, 'patty');
  clickGrill(world, slot);
  step(world, GRILL_COOK + 0.4);
  clickGrill(world, slot);
}

function chopVegetable(world, id) {
  grabIngredient(world, id);
  clickBoard(world);
  clickBoard(world);
  clickBoard(world);
  clickBoard(world);
  clickBoard(world);
}

/**
 * Build the first order on the board from its recipe, through the real
 * stations. When `serve` is true the bell is rung at the end.
 */
function cookFirstOrder(world, serve) {
  const order = world.orders[0];
  if (!order) return;
  const needs = order.recipe.needs;
  if (needs.bun) {
    grabIngredient(world, 'bun');
    clickPlate(world);
  }
  for (let n = 0; n < (needs.patty || 0); n += 1) {
    grillPatty(world, 0);
    clickPlate(world);
  }
  if (needs.cheese) {
    grabIngredient(world, 'cheese');
    clickPlate(world);
  }
  for (const id of ['tomato', 'lettuce', 'onion']) {
    if (needs[id]) {
      chopVegetable(world, id);
      clickPlate(world);
    }
  }
  if (serve) clickServe(world);
}

/**
 * Set `world` to the named scene (title, rush, serve or over; any other name
 * is title) and return the screen to draw over it.
 */
export function stageShot(name, world) {
  startShift(world);
  // A full order board reads as a busy kitchen in every scene.
  spawnOrder(world);
  spawnOrder(world);
  if (name === 'over') {
    step(world, 2);
    cookFirstOrder(world, true);
    world.score = 1240;
    world.coins = 124;
    world.bestCombo = 4;
    world.combo = 4;
    world.stats = { served: 9, missed: 2, wasted: 1 };
    world.best = 1240;
    world.shiftLeft = 0;
    gameOver(world, 'shift');
    return;
  }
  if (name === 'serve') {
    step(world, 3);
    cookFirstOrder(world, true);
    spawnOrder(world);
    cookFirstOrder(world, false);
    return;
  }
  if (name === 'rush') {
    step(world, 3);
    cookFirstOrder(world, true);
    spawnOrder(world);
    // A second dish mid-assembly, built from the next order's recipe: a
    // patty on the grill, one of the order's vegetables half-chopped on the
    // board, bun and one more of the order's ingredients already on the plate.
    const order = world.orders[0];
    const needs = order ? order.recipe.needs : {};
    const boardVeg = ['tomato', 'lettuce', 'onion'].find((id) => needs[id]) || 'tomato';
    grabIngredient(world, 'patty');
    clickGrill(world, 0);
    step(world, 2.5);
    grabIngredient(world, boardVeg);
    clickBoard(world);
    clickBoard(world);
    clickBoard(world);
    if (order) {
      grabIngredient(world, 'bun');
      clickPlate(world);
      if (needs.cheese) {
        grabIngredient(world, 'cheese');
        clickPlate(world);
      } else {
        // Finish the board's vegetable and plate it: the dish is one step
        // from matching the order.
        clickBoard(world);
        clickBoard(world);
        clickPlate(world);
      }
    }
    return;
  }
  // Title: a busy kitchen behind the title card.
  step(world, 3);
  grabIngredient(world, 'patty');
  clickGrill(world, 0);
  step(world, 2);
  grabIngredient(world, 'tomato');
  clickBoard(world);
  clickBoard(world);
  clickBoard(world);
  grabIngredient(world, 'bun');
  clickPlate(world);
  grabIngredient(world, 'cheese');
  clickPlate(world);
  world.screen = 'title';
}
