/* ============================================================
   富士山攀登攻略 · app.js
   ============================================================ */

/* ---------- 数据：路线详情 ---------- */
const ROUTES = {
  subashiri: {
    name: '御来栖路线（Subashiri）',
    tag: '人气首选',
    desc: '四条路线中设施最完善、游客最多的一条。从五合目登山口出发，补给站密集、登山道平整，适合首次登顶富士山的旅行者。御来栖五合目巴士交通最便利，下山后可直接乘坐接驳巴士返回新宿。',
    difficulty: 2,
    difficultyLabel: '轻松（★☆☆☆☆）',
    length: '5–6 小时',
    altitude: '2,350m 起',
    season: '7月1日–9月10日',
    features: ['设施最完善，补给站密集', '巴士直达五合目，交通便利', '人流量大，适合结伴出行', '夜间登顶看日出经典之选'],
  },
  yoshida: {
    name: '吉田路线（Yoshida）',
    tag: '风景绝佳',
    desc: '四条路线中风景最惊艳的一条，沿途火山地貌壮观，可以看到富士山独特的火山口与碎石坡。吉田五合目海拔最高（约 2,396m），适合自驾或乘坐特快巴士。沿途人少安静，适合摄影爱好者。',
    difficulty: 3,
    difficultyLabel: '中等（★★☆☆☆）',
    length: '5–7 小时',
    altitude: '2,396m 起',
    season: '7月1日–9月10日',
    features: ['火山地貌风景独一档', '五合目海拔最高，节省体力', '碎石路段多，需防滑鞋', '游客相对较少，清净'],
  },
  fujigawara: {
    name: '富士川路线（Fujigawara）',
    tag: '人少清净',
    desc: '四条路线中游客最少的一条，沿途林木茂密，空气湿润清新，夏季登山体感最舒适。富士川五合目海拔最低（约 1,327m），全程爬升幅度最大，适合有一定登山经验的旅行者。',
    difficulty: 4,
    difficultyLabel: '较难（★★★☆☆）',
    length: '7–9 小时',
    altitude: '1,327m 起',
    season: '7月1日–9月10日',
    features: ['游客最少，山林清新', '海拔低，爬升幅度大', '适合有经验的登山者', '夏季体感最凉爽舒适'],
  },
  gotemba: {
    name: '裾垂路线（Gotemba）',
    tag: '挑战极限',
    desc: '四条路线中最具挑战性的一条，全程爬升高度最大，碎石路段多，对体力要求最高。裾垂五合目海拔最低（约 1,200m），适合有高强度登山经验、想要挑战自我体能的登山者。',
    difficulty: 5,
    difficultyLabel: '困难（★★★★☆）',
    length: '9–12 小时',
    altitude: '1,200m 起',
    season: '7月1日–9月10日',
    features: ['挑战性最强，爬升最大', '碎石路段多，需专业装备', '适合有经验的登山者', '成就感最强'],
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

/* 默认渲染御来栖 */
renderRoute('subashiri');

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
