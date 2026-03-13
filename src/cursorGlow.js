export default function cursorGlow(userOptions = {}) {
  const defaults = {
    colorA: "#7df9ff",
    colorB: "#8b5cf6",
    glowSize: 110,
    ringSize: 28,
    ringWidth: 1.2,
    trailCount: 14,
    trailSize: 4,
    easing: 0.16,
    trailEasing: 0.28,
    glowOpacity: 0.22,
    trailOpacity: 0.7,
    blur: 28,
    hoverScale: 1.9,
    magneticStrength: 0.18,
    clickPulseScale: 0.72,
    clickPulseDuration: 260,
    zIndex: 9999,
    interactiveSelectors:
      "a, button, [role='button'], input, textarea, select, summary, .cursor-hover",
    hideNativeCursor: false,
    adaptivePerformance: true,
    maxDpr: 2,
  };

  const options = { ...defaults, ...userOptions };

  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      destroy() {},
      pause() {},
      resume() {},
    };
  }

  const state = {
    mouseX: window.innerWidth / 2,
    mouseY: window.innerHeight / 2,
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    lastMouseX: window.innerWidth / 2,
    lastMouseY: window.innerHeight / 2,
    velocityX: 0,
    velocityY: 0,
    speed: 0,
    isHovering: false,
    hoveredEl: null,
    isPaused: false,
    rafId: null,
    cleanupFns: [],
    cursorHiddenStyleEl: null,
  };

  const prefersReducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  )?.matches;

  const dpr = Math.min(window.devicePixelRatio || 1, options.maxDpr);

  let trailCount = options.trailCount;
  if (options.adaptivePerformance) {
    if (prefersReducedMotion) trailCount = 0;
    else if (dpr >= 2) trailCount = Math.max(8, Math.floor(trailCount * 0.8));
  }

  const root = document.createElement("div");
  root.setAttribute("data-cursor-glow-root", "true");

  Object.assign(root.style, {
    position: "fixed",
    inset: "0",
    pointerEvents: "none",
    zIndex: String(options.zIndex),
  });

  const glow = document.createElement("div");
  Object.assign(glow.style, {
    position: "fixed",
    left: "0px",
    top: "0px",
    width: `${options.glowSize}px`,
    height: `${options.glowSize}px`,
    borderRadius: "50%",
    pointerEvents: "none",
    transform: "translate3d(-50%, -50%, 0)",
    opacity: String(options.glowOpacity),
    filter: `blur(${options.blur}px)`,
    willChange: "transform, opacity",
    background: `radial-gradient(circle, ${hexToRgba(
      options.colorA,
      0.95
    )} 0%, ${hexToRgba(options.colorB, 0.7)} 42%, ${hexToRgba(
      options.colorB,
      0.08
    )} 72%, transparent 100%)`,
    mixBlendMode: "screen",
  });

  const ring = document.createElement("div");
  Object.assign(ring.style, {
    position: "fixed",
    left: "0px",
    top: "0px",
    width: `${options.ringSize}px`,
    height: `${options.ringSize}px`,
    borderRadius: "50%",
    pointerEvents: "none",
    boxSizing: "border-box",
    border: `${options.ringWidth}px solid ${hexToRgba(options.colorA, 0.9)}`,
    boxShadow: `
      0 0 0 1px ${hexToRgba(options.colorB, 0.18)} inset,
      0 0 14px ${hexToRgba(options.colorA, 0.24)},
      0 0 30px ${hexToRgba(options.colorB, 0.16)}
    `,
    transform: "translate3d(-50%, -50%, 0) scale(1)",
    transition: "transform 180ms ease, width 180ms ease, height 180ms ease",
    willChange: "transform, left, top",
    backdropFilter: "blur(1.5px)",
  });

  const core = document.createElement("div");
  Object.assign(core.style, {
    position: "fixed",
    left: "0px",
    top: "0px",
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    pointerEvents: "none",
    transform: "translate3d(-50%, -50%, 0)",
    background: options.colorA,
    boxShadow: `
      0 0 10px ${hexToRgba(options.colorA, 0.9)},
      0 0 22px ${hexToRgba(options.colorB, 0.45)}
    `,
    opacity: "0.95",
    willChange: "transform, left, top",
  });

  root.appendChild(glow);
  root.appendChild(ring);
  root.appendChild(core);

  const particles = [];
  for (let i = 0; i < trailCount; i++) {
    const el = document.createElement("div");
    const size = Math.max(1.8, options.trailSize - i * 0.12);

    Object.assign(el.style, {
      position: "fixed",
      left: "0px",
      top: "0px",
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "50%",
      pointerEvents: "none",
      transform: "translate3d(-50%, -50%, 0)",
      opacity: String(Math.max(0.08, options.trailOpacity - i * 0.045)),
      background:
        i % 2 === 0
          ? hexToRgba(options.colorA, 0.95)
          : hexToRgba(options.colorB, 0.9),
      boxShadow: `0 0 ${8 + i * 0.2}px ${
        i % 2 === 0
          ? hexToRgba(options.colorA, 0.32)
          : hexToRgba(options.colorB, 0.28)
      }`,
      willChange: "transform, left, top, opacity",
    });

    root.appendChild(el);
    particles.push({
      el,
      x: state.x,
      y: state.y,
    });
  }

  document.body.appendChild(root);

  if (options.hideNativeCursor) {
    const styleEl = document.createElement("style");
    styleEl.textContent = `html, body, a, button, input, textarea, select { cursor: none !important; }`;
    document.head.appendChild(styleEl);
    state.cursorHiddenStyleEl = styleEl;
  }

  const onMouseMove = (e) => {
    state.mouseX = e.clientX;
    state.mouseY = e.clientY;
  };

  const onMouseDown = () => {
    pulseRing();
    pulseGlow();
  };

  const onMouseLeaveWindow = () => {
    glow.style.opacity = "0";
    ring.style.opacity = "0";
    core.style.opacity = "0";
    particles.forEach((p) => {
      p.el.style.opacity = "0";
    });
  };

  const onMouseEnterWindow = () => {
    glow.style.opacity = String(options.glowOpacity);
    ring.style.opacity = "1";
    core.style.opacity = "0.95";
    particles.forEach((p, i) => {
      p.el.style.opacity = String(
        Math.max(0.08, options.trailOpacity - i * 0.045)
      );
    });
  };

  window.addEventListener("mousemove", onMouseMove, { passive: true });
  window.addEventListener("mousedown", onMouseDown, { passive: true });
  window.addEventListener("mouseleave", onMouseLeaveWindow);
  window.addEventListener("mouseenter", onMouseEnterWindow);

  state.cleanupFns.push(() =>
    window.removeEventListener("mousemove", onMouseMove)
  );
  state.cleanupFns.push(() =>
    window.removeEventListener("mousedown", onMouseDown)
  );
  state.cleanupFns.push(() =>
    window.removeEventListener("mouseleave", onMouseLeaveWindow)
  );
  state.cleanupFns.push(() =>
    window.removeEventListener("mouseenter", onMouseEnterWindow)
  );

  bindHoverTargets();

  function bindHoverTargets() {
    const elements = document.querySelectorAll(options.interactiveSelectors);

    elements.forEach((el) => {
      const onEnter = () => {
        state.isHovering = true;
        state.hoveredEl = el;
        ring.style.transform = `translate3d(-50%, -50%, 0) scale(${options.hoverScale})`;
        ring.style.borderColor = hexToRgba(options.colorB, 0.95);
        glow.style.opacity = String(Math.min(0.38, options.glowOpacity + 0.08));
      };

      const onLeave = () => {
        state.isHovering = false;
        state.hoveredEl = null;
        ring.style.transform = `translate3d(-50%, -50%, 0) scale(1)`;
        ring.style.borderColor = hexToRgba(options.colorA, 0.9);
        glow.style.opacity = String(options.glowOpacity);
      };

      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);

      state.cleanupFns.push(() => el.removeEventListener("mouseenter", onEnter));
      state.cleanupFns.push(() => el.removeEventListener("mouseleave", onLeave));
    });
  }

  function pulseRing() {
    ring.animate(
      [
        {
          transform: state.isHovering
            ? `translate3d(-50%, -50%, 0) scale(${options.hoverScale})`
            : "translate3d(-50%, -50%, 0) scale(1)",
        },
        {
          transform: state.isHovering
            ? `translate3d(-50%, -50%, 0) scale(${
                options.hoverScale * options.clickPulseScale
              })`
            : `translate3d(-50%, -50%, 0) scale(${options.clickPulseScale})`,
        },
        {
          transform: state.isHovering
            ? `translate3d(-50%, -50%, 0) scale(${options.hoverScale})`
            : "translate3d(-50%, -50%, 0) scale(1)",
        },
      ],
      {
        duration: options.clickPulseDuration,
        easing: "cubic-bezier(.22,1,.36,1)",
      }
    );
  }

  function pulseGlow() {
    glow.animate(
      [
        { opacity: Math.min(0.42, options.glowOpacity + 0.08) },
        { opacity: Math.min(0.6, options.glowOpacity + 0.22) },
        { opacity: state.isHovering ? Math.min(0.38, options.glowOpacity + 0.08) : options.glowOpacity },
      ],
      {
        duration: options.clickPulseDuration + 60,
        easing: "ease-out",
      }
    );
  }

  function animate() {
    if (state.isPaused) return;

    state.velocityX = state.mouseX - state.lastMouseX;
    state.velocityY = state.mouseY - state.lastMouseY;
    state.speed = Math.min(
      30,
      Math.sqrt(state.velocityX * state.velocityX + state.velocityY * state.velocityY)
    );

    state.lastMouseX = state.mouseX;
    state.lastMouseY = state.mouseY;

    state.targetX = state.mouseX;
    state.targetY = state.mouseY;

    if (state.isHovering && state.hoveredEl) {
      const rect = state.hoveredEl.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      state.targetX =
        state.mouseX + (centerX - state.mouseX) * options.magneticStrength;
      state.targetY =
        state.mouseY + (centerY - state.mouseY) * options.magneticStrength;
    }

    state.x += (state.targetX - state.x) * options.easing;
    state.y += (state.targetY - state.y) * options.easing;

    glow.style.left = `${state.x}px`;
    glow.style.top = `${state.y}px`;

    ring.style.left = `${state.x}px`;
    ring.style.top = `${state.y}px`;

    core.style.left = `${state.x}px`;
    core.style.top = `${state.y}px`;

    const dynamicGlowScale = 1 + state.speed * 0.012;
    glow.style.transform = `translate3d(-50%, -50%, 0) scale(${dynamicGlowScale})`;

    const dynamicCoreScale = 1 + state.speed * 0.018;
    core.style.transform = `translate3d(-50%, -50%, 0) scale(${dynamicCoreScale})`;

    let tx = state.x;
    let ty = state.y;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const follow = Math.max(0.12, options.trailEasing - i * 0.008);

      p.x += (tx - p.x) * follow;
      p.y += (ty - p.y) * follow;

      p.el.style.left = `${p.x}px`;
      p.el.style.top = `${p.y}px`;

      const stretch = 1 + state.speed * 0.015;
      p.el.style.transform = `translate3d(-50%, -50%, 0) scale(${stretch})`;

      tx = p.x;
      ty = p.y;
    }

    state.rafId = requestAnimationFrame(animate);
  }

  function pause() {
    state.isPaused = true;
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }

  function resume() {
    if (!state.isPaused) return;
    state.isPaused = false;
    state.rafId = requestAnimationFrame(animate);
  }

  function destroy() {
    pause();
    state.cleanupFns.forEach((fn) => fn());
    state.cleanupFns = [];
    if (state.cursorHiddenStyleEl) state.cursorHiddenStyleEl.remove();
    root.remove();
  }

  state.rafId = requestAnimationFrame(animate);

  return {
    destroy,
    pause,
    resume,
    refreshHoverTargets() {
      bindHoverTargets();
    },
  };
}

function hexToRgba(hex, alpha = 1) {
  const clean = hex.replace("#", "").trim();

  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return `rgba(125, 249, 255, ${alpha})`;
}