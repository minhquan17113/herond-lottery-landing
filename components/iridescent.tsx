"use client";

import { useEffect, useRef } from "react";

const VERTEX_SHADER = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// Thin-film interference over drifting value noise: the physical effect that
// makes real foil tickets shimmer. The cosine palette walks the film's
// spectral response, then gets pulled toward the Herond trio (blue, purple,
// pink) so the shimmer stays on brand instead of full rainbow.
const FRAGMENT_SHADER = `
precision mediump float;
uniform vec2 resolution;
uniform float time;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  v += 0.5 * noise(p);
  v += 0.25 * noise(p * 2.13 + 17.0);
  v += 0.125 * noise(p * 4.07 + 47.0);
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  uv.x *= resolution.x / resolution.y;

  // Film "thickness" field: slow-drifting layered noise.
  float t = time * 0.06;
  float film = fbm(uv * 2.4 + vec2(t, -t * 0.7));
  film += 0.3 * fbm(uv * 5.0 - vec2(t * 1.6, t));

  // Spectral response of a thin film at this thickness.
  vec3 spectral = 0.5 + 0.5 * cos(6.28318 * (film * 1.4 + vec3(0.00, 0.33, 0.67)));

  // Pull toward the brand trio so it reads Herond, not oil-slick.
  vec3 blue = vec3(0.20, 0.45, 0.96);
  vec3 purple = vec3(0.40, 0.32, 0.92);
  vec3 pink = vec3(1.00, 0.50, 0.59);
  vec3 brand = mix(mix(blue, purple, smoothstep(0.2, 0.6, film)), pink, smoothstep(0.55, 0.95, film));
  vec3 color = mix(brand, spectral, 0.35);

  // Brightness follows the film ridges; deep valleys go dark so the layer
  // blends into the stub instead of milking over it.
  float lum = smoothstep(0.35, 0.9, film);
  gl_FragColor = vec4(color * lum, 1.0);
}
`;

/**
 * Thin-film iridescence shader (WebGL, ~drawing a single quad). Composite it
 * with mix-blend-screen at low opacity over dark surfaces. Renders one static
 * frame under reduced motion; pauses entirely while offscreen.
 */
export function Iridescent({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return shader;
    };

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX_SHADER));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "resolution");
    const uTime = gl.getUniformLocation(program, "time");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let raf = 0;
    let visible = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const render = (now: number) => {
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduceMotion ? 0 : (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!reduceMotion && visible) raf = requestAnimationFrame(render);
    };

    // Only burn frames while the stub is actually on screen.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(render);
    });
    io.observe(canvas);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
}
