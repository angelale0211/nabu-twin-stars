/* ============================ sounds ============================
   Small synthesised sounds (no audio files): soft, bell-like, never harsh. */
const SFX = (function () {
  let ctx = null;
  function ac() {
    if (!S.sound) return null;
    try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; } catch (e) { return null; }
  }
  function tone(freq, dur, type, vol, when, slide) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, c.currentTime + (when || 0));
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, c.currentTime + (when || 0) + dur);
    g.gain.setValueAtTime(0.0001, c.currentTime + (when || 0));
    g.gain.exponentialRampToValueAtTime(vol || 0.15, c.currentTime + (when || 0) + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + (when || 0) + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + (when || 0)); o.stop(c.currentTime + (when || 0) + dur + 0.05);
  }
  return {
    tap() { tone(660, 0.06, 'triangle', 0.08); },
    found() { tone(784, 0.18, 'sine', 0.16); tone(1175, 0.28, 'sine', 0.14, 0.09); },
    miss() { tone(220, 0.18, 'triangle', 0.1, 0, 160); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 'sine', 0.14, i * 0.11)); tone(1319, 0.6, 'sine', 0.12, 0.45); },
    fail() { tone(392, 0.3, 'sine', 0.12); tone(330, 0.45, 'sine', 0.12, 0.25); },
    coin() { tone(1319, 0.08, 'square', 0.05); tone(1760, 0.14, 'square', 0.05, 0.07); },
    tick() { tone(1200, 0.03, 'square', 0.03); },
    chime() { [880, 1108, 1319].forEach((f, i) => tone(f, 0.3, 'sine', 0.1, i * 0.08)); },
    swoosh() { tone(300, 0.25, 'sine', 0.06, 0, 900); }
  };
})();
