import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';

/*
 * The FluxenWeb artifact: a liquid-metal core with topographic contour lines
 * that light up where the pointer "touches" it, wrapped in a shell of
 * fragmented triangles and a single orbit ring.
 */

const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

const coreVertex = /* glsl */ `
uniform float uTime;
uniform float uFlux;
uniform vec3 uPointer;
varying vec3 vViewPos;
varying vec3 vViewNormal;
varying float vDisp;
varying float vTouch;
${NOISE}
float displace(vec3 n){
  float slow = snoise(n * 1.15 + vec3(0.0, uTime * 0.12, uTime * 0.05));
  float fine = snoise(n * 3.4 - vec3(uTime * 0.08));
  float touch = smoothstep(0.72, 1.0, dot(n, normalize(uPointer)));
  return slow * (0.26 + uFlux * 0.18) + fine * 0.03 + touch * 0.1;
}
void main(){
  vec3 n = normalize(position);
  float r = length(position);
  float d = displace(n);
  vec3 p = n * (r + d);

  // Rebuild the normal from two nearby displaced points for a smooth, liquid surface.
  vec3 t = normalize(cross(n, abs(n.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0)));
  vec3 b = normalize(cross(n, t));
  float e = 0.012;
  vec3 na = normalize(n + t * e);
  vec3 nb = normalize(n + b * e);
  vec3 pa = na * (r + displace(na));
  vec3 pb = nb * (r + displace(nb));
  vec3 dn = normalize(cross(pa - p, pb - p));
  if (dot(dn, n) < 0.0) dn = -dn;

  vDisp = d;
  vTouch = smoothstep(0.72, 1.0, dot(n, normalize(uPointer)));
  vViewNormal = normalize(normalMatrix * dn);
  vec4 view = modelViewMatrix * vec4(p, 1.0);
  vViewPos = view.xyz;
  gl_Position = projectionMatrix * view;
}
`;

const coreFragment = /* glsl */ `
uniform float uTime;
uniform vec3 uAccent;
uniform vec3 uInk;
varying vec3 vViewPos;
varying vec3 vViewNormal;
varying float vDisp;
varying float vTouch;
void main(){
  vec3 n = normalize(vViewNormal);
  vec3 v = normalize(-vViewPos);
  float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.6);

  // Fake studio environment: soft horizon band + moving stripes = liquid chrome.
  vec3 r = reflect(-v, n);
  float horizon = smoothstep(0.22, 0.0, abs(r.y + 0.1));
  float stripes = smoothstep(0.7, 1.0, sin(r.y * 9.0 + r.x * 3.0 + uTime * 0.3) * 0.5 + 0.5);
  float top = smoothstep(0.3, 1.0, r.y);

  vec3 key = normalize(vec3(-0.5, 0.7, 0.6));
  float diff = clamp(dot(n, key), 0.0, 1.0);
  float spec = pow(clamp(dot(r, key), 0.0, 1.0), 40.0);

  vec3 col = vec3(0.02, 0.022, 0.04);
  col += uInk * (diff * 0.05 + horizon * 0.36 + stripes * 0.1 + top * 0.14 + spec * 0.95);
  // Indigo rim, white core: the same metal-to-blue sweep as the logo's F.
  col += mix(uAccent, uInk, smoothstep(0.1, 0.8, r.x * 0.5 + 0.5)) * fres * 0.55;

  // Topographic contour lines appear only where the pointer touches the surface.
  float h = vDisp * 18.0 - uTime * 0.16;
  float f = abs(fract(h + 0.5) - 0.5);
  float w = fwidth(h) * 1.1;
  float line = 1.0 - smoothstep(0.0, w, f);
  float mask = smoothstep(0.0, 0.85, vTouch);
  col = mix(col, uAccent * 1.25, line * mask);

  gl_FragColor = vec4(col, 1.0);
}
`;

const shardVertex = /* glsl */ `
uniform float uTime;
uniform float uExplode;
attribute vec3 aCentroid;
attribute vec3 aBary;
attribute float aRand;
varying vec3 vBary;
varying float vRand;
varying float vFacing;
void main(){
  vec3 dir = normalize(aCentroid);
  vec3 local = mix(aCentroid, position, 0.62);
  float drift = sin(uTime * 0.5 + aRand * 6.2831) * 0.06;
  local += dir * (drift + uExplode * (0.35 + aRand * 1.4));
  vBary = aBary;
  vRand = aRand;
  vec4 mv = modelViewMatrix * vec4(local, 1.0);
  vFacing = normalize(mat3(modelViewMatrix) * dir).z;
  gl_Position = projectionMatrix * mv;
}
`;

const shardFragment = /* glsl */ `
uniform vec3 uInk;
uniform vec3 uAccent;
uniform float uFade;
varying vec3 vBary;
varying float vRand;
varying float vFacing;
void main(){
  if (vRand < 0.42) discard;
  float edge = min(min(vBary.x, vBary.y), vBary.z);
  float w = fwidth(edge) * 1.1;
  float outline = 1.0 - smoothstep(0.0, w, edge - w * 0.4);
  float front = smoothstep(-0.4, 0.6, vFacing);
  float lit = step(0.982, vRand);
  vec3 col = mix(uInk, uAccent, lit);
  float alpha = max(outline * (0.18 + front * 0.42), lit * 0.75 * front);
  alpha *= uFade;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(col, alpha);
}
`;

function buildShardGeometry(radius, detail) {
  const source = new IcosahedronGeometry(radius, detail);
  const pos = source.getAttribute('position');
  const count = pos.count;
  const centroids = new Float32Array(count * 3);
  const bary = new Float32Array(count * 3);
  const rand = new Float32Array(count);
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  for (let i = 0; i < count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    const cx = (a.x + b.x + c.x) / 3;
    const cy = (a.y + b.y + c.y) / 3;
    const cz = (a.z + b.z + c.z) / 3;
    const r = Math.random();
    for (let k = 0; k < 3; k += 1) {
      const j = i + k;
      centroids.set([cx, cy, cz], j * 3);
      bary.set([k === 0 ? 1 : 0, k === 1 ? 1 : 0, k === 2 ? 1 : 0], j * 3);
      rand[j] = r;
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', pos);
  geometry.setAttribute('aCentroid', new BufferAttribute(centroids, 3));
  geometry.setAttribute('aBary', new BufferAttribute(bary, 3));
  geometry.setAttribute('aRand', new BufferAttribute(rand, 1));
  source.dispose();
  return geometry;
}

export function createArtifact(container, { reducedMotion = false, onFrame } = {}) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 8.2);

  const accent = new Color('#6e70ff');
  const ink = new Color('#e6e8ff');

  const root = new Group();
  root.rotation.set(0.35, -0.4, 0.12);
  scene.add(root);

  const coreUniforms = {
    uTime: { value: 0 },
    uFlux: { value: 0 },
    uPointer: { value: new Vector3(0.4, 0.3, 1) },
    uAccent: { value: accent },
    uInk: { value: ink },
  };
  const core = new Mesh(
    new IcosahedronGeometry(1.32, 40),
    new ShaderMaterial({ vertexShader: coreVertex, fragmentShader: coreFragment, uniforms: coreUniforms }),
  );
  root.add(core);

  const shardUniforms = {
    uTime: coreUniforms.uTime,
    uExplode: { value: 0 },
    uFade: { value: 1 },
    uInk: { value: ink },
    uAccent: { value: accent },
  };
  const shards = new Mesh(
    buildShardGeometry(1.95, 2),
    new ShaderMaterial({
      vertexShader: shardVertex,
      fragmentShader: shardFragment,
      uniforms: shardUniforms,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    }),
  );
  root.add(shards);

  const orbit = new Group();
  orbit.rotation.set(1.18, 0.18, -0.42);
  const ring = new Mesh(
    new TorusGeometry(2.55, 0.0045, 6, 320),
    new MeshBasicMaterial({ color: ink, transparent: true, opacity: 0.28 }),
  );
  const satellite = new Mesh(
    new SphereGeometry(0.045, 16, 16),
    new MeshBasicMaterial({ color: accent, blending: AdditiveBlending }),
  );
  orbit.add(ring, satellite);
  scene.add(orbit);

  // Interaction state (smoothed every frame)
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const flux = { value: 0, target: 0 };
  let scroll = 0;
  let width = 1;
  let height = 1;

  function resize() {
    width = Math.max(1, container.clientWidth);
    height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    camera.aspect = width / height;
    // Keep the object fully framed on tall (mobile) containers.
    camera.position.z = camera.aspect < 1 ? 8.2 / Math.max(camera.aspect, 0.62) : 8.2;
    camera.updateProjectionMatrix();
    if (reducedMotion) render(0);
  }

  const pointerDir = new Vector3();
  let lastTime = 0;

  function render(t) {
    const time = t / 1000;
    const dt = Math.min(0.05, time - lastTime || 0.016);
    lastTime = time;

    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3.2);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3.2);
    flux.value += (flux.target - flux.value) * Math.min(1, dt * 1.6);
    flux.target *= 0.96;

    coreUniforms.uTime.value = reducedMotion ? 4 : time;
    coreUniforms.uFlux.value = flux.value;

    root.rotation.y = -0.4 + (reducedMotion ? 0 : time * 0.06) + pointer.x * 0.5;
    root.rotation.x = 0.35 + pointer.y * 0.35;
    orbit.rotation.z = -0.42 + (reducedMotion ? 0 : time * 0.04);
    const angle = reducedMotion ? 2.2 : time * 0.45;
    satellite.position.set(Math.cos(angle) * 2.55, Math.sin(angle) * 2.55, 0);

    // Pointer direction in the object's local space, so the lit area follows the cursor.
    pointerDir.set(pointer.x * 1.6, pointer.y * 1.6, 1).normalize();
    root.updateMatrixWorld();
    const inv = root.matrixWorld.clone().invert();
    pointerDir.transformDirection(inv);
    coreUniforms.uPointer.value.copy(pointerDir);

    shardUniforms.uExplode.value = scroll * 1.1;
    shardUniforms.uFade.value = 1 - scroll * 0.6;
    root.scale.setScalar(1 - scroll * 0.12);

    renderer.render(scene, camera);
    if (onFrame) onFrame({ rx: root.rotation.x, ry: root.rotation.y, flux: flux.value });
  }

  let raf = 0;
  let running = false;
  const loop = (t) => {
    render(t);
    raf = requestAnimationFrame(loop);
  };

  function start() {
    if (running || reducedMotion) return;
    running = true;
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();
  render(0);

  return {
    start,
    stop,
    setPointer(x, y) {
      const dx = x - pointer.tx;
      const dy = y - pointer.ty;
      flux.target = Math.min(1, flux.target + Math.hypot(dx, dy) * 1.4);
      pointer.tx = x;
      pointer.ty = y;
      if (reducedMotion) render(0);
    },
    setScroll(p) {
      scroll = p;
      if (reducedMotion) render(0);
    },
    dispose() {
      stop();
      ro.disconnect();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
