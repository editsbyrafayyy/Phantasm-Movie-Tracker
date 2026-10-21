'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- OGL scene objects are untyped in this port */

import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl';
import { useEffect, useRef } from 'react';
import './CircularGallery.css';

interface GalleryItem {
  image: string;
  text: string;
}

interface CircularGalleryProps {
  items?: GalleryItem[];
  bend?: number;
  borderRadius?: number;
  scrollSpeed?: number;
  scrollEase?: number;
  onChange?: (index: number) => void;
  currentIndex?: number;
}

function debounce(func: () => void, wait: number): { (): void; cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const debounced = () => {
    clearTimeout(timeout);
    timeout = setTimeout(func, wait);
  };
  debounced.cancel = () => clearTimeout(timeout);
  return debounced;
}

function lerp(p1: number, p2: number, t: number): number {
  return p1 + (p2 - p1) * t;
}

class Media {
  extra: number;
  geometry: any;
  gl: any;
  image: string;
  index: number;
  length: number;
  renderer: any;
  scene: any;
  screen: any;
  text: string;
  viewport: any;
  bend: number;
  borderRadius: number;
  reducedMotion: boolean;
  img: HTMLImageElement | null = null;
  program: any;
  plane: any;
  title: any;
  scale: any;
  padding: any;
  width: any;
  widthTotal: any;
  x: any;
  speed: any;
  isBefore: any;
  isAfter: any;

  constructor({
    geometry,
    gl,
    image,
    index,
    length,
    renderer,
    scene,
    screen,
    text,
    viewport,
    bend,
    borderRadius = 0,
    reducedMotion = false
  }: any) {
    this.extra = 0;
    this.geometry = geometry;
    this.gl = gl;
    this.image = image;
    this.index = index;
    this.length = length;
    this.renderer = renderer;
    this.scene = scene;
    this.screen = screen;
    this.text = text;
    this.viewport = viewport;
    this.bend = bend;
    this.borderRadius = borderRadius;
    this.reducedMotion = reducedMotion;
    this.createShader();
    this.createMesh();
    this.onResize();
  }
  
  createShader() {
    const texture = new Texture(this.gl, {
      generateMipmaps: true
    });
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        varying vec2 vUv;
        
        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }
        
        void main() {
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );
          vec4 color = texture2D(tMap, uv);
          
          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          
          // Smooth antialiasing for edges
          float edgeSmooth = 0.002;
          float alpha = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, d);
          
          gl_FragColor = vec4(color.rgb, alpha);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius }
      },
      transparent: true
    });
    if (!this.image) return;
    const img = new Image();
    this.img = img;
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      texture.image = img;
      this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
    };
    img.src = this.image;
  }

  cancelImage() {
    if (!this.img) return;
    this.img.onload = null;
    this.img.src = '';
    this.img = null;
  }
  
  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program
    });
    this.plane.setParent(this.scene);
  }
  

  
  update(scroll: any, direction: string, frames = 1) {
    this.plane.position.x = this.x - scroll.current - this.extra;

    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);

      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }

    this.speed = scroll.current - scroll.last;
    if (!this.reducedMotion) this.program.uniforms.uTime.value += 0.04 * frames;
    this.program.uniforms.uSpeed.value = this.speed;

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    if (direction === 'right' && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
    if (direction === 'left' && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
  }
  
  onResize({ screen, viewport }: any = {}) {
    if (screen) this.screen = screen;
    if (viewport) {
      this.viewport = viewport;
      if (this.plane.program.uniforms.uViewportSizes) {
        this.plane.program.uniforms.uViewportSizes.value = [this.viewport.width, this.viewport.height];
      }
    }
    this.scale = this.screen.height / 1500;
    this.plane.scale.y = (this.viewport.height * (900 * this.scale)) / this.screen.height;
    this.plane.scale.x = (this.viewport.width * (700 * this.scale)) / this.screen.width;
    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    this.padding = 2;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

class App {
  container: HTMLElement;
  scrollSpeed: number;
  scroll: { ease: number; current: number; target: number; last: number; position?: number };
  onCheckDebounce: { (): void; cancel: () => void };
  reducedMotion: boolean;
  isVisible = true;
  running = false;
  intersectionObserver?: IntersectionObserver;
  lastFrame = 0;
  boundVisibility!: () => void;
  renderer!: any;
  gl!: any;
  camera!: any;
  scene!: any;
  planeGeometry!: any;
  mediasImages!: any[];
  medias!: Media[];
  screen!: any;
  viewport!: any;
  isDown!: boolean;
  start!: number;
  raf!: number;
  boundOnResize!: any;
  boundOnWheel!: any;
  boundOnTouchDown!: any;
  boundOnTouchMove!: any;
  boundOnTouchUp!: any;
  boundOnKeyDown!: any;
  boundUpdate!: () => void;
  onChangeCallback?: (index: number) => void;
  lastActiveIndex: number = 0;

  constructor(
    container: HTMLElement,
    {
      items,
      bend,
      borderRadius = 0,
      scrollSpeed = 2,
      scrollEase = 0.05
    }: any = {}
  ) {
    this.container = container;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.scrollSpeed = scrollSpeed;
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 };
    this.onCheckDebounce = debounce(this.onCheck.bind(this), 200);
    this.boundUpdate = this.update.bind(this);
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias(items, bend, borderRadius);
    this.addEventListeners();
    this.updateRunning();
  }

  /** Render loop runs only while on screen and the tab is visible. */
  updateRunning() {
    const active = this.isVisible && !document.hidden;
    if (active === this.running) return;
    this.running = active;
    window.cancelAnimationFrame(this.raf);
    if (active) this.raf = window.requestAnimationFrame(this.boundUpdate);
  }
  
  createRenderer() {
    this.renderer = new Renderer({
      alpha: true,
      // Edges are smoothed in the fragment shader, so MSAA only cost fill-rate.
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, 1.5)
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.gl.canvas);
  }
  
  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }
  
  createScene() {
    this.scene = new Transform();
  }
  
  createGeometry() {
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 10,
      widthSegments: 20
    });
  }
  
  createMedias(items: GalleryItem[] = [], bend = 1, borderRadius: number) {
    const galleryItems = items;
    this.mediasImages = galleryItems.concat(galleryItems);
    this.medias = this.mediasImages.map((data, index) => {
      return new Media({
        geometry: this.planeGeometry,
        gl: this.gl,
        image: data.image,
        index,
        length: this.mediasImages.length,
        renderer: this.renderer,
        scene: this.scene,
        screen: this.screen,
        text: data.text,
        viewport: this.viewport,
        bend,
        borderRadius,
        reducedMotion: this.reducedMotion
      });
    });
  }
  
  onTouchDown(e: any) {
    this.isDown = true;
    this.scroll.position = this.scroll.current;
    this.start = e.touches ? e.touches[0].clientX : e.clientX;
  }
  
  onTouchMove(e: any) {
    if (!this.isDown) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const distance = (this.start - x) * (this.scrollSpeed * 0.025);
    this.scroll.target = (this.scroll.position || 0) + distance;
  }
  
  onTouchUp() {
    this.isDown = false;
    this.onCheck();
  }
  
  onWheel(e: any) {
    const delta = e.deltaY || e.wheelDelta || e.detail;
    this.scroll.target += (delta > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.2;
    this.onCheckDebounce();
  }
  
  onKeyDown(e: any) {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        this.scroll.target += this.scrollSpeed * 5;
        this.onCheckDebounce();
        break;

      case 'ArrowLeft':
        e.preventDefault();
        this.scroll.target -= this.scrollSpeed * 5;
        this.onCheckDebounce();
        break;

      case 'Home':
        e.preventDefault();
        this.scroll.target = 0;
        this.onCheckDebounce();
        break;

      default:
        break;
    }
  }

  onCheck() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
    const item = width * itemIndex;
    this.scroll.target = this.scroll.target < 0 ? -item : item;
  }
  
  onResize() {
    this.screen = {
      width: this.container.clientWidth,
      height: this.container.clientHeight
    };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({
      aspect: this.screen.width / this.screen.height
    });
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
    if (this.medias) {
      this.medias.forEach(media => media.onResize({ screen: this.screen, viewport: this.viewport }));
    }
  }
  
  update(t: number = 0) {
    if (!this.running) return;
    // At rest only the slow wave moves — ~30fps is indistinguishable and halves GPU work.
    const settled = Math.abs(this.scroll.target - this.scroll.current) < 0.01;
    if (settled && t - this.lastFrame < 32) {
      this.raf = window.requestAnimationFrame(this.boundUpdate);
      return;
    }
    // Advance the wave by real elapsed time (in 60fps frames) so its speed is unchanged.
    const frames = this.lastFrame ? Math.min((t - this.lastFrame) / 16.67, 4) : 1;
    this.lastFrame = t;
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    const direction = this.scroll.current > this.scroll.last ? 'right' : 'left';
    if (this.medias) {
      this.medias.forEach(media => media.update(this.scroll, direction, frames));
    }
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;

    // Check active item index change
    if (this.medias && this.medias[0] && this.onChangeCallback) {
      const width = this.medias[0].width;
      const totalLength = this.mediasImages.length / 2;
      const rawIndex = Math.round(this.scroll.current / width);
      let activeIndex = rawIndex % totalLength;
      if (activeIndex < 0) {
        activeIndex += totalLength;
      }
      if (activeIndex !== this.lastActiveIndex) {
        this.lastActiveIndex = activeIndex;
        this.onChangeCallback(activeIndex);
      }
    }

    this.raf = window.requestAnimationFrame(this.boundUpdate);
  }
  
  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchDown = this.onTouchDown.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchUp = this.onTouchUp.bind(this);
    this.boundOnKeyDown = this.onKeyDown.bind(this);

    window.addEventListener('resize', this.boundOnResize);
    this.container?.addEventListener('mousewheel', this.boundOnWheel, { passive: true } as any);
    this.container?.addEventListener('wheel', this.boundOnWheel, { passive: true } as any);
    this.container?.addEventListener('mousedown', this.boundOnTouchDown);
    window.addEventListener('mousemove', this.boundOnTouchMove);
    window.addEventListener('mouseup', this.boundOnTouchUp);
    this.container?.addEventListener('touchstart', this.boundOnTouchDown, { passive: true } as any);
    window.addEventListener('touchmove', this.boundOnTouchMove, { passive: true } as any);
    window.addEventListener('touchend', this.boundOnTouchUp);

    this.container?.addEventListener('keydown', this.boundOnKeyDown);

    this.boundVisibility = () => this.updateRunning();
    document.addEventListener('visibilitychange', this.boundVisibility);
    this.intersectionObserver = new IntersectionObserver(entries => {
      this.isVisible = entries[0]?.isIntersecting ?? true;
      this.updateRunning();
    }, { threshold: 0.01 });
    this.intersectionObserver.observe(this.container);
  }
  
  destroy() {
    this.running = false;
    window.cancelAnimationFrame(this.raf);
    this.onCheckDebounce.cancel();
    this.intersectionObserver?.disconnect();
    document.removeEventListener('visibilitychange', this.boundVisibility);
    window.removeEventListener('resize', this.boundOnResize);
    this.container?.removeEventListener('mousewheel', this.boundOnWheel);
    this.container?.removeEventListener('wheel', this.boundOnWheel);
    this.container?.removeEventListener('mousedown', this.boundOnTouchDown);
    window.removeEventListener('mousemove', this.boundOnTouchMove);
    window.removeEventListener('mouseup', this.boundOnTouchUp);
    this.container?.removeEventListener('touchstart', this.boundOnTouchDown);
    window.removeEventListener('touchmove', this.boundOnTouchMove);
    window.removeEventListener('touchend', this.boundOnTouchUp);

    if (this.medias) {
      this.medias.forEach((media: Media) => {
        media.cancelImage();
        try {
          if (media.program && media.program.uniforms?.tMap?.value?.texture) {
            this.gl.deleteTexture(media.program.uniforms.tMap.value.texture);
          }
          if (media.program?.program) {
            this.gl.deleteProgram(media.program.program);
          }
        } catch {
          // Ignore WebGL teardown edge cases
        }
      });
      this.medias = [];
    }

    try {
      this.gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      // Context already lost
    }

    if (this.renderer && this.renderer.gl && this.renderer.gl.canvas?.parentNode) {
      this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas);
    }

    if (this.container) {
      this.container.removeEventListener('keydown', this.boundOnKeyDown);
    }
  }
}

export default function CircularGallery({
  items,
  bend = 3,
  borderRadius = 0.05,
  scrollSpeed = 2,
  scrollEase = 0.05,
  onChange,
  currentIndex
}: CircularGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<App | null>(null);
  const onChangeRef = useRef(onChange);
  const lastSentIndexRef = useRef<number>(-1);
  const startIndexRef = useRef(currentIndex);

  useEffect(() => {
    onChangeRef.current = onChange;
    startIndexRef.current = currentIndex;
  });

  useEffect(() => {
    if (!containerRef.current || !items?.length) return;
    const app = new App(containerRef.current, {
      items,
      bend,
      borderRadius,
      scrollSpeed,
      scrollEase
    });
    app.onChangeCallback = (index) => {
      lastSentIndexRef.current = index;
      onChangeRef.current?.(index);
    };

    // Start on the parent's current slide (read once at mount; later changes go through the effect below)
    const startIndex = startIndexRef.current;
    if (startIndex !== undefined && startIndex > 0 && app.medias && app.medias[0]) {
      const width = app.medias[0].width;
      const initialScroll = startIndex * width;
      app.scroll.target = initialScroll;
      app.scroll.current = initialScroll;
      app.scroll.last = initialScroll;
      app.lastActiveIndex = startIndex;
    }
    lastSentIndexRef.current = startIndex ?? -1;

    appRef.current = app;
    return () => {
      app.destroy();
      appRef.current = null;
    };
  }, [items, bend, borderRadius, scrollSpeed, scrollEase]);

  useEffect(() => {
    const app = appRef.current;
    if (app && currentIndex !== undefined && app.medias && app.medias[0]) {
      // Guard: do not programmatic scroll target update if the change is from drag/swipe
      if (currentIndex === lastSentIndexRef.current) {
        return;
      }

      const width = app.medias[0].width;
      if (width > 0) {
        const totalLength = items?.length || 1;
        const currentScroll = app.scroll.target;
        const currentScrollIndex = Math.round(currentScroll / width);
        
        let currentWrapped = currentScrollIndex % totalLength;
        if (currentWrapped < 0) currentWrapped += totalLength;
        
        let diff = currentIndex - currentWrapped;
        if (diff > totalLength / 2) {
          diff -= totalLength;
        } else if (diff < -totalLength / 2) {
          diff += totalLength;
        }
        
        const newTarget = (currentScrollIndex + diff) * width;
        app.scroll.target = newTarget;
        lastSentIndexRef.current = currentIndex;
      }
    }
  }, [currentIndex, items]);

  return (
    <div
      className="circular-gallery"
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="Featured films. Swipe or use the left and right arrow keys to browse."
    />
  );
}
