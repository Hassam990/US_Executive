import { useEffect, useRef } from "react";
import {
  AmbientLight,
  CatmullRomCurve3,
  GridHelper,
  Group,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from "three";

const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function RouteScene() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      root.classList.add("route-scene-no-webgl");
      return;
    }

    const scene = new Scene();
    const camera = new PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 4.1, 7);
    camera.lookAt(0, 0, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
    renderer.setClearColor(0x000000, 0);
    root.appendChild(renderer.domElement);

    const route = new CatmullRomCurve3([
      new Vector3(-3.2, -0.12, 1.35),
      new Vector3(-2.25, 0.2, 0.25),
      new Vector3(-1.15, -0.05, 0.5),
      new Vector3(-0.1, 0.3, -0.85),
      new Vector3(1.1, 0.05, -0.4),
      new Vector3(2.4, 0.32, -1.6),
      new Vector3(3.25, 0.08, -1.1),
    ]);
    const routeGroup = new Group();
    scene.add(routeGroup);

    const routeMesh = new Mesh(
      new TubeGeometry(route, 100, 0.018, 8, false),
      new MeshBasicMaterial({ color: 0xec4899, transparent: true, opacity: 0.82 }),
    );
    routeGroup.add(routeMesh);

    const grid = new GridHelper(10, 20, 0x4a4240, 0x282625);
    grid.position.y = -0.45;
    const gridMaterial = grid.material as LineBasicMaterial;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.62;
    routeGroup.add(grid);

    const movingMarker = new Mesh(
      new SphereGeometry(0.075, 16, 16),
      new MeshBasicMaterial({ color: 0xf4e3d5 }),
    );
    routeGroup.add(movingMarker);

    const stops = [
      [-3.2, -0.12, 1.35],
      [-0.1, 0.3, -0.85],
      [3.25, 0.08, -1.1],
    ] as const;
    stops.forEach(([x, y, z], index) => {
      const stop = new Group();
      stop.position.set(x, y, z);
      stop.add(new Mesh(
        new SphereGeometry(index === 1 ? 0.12 : 0.09, 20, 20),
        new MeshStandardMaterial({
          color: index === 1 ? 0xfbcfe8 : 0xf472b6,
          emissive: index === 1 ? 0x7c204e : 0x4a1630,
          emissiveIntensity: 0.7,
          roughness: 0.4,
        }),
      ));
      const ring = new Mesh(
        new TorusGeometry(0.17, 0.008, 6, 32),
        new MeshBasicMaterial({ color: 0xec4899, transparent: true, opacity: 0.65 }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.07;
      stop.add(ring);
      routeGroup.add(stop);
    });

    scene.add(new AmbientLight(0xffffff, 1.3));
    const light = new PointLight(0xec4899, 5, 10);
    light.position.set(1, 3, 3);
    scene.add(light);

    const resize = () => {
      const { width, height } = root.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const bounds = root.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
    };
    root.addEventListener("pointermove", onPointerMove, { passive: true });
    const observer = new ResizeObserver(resize);
    observer.observe(root);

    let frame = 0;
    const renderFrame = (time: number) => {
      movingMarker.position.copy(route.getPointAt((time * 0.00004) % 1));
      routeGroup.rotation.y += (pointer.x * 0.045 - routeGroup.rotation.y) * 0.035;
      routeGroup.rotation.x += (-pointer.y * 0.025 - routeGroup.rotation.x) * 0.035;
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(renderFrame);
    };

    resize();
    if (!reduceMotion) frame = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      root.removeEventListener("pointermove", onPointerMove);
      scene.traverse((object) => {
        if (object instanceof Mesh) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
          else material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={rootRef} className="route-scene-canvas" aria-hidden="true" />;
}
