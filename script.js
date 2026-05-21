/**
 * ==========================================================================
 * 1. DYNAMIC RESPONSIVE TECH-MESH GRID CANVAS BACKGROUND ENGINE
 * ==========================================================================
 */
(() => {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles = [], lines = [];
  let pulse = 0;

  // Calculates matrix coordinates adaptively across viewport resizing routines
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    generateGrid();
  }

  // Generates cross-point lines configuration coordinates maps
  function generateGrid() {
    lines = [];
    for (let x = 0; x < Math.max(2000, W); x += 80) {
      lines.push({ x1: x, y1: 0, x2: x, y2: Math.max(1200, H), h: true });
    }
    for (let y = 0; y < Math.max(1200, H); y += 80) {
      lines.push({ x1: 0, y1: y, x2: Math.max(2000, W), y2: y, h: false });
    }
  }

  window.addEventListener('resize', resize);
  resize();

  // Populate background node matrix parameters
  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      a: Math.random()
    });
  }

  // Rendering background frames continuously
  function drawBg() {
    ctx.clearRect(0, 0, W, H);
    pulse += 0.015;

    // Draw grid vectors line maps
    ctx.lineWidth = 0.4;
    lines.forEach(l => {
      ctx.strokeStyle = `rgba(0, 229, 255, ${0.07 + 0.03 * Math.sin(pulse + l.x1 * 0.01)})`;
      ctx.beginPath();
      ctx.moveTo(l.x1 % W, l.y1 % H);
      ctx.lineTo(l.x2 % W, l.y2 % H);
      ctx.stroke();
    });

    // Handle floating node displacements loop
    particles.forEach(p => {
      p.x = (p.x + p.vx + W) % W;
      p.y = (p.y + p.vy + H) % H;
      const alpha = 0.3 + 0.4 * Math.sin(pulse + p.a * 5);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
      ctx.fill();
    });

    // Intermittent threat warning anomalies indicator node (Red Matrix Nodes)
    if (Math.random() < 0.005) {
      const rx = Math.random() * W, ry = Math.random() * H;
      ctx.beginPath();
      ctx.arc(rx, ry, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 32, 32, 0.8)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rx, ry, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 32, 32, 0.1)';
      ctx.fill();
    }

    requestAnimationFrame(drawBg);
  }
  drawBg();
})();

/**
 * ==========================================================================
 * 2. AUTOMATED PRESENTATION SLIDESHOW TIME NAVIGATION ENGINE
 * ==========================================================================
 */
(() => {
  // Pre-configured global timeline durations array mappings per scene sequence (in ms)
  const DURATIONS = [4000, 5000, 6000, 6000, 6000, 6000, 6000, 6000, 7000, 7000, 8000];

  let current = 0;
  let timer = null;
  let paused = false;
  let started = false;

  const progressBar = document.getElementById('progressBar');
  const slideNum    = document.getElementById('slideNum');
  const pauseBtn    = document.getElementById('pauseBtn');
  const controls    = document.getElementById('controls');
  const playBtn     = document.getElementById('playBtn');

  if (!playBtn) return;

  function getScenes() {
    return document.querySelectorAll('.scene');
  }

  // Flushes element state to forcefully refresh CSS transition triggers instantly
  function restartAnimations(el) {
    const animatedChildren = el.querySelectorAll('*');
    animatedChildren.forEach(child => {
      child.style.animation = 'none';
      void child.offsetHeight; 
      child.style.animation = '';
    });
  }

  // Active scene execution handler
  function showScene(idx) {
    const scenes = getScenes();
    const totalScenes = scenes.length;

    scenes.forEach((s) => {
      s.classList.remove('active');
    });

    requestAnimationFrame(() => {
      const target = scenes[idx];
      target.classList.add('active');
      restartAnimations(target);

      // Track timeline tracking metric percentages updates
      const pct = ((idx + 1) / totalScenes) * 100;
      if (progressBar) progressBar.style.width = pct + '%';
      if (slideNum) slideNum.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(totalScenes).padStart(2, '0');
    });
  }

  function advance() {
    const totalScenes = getScenes().length;
    current = (current < totalScenes - 1) ? current + 1 : 0;
    showScene(current);
    if (!paused) scheduleNext();
  }

  function scheduleNext() {
    clearTimeout(timer);
    if (!paused) {
      timer = setTimeout(advance, DURATIONS[current]);
    }
  }

  function startVideo() {
    playBtn.style.display = 'none';
    if (controls) controls.style.display = 'flex';
    started = true;
    current = 0;
    showScene(0);
    scheduleNext();
  }

  // Attaching event handlers explicitly to UI elements
  playBtn.addEventListener('click', startVideo);

  document.getElementById('nextBtn')?.addEventListener('click', () => {
    clearTimeout(timer);
    const totalScenes = getScenes().length;
    current = (current < totalScenes - 1) ? current + 1 : 0;
    showScene(current);
    if (!paused) scheduleNext();
  });

  document.getElementById('prevBtn')?.addEventListener('click', () => {
    clearTimeout(timer);
    current = (current > 0) ? current - 1 : getScenes().length - 1;
    showScene(current);
    if (!paused) scheduleNext();
  });

  pauseBtn?.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.textContent = paused ? '▶ PLAY' : '⏸ PAUSE';
    if (paused) {
      clearTimeout(timer);
    } else {
      scheduleNext();
    }
  });

  // Native hardware keyboard shortcut routing maps
  document.addEventListener('keydown', e => {
    if (!started) return;
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      document.getElementById('nextBtn')?.click();
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      document.getElementById('prevBtn')?.click();
    }
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      pauseBtn?.click();
    }
  });
})();

/**
 * ==========================================================================
 * 3. COPY TO CLIPBOARD GLOBAL APPLICATION UTILITY MANAGER
 * ==========================================================================
 */
(() => {
  const copyButtons = document.querySelectorAll("[data-copy]");
  const activeTimeouts = new Map();

  const fallbackCopyText = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Text generation copy action intercept failure: ", err);
    }

    document.body.removeChild(textArea);
  };

  copyButtons.forEach((button) => {
    if (!button.hasAttribute("aria-live")) {
      button.setAttribute("aria-live", "polite");
    }

    button.addEventListener("click", async () => {
      const stringToCopy = button.dataset.copy;
      const originalText = button.textContent;

      if (!stringToCopy) return;

      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(stringToCopy);
          button.textContent = "Copied";
        } catch (err) {
          fallbackCopyText(stringToCopy);
          button.textContent = "Copied";
        }
      } else {
        fallbackCopyText(stringToCopy);
        button.textContent = "Copied";
      }

      if (activeTimeouts.has(button)) {
        clearTimeout(activeTimeouts.get(button));
      }

      const timeoutId = window.setTimeout(() => {
        button.textContent = originalText;
        activeTimeouts.delete(button);
      }, 1400);

      activeTimeouts.set(button, timeoutId);
    });
  });
})();
