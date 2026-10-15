/* ============================================================
   富士山攀登攻略 · app.js
   ============================================================ */

/* ---------- 数据：路线详情 ---------- */
const ROUTES = {
  yoshida: {
    name: '吉田路线（Yoshida）',
    tag: '人气首选',
    desc: '四条路线中人气最高、设施最完善的一条，约六成登山者选择此路。从山梨侧富士斯巴鲁线五合目出发，避难小屋与补给站最密集，救援资源也最充足，最适合首次登顶富士山的旅行者。',
    difficulty: 2,
    difficultyLabel: '轻松（★☆☆☆☆）',
    length: '5–7 小时',
    altitude: '2,305m 起',
    season: '7月1日–9月10日',
    features: ['设施最完善，补给站密集', '巴士直达五合目，交通最便利', '人流最大，旺季需排队', '新手与夜间登顶看日出的首选'],
  },
  subashiri: {
    name: '须走路线（Subashiri）',
    tag: '人少清净',
    desc: '从静冈侧须走口五合目出发，前半段穿行于林木之间，人流明显少于吉田路线。八合目以上与吉田路线汇合。最大的特色是下山可走「砂走」——沿着火山砂坡一路滑下，约 2–3 小时即可返回五合目。',
    difficulty: 3,
    difficultyLabel: '中等（★★☆☆☆）',
    length: '5–7 小时',
    altitude: '1,970m 起',
    season: '7月1日–9月10日',
    features: ['前半段林荫道，人少清幽', '下山「砂走」滑沙，速度极快', '八合目后与吉田路线汇合', '适合想避开人潮的登山者'],
  },
  gotemba: {
    name: '御殿场路线（Gotemba）',
    tag: '挑战极限',
    desc: '四条路线中海拔最低、爬升最大、耗时最长的一条。从御殿场口五合目出发，起点海拔仅 1,440m，全程上下落差近 2,350m，登山道多为火山砂石，对体能与膝盖都是极大考验。人流最少，适合有丰富经验的登山者。',
    difficulty: 5,
    difficultyLabel: '困难（★★★★☆）',
    length: '7–9 小时',
    altitude: '1,440m 起',
    season: '7月1日–9月10日',
    features: ['海拔最低，爬升幅度最大', '人流最少，最为清净', '火山砂石路面，极耗体力', '下山砂走体验独特，但需留意膝盖'],
  },
  fujinomiya: {
    name: '富士宫路线（Fujinomiya）',
    tag: '路程最短',
    desc: '从静冈侧富士宫口五合目出发，起点海拔 2,400m 为四条路线中最高，因此登顶路程最短。但坡度陡峭、岩石路段多，且五合目以上无林荫遮蔽，需注意防晒与高原反应。适合时间有限或想缩短行程的登山者。',
    difficulty: 4,
    difficultyLabel: '较难（★★★☆☆）',
    length: '4–5 小时',
    altitude: '2,400m 起',
    season: '7月1日–9月10日',
    features: ['起点海拔最高，路程最短', '坡度陡峭，岩石路段多', '五合目以上无遮蔽，需防晒', '适合时间有限的登山者'],
  },
};

/* ---------- 路线面板渲染 ---------- */
const panel = document.getElementById('routePanel');
const tabs = document.querySelectorAll('.routes__tab');

function renderRoute(key) {
  const r = ROUTES[key];
  if (!r) return;
  panel.classList.remove('show');
  setTimeout(() => {
    panel.innerHTML = `
      <div class="route-detail">
        <div class="route-detail__info">
          <h3>${r.name}</h3>
          <p class="route-detail__desc">${r.desc}</p>
          <div class="route-detail__meta">
            <div class="meta-item">
              <p class="meta-item__label">所需时间</p>
              <p class="meta-item__val">${r.length}</p>
            </div>
            <div class="meta-item">
              <p class="meta-item__label">起点海拔</p>
              <p class="meta-item__val">${r.altitude}</p>
            </div>
            <div class="meta-item">
              <p class="meta-item__label">开放日期</p>
              <p class="meta-item__val">${r.season}</p>
            </div>
          </div>
          <div class="diff-bar">
            <p class="diff-bar__label">
              <span>难度等级</span>
              <span>${r.difficultyLabel}</span>
            </p>
            <div class="diff-bar__track">
              <div class="diff-bar__fill" style="width: ${r.difficulty * 20}%"></div>
            </div>
          </div>
        </div>
        <aside class="route-detail__feat">
          <h4>路线特色</h4>
          <ul>
            ${r.features.map(f => `<li>${f}</li>`).join('')}
          </ul>
        </aside>
      </div>`;
    requestAnimationFrame(() => panel.classList.add('show'));
  }, 180);
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('routes__tab--active'));
    tab.classList.add('routes__tab--active');
    renderRoute(tab.dataset.route);
  });
});

/* 默认渲染吉田路线（人气最高） */
renderRoute('yoshida');

/* ---------- 导航栏：滚动变色 ---------- */
const nav = document.getElementById('nav');
let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
    ticking = false;
  });
}, { passive: true });

/* ---------- 导航栏：汉堡菜单 ---------- */
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav__links');
navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navToggle.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

/* ---------- IntersectionObserver：入场动画 ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('reveal');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(
  '.section__head, .routes__tab, .gear-card, .timeline__item, .gallery__item, .booking'
).forEach(el => io.observe(el));

/* ---------- 统计数字滚动动画 ---------- */
const statIO = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    statIO.unobserve(e.target);
    const el = e.target;
    const target = parseInt(el.dataset.count, 10);
    const dur = 1600;
    const start = performance.now();
    (function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    })(performance.now());
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat__num[data-count]').forEach(el => statIO.observe(el));

/* ---------- 按钮光晕跟随鼠标 ---------- */
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    btn.style.setProperty('--mx', `${x}%`);
    btn.style.setProperty('--my', `${y}%`);
  });
});
