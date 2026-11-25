// Ember Kitchen — every pixel the player sees, drawn on one canvas with plain
// vector shapes: the kitchen, the order board, the counter, the stations, the
// HUD and the screens. Nothing is loaded from a file.
import {
  BIN_ORDER,
  CHOPS_NEEDED,
  FIELD,
  FONT,
  GRILL_BURN,
  GRILL_COOK,
  INGREDIENTS,
  PALETTE,
} from './config.js';
import {
  BELL,
  BINS,
  BOARD,
  GRILL,
  HINT,
  HUD,
  MUTE_BUTTON,
  ORDERS,
  PAUSE_BUTTON,
  PLATE,
  SERVE,
  TRASH,
  binRect,
  grillSlotRect,
  ticketRect,
} from './layout.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';
import { mouse } from './input.js';

/** Where a popup or particle burst anchors on the playfield. */
function anchor(place) {
  if (place === 'grill') return { x: GRILL.x + GRILL.w / 2, y: GRILL.y + 72 };
  if (place === 'board') return { x: BOARD.x + BOARD.w / 2, y: BOARD.y + 10 };
  if (place === 'orders') return { x: ORDERS.x + 90, y: ORDERS.y + ORDERS.h + 14 };
  return { x: SERVE.x + 120, y: SERVE.y + 40 };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, size, color, weight = 700, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
}

function shadowedText(ctx, value, x, y, size, color, align = 'left') {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.font = `800 ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.fillText(value, x + 2, y + 2);
  text(ctx, value, x, y, size, color, 800, align);
}

/** One ingredient, drawn as vector art, centred at (x, y), size s. */
export function drawIngredient(ctx, id, form, x, y, s) {
  const half = s / 2;
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') {
    ctx.fillStyle = '#f2b25c';
    ctx.beginPath();
    ctx.arc(0, half * 0.25, half * 0.95, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e09a3e';
    ctx.fillRect(-half * 0.95, half * 0.25, half * 1.9, half * 0.28);
    ctx.fillStyle = '#fff3d6';
    for (const [dx, dy] of [[-0.4, -0.35], [0, -0.55], [0.4, -0.35], [-0.15, -0.15], [0.2, -0.12]]) {
      ctx.beginPath();
      ctx.ellipse(dx * half, dy * half, half * 0.09, half * 0.06, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty') {
    const color = form === 'burnt' ? '#1c1512' : form === 'cooked' ? '#6b3a24' : '#c98a6d';
    ctx.fillStyle = color;
    roundRect(ctx, -half, -half * 0.55, s, half * 1.1, half * 0.35);
    ctx.fill();
    if (form === 'cooked') {
      ctx.strokeStyle = '#3f2214';
      ctx.lineWidth = Math.max(2, s * 0.06);
      for (const dx of [-0.45, 0, 0.45]) {
        ctx.beginPath();
        ctx.moveTo(dx * half, -half * 0.4);
        ctx.lineTo(dx * half, half * 0.4);
        ctx.stroke();
      }
    }
    if (form === 'burnt') {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(-half * 0.3, -half * 0.2, half * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'tomato') {
    if (form === 'chopped') {
      ctx.fillStyle = '#e5534b';
      for (const dx of [-0.45, 0.15]) {
        ctx.beginPath();
        ctx.arc(dx * half, 0, half * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f2827a';
        ctx.beginPath();
        ctx.arc(dx * half, 0, half * 0.24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e5534b';
      }
    } else {
      ctx.fillStyle = '#e5534b';
      ctx.beginPath();
      ctx.arc(0, half * 0.08, half * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3f7a2e';
      for (const angle of [0, 1.1, 2.2, 3.3, 4.4, 5.5]) {
        ctx.beginPath();
        ctx.ellipse(Math.cos(angle) * half * 0.3, -half * 0.75 + Math.sin(angle) * half * 0.12, half * 0.3, half * 0.12, angle, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (id === 'lettuce') {
    if (form === 'chopped') {
      ctx.strokeStyle = '#7bc950';
      ctx.lineWidth = Math.max(3, s * 0.12);
      ctx.lineCap = 'round';
      for (const dy of [-0.35, 0, 0.35]) {
        ctx.beginPath();
        ctx.moveTo(-half * 0.8, dy * half);
        ctx.quadraticCurveTo(0, dy * half - half * 0.25, half * 0.8, dy * half);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#7bc950';
      ctx.beginPath();
      ctx.ellipse(0, 0, half * 0.95, half * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5da83a';
      ctx.beginPath();
      ctx.ellipse(-half * 0.3, -half * 0.2, half * 0.5, half * 0.35, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a8e088';
      ctx.lineWidth = Math.max(2, s * 0.05);
      ctx.beginPath();
      ctx.moveTo(0, -half * 0.6);
      ctx.lineTo(0, half * 0.6);
      ctx.stroke();
    }
  } else if (id === 'cheese') {
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.moveTo(-half * 0.9, half * 0.6);
    ctx.lineTo(half * 0.9, half * 0.6);
    ctx.lineTo(half * 0.9, -half * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d8a920';
    for (const [dx, dy] of [[-0.4, 0.25], [0.25, 0.05], [0.55, 0.35]]) {
      ctx.beginPath();
      ctx.arc(dx * half, dy * half, half * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'onion') {
    if (form === 'chopped') {
      ctx.strokeStyle = '#c9a0e0';
      ctx.lineWidth = Math.max(3, s * 0.1);
      for (const r of [0.85, 0.55, 0.28]) {
        ctx.beginPath();
        ctx.arc(0, 0, half * r, 0.3, Math.PI * 2 - 0.3);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#e8d5f5';
      ctx.beginPath();
      ctx.arc(0, half * 0.1, half * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a87fc9';
      ctx.lineWidth = Math.max(2, s * 0.05);
      for (const r of [0.62, 0.4, 0.2]) {
        ctx.beginPath();
        ctx.arc(0, half * 0.1, half * r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#7bc950';
      ctx.beginPath();
      ctx.moveTo(-half * 0.15, -half * 0.7);
      ctx.quadraticCurveTo(0, -half * 1.25, half * 0.2, -half * 0.75);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawKitchen(ctx, world) {
  // Wall tiles and a sunset window.
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(0, 0, FIELD.width, 156);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let x = 0; x < FIELD.width; x += 64) ctx.fillRect(x, 0, 2, 156);
  for (let y = 0; y < 156; y += 52) ctx.fillRect(0, y, FIELD.width, 2);
  ctx.fillStyle = '#1d130c';
  roundRect(ctx, 1064, 14, 200, 120, 10);
  ctx.fill();
  const sunset = ctx.createLinearGradient(0, 22, 0, 126);
  sunset.addColorStop(0, '#ff9a3d');
  sunset.addColorStop(0.6, '#ff6b4a');
  sunset.addColorStop(1, '#7a2e4d');
  ctx.fillStyle = sunset;
  roundRect(ctx, 1072, 22, 184, 104, 6);
  ctx.fill();
  ctx.fillStyle = '#ffd98a';
  ctx.beginPath();
  ctx.arc(1150, 96, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1d130c';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(1164, 22);
  ctx.lineTo(1164, 126);
  ctx.moveTo(1072, 74);
  ctx.lineTo(1256, 74);
  ctx.stroke();
  // Hanging pans.
  ctx.strokeStyle = '#2b1d12';
  ctx.lineWidth = 4;
  for (const x of [620, 690, 760]) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 26);
    ctx.stroke();
    ctx.fillStyle = '#3a3a40';
    ctx.beginPath();
    ctx.arc(x, 44, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#55555e';
    ctx.beginPath();
    ctx.arc(x, 44, 13, 0, Math.PI * 2);
    ctx.fill();
  }
  // Floor and the long wooden counter.
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 156, FIELD.width, 324);
  ctx.fillStyle = PALETTE.counterEdge;
  roundRect(ctx, 8, 156, 1264, 316, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterTop;
  roundRect(ctx, 8, 156, 1264, 18, 8);
  ctx.fill();
}

function drawHud(ctx, world, paused) {
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(0, 0, FIELD.width, HUD.h);
  ctx.fillStyle = PALETTE.panelEdge;
  ctx.fillRect(0, HUD.h - 3, FIELD.width, 3);
  text(ctx, 'EMBER KITCHEN', 16, 32, 26, PALETTE.accent, 800);
  text(ctx, 'Sizzle & Serve', 244, 32, 13, PALETTE.muted, 600);
  text(ctx, `SCORE ${world.score}`, 420, 31, 20, PALETTE.cream, 800);
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(560, 24, 10, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, `${world.coins}`, 575, 31, 20, PALETTE.gold, 800);
  if (world.combo >= 2) {
    text(ctx, `COMBO x${world.combo}`, 640, 31, 20, '#ffb03a', 800);
  }
  text(ctx, `LEVEL ${world.level}`, 800, 31, 18, PALETTE.green, 800);
  const minutes = Math.floor(world.shiftLeft / 60);
  const seconds = Math.floor(world.shiftLeft % 60);
  const timeText = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const urgent = world.shiftLeft <= 30 && world.screen === SCREEN_PLAY;
  text(ctx, `SHIFT ${timeText}`, 900, 31, 20, urgent ? PALETTE.red : PALETTE.cream, 800);
  const barW = 90;
  ctx.fillStyle = '#1d130c';
  roundRect(ctx, 900, 38, barW, 5, 2);
  ctx.fill();
  ctx.fillStyle = urgent ? PALETTE.red : PALETTE.accent;
  roundRect(ctx, 900, 38, barW * Math.max(0, world.shiftLeft / 150), 5, 2);
  ctx.fill();
  for (let i = 0; i < 3; i += 1) {
    const x = 1010 + i * 26;
    ctx.fillStyle = i < world.hearts ? PALETTE.red : '#4a2c22';
    ctx.beginPath();
    ctx.arc(x, 20, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 8, 20);
    ctx.lineTo(x, 32);
    ctx.lineTo(x + 8, 20);
    ctx.closePath();
    ctx.fill();
  }
  text(ctx, `BEST ${world.best}`, 1010, 44, 11, PALETTE.muted, 600);
  ctx.fillStyle = world.muted ? '#57402c' : PALETTE.steel;
  roundRect(ctx, MUTE_BUTTON.x, MUTE_BUTTON.y, MUTE_BUTTON.w, MUTE_BUTTON.h, 6);
  ctx.fill();
  text(ctx, world.muted ? 'MUTE' : 'SOUND', MUTE_BUTTON.x + 28, 29, 11, PALETTE.ink, 800, 'center');
  ctx.fillStyle = paused ? PALETTE.accent : PALETTE.steel;
  roundRect(ctx, PAUSE_BUTTON.x, PAUSE_BUTTON.y, PAUSE_BUTTON.w, PAUSE_BUTTON.h, 6);
  ctx.fill();
  text(ctx, paused ? 'PLAY' : 'PAUSE', PAUSE_BUTTON.x + 28, 29, 11, PALETTE.ink, 800, 'center');
}

function drawOrders(ctx, world) {
  text(ctx, 'ORDER BOARD', ORDERS.x, ORDERS.y - 8, 13, PALETTE.cream, 800);
  for (let i = 0; i < world.orders.length; i += 1) {
    const order = world.orders[i];
    const rect = ticketRect(i);
    ctx.fillStyle = PALETTE.ticket;
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.fillStyle = '#e5534b';
    roundRect(ctx, rect.x, rect.y, rect.w, 24, 8);
    ctx.fill();
    ctx.fillRect(rect.x, rect.y + 16, rect.w, 8);
    text(ctx, order.recipe.name.toUpperCase(), rect.x + 10, rect.y + 17, 14, '#fff6dd', 800);
    text(ctx, `$${order.recipe.price}`, rect.x + rect.w - 10, rect.y + 17, 14, '#ffe9a8', 800, 'right');
    let iconX = rect.x + 24;
    for (const [id, count] of Object.entries(order.recipe.needs)) {
      for (let n = 0; n < count; n += 1) {
        drawIngredient(ctx, id, id === 'patty' ? 'cooked' : id === 'tomato' || id === 'lettuce' || id === 'onion' ? 'chopped' : 'ready', iconX, rect.y + 50, 30);
        iconX += 36;
      }
    }
    const ratio = Math.max(0, order.left / order.total);
    ctx.fillStyle = '#e8dcc0';
    roundRect(ctx, rect.x + 10, rect.y + rect.h - 14, rect.w - 20, 8, 4);
    ctx.fill();
    ctx.fillStyle = ratio > 0.5 ? '#7bc950' : ratio > 0.25 ? '#f2c94c' : '#e5534b';
    roundRect(ctx, rect.x + 10, rect.y + rect.h - 14, (rect.w - 20) * ratio, 8, 4);
    ctx.fill();
    text(ctx, `${Math.ceil(order.left)}s`, rect.x + rect.w - 10, rect.y + rect.h - 18, 12, ratio > 0.25 ? '#7a6a4a' : '#e5534b', 800, 'right');
  }
  for (let i = world.orders.length; i < 3; i += 1) {
    const rect = ticketRect(i);
    ctx.strokeStyle = 'rgba(255,243,214,0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'WAITING…', rect.x + rect.w / 2, rect.y + rect.h / 2 + 5, 14, 'rgba(255,243,214,0.5)', 700, 'center');
  }
}

function drawBins(ctx, world) {
  text(ctx, 'INGREDIENTS  ·  click or press 1-6', BINS.x, BINS.y - 8, 13, PALETTE.cream, 800);
  for (let i = 0; i < BIN_ORDER.length; i += 1) {
    const id = BIN_ORDER[i];
    const rect = binRect(i);
    const held = world.held && world.held.id === id;
    ctx.fillStyle = held ? '#57402c' : PALETTE.steel;
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.fillStyle = '#2b1d12';
    roundRect(ctx, rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8, 6);
    ctx.fill();
    drawIngredient(ctx, id, id === 'patty' ? 'raw' : 'ready', rect.x + rect.w / 2, rect.y + 30, 40);
    text(ctx, INGREDIENTS[id].name.toUpperCase(), rect.x + rect.w / 2, rect.y + rect.h - 8, 11, PALETTE.cream, 700, 'center');
    ctx.fillStyle = PALETTE.accent;
    ctx.beginPath();
    ctx.arc(rect.x + rect.w - 12, rect.y + 12, 9, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, INGREDIENTS[id].key, rect.x + rect.w - 12, rect.y + 16, 11, PALETTE.ink, 800, 'center');
  }
}

function drawBoard(ctx, world) {
  text(ctx, 'CHOPPING BOARD  ·  click to chop', BOARD.x, BOARD.y - 8, 13, PALETTE.cream, 800);
  ctx.fillStyle = PALETTE.boardEdge;
  roundRect(ctx, BOARD.x, BOARD.y, BOARD.w, BOARD.h, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.board;
  roundRect(ctx, BOARD.x + 6, BOARD.y + 6, BOARD.w - 12, BOARD.h - 12, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 2;
  for (let x = BOARD.x + 40; x < BOARD.x + BOARD.w; x += 44) {
    ctx.beginPath();
    ctx.moveTo(x, BOARD.y + 10);
    ctx.lineTo(x, BOARD.y + BOARD.h - 10);
    ctx.stroke();
  }
  const item = world.board;
  if (item) {
    const form = item.chops >= CHOPS_NEEDED ? 'chopped' : 'whole';
    drawIngredient(ctx, item.id, form, BOARD.x + BOARD.w / 2, BOARD.y + 78, 84);
    const done = Math.min(CHOPS_NEEDED, item.chops);
    for (let i = 0; i < CHOPS_NEEDED; i += 1) {
      ctx.fillStyle = i < done ? PALETTE.green : '#c9a582';
      ctx.beginPath();
      ctx.arc(BOARD.x + BOARD.w / 2 - 30 + i * 30, BOARD.y + BOARD.h - 22, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    text(ctx, done >= CHOPS_NEEDED ? 'CHOPPED — click to take' : `CHOP ${done}/${CHOPS_NEEDED}`, BOARD.x + BOARD.w / 2, BOARD.y + BOARD.h - 34, 13, PALETTE.ink, 800, 'center');
  } else {
    text(ctx, 'Drop a tomato, lettuce', BOARD.x + BOARD.w / 2, BOARD.y + 66, 14, '#8a6a45', 700, 'center');
    text(ctx, 'or onion here', BOARD.x + BOARD.w / 2, BOARD.y + 86, 14, '#8a6a45', 700, 'center');
  }
}

function drawGrill(ctx, world) {
  text(ctx, 'GRILL  ·  patties cook, then burn!', GRILL.x, GRILL.y - 8, 13, PALETTE.cream, 800);
  ctx.fillStyle = PALETTE.grill;
  roundRect(ctx, GRILL.x, GRILL.y, GRILL.w, GRILL.h, 10);
  ctx.fill();
  for (let slot = 0; slot < 2; slot += 1) {
    const rect = grillSlotRect(slot);
    const item = world.grill[slot];
    ctx.fillStyle = '#1c1714';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#4a4038';
    ctx.lineWidth = 3;
    for (let i = 1; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(rect.x + 8, rect.y + (rect.h / 4) * i);
      ctx.lineTo(rect.x + rect.w - 8, rect.y + (rect.h / 4) * i);
      ctx.stroke();
    }
    if (item) {
      const flicker = 0.75 + 0.25 * Math.sin(world.time * 9 + slot * 2);
      if (item.stage === 'cooking') {
        ctx.fillStyle = `rgba(226,88,34,${0.35 * flicker})`;
        roundRect(ctx, rect.x + 6, rect.y + rect.h - 26, rect.w - 12, 18, 6);
        ctx.fill();
      }
      drawIngredient(ctx, 'patty', item.stage === 'burnt' ? 'burnt' : item.stage === 'cooked' ? 'cooked' : 'raw', rect.x + rect.w / 2, rect.y + 44, 64);
      const total = item.stage === 'cooking' ? GRILL_COOK : GRILL_BURN;
      const left = item.stage === 'cooking' ? item.t : item.t;
      const ratio = item.stage === 'burnt' ? 1 : Math.min(1, left / total);
      ctx.fillStyle = '#3a2c22';
      roundRect(ctx, rect.x + 10, rect.y + rect.h - 16, rect.w - 20, 8, 4);
      ctx.fill();
      ctx.fillStyle = item.stage === 'burnt' ? '#e5534b' : item.stage === 'cooked' ? '#f2c94c' : '#e25822';
      roundRect(ctx, rect.x + 10, rect.y + rect.h - 16, (rect.w - 20) * ratio, 8, 4);
      ctx.fill();
      text(ctx, item.stage === 'burnt' ? 'BURNT!' : item.stage === 'cooked' ? 'READY — take it!' : 'COOKING…', rect.x + rect.w / 2, rect.y + rect.h - 22, 11, '#fff3d6', 800, 'center');
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      roundRect(ctx, rect.x + 18, rect.y + rect.h / 2 - 12, rect.w - 36, 24, 6);
      ctx.fill();
      text(ctx, 'empty slot', rect.x + rect.w / 2, rect.y + rect.h / 2 + 4, 12, '#a89a88', 700, 'center');
    }
  }
}

function drawPlate(ctx, world) {
  text(ctx, 'YOUR PLATE  ·  click to add', PLATE.x, PLATE.y - 8, 13, PALETTE.cream, 800);
  ctx.fillStyle = '#241a14';
  roundRect(ctx, PLATE.x, PLATE.y, PLATE.w, PLATE.h, 10);
  ctx.fill();
  const cx = PLATE.x + PLATE.w / 2;
  const cy = PLATE.y + 150;
  ctx.fillStyle = '#e8e4da';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 118, 52, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c8c4ba';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 92, 38, 0, 0, Math.PI * 2);
  ctx.fill();
  // The dish, stacked bottom-up, each layer peeking out sideways.
  let layerY = cy - 6;
  let layer = 0;
  for (const id of world.plate) {
    const dx = layer % 2 === 0 ? -12 : 12;
    if (id === 'bun') {
      drawIngredient(ctx, 'bun', 'ready', cx + dx, layerY - 8, 84);
      layerY -= 16;
    } else {
      drawIngredient(ctx, id, id === 'patty' ? 'cooked' : id === 'tomato' || id === 'lettuce' || id === 'onion' ? 'chopped' : 'ready', cx + dx, layerY - 6, 76);
      layerY -= 14;
    }
    layer += 1;
  }
  if (world.plate.length === 0) {
    text(ctx, 'Build a dish here', cx, cy - 4, 14, '#8a7a68', 700, 'center');
  }
  // The recipe the plate is closest to, as a hint.
  let hint = '';
  if (world.plate.length > 0) {
    const counts = {};
    for (const id of world.plate) counts[id] = (counts[id] || 0) + 1;
    for (const order of world.orders) {
      const needs = order.recipe.needs;
      const ok = Object.keys(counts).every((id) => (counts[id] || 0) <= (needs[id] || 0));
      const missing = Object.keys(needs).filter((id) => (counts[id] || 0) < needs[id]);
      if (ok && missing.length > 0) {
        hint = `Needs: ${missing.map((id) => INGREDIENTS[id].name).join(' + ')}`;
        break;
      }
      if (ok && missing.length === 0) {
        hint = `Matches ${order.recipe.name} — RING THE BELL!`;
        break;
      }
    }
  }
  if (hint) text(ctx, hint, cx, PLATE.y + PLATE.h - 12, 13, hint.includes('Matches') ? '#7bc950' : '#c9a582', 800, 'center');
}

function drawServe(ctx, world) {
  text(ctx, 'SERVE  ·  ring the bell', SERVE.x, SERVE.y - 8, 13, PALETTE.cream, 800);
  ctx.fillStyle = '#241a14';
  roundRect(ctx, SERVE.x, SERVE.y, SERVE.w, SERVE.h, 10);
  ctx.fill();
  const ready = world.plate.length > 0 && world.orders.some((order) => {
    const counts = {};
    for (const id of world.plate) counts[id] = (counts[id] || 0) + 1;
    return Object.keys(order.recipe.needs).every((id) => counts[id] === order.recipe.needs[id])
      && Object.keys(counts).every((id) => order.recipe.needs[id]);
  });
  const pulse = ready ? 0.8 + 0.2 * Math.sin(world.time * 6) : 1;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = ready ? PALETTE.gold : PALETTE.steel;
  ctx.beginPath();
  ctx.arc(BELL.x + BELL.w / 2, BELL.y + 46, 44, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(BELL.x + BELL.w / 2 - 44, BELL.y + 46, 88, 10);
  ctx.fillStyle = '#2b1d12';
  ctx.beginPath();
  ctx.arc(BELL.x + BELL.w / 2, BELL.y + 46, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#57402c';
  roundRect(ctx, BELL.x + 8, BELL.y + 66, BELL.w - 16, 10, 4);
  ctx.fill();
  text(ctx, ready ? 'READY TO SERVE!' : 'RING WHEN THE DISH MATCHES', BELL.x + BELL.w / 2, BELL.y + 96, 13, ready ? PALETTE.gold : '#c9a582', 800, 'center');
  // Trash can.
  ctx.fillStyle = '#5a5148';
  roundRect(ctx, TRASH.x, TRASH.y, TRASH.w, TRASH.h, 8);
  ctx.fill();
  ctx.fillStyle = '#3a332c';
  roundRect(ctx, TRASH.x + 8, TRASH.y - 8, TRASH.w - 16, 12, 5);
  ctx.fill();
  ctx.strokeStyle = '#2b2620';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(TRASH.x + 28 + i * 20, TRASH.y + 20);
    ctx.lineTo(TRASH.x + 28 + i * 20, TRASH.y + TRASH.h - 16);
    ctx.stroke();
  }
  text(ctx, 'TRASH', TRASH.x + TRASH.w / 2, TRASH.y + TRASH.h + 16, 12, '#c9a582', 800, 'center');
  text(ctx, 'Served today', SERVE.x + 16, SERVE.y + 210, 13, '#c9a582', 700);
  text(ctx, `${world.stats.served} dishes   ·   ${world.stats.missed} lost   ·   ${world.stats.wasted} wasted`, SERVE.x + 16, SERVE.y + 230, 13, PALETTE.cream, 700);
}

function drawHeld(ctx, world) {
  if (!world.held || !mouse.inside) return;
  const { id, form } = world.held;
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, 30, 0, Math.PI * 2);
  ctx.fill();
  drawIngredient(ctx, id, form, mouse.x, mouse.y, 44);
  ctx.restore();
  text(ctx, INGREDIENTS[id].name, mouse.x, mouse.y + 44, 12, PALETTE.cream, 800, 'center');
}

function drawEffects(ctx, world) {
  for (const part of world.particles) {
    const base = anchor(part.place);
    const alpha = 1 - part.t / part.life;
    ctx.fillStyle = part.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(base.x + part.x, base.y + part.y, part.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const pop of world.popups) {
    const base = anchor(pop.place);
    const rise = pop.t * 34;
    const alpha = pop.t > pop.life - 0.4 ? Math.max(0, (pop.life - pop.t) / 0.4) : 1;
    ctx.globalAlpha = alpha;
    shadowedText(ctx, pop.text, base.x, base.y - rise, 22, pop.color, 'center');
  }
  ctx.globalAlpha = 1;
}

function drawHint(ctx) {
  text(ctx, 'CLICK bins, grill, board & plate  ·  1-6 grab  ·  SPACE serve  ·  T trash  ·  P pause  ·  M mute', HINT.x + HINT.w / 2, HINT.y + 28, 14, PALETTE.muted, 600, 'center');
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(20,12,8,0.82)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  shadowedText(ctx, title, FIELD.width / 2, 150, 54, accent, 'center');
  let y = 205;
  for (const line of lines) {
    text(ctx, line, FIELD.width / 2, y, 19, PALETTE.cream, 600, 'center');
    y += 30;
  }
}

function drawTitle(ctx, world) {
  overlay(ctx, 'EMBER KITCHEN', [
    'Sizzle & Serve — a one-chef race against the order board.',
    'Grab ingredients, grill the patties, chop the vegetables,',
    'build each dish exactly as ordered — and ring the bell before',
    'the ticket runs out. Three lost orders end your shift.',
    '',
    'CLICK or press ENTER to start your shift',
  ], PALETTE.accent);
  text(ctx, `BEST SCORE  ${world.best}`, FIELD.width / 2, 400, 16, PALETTE.gold, 800, 'center');
}

function drawOver(ctx, world) {
  const won = world.overReason === 'shift';
  const title = won ? 'SHIFT COMPLETE!' : 'SHIFT OVER';
  const lines = won
    ? [
        `You served ${world.stats.served} dishes and earned ${world.score} points.`,
        `Best combo x${world.bestCombo}  ·  ${world.coins} coins earned  ·  ${world.stats.missed} orders lost.`,
        world.score >= world.best && world.score > 0 ? 'A NEW BEST SCORE!' : `Best score: ${world.best}`,
        '',
        'CLICK or press ENTER to work another shift',
      ]
    : [
        'Three orders went unserved and the customers walked out.',
        `You served ${world.stats.served} dishes and earned ${world.score} points.`,
        `Best combo x${world.bestCombo}  ·  ${world.coins} coins earned.`,
        '',
        'CLICK or press ENTER to try again',
      ];
  overlay(ctx, title, lines, won ? PALETTE.gold : PALETTE.red);
}

/** Draw one frame of the game. */
export function render(ctx, world, paused) {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  drawKitchen(ctx, world);
  drawHud(ctx, world, paused);
  drawOrders(ctx, world);
  drawBins(ctx, world);
  drawBoard(ctx, world);
  drawGrill(ctx, world);
  drawPlate(ctx, world);
  drawServe(ctx, world);
  drawEffects(ctx, world);
  drawHint(ctx);
  drawHeld(ctx, world);
  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world);
  if (world.screen === SCREEN_OVER) drawOver(ctx, world);
  if (paused && world.screen === SCREEN_PLAY) {
    overlay(ctx, 'PAUSED', ['Take a breath. The grill is holding.', '', 'Press P or click PAUSE to keep cooking'], PALETTE.cream);
  }
}
