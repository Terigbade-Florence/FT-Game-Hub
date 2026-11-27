/** Short confetti burst. Skipped when the user prefers reduced motion. */
export function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = Object.assign(document.createElement("canvas"), { className: "fx", width: innerWidth, height: innerHeight });
  document.body.append(canvas);
  const g = canvas.getContext("2d");
  const colors = ["#ff7a1a", "#12c28b", "#ff4f9a", "#3b4bff", "#ffd23f"];
  const bits = Array.from({ length: 90 }, () => ({
    x: innerWidth / 2, y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 12 - 3,
    size: 5 + Math.random() * 6, spin: Math.random() * 6, color: colors[Math.floor(Math.random() * colors.length)],
  }));
  let frame = 0;
  (function tick() {
    g.clearRect(0, 0, canvas.width, canvas.height);
    for (const b of bits) {
      b.vy += 0.35; b.x += b.vx; b.y += b.vy; b.spin += 0.2;
      g.save(); g.translate(b.x, b.y); g.rotate(b.spin);
      g.fillStyle = b.color; g.fillRect(-b.size / 2, -b.size / 3, b.size, b.size * 0.6); g.restore();
    }
    if (++frame < 110) requestAnimationFrame(tick); else canvas.remove();
  })();
}

export function toast(text) {
  const el = Object.assign(document.createElement("div"), { className: "toast", textContent: text });
  el.setAttribute("role", "status");
  document.body.append(el);
  setTimeout(() => el.remove(), 2200);
}
