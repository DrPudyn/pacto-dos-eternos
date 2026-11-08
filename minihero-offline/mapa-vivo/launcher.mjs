// Abre o mapa vivo por cima do jogo, sem sair da conta e sem gravar progresso.
import {mountLivingMap} from './boot.mjs';

function partyFromGame() {
  try {
    const list = globalThis.mhDescribeParty?.();
    return Array.isArray(list) && list.length ? list : null;
  } catch {
    return null;
  }
}

function ensureStyle() {
  const current = document.querySelector('link[data-mapa-vivo]');
  if (current?.sheet) return Promise.resolve();
  if (current) {
    return new Promise(resolve => {
      current.addEventListener('load', () => resolve(), {once: true});
      current.addEventListener('error', () => resolve(), {once: true});
    });
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./mapa-vivo.css', import.meta.url).href;
  link.dataset.mapaVivo = '1';
  const ready = new Promise(resolve => {
    link.addEventListener('load', () => resolve(), {once: true});
    link.addEventListener('error', () => resolve(), {once: true});
  });
  document.head.append(link);
  return ready;
}

async function openOverlay() {
  if (document.querySelector('.mapa-vivo')) return;
  await ensureStyle();
  mountLivingMap(document.body, {party: partyFromGame(), onClose() {}});
}

function bind() {
  if (document.body?.dataset.mapaVivo === '1') return;
  const link = document.querySelector('.farm-preview-link');
  if (!link || link.dataset.mapaVivo === '1') return;
  link.dataset.mapaVivo = '1';
  link.textContent = 'MAPA VIVO';
  link.href = './mapa-vivo.html';
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openOverlay();
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
else bind();
