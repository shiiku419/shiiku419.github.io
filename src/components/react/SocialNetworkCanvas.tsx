import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
  r: number;
  isAI: boolean;
  pulse: number; // 0..1 decaying flash intensity
  pulseColor: string;
  ringT: number; // -1 when no ring, else 0..1 progress
}

interface Colors {
  human: string;
  ai: string;
  amber: string;
}

const AMBER = "#d9a441";

function readColors(): Colors {
  const style = getComputedStyle(document.documentElement);
  const human = style.getPropertyValue("--accent-sage").trim() || "#6b8f71";
  const ai = style.getPropertyValue("--accent-violet").trim() || "#7c6fc9";
  return { human, ai, amber: AMBER };
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.trim();
  if (m.startsWith("#")) {
    const v = m.length === 4
      ? m.slice(1).split("").map((c) => c + c).join("")
      : m.slice(1);
    const num = parseInt(v, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
  const rgbMatch = m.match(/(\d+(?:\.\d+)?)/g);
  if (rgbMatch && rgbMatch.length >= 3) {
    return [Number(rgbMatch[0]), Number(rgbMatch[1]), Number(rgbMatch[2])];
  }
  return [150, 150, 150];
}

export default function SocialNetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = reducedMotionMq.matches;

    let colors = readColors();
    let width = 0;
    let height = 0;
    let dpr = Math.max(1, window.devicePixelRatio || 1);

    let nodes: Node[] = [];
    const EDGE_DIST = 180;
    const REPEL_DIST = 42;
    const MOUSE_RADIUS = 120;
    const MAX_SPEED = 0.35;

    let mouseX = -9999;
    let mouseY = -9999;
    let mouseActive = false;

    let running = false;
    let rafId = 0;
    let lastAmbient = performance.now();
    const AMBIENT_INTERVAL = 6000;

    function nodeCount() {
      const area = width * height;
      return Math.max(24, Math.min(90, Math.round(area / 16000)));
    }

    function buildNodes() {
      const count = nodeCount();
      const next: Node[] = [];
      for (let i = 0; i < count; i++) {
        const homeX = Math.random() * width;
        const homeY = Math.random() * height;
        const isAI = i < Math.round(count * 0.25);
        next.push({
          x: homeX,
          y: homeY,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.1,
          homeX,
          homeY,
          r: isAI ? 5.2 : 3.8,
          isAI,
          pulse: 0,
          pulseColor: isAI ? colors.ai : colors.human,
          ringT: -1
        });
      }
      // shuffle so AI/human are interspersed
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      nodes = next;
    }

    function resize() {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildNodes();
      drawFrame();
    }

    function edgesFor(i: number, list: Node[]) {
      const result: number[] = [];
      const a = list[i];
      for (let j = 0; j < list.length; j++) {
        if (j === i) continue;
        const b = list[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < EDGE_DIST) result.push(j);
      }
      return result;
    }

    function triggerCascade(originIdx: number) {
      const origin = nodes[originIdx];
      const originColor = origin.isAI ? colors.ai : colors.human;
      origin.pulse = 1;
      origin.pulseColor = colors.amber;
      origin.ringT = 0;

      const visited = new Set<number>([originIdx]);
      let frontier = [originIdx];
      let hop = 0;

      function step() {
        const nextFrontier: number[] = [];
        for (const idx of frontier) {
          const node = nodes[idx];
          const neighbors = edgesFor(idx, nodes).filter((n) => !visited.has(n));
          const fanout = node.isAI ? neighbors.length : Math.min(neighbors.length, 3);
          const chosen = neighbors
            .sort(() => Math.random() - 0.5)
            .slice(0, fanout);
          for (const n of chosen) {
            if (visited.has(n)) continue;
            visited.add(n);
            nextFrontier.push(n);
            nodes[n].pulse = 1;
            nodes[n].pulseColor = originColor;
            nodes[n].ringT = 0;
          }
        }
        frontier = nextFrontier;
        hop += 1;
        if (!running) drawFrame();
        if (frontier.length > 0 && hop < 8) {
          setTimeout(step, 250);
        }
      }

      if (edgesFor(originIdx, nodes).length > 0) {
        setTimeout(step, 250);
      }
    }

    const CLICK_RADIUS = 240;

    function handleClick(e: MouseEvent) {
      const target = e.target;
      if (
        target instanceof Element &&
        target.closest("a, button, input, textarea, select, label, [role='button']")
      ) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let nearest = -1;
      let nearestD = Infinity;
      nodes.forEach((n, i) => {
        const dx = n.x - x;
        const dy = n.y - y;
        const d = dx * dx + dy * dy;
        if (d < nearestD) {
          nearestD = d;
          nearest = i;
        }
      });
      if (nearest >= 0 && nearestD <= CLICK_RADIUS * CLICK_RADIUS) triggerCascade(nearest);
    }

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      mouseActive = true;
    }

    function handleMouseLeave() {
      mouseActive = false;
      mouseX = -9999;
      mouseY = -9999;
    }

    function drawFrame() {
      ctx.clearRect(0, 0, width, height);

      // edges, tinted by the pair of nodes they connect
      const [hr, hg, hb] = hexToRgb(colors.human);
      const [ar, ag, ab] = hexToRgb(colors.ai);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < EDGE_DIST) {
            const closeness = 1 - d / EDGE_DIST;
            const aiShare = ((a.isAI ? 1 : 0) + (b.isAI ? 1 : 0)) / 2;
            const er = Math.round(hr + (ar - hr) * aiShare);
            const eg = Math.round(hg + (ag - hg) * aiShare);
            const eb = Math.round(hb + (ab - hb) * aiShare);
            const glow = Math.max(a.pulse, b.pulse);
            ctx.strokeStyle = `rgba(${er}, ${eg}, ${eb}, ${(closeness * 0.45 + glow * 0.4).toFixed(3)})`;
            ctx.lineWidth = 1 + glow;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // nodes
      for (const n of nodes) {
        const baseColor = n.isAI ? colors.ai : colors.human;
        const [br, bg, bb] = hexToRgb(baseColor);
        let fillR = br;
        let fillG = bg;
        let fillB = bb;
        if (n.pulse > 0) {
          const [pr, pg, pb] = hexToRgb(n.pulseColor);
          fillR = br + (pr - br) * n.pulse;
          fillG = bg + (pg - bg) * n.pulse;
          fillB = bb + (pb - bb) * n.pulse;
        }

        ctx.save();
        ctx.shadowColor = `rgba(${fillR}, ${fillG}, ${fillB}, ${n.isAI ? 0.7 : 0.45})`;
        ctx.shadowBlur = n.isAI ? 14 : 8;

        ctx.beginPath();
        ctx.fillStyle = `rgb(${fillR}, ${fillG}, ${fillB})`;
        ctx.arc(n.x, n.y, n.r + n.pulse * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (n.ringT >= 0) {
          const ringR = n.r + 4 + n.ringT * 18;
          const ringOpacity = 1 - n.ringT;
          const [pr2, pg2, pb2] = hexToRgb(n.pulseColor);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${pr2}, ${pg2}, ${pb2}, ${(ringOpacity * 0.7).toFixed(3)})`;
          ctx.lineWidth = 1.5;
          ctx.arc(n.x, n.y, ringR, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    function tick(now: number) {
      if (!running) return;

      for (const n of nodes) {
        // brownian drift
        n.vx += (Math.random() - 0.5) * 0.02;
        n.vy += (Math.random() - 0.5) * 0.02;

        // centering toward home ellipse position
        n.vx += (n.homeX - n.x) * 0.0015;
        n.vy += (n.homeY - n.y) * 0.0015;

        // mouse attraction
        if (mouseActive) {
          const dx = mouseX - n.x;
          const dy = mouseY - n.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MOUSE_RADIUS && d > 0.01) {
            const force = (1 - d / MOUSE_RADIUS) * 0.02;
            n.vx += (dx / d) * force;
            n.vy += (dy / d) * force;
          }
        }

        // decay
        n.pulse *= 0.965;
        if (n.pulse < 0.01) n.pulse = 0;
        if (n.ringT >= 0) {
          n.ringT += 1 / (2000 / 16.7);
          if (n.ringT > 1) n.ringT = -1;
        }
      }

      // repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
          if (d < REPEL_DIST) {
            const force = (1 - d / REPEL_DIST) * 0.03;
            const fx = (dx / d) * force;
            const fy = (dy / d) * force;
            a.vx += fx;
            a.vy += fy;
            b.vx -= fx;
            b.vy -= fy;
          }
        }
      }

      for (const n of nodes) {
        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (speed > MAX_SPEED) {
          n.vx = (n.vx / speed) * MAX_SPEED;
          n.vy = (n.vy / speed) * MAX_SPEED;
        }
        n.vx *= 0.96;
        n.vy *= 0.96;
        n.x += n.vx;
        n.y += n.vy;
      }

      if (now - lastAmbient > AMBIENT_INTERVAL && nodes.length > 0) {
        lastAmbient = now;
        triggerCascade(Math.floor(Math.random() * nodes.length));
      }

      drawFrame();
      rafId = requestAnimationFrame(tick);
    }

    function start() {
      if (running || reducedMotion) return;
      running = true;
      lastAmbient = performance.now();
      rafId = requestAnimationFrame(tick);
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    }

    const ro = new ResizeObserver(() => resize());
    ro.observe(container);
    resize();

    const themeObserver = new MutationObserver(() => {
      colors = readColors();
      if (reducedMotion) drawFrame();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });

    const reducedMotionListener = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches;
      if (reducedMotion) {
        stop();
        drawFrame();
      } else {
        start();
      }
    };
    reducedMotionMq.addEventListener("change", reducedMotionListener);

    const handleVisibilityChange = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    document.addEventListener("click", handleClick);
    document.addEventListener("mousemove", handleMouseMove);
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);

    if (!reducedMotion) start();

    return () => {
      stop();
      ro.disconnect();
      themeObserver.disconnect();
      reducedMotionMq.removeEventListener("change", reducedMotionListener);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("mousemove", handleMouseMove);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: 0.32 }}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <span className="sr-only">
        Interactive visualization: ideas propagating through a human–AI social network
      </span>
    </div>
  );
}
