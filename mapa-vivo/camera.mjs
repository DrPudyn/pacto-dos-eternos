// CameraController — segue o centro do grupo com lerp.
// O cenário é desenhado em (pixel - câmera), então anda no sentido oposto ao dos heróis.

import {clamp} from './constantes.mjs';

export class CameraController {
  constructor(view = {w: 960, h: 540}) {
    this.x = 0;
    this.y = 0;
    this.view = view;
    this.stiffness = 5.5;
  }

  setView(w, h) {
    this.view.w = w;
    this.view.h = h;
  }

  desired(focusX, focusY, bounds) {
    let x = focusX - this.view.w / 2;
    let y = focusY - this.view.h / 2;
    if (!bounds) return {x, y};
    // O grupo fica no centro. O mapa menor que a tela (uma casa, por exemplo)
    // é que se centraliza; no continente a borda pode sair da tela.
    if (bounds.w <= this.view.w) x = bounds.x - (this.view.w - bounds.w) / 2;
    else x = clamp(x, bounds.x - this.view.w * 0.35, bounds.x + bounds.w - this.view.w * 0.65);
    if (bounds.h <= this.view.h) y = bounds.y - (this.view.h - bounds.h) / 2;
    else y = clamp(y, bounds.y - this.view.h * 0.25, bounds.y + bounds.h - this.view.h * 0.75);
    return {x, y};
  }

  // Um frame não chega no alvo. k cresce com o dt e nunca passa de 1.
  follow(focusX, focusY, dt, bounds) {
    const target = this.desired(focusX, focusY, bounds);
    const k = 1 - Math.exp(-this.stiffness * Math.max(0, dt));
    this.x += (target.x - this.x) * k;
    this.y += (target.y - this.y) * k;
    return this;
  }

  snap(focusX, focusY, bounds) {
    const target = this.desired(focusX, focusY, bounds);
    this.x = target.x;
    this.y = target.y;
    return this;
  }
}
