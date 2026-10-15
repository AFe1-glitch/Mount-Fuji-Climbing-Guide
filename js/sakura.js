/* ============================================================
   富士山攀登攻略 · sakura.js
   樱花飘落：canvas 绘制，稀疏、缓慢、轻微摆动
   —— 不影响观感的设计约束 ——
   1. canvas 单元素绘制，不产生 DOM 节点，不触发重排
   2. pointer-events:none，所有交互穿透
   3. z-index 低于导航栏，不会盖住菜单
   4. 花瓣低透明度淡粉色，正文始终可读
   5. prefers-reduced-motion 下完全禁用
   6. 标签页隐藏时暂停 rAF，不空耗电量
   ============================================================ */

(function () {
  'use strict';

  var canvas = document.getElementById('sakura');
  if (!canvas) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) return;

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  /* 花瓣配色：淡粉系，饱和度压低以适配深空蓝背景 */
  var COLORS = [
    [255, 183, 197],
    [255, 205, 215],
    [252, 228, 236],
    [255, 170, 185]
  ];

  var petals = [];
  var W = 0;
  var H = 0;
  var rafId = null;
  var resizeTimer = null;

  /* 「轻微」密度：约每 90,000px² 一片，并夹在 5–14 片之间。
     大屏不堆积，手机也不至于一片都看不见。 */
  function petalCount() {
    var byArea = Math.round((window.innerWidth * window.innerHeight) / 90000);
    return Math.max(5, Math.min(14, byArea));
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makePetal(seedOnScreen) {
    return {
      x: rand(0, W),
      /* 初始铺满全屏；回收时从顶部之上重新落下 */
      y: seedOnScreen ? rand(0, H) : rand(-90, -20),
      size: rand(4.5, 9),
      vy: rand(0.22, 0.5),          // 下落速度：慢，避免抢视线
      vx: rand(-0.2, 0.35),         // 水平漂移
      swayAmp: rand(10, 26),        // 摆动幅度
      swayFreq: rand(0.0006, 0.0014),
      phase: rand(0, Math.PI * 2),
      spin: rand(-0.008, 0.008),    // 自转
      angle: rand(0, Math.PI * 2),
      alpha: rand(0.3, 0.62),       // 半透明，压住存在感
      color: COLORS[(Math.random() * COLORS.length) | 0]
    };
  }

  /* 花瓣形状：两段贝塞尔拼成带尖的水滴，比圆形更像花瓣 */
  function drawPetal(p, t) {
    var sway = Math.sin(p.phase + t * p.swayFreq) * p.swayAmp;
    var s = p.size;

    ctx.save();
    ctx.translate(p.x + sway, p.y);
    ctx.rotate(p.angle);
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = 'rgb(' + p.color[0] + ',' + p.color[1] + ',' + p.color[2] + ')';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.5);
    ctx.bezierCurveTo(s * 0.58, -s * 0.34, s * 0.5, s * 0.46, 0, s * 0.5);
    ctx.bezierCurveTo(-s * 0.5, s * 0.46, -s * 0.58, -s * 0.34, 0, -s * 0.5);
    ctx.fill();
    ctx.restore();
  }

  function step(now) {
    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < petals.length; i++) {
      var p = petals[i];
      p.y += p.vy;
      p.x += p.vx;
      p.angle += p.spin;

      /* 落出画面或飘出侧边后回收，复用对象避免频繁 GC */
      if (p.y - p.size > H || p.x < -90 || p.x > W + 90) {
        petals[i] = makePetal(false);
        continue;
      }
      drawPetal(p, now);
    }

    rafId = requestAnimationFrame(step);
  }

  function start() {
    if (rafId === null) rafId = requestAnimationFrame(step);
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2); // 限制 2x，兼顾清晰与性能
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var target = petalCount();
    if (petals.length > target) {
      petals.length = target;
    } else {
      while (petals.length < target) petals.push(makePetal(true));
    }
  }

  resize();
  start();

  /* 窗口尺寸变化：防抖，避免拖动过程中反复重建 */
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });

  /* 切到后台标签页时暂停，省电 */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { stop(); } else { start(); }
  });

  /* 用户实时切换「减少动效」偏好时立即停掉 */
  function onMotionChange(e) {
    if (e.matches) {
      stop();
      ctx.clearRect(0, 0, W, H);
      canvas.style.display = 'none';
    }
  }
  if (reduce.addEventListener) {
    reduce.addEventListener('change', onMotionChange);
  } else if (reduce.addListener) {
    reduce.addListener(onMotionChange); // 旧版 Safari
  }
})();
