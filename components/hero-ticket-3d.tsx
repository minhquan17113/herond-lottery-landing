"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The hero's 3D holographic ticket. Renders the brand's ticket-iridescent.glb
 * in a lazy three.js scene: gentle idle float plus a spring-lerped turn toward
 * the pointer, lit so the iridescent material catches the aurora hues.
 *
 * Loaded via next/dynamic (see hero.tsx), so three.js never enters the
 * critical bundle. The hero video stays mounted underneath as the poster and
 * the fallback: the canvas only fades in after the model is ready, and we
 * bail (leaving the video) on reduced motion, missing WebGL, or load failure.
 */
export function HeroTicket3D({ onReady }: { onReady?: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let raf = 0;
    let cleanupScene: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      const [{ GLTFLoader }, { DRACOLoader }, { RoomEnvironment }] = await Promise.all([
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        import("three/examples/jsm/loaders/DRACOLoader.js"),
        import("three/examples/jsm/environments/RoomEnvironment.js"),
      ]);
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);
      renderer.domElement.style.position = "absolute";
      renderer.domElement.style.inset = "0";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
      camera.position.set(0, 0, 5.2);

      // Physical/iridescent materials need an environment to reflect;
      // RoomEnvironment is procedural (no HDR download).
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 0.55;

      // Brand-hued studio: cool key, purple/pink rims. This is what drives the
      // iridescent material's color response.
      scene.add(new THREE.AmbientLight(0xffffff, 0.2));
      const key = new THREE.DirectionalLight(0xdbe6ff, 1.1);
      key.position.set(2.5, 3, 4);
      scene.add(key);
      const rimA = new THREE.DirectionalLight(0x6651ea, 1.6);
      rimA.position.set(-4, 1, -2);
      scene.add(rimA);
      const rimB = new THREE.DirectionalLight(0xff8097, 1.2);
      rimB.position.set(3, -3, -3);
      scene.add(rimB);

      const resize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener("resize", resize);

      let model: import("three").Group | null = null;
      try {
        // The ticket asset is Draco-compressed; decoder is vendored under
        // /assets/draco (copied from three's examples) so no CDN dependency.
        const draco = new DRACOLoader();
        draco.setDecoderPath("/assets/draco/");
        const loader = new GLTFLoader();
        loader.setDRACOLoader(draco);
        const gltf = await loader.loadAsync("/assets/ticket-iridescent.glb");
        draco.dispose();
        if (disposed) return;
        model = gltf.scene;

        // Push the holographic response: full iridescence, restrained env
        // reflections so the card reads foil-on-night rather than blown white.
        model.traverse((obj) => {
          const mesh = obj as import("three").Mesh;
          if (!mesh.isMesh) return;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => {
            const mat = m as import("three").MeshPhysicalMaterial;
            if ("envMapIntensity" in mat) mat.envMapIntensity = 0.8;
            if ("metalness" in mat) mat.metalness = 0.3;
            if ("roughness" in mat) mat.roughness = 0.18;
            if ("iridescence" in mat) {
              mat.iridescence = 1.0;
              mat.iridescenceIOR = 1.8;
              mat.iridescenceThicknessRange = [120, 500];
            }
          });
        });

        // Normalize scale/centering so the ticket fills the frame regardless
        // of how the asset was authored.
        // Orient the card to face the camera: its thinnest bounding axis is
        // the face normal, so rotate that axis onto +z before framing.
        let box = new THREE.Box3().setFromObject(model);
        let size = box.getSize(new THREE.Vector3());
        const dims = [size.x, size.y, size.z];
        const thin = dims.indexOf(Math.min(...dims));
        const pivot = new THREE.Group();
        pivot.add(model);
        if (thin === 0) pivot.rotation.y = Math.PI / 2;
        if (thin === 1) pivot.rotation.x = -Math.PI / 2;
        pivot.updateMatrixWorld(true);

        box = new THREE.Box3().setFromObject(pivot);
        size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(model.worldToLocal(center.clone()));
        pivot.updateMatrixWorld(true);

        // Fit to the camera frustum at the model's distance, with breathing room.
        const dist = camera.position.z;
        const visH = 2 * dist * Math.tan((camera.fov * Math.PI) / 360);
        const visW = visH * (mount.clientWidth / Math.max(1, mount.clientHeight));
        const fit = 0.9 * Math.min(visW / size.x, visH / size.y);
        pivot.scale.setScalar(fit);
        // The pivot holds the static orientation; the rig is what the pointer
        // and idle float animate, so the two rotations never fight.
        const rig = new THREE.Group();
        rig.add(pivot);
        scene.add(rig);
        model = rig;
      } catch (err) {
        console.error("HeroTicket3D: model load failed", err);
        return; // leave the video fallback in place
      }

      // Pointer-driven target rotation, spring-lerped in the render loop.
      // The resting pose is deliberately angled; a flat-on card reads as 2D.
      const baseX = -0.06;
      const baseY = 0.26;
      let targetX = baseX;
      let targetY = baseY;
      const onPointer = (e: PointerEvent) => {
        const rect = mount.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        targetY = baseY + nx * 0.7;
        targetX = baseX + ny * 0.45;
      };
      const onLeave = () => {
        targetX = baseX;
        targetY = baseY;
      };
      // Listen on the hero section, not just the canvas, so the ticket turns
      // as the visitor moves through the whole hero.
      const zone = mount.closest("section") ?? mount;
      zone.addEventListener("pointermove", onPointer as EventListener);
      zone.addEventListener("pointerleave", onLeave);

      let visible = true;
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
      });
      io.observe(mount);

      const clock = new THREE.Clock();
      const render = () => {
        raf = requestAnimationFrame(render);
        if (!visible || !model) return;
        const t = clock.getElapsedTime();
        model.rotation.x += (targetX + Math.sin(t * 0.7) * 0.05 - model.rotation.x) * 0.06;
        model.rotation.y += (targetY + Math.sin(t * 0.45) * 0.12 - model.rotation.y) * 0.06;
        model.position.y = Math.sin(t * 0.8) * 0.07;
        renderer.render(scene, camera);
      };
      render();
      setReady(true);
      onReady?.();

      cleanupScene = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener("resize", resize);
        zone.removeEventListener("pointermove", onPointer as EventListener);
        zone.removeEventListener("pointerleave", onLeave);
        pmrem.dispose();
        renderer.dispose();
        mount.removeChild(renderer.domElement);
      };
    })().catch((err) => console.error("HeroTicket3D:", err));

    return () => {
      disposed = true;
      cleanupScene?.();
    };
  }, [onReady]);

  return (
    <div
      ref={mountRef}
      aria-hidden
      className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
      style={{
        // Dark panel with the aurora sunk in as depth, same recipe as the
        // final CTA's prize stub, so the 3D ticket floats over brand light.
        background: [
          "radial-gradient(120% 130% at 12% 115%, rgba(51,115,246,0.30), transparent 58%)",
          "radial-gradient(90% 100% at 90% -15%, rgba(255,128,151,0.12), transparent 55%)",
          "#101014",
        ].join(", "),
      }}
    />
  );
}
