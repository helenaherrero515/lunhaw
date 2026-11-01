// @ts-nocheck
// Lunhaw Landing Page 3D & Animation Engine
// Extracted verbatim from Lunhaw-landingpage.html

import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

export function initLunhawVisuals() {
  if (typeof window === "undefined") return;

  window.THREE = THREE;
  window.gsap = gsap;
  window.ScrollTrigger = ScrollTrigger;
  window.Lenis = Lenis;

  // Execute verbatim script:
  
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function hasWebGL() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }
  if (reduce || !window.THREE || !window.gsap || !window.ScrollTrigger || !hasWebGL()) return; // plain static layout
  root.classList.add('js');

  var T = THREE;
  gsap.registerPlugin(ScrollTrigger);
  var $ = function (s) { return document.querySelector(s); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var easeOutBack = function (t) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- smooth scroll (Lenis synced to GSAP) ---------- */
  var lenis = null;
  try {
    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  } catch (e) { lenis = null; }
  document.querySelectorAll('[data-scroll]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var el = document.querySelector(a.getAttribute('href'));
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: a.getAttribute('href') === '#top' ? 0 : -70, duration: 1.4 });
      else el.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------- geometry helpers ---------- */
  var P = { mint: 0xB7F9ED, lime: 0x98D746, forest: 0x245C43, leaf: 0x6B9B72, off: 0xF7F7F0, char: 0x26332D, white: 0xFFFFFF, bark: 0x7B5E45, road: 0x3A4640, plaza: 0xE4ECD9, glass: 0x9FD8CF };
  var mats = {};
  function M(c) { return mats[c] || (mats[c] = new T.MeshLambertMaterial({ color: c })); }
  function mesh(g, c) { return new T.Mesh(g, M(c)); }
  function box(w, h, d, c, x, y, z) { var m = mesh(new T.BoxGeometry(w, h, d), c); m.position.set(x || 0, (y || 0) + h / 2, z || 0); return m; }
  function cyl(rt, rb, h, c, x, y, z, seg) { var m = mesh(new T.CylinderGeometry(rt, rb, h, seg || 16), c); m.position.set(x || 0, (y || 0) + h / 2, z || 0); return m; }
  function cone(r, h, c, x, y, z, seg) { return cyl(0, r, h, c, x, y, z, seg || 7); }
  function ball(r, c, x, y, z) { var m = mesh(new T.SphereGeometry(r, 16, 12), c); m.position.set(x || 0, y || 0, z || 0); return m; }
  function grp() { var g = new T.Group(); for (var i = 0; i < arguments.length; i++) g.add(arguments[i]); return g; }
  function gable(w, h, d, c) {
    var s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
    var g = new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2);
    return mesh(g, c);
  }
  function tree(s, round) {
    var g = new T.Group(); g.add(cyl(.1, .15, .6, P.bark));
    var c = new T.Group();
    if (round) { c.add(ball(.72, P.forest, 0, 1.15, 0)); c.add(ball(.5, P.leaf, .3, 1.55, .1)); }
    else { c.add(cone(.78, 1.1, P.forest, 0, .45)); c.add(cone(.56, .95, P.leaf, 0, 1.1)); }
    g.add(c); g.userData.canopy = c; g.scale.setScalar(s || 1); return g;
  }
  function building(w, h, d, c) {
    var g = new T.Group(); g.add(box(w, h, d, c)); g.add(box(w + .12, .12, d + .12, P.leaf, 0, h, 0));
    var rows = Math.max(1, Math.floor((h - .3) / .9)), nx = Math.max(1, Math.floor(w / .9)), nz = Math.max(1, Math.floor(d / .9));
    for (var r = 0; r < rows; r++) {
      var y = .5 + r * .9;
      for (var i = 0; i < nx; i++) g.add(box(.34, .42, .05, P.glass, -w / 2 + (w / nx) * (i + .5), y, d / 2 + .02));
      for (var k = 0; k < nz; k++) g.add(box(.05, .42, .34, P.glass, w / 2 + .02, y, -d / 2 + (d / nz) * (k + .5)));
    }
    return g;
  }
  function lamp(h) { var g = new T.Group(); g.add(cyl(.05, .07, h || 1.8, P.char)); g.add(ball(.16, 0xFFF4B8, 0, h || 1.8, 0)); return g; }
  function bench() { var g = new T.Group(); g.add(box(1.1, .1, .4, P.bark, 0, .32, 0)); g.add(box(1.1, .35, .08, P.bark, 0, .45, -.2)); g.add(box(.08, .32, .36, P.char, -.45, 0, 0)); g.add(box(.08, .32, .36, P.char, .45, 0, 0)); return g; }
  function vehicle(len, h, c, stripe) {
    var g = new T.Group(); g.add(box(.9, h, len, c, 0, .18, 0)); g.add(box(.92, .12, len * .86, stripe, 0, .18 + h * .45, 0));
    g.add(box(.94, h * .32, len * .72, P.glass, 0, .18 + h * .55, 0));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p) { var w = cyl(.2, .2, .14, P.char, p[0] * .46, 0, p[1] * len * .32, 14); w.rotation.z = Math.PI / 2; w.position.y = .2; g.add(w); });
    return g;
  }
  function library() {
    var g = new T.Group();
    g.add(box(3.4, .12, 2.6, P.white, 0, 0, .1));
    g.add(box(3.0, .12, .6, P.off, 0, .12, 1.4));
    g.add(box(2.6, 1.3, 1.7, P.off, 0, .24, -.1));
    for (var i = 0; i < 4; i++) g.add(cyl(.1, .1, 1.3, P.white, -1.05 + i * .7, .24, .95, 12));
    g.add(box(2.9, .16, .72, P.white, 0, 1.54, .85));
    var gb = gable(3.0, .75, .72, P.mint); gb.position.set(0, 1.7, .85); g.add(gb);
    g.add(box(2.8, .1, 1.8, P.leaf, 0, 1.54, -.1));
    g.add(box(.5, .72, .06, P.forest, 0, .24, .8));
    g.add(box(1.0, .26, .06, P.lime, 0, 1.18, .84));
    return g;
  }
  function hopper() {
    var g = new T.Group(), b = new T.Group(); g.add(b);
    b.add(ball(.46, P.lime, .32, .64, 0));
    b.add(ball(.15, P.white, .68, .74, .22)); b.add(ball(.15, P.white, .68, .74, -.22));
    b.add(ball(.08, P.char, .8, .74, .22)); b.add(ball(.08, P.char, .8, .74, -.22));
    var tor = ball(.4, P.leaf, -.38, .44, 0); tor.scale.set(1.5, .9, .9); b.add(tor);
    var wings = [];
    [1, -1].forEach(function (s) { var w = box(.85, .04, .4, P.mint, 0, 0, 0); w.position.set(-.42, .95, .3 * s); wings.push(w); b.add(w); });
    var ants = [];
    [1, -1].forEach(function (s) {
      var a = cyl(.03, .03, .7, P.forest, .28, 1.0, .18 * s, 8); a.rotation.z = -.28; a.rotation.x = .18 * s;
      var tip = ball(.12, P.lime, 0, .38, 0); tip.scale.set(1.8, .5, 1); a.add(tip); ants.push(a); b.add(a);
    });
    [[-.75, .24], [-.75, -.24], [.0, .22], [.0, -.22]].forEach(function (p) { var l = cyl(.05, .05, .5, P.forest, p[0], .05, p[1], 8); l.rotation.z = p[0] < -.3 ? .6 : -.2; b.add(l); });
    g.userData = { b: b, wings: wings, ants: ants };
    return g;
  }
  function animHopper(h, t, amp, spd) {
    var u = h.userData, s = Math.sin(t * spd);
    u.b.position.y = Math.abs(s) * amp; u.b.rotation.z = s * .06;
    u.wings[0].rotation.x = Math.sin(t * 28) * .35 + .2; u.wings[1].rotation.x = -Math.sin(t * 28) * .35 - .2;
    u.ants[0].rotation.x = .18 + Math.sin(t * 3) * .12; u.ants[1].rotation.x = -.18 - Math.sin(t * 3 + 1) * .12;
  }

  /* ---------- stage framework + single rAF loop ---------- */
  var stages = [];
  function makeStage(canvas, o) {
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (T.SRGBColorSpace) {
      renderer.outputColorSpace = T.SRGBColorSpace;
    }
    renderer.toneMapping = T.NoToneMapping;

    var scene = new T.Scene();
    var camera = new T.OrthographicCamera(-1, 1, 1, -1, -60, 120);
    scene.add(new T.AmbientLight(0xffffff, 0.96));
    var sun = new T.DirectionalLight(0xffffff, 1.15);
    sun.position.set(6, 15, 9);
    scene.add(sun);
    var fill = new T.DirectionalLight(0xfffef0, 0.42);
    fill.position.set(-8, 12, 6);
    scene.add(fill);
    var hemi = new T.HemisphereLight(0xffffff, 0x98D746, 0.38);
    scene.add(hemi);

    var st = { canvas: canvas, renderer: renderer, scene: scene, camera: camera, size: o.size, minHalfW: o.minHalfW || 0, cam: new T.Vector3(o.cam[0], o.cam[1], o.cam[2]), look: new T.Vector3((o.look || [0, 0, 0])[0], (o.look || [0, 0, 0])[1], (o.look || [0, 0, 0])[2]), visible: false, update: function () {} };
    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false);
      var a = w / h, s = Math.max(st.size, st.minHalfW / a);
      camera.left = -s * a; camera.right = s * a; camera.top = s; camera.bottom = -s; camera.updateProjectionMatrix();
    }
    st.resize = resize;
    camera.position.copy(st.cam); camera.lookAt(st.look);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
    if (window.IntersectionObserver) new IntersectionObserver(function (e) { st.visible = e[0].isIntersecting; }, { rootMargin: '120px' }).observe(canvas); else st.visible = true;
    stages.push(st); resize(); return st;
  }
  var clock = new T.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    if (document.hidden) { clock.getDelta(); return; }
    var dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
    for (var i = 0; i < stages.length; i++) {
      var st = stages[i]; if (!st.visible) continue;
      st.update(t, dt); st.renderer.render(st.scene, st.camera);
    }
  })();

  function draggable(canvas, group, range) {
    var drag = false, sx = 0, base = 0, rot = 0, target = 0;
    canvas.addEventListener('pointerdown', function (e) { drag = true; sx = e.clientX; base = target; try { canvas.setPointerCapture(e.pointerId); } catch (x) {} canvas.classList.add('grab'); });
    canvas.addEventListener('pointermove', function (e) { if (drag) target = clamp(base + (e.clientX - sx) * .006, -range, range); });
    var end = function () { drag = false; canvas.classList.remove('grab'); };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    return function (dt, idle) { rot += (target - rot) * Math.min(1, dt * 8); group.rotation.y = rot + (idle || 0); };
  }

  /* ---------- hero scene: NCR map + hopping grasshopper ---------- */
  (function hero() {
    var canvas = $('#hero-canvas'); if (!canvas) return;
    var st = makeStage(canvas, { size: 4.5, cam: [3, 13, 13], look: [0, 0, .2], minHalfW: 5.2 });
    var world = new T.Group(); st.scene.add(world);
    var add = function (o) { world.add(o); return o; };
               // Manila Bay + surrounding water
    var H = .3, G = .12 + H;                               // ground height of land
    var CITIES = [
      [[-3.8,-6],[-1.6,-6.8],[-.8,-5],[-2.6,-4.2]],
      [[-1.6,-6.8],[1.8,-6.8],[3.2,-4.6],[2.6,-2.6],[.6,-2.4],[-.6,-3.4],[-.8,-5]],
      [[-2.6,-4.2],[-.8,-5],[-.6,-3.4],[-1.8,-2.6],[-3,-3]],
      [[-4,-4.4],[-2.6,-4.2],[-3,-3],[-4,-3.2]],
      [[-4,-3.2],[-3,-3],[-3.2,-2.2],[-4.2,-2.4]],
      [[-3.2,-2.2],[-1.8,-2.6],[-1,-1.6],[-1.2,0],[-3.2,0]],
      [[-1.8,-2.6],[-.6,-3.4],[.6,-2.4],[-.2,-1.6],[-1,-1.6]],
      [[-1,-1.6],[-.2,-1.6],[.4,-.6],[-.4,0],[-1.2,0]],
      [[.6,-2.4],[2.6,-2.6],[3,-.6],[1.8,.4],[.4,-.6],[-.2,-1.6]],
      [[2.6,-2.6],[3.8,-3.2],[4,-1.2],[3,-.6]],
      [[-1.2,0],[-.4,0],[.4,-.6],[1,.6],[.2,1.8],[-1,1.6]],
      [[-3.2,0],[-1.2,0],[-1,1.6],[-2.6,2]],
      [[.4,-.6],[1.8,.4],[2.4,2],[1.2,3],[.2,1.8],[1,.6]],
      [[-2.6,2],[-1,1.6],[.2,1.8],[.4,3.4],[-1.6,3.6],[-2.8,3]],
      [[-1.6,3.6],[.4,3.4],[.2,5],[-1.8,4.8]],
      [[.4,3.4],[1.2,3],[2,4],[1.4,6.4],[.2,6],[.2,5]]
    ];
    var TINT = [0x98D746, 0xB4E26A, 0xA3DB86, 0xC3EC8F, 0x8FD05C, 0xADE07A];
    function poly(pts, h, c, k) {
      var cx = 0, cz = 0; pts.forEach(function (p) { cx += p[0]; cz += p[1]; }); cx /= pts.length; cz /= pts.length;
      var sh = new T.Shape();
      pts.forEach(function (p, i) { var x = cx + (p[0] - cx) * k, z = cz + (p[1] - cz) * k; if (i) sh.lineTo(x, -z); else sh.moveTo(x, -z); });
      sh.closePath();
      var g = new T.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false }); g.rotateX(-Math.PI / 2);
      return mesh(g, c);
    }
    CITIES.forEach(function (p, i) {
      add(poly(p, .12, P.forest, 1.02));
      var top = poly(p, H, TINT[i % TINT.length], .955); top.position.y = .12; add(top);
    });
    // skyline in Makati / Taguig / Ortigas, plus a few trees
    [[-.2,.1,1.7],[.3,.5,2.3],[.9,1.2,2],[1.6,1.1,2.6],[1.1,-1.5,1.7],[.2,-1.2,1.3],[-.7,-.6,1.2],[-2.3,1.3,1],[-1.2,-3.7,1],[1.8,-5.3,1.1],[2.2,-3.1,.9]].forEach(function (b, i) {
      var g = building(.5, b[2], .5, i % 3 ? P.white : P.off); g.position.set(b[0], G, b[1]); add(g);
    });
    var rnd = rng(11), clouds = [];
    for (var i = 0; i < 26; i++) {
      var tx = -3.5 + rnd() * 7.5, tz = -6 + rnd() * 11.5, t = tree(.38 + rnd() * .2, i % 2 === 0); t.position.set(tx, G, tz); add(t);
    }
    for (var c = 0; c < 3; c++) {
      var cg = new T.Group(); [[0,0,0,.8],[.8,-.1,.2,.6],[-.8,-.05,-.1,.55],[.2,.25,.1,.5]].forEach(function (s) { var m = mesh(new T.SphereGeometry(s[3], 12, 10), P.white); m.position.set(s[0], s[1], s[2]); cg.add(m); });
      cg.position.set(-9 + c * 7, 7 + (c % 2) * .8, -5 + c * 4); cg.scale.set(1, .6, 1); cg.userData.sp = .22 + c * .06; add(cg); clouds.push(cg);
    }
    // parks and libraries
    function park() { var g = new T.Group(); g.add(cyl(.62, .62, .08, 0xD8FFF8, 0, 0, 0, 24)); g.add(cyl(.5, .5, .12, P.lime, 0, 0, 0, 24)); var a = tree(.55, true); a.position.set(-.18, .1, .1); g.add(a); var b = tree(.48, false); b.position.set(.22, .1, -.12); g.add(b); return g; }
    function lib() { var g = library(); g.scale.setScalar(.34); return g; }
    var STOPS = [
      ['Rizal Park', 'Park', -2.6, -.5], ['National Library', 'Library', -1.9, -1.5],
      ['Ayala Triangle Gardens', 'Park', -.2, .8], ['Taguig City Library', 'Library', 1.4, 1.6],
      ['Pasig City Library', 'Library', 1.6, -1], ['Marikina River Park', 'Park', 3.3, -2.1],
      ['Quezon City Public Library', 'Library', 1.6, -3.8], ['La Mesa Eco Park', 'Park', .4, -5.3]
    ].map(function (a) {
      var o = a[1] === 'Park' ? park() : lib(); o.position.set(a[2], G, a[3]); add(o);
      return { n: a[0], t: a[1], x: a[2], z: a[3], o: o, s: o.scale.x };
    });
    var hop = hopper(); hop.scale.setScalar(.62); world.add(hop);
    var cur = 0, nxt = 1, phase = 'wait', timer = .9, u = 0, dur = 1, dist = 1, label = $('#hop-name');
    hop.position.set(STOPS[0].x, G + .1, STOPS[0].z);
    function bounce(sp) { gsap.fromTo(sp.o.scale, { x: sp.s * 1.35, y: sp.s * 1.35, z: sp.s * 1.35 }, { x: sp.s, y: sp.s, z: sp.s, duration: .8, ease: 'elastic.out(1,.4)' }); }
    gsap.from(world.scale, { x: .5, y: .5, z: .5, duration: 1.2, ease: 'back.out(1.4)' });
    var mx = 0, my = 0, rotY = 0;
    window.addEventListener('pointermove', function (e) { mx = e.clientX / window.innerWidth - .5; my = e.clientY / window.innerHeight - .5; });
    st.update = function (t, dt) {
      rotY += (mx * .2 - rotY) * Math.min(1, dt * 3); world.rotation.y = rotY + Math.sin(t * .2) * .03;
      st.camera.position.y = st.cam.y + my * -.8; st.camera.lookAt(st.look);
      clouds.forEach(function (c) { c.position.x += dt * c.userData.sp; if (c.position.x > 11) c.position.x = -11; });
      var a = STOPS[cur], b = STOPS[nxt];
      if (phase === 'wait') {
        timer -= dt; animHopper(hop, t, .06, 4);
        if (timer <= 0) {
          phase = 'hop'; u = 0; dist = Math.hypot(b.x - a.x, b.z - a.z); dur = .8 + dist * .16;
          hop.rotation.y = Math.atan2(-(b.z - a.z), b.x - a.x);
        }
      } else {
        u = Math.min(1, u + dt / dur);
        var e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        hop.position.x = a.x + (b.x - a.x) * u; hop.position.z = a.z + (b.z - a.z) * u;
        hop.position.y = G + .1 + Math.sin(Math.PI * u) * (1 + dist * .35);
        hop.userData.b.rotation.z = -Math.cos(Math.PI * u) * .35;
        animHopper(hop, t, 0, 1);
        if (u >= 1) {
          cur = nxt; nxt = (nxt + 1) % STOPS.length; phase = 'wait'; timer = 1; bounce(b);
          hop.userData.b.rotation.z = 0;
          if (label) label.textContent = 'Hopped onto ' + b.n + ' · ' + b.t;
        }
      }
    };
    /* --- depth & polish: diorama base, river, roads, shadows, pins, trail, ripples, leaves --- */
    add(box(10.6, .5, 15.4, 0xB9DE97, 0, -.5, .2));
    function seg(a, b, w, c, y) { var dx = b[0] - a[0], dz = b[1] - a[1], m = box(Math.hypot(dx, dz), .03, w, c, (a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2); m.rotation.y = Math.atan2(-dz, dx); return add(m); }
    function line(pts, w, c, y) { for (var i = 1; i < pts.length; i++) seg(pts[i - 1], pts[i], w, c, y); }
    line([[-3.2,-.8],[-2,-1],[-1,-.9],[0,-1.2],[1,-1.4],[2,-1.6],[3,-2.1]], .24, 0xB7F9ED, G);            // Pasig River
    line([[-1.6,-5.8],[-1,-3.9],[-.6,-1.6],[-.1,.9],[.3,3.6]], .1, 0xFFFFFF, G + .03);                 // main avenue
    line([[-3.4,-3.4],[-1.8,-1.2],[-.4,-.2],[1.4,.6],[3.2,-.4]], .08, 0xF7F7F0, G + .03);
    var sun = st.scene.children.filter(function (o) { return o.isDirectionalLight; })[0];
    if (sun) {
      st.renderer.shadowMap.enabled = true; st.renderer.shadowMap.type = T.PCFSoftShadowMap;
      sun.position.set(-5, 12, 6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0006;
      var sc = sun.shadow.camera; sc.left = -10; sc.right = 10; sc.top = 10; sc.bottom = -10; sc.near = 1; sc.far = 40; sc.updateProjectionMatrix();
      world.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    }
    var pins = STOPS.map(function (sp, i) {
      var col = sp.t === 'Park' ? P.lime : 0xFFC94D, g = new T.Group();
      g.add(cyl(.025, .025, .9, P.char, 0, 0, 0, 6)); g.add(ball(.2, col, 0, 1, 0)); g.add(ball(.075, P.white, 0, 1, .17));
      g.position.set(sp.x - .45, G, sp.z - .35); add(g); return g;
    });
    var trail = [], ti = 0, tAcc = 0, leaves = [], prev = 'wait';
    for (var q = 0; q < 24; q++) { var tb = ball(.07, P.white, 0, -9, 0); tb.userData.l = 0; tb.scale.setScalar(.001); add(tb); trail.push(tb); }
    for (var l = 0; l < 12; l++) { var lf = mesh(new T.BoxGeometry(.2, .03, .12), l % 2 ? P.lime : P.leaf); lf.position.set(-4 + rnd() * 8, 1 + rnd() * 4, -6 + rnd() * 12); lf.userData = { v: .3 + rnd() * .3, s: rnd() * 3 }; add(lf); leaves.push(lf); }
    function ripple(sp) {
      var r = new T.Mesh(new T.RingGeometry(.3, .42, 28), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .95, side: T.DoubleSide }));
      r.rotation.x = -Math.PI / 2; r.position.set(sp.x, G + .05, sp.z); world.add(r);
      gsap.to(r.scale, { x: 3.4, y: 3.4, duration: 1, ease: 'power2.out' });
      gsap.to(r.material, { opacity: 0, duration: 1, onComplete: function () { world.remove(r); } });
    }
    var baseUpdate = st.update;
    st.update = function (t, dt) {
      baseUpdate(t, dt);
      pins.forEach(function (p, i) {
        var on = (i === nxt && phase === 'hop') || (i === cur && phase === 'wait'), s = p.scale.x + ((on ? 1.35 : 1) - p.scale.x) * Math.min(1, dt * 6);
        p.scale.setScalar(s); p.children[1].position.y = 1 + Math.sin(t * 2.2 + i) * .07; p.children[2].position.y = p.children[1].position.y;
      });
      if (phase === 'hop') { tAcc += dt; if (tAcc > .05) { tAcc = 0; var d = trail[ti++ % trail.length]; d.position.set(hop.position.x, G + .06, hop.position.z); d.userData.l = 1; } }
      if (prev === 'hop' && phase === 'wait') ripple(STOPS[cur]);
      prev = phase;
      trail.forEach(function (d) { d.userData.l = Math.max(0, d.userData.l - dt * .7); d.scale.setScalar(Math.max(.001, d.userData.l)); });
      leaves.forEach(function (lf) { var u = lf.userData; lf.position.y -= dt * u.v; lf.position.x += Math.sin(t * 1.3 + u.s) * dt * .25; lf.rotation.x += dt * 1.5; lf.rotation.z += dt; if (lf.position.y < G + .3) lf.position.y = 5 + Math.random(); });
    };
    // headline + copy entrance
    gsap.killTweensOf('#hero-title .ln > span, #hero-lead, #hero-cta .btn');
    var tl = gsap.timeline({ delay: .1 });
    tl.fromTo('#hero-title .ln > span', { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: .9, ease: 'power3.out', stagger: .12 })
      .fromTo('#hero-lead', { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: .8, ease: 'power3.out' }, '-=.55')
      .fromTo('#hero-cta .btn', { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: 'power3.out', stagger: .1 }, '-=.5');
  })();

  /* ---------- pinned journey ---------- */
  (function journey() {
    var canvas = $('#journey-canvas'); if (!canvas) return;
    var st = makeStage(canvas, { size: 5.6, cam: [9, 8, 9], minHalfW: 6.4 });
    var world = new T.Group(); st.scene.add(world);
    var W = [[-9, 7], [-5, 7], [-5, 2], [0, 2], [0, -3], [5, -3], [5, -7]], segs = [], L = 0;
    for (var i = 1; i < W.length; i++) { var a = W[i - 1], b = W[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push({ a: a, b: b, l: l, s: L }); L += l; }
    function at(u) {
      var d = clamp(u, 0, 1) * L;
      for (var k = 0; k < segs.length; k++) { var s = segs[k]; if (d <= s.s + s.l + 1e-6) { var f = (d - s.s) / s.l; return { x: s.a[0] + (s.b[0] - s.a[0]) * f, z: s.a[1] + (s.b[1] - s.a[1]) * f, dx: s.b[0] - s.a[0], dz: s.b[1] - s.a[1] }; } }
      var e = segs[segs.length - 1]; return { x: e.b[0], z: e.b[1], dx: e.b[0] - e.a[0], dz: e.b[1] - e.a[1] };
    }
    var items = [];
    function reg(o, s, d, k) { o.scale.setScalar(.0001); o.visible = false; world.add(o); items.push({ o: o, s: s, d: d, k: k || 1 }); return o; }
    var ground = new T.Group(); ground.add(box(24, .5, 22, P.forest, 0, -.5, 0)); ground.add(box(24, .16, 22, P.lime, 0, 0, 0)); ground.position.set(-2, 0, 0); reg(ground, 0, .06);
    // path tiles that darken once walked
    var tiles = [], n = Math.floor(L / .9);
    for (var t = 0; t <= n; t++) {
      var u = t / n, p = at(u), tm = new T.MeshLambertMaterial({ color: P.off });
      var tile = new T.Mesh(new T.BoxGeometry(.84, .08, .84), tm); tile.position.set(p.x, .16 + .04, p.z);
      var g = new T.Group(); g.add(tile); g.position.set(0, 0, 0); reg(g, Math.max(0, u * .92 - .1), .08);
      tiles.push({ m: tm, th: .04 + u * .92 });
    }
    var apt = building(2.1, 4.4, 2.1, P.mint); apt.position.set(-10.6, .16, 6.2); reg(apt, .0, .1);
    var apt2 = building(1.8, 3.0, 2.0, P.off); apt2.position.set(-10.6, .16, 9.2); reg(apt2, .02, .1);
    var stop = new T.Group(); stop.add(cyl(.05, .05, 1.7, P.char, -.6, 0, 0)); stop.add(cyl(.05, .05, 1.7, P.char, .6, 0, 0)); stop.add(box(1.5, .1, .9, P.forest, 0, 1.7, 0)); stop.add(box(1.2, .06, .06, P.char, 0, .5, -.4)); stop.add(box(.5, .35, .06, P.lime, 1.0, 1.4, .5));
    stop.position.set(-3.7, .16, 4.8); stop.rotation.y = Math.PI / 2; reg(stop, .1, .09);
    var jeep = vehicle(2.0, .7, P.lime, P.forest); jeep.position.set(-2.4, .16, 6.0); jeep.rotation.y = Math.PI / 2; jeep.userData.x0 = -2.4; reg(jeep, .16, .1);
    var tp = [[2, 3.4], [3.6, 1.2], [2.2, -.2], [3.2, -1.2], [-2, 3], [-3, 4.6], [-2.2, -.6], [-3, -2.6], [-1.6, -5], [2.2, -5.4], [3, -6.6], [7.6, -1], [7.4, 2.2], [-7.6, -2], [-8, .2], [-4.4, 8.6], [8, -5]];
    var forest = [];
    tp.forEach(function (p, i) { var tr = tree(.9 + (i % 3) * .12, i % 2 === 0); tr.position.set(p[0], .16, p[1]); tr.userData.ph = i; reg(tr, .22 + (i % 6) * .07, .1, tr.scale.x); forest.push(tr); });
    var pond = new T.Group(); pond.add(cyl(1.5, 1.5, .06, P.mint, 0, 0, 0, 28)); pond.add(cyl(1.08, 1.08, .09, 0xD8FFF8, 0, 0, 0, 28)); pond.position.set(-3.8, .16, -1.4); reg(pond, .36, .1);
    var bn = bench(); bn.position.set(1.3, .16, .2); bn.rotation.y = Math.PI / 2; reg(bn, .42, .08);
    var rb = building(1.7, 3.2, 2.2, P.off); rb.position.set(9, .16, 1.5); reg(rb, .12, .12);
    var rb2 = building(1.7, 2.2, 2.2, P.mint); rb2.position.set(9, .16, -2.2); reg(rb2, .3, .12);
    var lib = library(); lib.scale.setScalar(1); lib.position.set(5, .16, -9.4); reg(lib, .72, .2);
    [[-5.8, 5], [-.8, 2.8], [.8, -1], [3.6, -3.8], [5.8, -5.5]].forEach(function (p, i) { var lp = lamp(1.8); lp.position.set(p[0], .16, p[1]); reg(lp, .1 + i * .15, .08); });
    var hop = hopper(); hop.scale.setScalar(.8); world.add(hop);
    var panels = [].slice.call(document.querySelectorAll('#panels .panel')), dots = [].slice.call(document.querySelectorAll('.dots .dot')), step = 0;
    function setStep(i) { if (i === step) return; step = i; panels.forEach(function (p, k) { p.classList.toggle('on', k === i); }); dots.forEach(function (d, k) { d.classList.toggle('on', k === i); }); }
    var target = 0, prog = 0, face = 0, look = new T.Vector3(-9, 0, 7), lit = new T.Color(P.forest), plain = new T.Color(P.off);
    ScrollTrigger.create({ trigger: '.journey', start: 'top top', end: 'bottom bottom', onUpdate: function (s) { target = s.progress; } });
    st.update = function (t, dt) {
      prog += (target - prog) * Math.min(1, dt * 5);
      items.forEach(function (it) {
        var u = clamp((prog - it.s) / it.d, 0, 1); it.o.visible = u > 0;
        it.o.scale.setScalar(Math.max(.0001, easeOutBack(u) * it.k));
      });
      tiles.forEach(function (tl) { tl.m.color.lerp(prog > tl.th ? lit : plain, .18); });
      var u = .02 + prog * .96, p = at(u);
      hop.position.set(p.x, .16 + .22, p.z);
      var want = Math.atan2(-p.dz, p.dx), dA = ((want - face + Math.PI * 3) % (Math.PI * 2)) - Math.PI; face += dA * Math.min(1, dt * 6); hop.rotation.y = face;
      animHopper(hop, t, .34, 7);
      forest.forEach(function (tr) { tr.userData.canopy.rotation.z = Math.sin(t * 1.3 + tr.userData.ph) * .04; });
      jeep.position.x = jeep.userData.x0 + Math.max(0, prog - .3) * 46; jeep.visible = jeep.position.x < 8 && jeep.scale.x > .01;
      look.x += (p.x - look.x) * Math.min(1, dt * 3.5); look.z += (p.z - look.z) * Math.min(1, dt * 3.5);
      st.camera.position.set(look.x + 9, 8, look.z + 9); st.camera.lookAt(look.x, 0, look.z);
      setStep(prog < .34 ? 0 : prog < .68 ? 1 : 2);
    };
  })();

  /* ---------- green index: street with trees ---------- */
  (function green() {
    var canvas = $('#green-canvas'); if (!canvas) return;
    var st = makeStage(canvas, { size: 5.2, cam: [10, 8.5, 10], look: [0, .6, 0], minHalfW: 6.6 });
    var world = new T.Group(); st.scene.add(world);
    world.add(box(11, .5, 8.4, P.forest, 0, -.5, 0));
    world.add(box(11, .14, 8.4, P.plaza, 0, 0, 0));
    world.add(box(11, .16, 2.4, P.road, 0, .0, 0));
    for (var x = -4.8; x <= 4.8; x += 1.3) world.add(box(.6, .03, .08, P.white, x, .16, 0));
    world.add(box(11, .2, 1.0, P.off, 0, 0, -1.75)); world.add(box(11, .2, 1.0, P.off, 0, 0, 1.75));
    var cols = [P.off, P.mint, P.white, P.off, P.mint];
    for (var i = 0; i < 4; i++) { var b = building(2.2, 2.6 + (i % 3) * .9, 1.7, cols[i]); b.position.set(-4.0 + i * 2.7, .14, -3.3); world.add(b); }
    for (var j = 0; j < 4; j++) { var s = building(2.0, 1.2 + (j % 2) * .6, 1.2, cols[j + 1]); s.position.set(-4.0 + j * 2.7, .14, 3.4); world.add(s); }
    var slots = [], rnd = rng(11);
    for (var k = 0; k < 6; k++) { slots.push([-4.5 + k * 1.8, -1.75]); slots.push([-3.6 + k * 1.8, 1.75]); }
    // planting order shuffled so every count looks balanced
    var order = slots.map(function (_, i) { return i; }).sort(function () { return rnd() - .5; });
    var plants = slots.map(function (p, i) {
      var g = new T.Group(), tr = tree(1.0, i % 2 === 0), shade = new T.Mesh(new T.CircleGeometry(1.0, 28), new T.MeshBasicMaterial({ color: 0x0f2a1d, transparent: true, opacity: .22, depthWrite: false }));
      shade.rotation.x = -Math.PI / 2; shade.position.set(.35, .2, .35);
      g.add(shade); g.add(tr); g.position.set(p[0], .2, p[1]); g.scale.setScalar(.0001); g.userData = { tr: tr, on: false, ph: i }; world.add(g); return g;
    });
    var car1 = vehicle(1.3, .55, P.lime, P.forest); car1.rotation.y = Math.PI / 2; car1.position.set(-5, .16, -.55); world.add(car1);
    var car2 = vehicle(1.5, .6, P.mint, P.forest); car2.rotation.y = -Math.PI / 2; car2.position.set(5, .16, .55); world.add(car2);
    var walker = hopper(); walker.scale.setScalar(.6); walker.position.set(-4, .3, 1.75); world.add(walker);
    var out = $('#trees-out'), range = $('#trees'), count = -1;
    function setCount(nv) {
      nv = clamp(Math.round(nv), 0, 12); if (nv === count) return; count = nv;
      plants.forEach(function (g) { g.userData.want = false; });
      for (var q = 0; q < nv; q++) plants[order[q]].userData.want = true;
      plants.forEach(function (g) {
        if (g.userData.want !== g.userData.on) { g.userData.on = g.userData.want; gsap.to(g.scale, { x: g.userData.on ? 1 : .0001, y: g.userData.on ? 1 : .0001, z: g.userData.on ? 1 : .0001, duration: g.userData.on ? .8 : .35, ease: g.userData.on ? 'back.out(2.2)' : 'power2.in', delay: Math.random() * .12 }); }
      });
      if (out) out.textContent = nv + ' of 12 trees planted. Illustration only.';
    }
    if (range) range.addEventListener('input', function () { setCount(range.value); });
    document.querySelectorAll('[data-trees]').forEach(function (b) { b.addEventListener('click', function () { range.value = b.getAttribute('data-trees'); setCount(range.value); }); });
    ScrollTrigger.create({ trigger: canvas, start: 'top 85%', once: true, onEnter: function () { setCount(range ? range.value : 4); } });
    var drag = draggable(canvas, world, .7);
    st.update = function (t, dt) {
      drag(dt, Math.sin(t * .3) * .05);
      plants.forEach(function (g) { g.userData.tr.userData.canopy.rotation.z = Math.sin(t * 1.3 + g.userData.ph) * .04; });
      car1.position.x += dt * 2.4; if (car1.position.x > 6) car1.position.x = -6;
      car2.position.x -= dt * 2.9; if (car2.position.x < -6) car2.position.x = 6;
      walker.position.x = -3.6 + (Math.sin(t * .35) * .5 + .5) * 6.8; walker.rotation.y = Math.cos(t * .35) > 0 ? 0 : Math.PI;
      animHopper(walker, t, .22, 6);
    };
  })();

  /* ---------- libraries: books drop onto stacks ---------- */
  (function libs() {
    var canvas = $('#lib-canvas'); if (!canvas) return;
    var st = makeStage(canvas, { size: 5.0, cam: [9, 8, 9], look: [0, 1.0, 0], minHalfW: 6.0 });
    var world = new T.Group(); st.scene.add(world);
    world.add(cyl(5.2, 5.4, .5, P.forest, 0, -.5, 0, 40)); world.add(cyl(5.2, 5.2, .14, P.lime, 0, 0, 0, 40)); world.add(cyl(2.6, 2.6, .18, P.plaza, 0, .14, 0, 40));
    var lib = library(); lib.scale.setScalar(1.15); lib.position.set(0, .2, -.6); world.add(lib);
    [[-4, -2.2], [4, -1.8], [-3.6, 2.4], [3.8, 3]].forEach(function (p, i) { var tr = tree(.95, i % 2 === 0); tr.position.set(p[0], .14, p[1]); tr.userData.ph = i; world.add(tr); lib.userData['t' + i] = tr; });
    var lp = lamp(1.9); lp.position.set(2.2, .2, 2.7); world.add(lp);
    var cols = [P.forest, P.lime, P.mint, P.leaf, P.off, P.char, P.white];
    var rnd = rng(5), books = [], stackPos = [[-2.4, 2.4], [2.6, 2.7], [-3.2, -.2], [3.4, .6]];
    stackPos.forEach(function (sp, si) {
      for (var b = 0; b < 5; b++) {
        var bk = box(.95 - b * .04, .2, .7, cols[(si + b) % cols.length], 0, 0, 0); bk.rotation.y = (rnd() - .5) * .6;
        var fin = { x: sp[0], y: .34 + b * .21, z: sp[1] }; bk.position.set(fin.x, fin.y + 10, fin.z); bk.userData = { fin: fin }; world.add(bk); books.push(bk);
      }
    });
    var floaters = [];
    for (var f = 0; f < 6; f++) { var fb = box(.5, .12, .38, cols[f % cols.length], 0, 0, 0); fb.userData = { a: f / 6 * Math.PI * 2, r: 3.7, y: 2.7 + (f % 2) * .6 }; world.add(fb); floaters.push(fb); }
    var reader = hopper(); reader.scale.setScalar(.8); reader.position.set(0, .35, 2.3); reader.rotation.y = Math.PI / 2; world.add(reader);
    var tl = null;
    function drop() {
      if (tl) tl.kill();
      books.forEach(function (bk) { bk.position.y = bk.userData.fin.y + 10; });
      tl = gsap.timeline();
      books.forEach(function (bk, i) { tl.to(bk.position, { y: bk.userData.fin.y, duration: .9, ease: 'bounce.out' }, i * .07); });
    }
    ScrollTrigger.create({ trigger: canvas, start: 'top 80%', once: true, onEnter: drop });
    var rp = $('#replay'); if (rp) rp.addEventListener('click', drop);
    var drag = draggable(canvas, world, .8);
    st.update = function (t, dt) {
      drag(dt, Math.sin(t * .25) * .06);
      floaters.forEach(function (fb) { var u = fb.userData, a = u.a + t * .5; fb.position.set(Math.cos(a) * u.r, u.y + Math.sin(t * 1.4 + u.a) * .25, Math.sin(a) * u.r - .6); fb.rotation.y = -a; fb.rotation.z = Math.sin(t * 2 + u.a) * .25; });
      for (var i = 0; i < 4; i++) lib.userData['t' + i].userData.canopy.rotation.z = Math.sin(t * 1.2 + i) * .035;
      animHopper(reader, t, .06, 2.2);
    };
  })();

  /* ---------- scroll effects ---------- */
  /* why: pinned scroll story */
  (function () {
    var sec = document.querySelector('.why'); if (!sec) return;
    var eb = sec.querySelector('.eyebrow'),
        h = sec.querySelector('.statement'),
        sub = sec.querySelector('.sub'),
        big = sec.querySelector('.payoff'),
        hl = sec.querySelector('.hl2'),
        hop = sec.querySelector('.why-hopper') as HTMLElement | null,
        ground = sec.querySelector('.ground') as HTMLElement | null,
        decos = sec.querySelectorAll('.deco svg');
    if (!h || !hop) return;
    var words = h.querySelectorAll('.w');
    if (!words.length) {
      var text = (h.textContent || '').trim();
      h.setAttribute('aria-label', text);
      h.innerHTML = text.split(/\s+/).map(function (w) { return '<span class="w" aria-hidden="true">' + w + '</span>'; }).join(' ');
      words = h.querySelectorAll('.w');
    }
    if (hl) gsap.set(hl, { '--sw': 0 });
    gsap.set(hop, { x: 0, y: 0 });
    var tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: .6, invalidateOnRefresh: true } });
    if (eb) tl.from(eb, { y: 20, opacity: 0, duration: .5 }, 0);
    if (sub) tl.to(sub, { y: 0, opacity: 1, duration: 1, ease: 'power2.out' }, 3.0);
    if (big) tl.to(big, { y: 0, scale: 1, opacity: 1, duration: 1.1, ease: 'back.out(1.8)' }, 4.5);
    if (hl) tl.to(hl, { '--sw': 1, duration: 1 }, 5.5);
    tl.fromTo(hop,
      { x: 0 },
      {
        x: function () {
          if (ground) {
            return Math.max(0, ground.offsetWidth - hop!.offsetWidth);
          }
          return Math.max(0, window.innerWidth * 0.88 - hop!.offsetWidth);
        },
        duration: 7.2,
        ease: 'none'
      },
      0
    ).to(hop, {
      keyframes: {
        y: [0, -75, 0, -75, 0, -75, 0, -75, 0, -75, 0, -75, 0, -75, 0],
        easeEach: 'sine.inOut'
      },
      duration: 7.2,
      ease: 'none'
    }, 0);
    var speeds = [-.8, .5, -.4, .9, -.6, .3];
    decos.forEach(function (el, i) {
      var s = speeds[i % speeds.length];
      tl.fromTo(el, { y: 120 * s, rotate: -12 * s }, { y: -160 * s, rotate: 14 * s, duration: 7.2 }, 0);
    });
  })();

  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 92%', once: true,
    onEnter: function (els) { gsap.from(els, { y: 46, scale: .96, duration: .9, ease: 'back.out(1.5)', stagger: .09, overwrite: true }); }
  });


  // marquee speeds up with scroll velocity
  var mq = gsap.to('#track', { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
  var tween = null;
  ScrollTrigger.create({
    onUpdate: function (self) {
      var v = clamp(Math.abs(self.getVelocity()) / 350, 0, 8);
      if (tween) tween.kill();
      tween = gsap.timeline().to(mq, { timeScale: 1 + v, duration: .15 }).to(mq, { timeScale: 1, duration: .9 });
    }
  });

  // stat counters (final number is already in the markup)
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var end = parseInt(el.getAttribute('data-count'), 10), o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () {
      el.textContent = '0';
      if (end === 0) return;
      gsap.to(o, { v: end, duration: 1.4, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(o.v); }, onComplete: function () { el.textContent = end; } });
    } });
  });

  // card tilt
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.tilt').forEach(function (el) {
      var rx = gsap.quickTo(el, 'rotationX', { duration: .4, ease: 'power3' }), ry = gsap.quickTo(el, 'rotationY', { duration: .4, ease: 'power3' });
      gsap.set(el, { transformPerspective: 800 });
      el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - .5) * 9); rx(-((e.clientY - r.top) / r.height - .5) * 9); });
      el.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });
  }

  // closing mascot bob
  gsap.to('#cta-mascot', { y: -14, rotation: 3, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();

}
