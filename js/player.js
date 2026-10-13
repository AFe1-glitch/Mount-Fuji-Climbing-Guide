/* ============================================================
   音乐播放器插件 · Mount Fuji Player
   原生 JS，无依赖。改下面 CONFIG 即可，不用动其他代码。
   ============================================================ */
(function () {
  'use strict';

  /* ==========================================================
     ① 配置区 —— 只需要改这里
     ==========================================================
     mode: 'embed'  官方嵌入模式。用 YouTube / Spotify / Apple Music
                    等平台的官方 embed 链接，播放走平台的正版授权。
     mode: 'audio'  自有音频模式。指向你自己拥有版权或已获授权的
                    音频文件，例如你购买的数字单曲。
     ========================================================== */
  var CONFIG = {
    mode: 'audio',

    /* --- mode: 'embed' 时填这个 --- */
    embedUrl: '',      /* 例：'https://www.youtube.com/embed/视频ID' */
    embedHeight: 180,  /* YouTube ≈180 · Spotify 单曲 ≈152 · Apple Music ≈175 */

    /* --- mode: 'audio' 时填这个 --- */
    audioSrc: 'audio/fuji.mp3',      /* 例：'audio/fuji.mp3' */

    /* --- 面板上显示的信息 --- */
    title: '富士山下',
    artist: '陈奕迅',
    album: '',
    cover: 'img/cover.jpg',   /* 封面图路径；留空则显示黑胶唱片图案 */

    /* --- 行为 --- */
    startOpen: false,  /* 打开网页时是否自动展开面板 */
    loop: true,        /* 单曲循环（仅 audio 模式有效） */
    volume: 0.8
  };
  /* ========================================================== */

  var STORE_KEY = 'mf-player-state';

  /* ---------- 图标 ---------- */
  var ICON = {
    disc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
          '<g class="mf-fab__disc"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></g>' +
          '<circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.3-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6.5" y="5" width="3.6" height="14" rx="1.2"/><rect x="13.9" y="5" width="3.6" height="14" rx="1.2"/></svg>',
    loop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>',
    volume: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>',
    mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  /* ---------- 读取存档的偏好 ---------- */
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { saved = {}; }

  var state = {
    open: !!CONFIG.startOpen,
    playing: false,
    muted: false,
    volume: typeof saved.volume === 'number' ? saved.volume : CONFIG.volume,
    loop: typeof saved.loop === 'boolean' ? saved.loop : CONFIG.loop
  };

  function persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ volume: state.volume, loop: state.loop }));
    } catch (e) { /* 隐私模式下忽略 */ }
  }

  /* ---------- 构建 DOM ---------- */
  var root = document.createElement('div');
  root.className = 'mf-player';
  root.innerHTML =
    '<div class="mf-panel" role="dialog" aria-label="音乐播放器">' +
      '<div class="mf-panel__head">' +
        '<div class="mf-panel__meta">' +
          '<div class="mf-panel__title"></div>' +
          '<div class="mf-panel__artist"></div>' +
        '</div>' +
        '<button type="button" class="mf-panel__close" data-act="close" aria-label="收起播放器">' + ICON.close + '</button>' +
      '</div>' +
      '<div class="mf-panel__body"></div>' +
    '</div>' +
    '<button type="button" class="mf-fab" data-act="toggle" aria-expanded="false" aria-label="打开音乐播放器">' + ICON.disc + '</button>';

  var panel   = root.querySelector('.mf-panel');
  var body    = root.querySelector('.mf-panel__body');
  var fab     = root.querySelector('.mf-fab');

  root.querySelector('.mf-panel__title').textContent  = CONFIG.title;
  root.querySelector('.mf-panel__artist').textContent = CONFIG.album
    ? CONFIG.artist + ' · ' + CONFIG.album
    : CONFIG.artist;

  var audio = null;   // audio 模式下的 <audio>
  var els   = {};     // audio 模式下的控件引用

  /* ---------- 音频模式：构建自定义控件 ---------- */
  function buildAudioUI() {
    if (!CONFIG.audioSrc) {
      showHint('还没有配置音频文件。<br>把你自己拥有版权的音频路径填到 <code>js/player.js</code> 的 <code>audioSrc</code>。');
      return;
    }

    /* 有封面就用封面，否则退回黑胶唱片图案 */
    var discHtml = CONFIG.cover
      ? '<div class="mf-vinyl mf-vinyl--cover">' +
          '<img class="mf-vinyl__cover" src="' + escapeHtml(CONFIG.cover) + '"' +
          ' alt="' + escapeHtml(CONFIG.title) + ' 封面" loading="lazy">' +
        '</div>'
      : '<div class="mf-vinyl"><div class="mf-vinyl__label"></div></div>';

    body.innerHTML =
      '<div class="mf-stage">' +
        discHtml +
        '<div class="mf-stage__right">' +
          '<button type="button" class="mf-btn mf-btn--play" data-act="play" aria-label="播放">' + ICON.play + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="mf-track" role="slider" tabindex="0" aria-label="播放进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
        '<div class="mf-track__fill"></div><div class="mf-track__thumb"></div>' +
      '</div>' +
      '<div class="mf-time"><span data-role="cur">0:00</span><span data-role="dur">0:00</span></div>' +
      '<div class="mf-row">' +
        '<button type="button" class="mf-btn mf-btn--sm" data-act="mute" aria-label="静音">' + ICON.volume + '</button>' +
        '<div class="mf-vol" role="slider" tabindex="0" aria-label="音量" aria-valuemin="0" aria-valuemax="100">' +
          '<div class="mf-vol__fill"></div>' +
        '</div>' +
        '<button type="button" class="mf-btn mf-btn--sm" data-act="loop" aria-label="单曲循环">' + ICON.loop + '</button>' +
      '</div>' +
      '<div class="mf-error" role="alert" hidden></div>';

    els.play   = body.querySelector('[data-act="play"]');
    els.mute   = body.querySelector('[data-act="mute"]');
    els.loop   = body.querySelector('[data-act="loop"]');
    els.track  = body.querySelector('.mf-track');
    els.fill   = body.querySelector('.mf-track__fill');
    els.thumb  = body.querySelector('.mf-track__thumb');
    els.vol    = body.querySelector('.mf-vol');
    els.volFill= body.querySelector('.mf-vol__fill');
    els.cur    = body.querySelector('[data-role="cur"]');
    els.dur    = body.querySelector('[data-role="dur"]');
    els.err    = body.querySelector('.mf-error');

    /* 封面加载失败时退回黑胶唱片图案 */
    if (CONFIG.cover) {
      var coverImg = body.querySelector('.mf-vinyl__cover');
      if (coverImg) {
        coverImg.addEventListener('error', function () {
          var v = body.querySelector('.mf-vinyl');
          if (v) {
            v.classList.remove('mf-vinyl--cover');
            v.innerHTML = '<div class="mf-vinyl__label"></div>';
          }
        });
      }
    }

    audio = new Audio();
    audio.preload = 'metadata';
    audio.src = CONFIG.audioSrc;
    audio.loop = state.loop;

    els.play.innerHTML = ICON.play;
    els.loop.classList.toggle('is-on', state.loop);
    applyVolume();

    /* 进度条：拖动预览 + 松开定位 */
    bindScrub(els.track,
      function (r) { els.fill.style.width = r * 100 + '%'; els.thumb.style.left = r * 100 + '%'; },
      function (r) { if (audio.duration) audio.currentTime = r * audio.duration; }
    );
    /* 音量条 */
    bindScrub(els.vol,
      function (r) { els.volFill.style.width = r * 100 + '%'; },
      function (r) { state.volume = r; state.muted = r === 0; applyVolume(); persist(); }
    );
    /* 键盘操作 */
    els.track.addEventListener('keydown', function (e) {
      if (!audio.duration) return;
      if (e.key === 'ArrowRight') { audio.currentTime = Math.min(audio.duration, audio.currentTime + 5); e.preventDefault(); }
      if (e.key === 'ArrowLeft')  { audio.currentTime = Math.max(0, audio.currentTime - 5); e.preventDefault(); }
    });
    els.vol.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp')   { state.volume = clamp01(state.volume + 0.05); state.muted = false; applyVolume(); persist(); e.preventDefault(); }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowDown') { state.volume = clamp01(state.volume - 0.05); state.muted = state.volume === 0; applyVolume(); persist(); e.preventDefault(); }
    });

    audio.addEventListener('play',  function () { setPlaying(true); });
    audio.addEventListener('pause', function () { setPlaying(false); });
    audio.addEventListener('ended', function () { setPlaying(false); });
    audio.addEventListener('loadedmetadata', function () { els.dur.textContent = fmt(audio.duration); });
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('error', function () {
      /* 加载失败时保留控件，只在下方显示一行错误，避免整个播放器被清空 */
      els.dur.textContent = '--:--';
      els.play.disabled = true;
      if (els.err) {
        els.err.hidden = false;
        els.err.textContent = '音频加载失败，请检查路径：' + CONFIG.audioSrc;
      }
    });
  }

  /* ---------- 嵌入模式：构建 iframe（首次展开才加载） ---------- */
  var embedBuilt = false;
  function buildEmbedUI() {
    if (embedBuilt) return;
    embedBuilt = true;

    if (!CONFIG.embedUrl) {
      showHint('还没有配置官方嵌入链接。<br>把 YouTube / Spotify / Apple Music 的官方 embed 地址填到 <code>js/player.js</code> 的 <code>embedUrl</code>。');
      return;
    }
    body.innerHTML = '<div class="mf-embed"><iframe src="' + escapeHtml(CONFIG.embedUrl) + '"' +
      ' height="' + Number(CONFIG.embedHeight) + '"' +
      ' title="' + escapeHtml(CONFIG.title + ' · ' + CONFIG.artist) + '"' +
      ' loading="lazy" allow="autoplay; encrypted-media; picture-in-picture"' +
      ' allowfullscreen></iframe></div>';
  }

  function showHint(html) {
    body.innerHTML = '<div class="mf-hint">' + html + '</div>';
  }

  /* ---------- 通用工具 ---------- */
  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function clamp01(n) { return Math.min(1, Math.max(0, n)); }

  function setPlaying(on) {
    state.playing = on;
    root.classList.toggle('is-playing', on);
    if (els.play) {
      els.play.innerHTML = on ? ICON.pause : ICON.play;
      els.play.setAttribute('aria-label', on ? '暂停' : '播放');
    }
  }

  function applyVolume() {
    if (!audio) return;
    audio.volume = state.muted ? 0 : state.volume;
    if (els.volFill) els.volFill.style.width = (state.muted ? 0 : state.volume) * 100 + '%';
    if (els.mute) els.mute.innerHTML = state.muted ? ICON.mute : ICON.volume;
  }

  function updateProgress() {
    if (!audio || !els.fill) return;
    var p = audio.duration ? clamp01(audio.currentTime / audio.duration) : 0;
    els.fill.style.width = p * 100 + '%';
    els.thumb.style.left = p * 100 + '%';
    els.cur.textContent = fmt(audio.currentTime);
    els.track.setAttribute('aria-valuenow', Math.round(p * 100));
  }

  /* ---------- 拖拽/点击通用绑定 ---------- */
  function bindScrub(el, onRatio, onCommit) {
    var dragging = false;
    function ratioOf(e) {
      var r = el.getBoundingClientRect();
      return clamp01((e.clientX - r.left) / r.width);
    }
    el.addEventListener('pointerdown', function (e) {
      dragging = true;
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
      onRatio(ratioOf(e)); onCommit(ratioOf(e));
      e.preventDefault();
    });
    el.addEventListener('pointermove', function (e) {
      if (dragging) onRatio(ratioOf(e));
    });
    function end(e) {
      if (!dragging) return;
      dragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch (err) {}
      onCommit(ratioOf(e));
    }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', function () { dragging = false; });
  }

  /* ---------- 展开 / 收起 ---------- */
  function setOpen(open) {
    state.open = open;
    root.classList.toggle('is-open', open);
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    fab.setAttribute('aria-label', open ? '收起音乐播放器' : '打开音乐播放器');
    if (open) {
      if (CONFIG.mode === 'audio') { if (!audio) buildAudioUI(); }
      else { buildEmbedUI(); }
    }
  }

  /* ---------- 事件绑定 ---------- */
  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var act = t.getAttribute('data-act');

    if (act === 'toggle') { setOpen(!state.open); return; }
    if (act === 'close')  { setOpen(false); return; }

    if (act === 'play') {
      if (!audio) return;
      if (audio.paused) {
        /* 首次播放可能因浏览器策略被拒绝，提示用户再点一次 */
        var p = audio.play();
        if (p && p.catch) p.catch(function () { setPlaying(false); });
      } else {
        audio.pause();
      }
      return;
    }

    if (act === 'mute') {
      state.muted = !state.muted;
      applyVolume();
      return;
    }

    if (act === 'loop') {
      state.loop = !state.loop;
      if (audio) audio.loop = state.loop;
      els.loop.classList.toggle('is-on', state.loop);
      persist();
      return;
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && state.open) setOpen(false);
  });

  document.addEventListener('click', function (e) {
    if (state.open && !root.contains(e.target)) setOpen(false);
  });

  /* ---------- 启动 ---------- */
  function init() {
    document.body.appendChild(root);
    if (state.open) setOpen(true);  /* 控件在首次展开时生成，内部完成事件绑定 */
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
