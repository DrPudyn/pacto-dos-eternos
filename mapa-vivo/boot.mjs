/* Mapa vivo — tela cheia, câmera e HUD.
   Monte com mountLivingMap(elemento, {party, onClose}).
   O ouro e os abates desta tela ficam só na sessão: não alteram save, loja nem baú. */

import {describeWorld, createWorld, stepWorld} from './world.mjs';
import {createRenderer} from './render.mjs';
import {loadSprites} from './sprites.mjs';

const MODE = {march: 'avançando', chase: 'caçando', attack: 'atacando', idle: 'em guarda'};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function mountLivingMap(parent, options = {}) {
  const root = el('section', 'mapa-vivo');
  root.setAttribute('aria-label', 'Mapa vivo');
  // O clique abre o mapa antes da folha de estilo terminar. Sem isto a seção
  // nasce no fluxo da página e o canvas fica numa faixa.
  root.style.position = 'fixed';
  root.style.inset = '0';
  root.style.zIndex = '2147483000';
  root.style.background = '#10241c';
  root.style.overflow = 'hidden';
  const canvas = el('canvas', 'view');
  canvas.setAttribute('aria-label', 'Heróis avançando pelo mapa. A câmera segue o grupo.');
  const hud = el('div', 'mapa-hud');
  const top = el('div', 'mapa-top');
  const mini = el('canvas', 'mapa-mini');
  mini.width = 168;
  mini.height = 108;
  const stats = el('div', 'mapa-stats');
  const title = el('strong', '', 'MAPA VIVO');
  const place = el('span', 'mapa-place', 'Floresta');
  const detail = el('span', '', '0 abates');
  stats.append(title, place, detail);
  const party = el('div', 'mapa-party');
  top.append(mini, party, stats);
  const bottom = el('div', 'mapa-bottom');
  const hint = el('p', 'mapa-hint', 'Os heróis andam sozinhos, limpam a área e seguem para a direita.');
  const pause = el('button', '', 'PAUSAR');
  pause.type = 'button';
  const restart = el('button', '', 'REINICIAR');
  restart.type = 'button';
  bottom.append(hint, pause, restart);
  if (options.onClose) {
    const close = el('button', 'mapa-close', 'FECHAR');
    close.type = 'button';
    close.onclick = () => api.destroy();
    bottom.append(close);
  }
  hud.append(top, bottom);
  root.append(canvas, hud);
  parent.append(root);

  const ctx = canvas.getContext('2d');
  const mx = mini.getContext('2d');
  const sprites = loadSprites(import.meta.url);
  const renderer = createRenderer(sprites);
  let world = createWorld({seed: options.seed ?? 20261108, party: options.party, view: {w: 960, h: 540}});
  let raf = 0;
  let last = performance.now();
  let stopped = false;

  const params = new URLSearchParams(window.location.search);
  const mockup = params.get('mockup') === '1';
  if (params.get('limpo') === '1') hud.style.display = 'none';

  function resize() {
    const rect = root.getBoundingClientRect();
    // 2× inteiro: o bitmap fica na resolução nativa e o CSS amplia sem filtrar.
    const cssW = Math.max(320, Math.floor(rect.width / 2) * 2);
    const cssH = Math.max(240, Math.floor(rect.height / 2) * 2);
    canvas.width = cssW / 2;
    canvas.height = cssH / 2;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    world.camera.setView(canvas.width, canvas.height);
    if (mockup) {
      world.camera.x = 0;
      world.camera.y = 0;
      world.snapCamera = false;
      world.paused = true;
    }
  }

  function paintHud() {
    const info = describeWorld(world);
    place.textContent = info.biome;
    detail.textContent = info.kills + ' abates · ' + info.gold + ' ouro da trilha';
    party.replaceChildren(...world.heroes.map(hero => {
      const card = el('div', 'mapa-card');
      card.append(el('b', '', hero.name), el('small', '', MODE[hero.mode] ?? hero.mode));
      return card;
    }));
    hint.textContent = world.interior
      ? 'Dentro da casa. Eles eliminam quem estiver na sala e saem pela porta.'
      : 'Os heróis andam sozinhos, limpam a área e seguem para a direita. A câmera acompanha.';
    renderer.minimap(mx, world, mini.width, mini.height);
  }

  function frame(now) {
    if (stopped) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    stepWorld(world, dt);
    renderer.draw(ctx, world, world.camera.view);
    paintHud();
  }

  pause.onclick = () => {
    world.paused = !world.paused;
    pause.textContent = world.paused ? 'RETOMAR' : 'PAUSAR';
  };
  restart.onclick = () => {
    const view = {...world.camera.view};
    world = createWorld({seed: (options.seed ?? 20261108) + Math.floor(performance.now()) % 997, party: options.party, view});
    pause.textContent = 'PAUSAR';
  };
  const onResize = () => resize();
  window.addEventListener('resize', onResize);
  resize();
  // O overlay entra antes do layout assentar. Um frame depois a seção já ocupa a tela.
  requestAnimationFrame(() => resize());
  // ?t=12 adianta a simulação para revisar um instante. Sem o parâmetro, o mapa corre em tempo real.
  const seek = Number(params.get('t') || 0);
  if (!mockup && seek > 0) {
    const steps = Math.round(Math.min(90, seek) * 60);
    for (let i = 0; i < steps; i++) stepWorld(world, 1 / 60);
    world.snapCamera = true;
  }
  raf = requestAnimationFrame(frame);
  window.__mapaMundo = () => world;
  window.__mapaPronto = sprites.ready.then(() => {
    renderer.draw(ctx, world, world.camera.view);
    return true;
  });

  const api = {
    destroy() {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      root.remove();
      options.onClose?.();
    },
    world: () => world
  };
  return api;
}
