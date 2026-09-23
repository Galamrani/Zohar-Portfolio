/* ============================================================
   main.js — התנהגות האתר. בדרך כלל אין צורך לגעת כאן.
   כדי לשנות טקסט או להוסיף פרויקט, ערכו את js/content.js.
   ============================================================ */

/* ---------- מזריק את הטקסט מ-content.js לתוך העמוד ---------- */
const el = (tag, cls, txt) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
};

(function(){
  const text = (id, val) => { const e = document.getElementById(id); if (e && val != null) e.textContent = val; };
  const link = (id, href, val) => { const e = document.getElementById(id); if (e){ e.href = href; e.textContent = val; } };

  const tel  = 'tel:' + CONTENT.contact.phone.replace(/[\s-]/g, '');
  const mail = 'mailto:' + CONTENT.contact.email;

  text('brandName', CONTENT.name);
  text('navWork', CONTENT.nav.work);
  text('navServices', CONTENT.nav.services);
  text('navContact', CONTENT.nav.contact);

  text('heroName', CONTENT.name);
  text('heroTitle', CONTENT.title);
  link('heroPhone', tel, CONTENT.contact.phone);
  link('heroEmail', mail, CONTENT.contact.email);
  text('heroLede', CONTENT.hero.lede);
  const facts = document.getElementById('heroFacts');
  CONTENT.hero.facts.forEach(f => {
    const d = el('div');
    /* ערך מספרי כמו "20+" נכתב משמאל לימין, אחרת ב-RTL הפלוס קופץ להתחלה */
    const dt = el('dt', /^[\d\s+%.,-]+$/.test(f.value) ? 'ltr' : null, f.value);
    d.append(dt, el('dd', null, f.label));
    facts.append(d);
  });

  text('workHeading', CONTENT.work.heading);
  text('workSubtitle', CONTENT.work.subtitle);

  /* תחומי עבודה — שורה לכל תחום */
  text('servicesHeading', CONTENT.services.heading);
  const rows = document.getElementById('serviceRows');
  CONTENT.services.items.forEach((it, i) => {
    const row = el('div', 'row');
    row.append(el('span', 'row__no', String(i + 1).padStart(2, '0')));
    const body = el('div');
    body.append(el('h3', 'row__title', it.title), el('p', 'row__sub', it.text));
    row.append(body);
    rows.append(row);
  });

  text('contactHeading', CONTENT.footer.heading);
  link('contactPhone', tel, CONTENT.contact.phone);
  link('contactEmail', mail, CONTENT.contact.email);
  text('footerLine', CONTENT.name + ' · ' + CONTENT.title);
  text('footerCopyright', CONTENT.footer.copyright);
})();

/* ---------- פרויקטים: גלריית תמונות וסרטונים ----------
   כל כרטיס מציג מסילה אופקית של שקופיות (scroll-snap) — מחליקים
   באצבע, גוללים בטאצ'פד או לוחצים על החיצים. מונה בפינה מראה
   באיזו שקופית נמצאים, וסרטון מתנגן רק כשהשקופית שלו מוצגת.     */
(function(){
  const W = CONTENT.work;
  const host = document.getElementById('projects');

  /* ---------- איתור הקבצים בתיקיית הפרויקט ----------
     אתר סטטי לא יכול לקרוא את רשימת הקבצים בתיקייה, ולכן מנסים את
     השמות הצפויים (1.jpg, 1.mp4, 2.jpg ...) ובודקים מה נטען בפועל,
     מספר אחרי מספר, עד המספר הראשון שאין לו אף קובץ.
     בכל מספר הסדר הוא סדר העדיפות: וידאו, אחר כך תמונה, ורק בסוף
     ה-SVG הזמני. אם נמצא בתיקייה ולו קובץ אמיתי אחד, ה-SVG-ים
     הזמניים מוסתרים כולם.
     הבדיקה עובדת גם בפתיחה ישירה של index.html מהמחשב (file://),
     כי היא טוענת את הקבצים כמו הדפדפן ולא דרך fetch.                  */
  const MEDIA_ROOT = 'media/';
  const VIDEO_EXT  = ['mp4', 'webm', 'mov'];
  const IMAGE_EXT  = ['jpg', 'jpeg', 'png', 'webp'];
  const TEMP_EXT   = ['svg'];
  const MAX_ITEMS  = 60;

  const probeImage = src => new Promise(ok => {
    const i = new Image();
    i.onload  = () => ok(src);
    i.onerror = () => ok(null);
    i.src = src;
  });
  const probeVideo = src => new Promise(ok => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.onloadedmetadata = () => { ok(src); v.removeAttribute('src'); v.load(); };
    v.onerror = () => ok(null);
    v.src = src;
  });
  const first = list => list.find(Boolean) || null;

  /* מחזיר { type, src, poster } למספר אחד בתיקייה, או null אם אין כלום */
  async function findItem(folder, n){
    const base = MEDIA_ROOT + folder + '/' + n + '.';
    const [videos, images, temps] = await Promise.all([
      Promise.all(VIDEO_EXT.map(e => probeVideo(base + e))),
      Promise.all(IMAGE_EXT.map(e => probeImage(base + e))),
      Promise.all(TEMP_EXT.map(e => probeImage(base + e)))
    ]);
    const video = first(videos), image = first(images), temp = first(temps);
    if (video) return { type:'video', src:video, poster:image };
    if (image) return { type:'image', src:image };
    if (temp)  return { type:'image', src:temp, temp:true };
    return null;
  }

  /* רשימה מפורשת ב-content.js גוברת על החיפוש האוטומטי */
  async function findMedia(p){
    if (Array.isArray(p.media) && p.media.length){
      return p.media.map(name => {
        const ext = String(name).split('.').pop().toLowerCase();
        return { type: VIDEO_EXT.includes(ext) ? 'video' : 'image', src: MEDIA_ROOT + p.folder + '/' + name };
      });
    }
    const items = [];
    for (let n = 1; n <= MAX_ITEMS; n++){
      const m = await findItem(p.folder, n);
      if (!m) break;
      items.push(m);
    }
    const real = items.filter(m => !m.temp);
    return real.length ? real : items;
  }

  function mediaEl(m, alt){
    if (m.type === 'video'){
      const v = el('video', 'gal__media');
      Object.assign(v, { src:m.src, muted:true, loop:true, playsInline:true, preload:'metadata' });
      v.setAttribute('aria-label', alt);
      if (m.poster) v.poster = m.poster;
      return v;
    }
    const img = el('img', 'gal__media');
    Object.assign(img, { src:m.src, alt, decoding:'async' });
    return img;
  }

  /* מסגרת ריקה — מוצגת בזמן החיפוש, ונשארת אם בתיקייה אין אף קובץ */
  function emptyFrame(){
    const ph = el('div', 'gal__ph');
    ph.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="2"/><circle cx="8.5" cy="10" r="1.8"/><path d="M21.5 16l-5.5-5.5L6 19.5"/></svg>';
    ph.append(el('span', null, W.placeholder));
    return ph;
  }

  const ARROW = d => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>';

  /* בונה את הגלריה של כרטיס אחד ומחזיר את האלמנט שלה */
  function gallery(p){
    const gal   = el('div', 'gal');
    const track = el('div', 'gal__track');
    track.tabIndex = 0;
    track.setAttribute('role', 'group');
    track.setAttribute('aria-label', p.title);
    const slide = el('div', 'gal__slide');
    slide.append(emptyFrame());
    track.append(slide);

    /* ב-RTL "הקודם" יושב מימין והחץ שלו מצביע ימינה */
    const prev = el('button', 'gal__nav gal__prev');
    const next = el('button', 'gal__nav gal__next');
    prev.type = next.type = 'button';
    prev.setAttribute('aria-label', W.prev);
    next.setAttribute('aria-label', W.next);
    prev.innerHTML = ARROW('M9 6l6 6-6 6');
    next.innerHTML = ARROW('M15 6l-6 6 6 6');
    const count = el('span', 'gal__count ltr');

    gal.append(track, prev, next, count);
    gal._track = track;
    return gal;
  }

  /* ממלא את הגלריה ברגע שהקבצים נמצאו, ומחבר את הניווט */
  async function fill(gal, p){
    const items = await findMedia(p);
    if (!items.length) return;
    const track = gal._track;
    const slides = items.map((m, i) => {
      const s = el('div', 'gal__slide');
      s.append(mediaEl(m, p.title + ' — ' + (i + 1) + '/' + items.length));
      return s;
    });
    track.replaceChildren(...slides);
    if (items.some(m => m.temp)) gal.classList.add('is-temp');

    const total = slides.length;
    const count = gal.querySelector('.gal__count');
    const prev  = gal.querySelector('.gal__prev');
    const next  = gal.querySelector('.gal__next');
    gal.classList.toggle('is-multi', total > 1);

    /* ב-RTL scrollLeft יורד לשלילי, ולכן עובדים עם הערך המוחלט
       ומכפילים בכיוון בזמן גלילה                                  */
    const dir = getComputedStyle(track).direction === 'rtl' ? -1 : 1;
    let current = -1;
    const update = () => {
      const i = Math.min(total - 1, Math.round(Math.abs(track.scrollLeft) / (track.clientWidth || 1)));
      if (i === current) return;
      current = i;
      count.textContent = (i + 1) + ' / ' + total;
      prev.disabled = i === 0;
      next.disabled = i === total - 1;
      slides.forEach((s, k) => {
        const v = s.querySelector('video');
        if (!v) return;
        if (k === i && gal._visible) v.play().catch(()=>{});
        else v.pause();
      });
    };
    gal._update = () => { current = -1; update(); };
    const go = step => track.scrollBy({ left: dir * step * track.clientWidth, behavior:'smooth' });
    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    track.addEventListener('keydown', e => {
      /* בגלריה מימין לשמאל, חץ שמאלה = הבא */
      if (e.key === 'ArrowLeft'){ e.preventDefault(); go(dir === -1 ? 1 : -1); }
      if (e.key === 'ArrowRight'){ e.preventDefault(); go(dir === -1 ? -1 : 1); }
    });
    let raf = 0;
    track.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; update(); });
    }, { passive:true });
    update();
  }

  /* החיפוש מתחיל רק כשהכרטיס מתקרב למסך, כדי לא לטעון את כל
     הגלריה מראש. בלי IntersectionObserver — טוענים הכול מיד.     */
  const load = card => { if (card._project.folder || card._project.media) fill(card._gal, card._project); };
  const lazy = 'IntersectionObserver' in window
    ? new IntersectionObserver((es, obs) => es.forEach(x => {
        if (x.isIntersecting){ obs.unobserve(x.target); load(x.target); }
      }), { rootMargin:'400px 0px' })
    : { observe: load };

  /* סרטונים מתנגנים רק כשהגלריה שלהם נראית על המסך */
  const onScreen = 'IntersectionObserver' in window
    ? new IntersectionObserver(es => es.forEach(x => {
        x.target._visible = x.isIntersecting;
        x.target._update?.();
      }), { threshold:.35 })
    : { observe: g => { g._visible = true; } };

  W.projects.forEach(p => {
    const card = el('article', 'project');
    card.dataset.cat = p.category;
    card._project = p;

    const gal = gallery(p);
    card._gal = gal;

    const body = el('div', 'project__body');
    const meta = el('div', 'project__meta');
    meta.append(el('span', 'tag', p.category));
    if (p.place) meta.append(el('span', 'project__place', p.place));
    body.append(meta, el('h3', 'project__title', p.title));
    if (p.text) body.append(el('p', 'project__text', p.text));

    card.append(gal, body);
    host.append(card);
    lazy.observe(card);
    onScreen.observe(gal);
  });

  /* סינון לפי תחום — רק תחומים שיש בהם פרויקטים מקבלים כפתור */
  const filters = document.getElementById('filters');
  const cats = W.categories.filter(c => W.projects.some(p => p.category === c));
  if (cats.length < 2){ filters.remove(); return; }
  const buttons = [W.all, ...cats].map((c, i) => {
    const b = el('button', 'chip', c);
    b.type = 'button';
    b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    b.addEventListener('click', () => {
      buttons.forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      host.querySelectorAll('.project').forEach(card => {
        card.hidden = i !== 0 && card.dataset.cat !== c;
      });
      /* כרטיסים שהופיעו עכשיו אולי עוד לא נחשפו בגלילה */
      requestAnimationFrame(revealVisible);
    });
    filters.append(b);
    return b;
  });
})();

/* ---------- גלילה: חשיפות, סימון הקישור הפעיל ופס ההתקדמות ---------- */
/* הפריטים נחשפים בהדרגה. בגלריה הכרטיסים יושבים בזוגות, ולכן רק
   הכרטיס השני בכל שורה מקבל השהיה; ברשימת התחומים — אחד אחרי השני. */
document.querySelectorAll('.projects .project').forEach((e,i) => { e.dataset.stagger = (i % 2) * 110; });
document.querySelectorAll('.rows .row').forEach((e,i) => { e.dataset.stagger = i * 85; });

/* התוכן עצמו מוסתר עד לחשיפה, ולכן אסור שהחשיפה תלויה בגורם יחיד.
   IntersectionObserver הוא המנגנון הראשי, וסריקת מיקומים בזמן גלילה
   היא רשת ביטחון — אם הראשון לא ירוץ, התוכן עדיין יופיע.            */
const pending = new Set(document.querySelectorAll('.reveal, .projects .project, .rows .row'));

function reveal(e){
  if (!pending.has(e)) return;
  pending.delete(e);
  setTimeout(()=> e.classList.add('in'), Number(e.dataset.stagger) || 0);
}
function revealVisible(){
  if (!pending.size) return;
  for (const e of [...pending]){
    const r = e.getBoundingClientRect();
    if (r.top < innerHeight * 0.9 && r.bottom > 0) reveal(e);
  }
}

if ('IntersectionObserver' in window){
  const io = new IntersectionObserver((es, obs) => {
    es.forEach(x => { if (x.isIntersecting){ reveal(x.target); obs.unobserve(x.target); } });
  }, { threshold:.15 });
  pending.forEach(e => io.observe(e));
}
addEventListener('load', revealVisible);

const progress = document.getElementById('progressBar');
const topbar   = document.querySelector('.topbar');
const marks = [
  { el: document.querySelector('.hero'),      nav:null                                   },
  { el: document.getElementById('work'),      nav:document.getElementById('navWork')     },
  { el: document.getElementById('services'),  nav:document.getElementById('navServices') },
  { el: document.getElementById('contact'),   nav:document.getElementById('navContact')  }
].filter(m => m.el);

let ticking = false;
function onScroll(){
  const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
  const y = scrollY + 150;
  let m = marks[0];
  marks.forEach(x => { if (x.el.getBoundingClientRect().top + scrollY <= y) m = x; });
  /* החלק האחרון קצר מגובה המסך, ולכן לעולם לא מגיע לקו ה-150.
     כשמגיעים לתחתית העמוד הוא הנבחר הטבעי.                      */
  if (max > 0 && max - scrollY < 4) m = marks[marks.length - 1];

  marks.forEach(x => { if (x.nav) x.nav.classList.toggle('is-current', x === m); });

  if (topbar) topbar.classList.toggle('is-stuck', scrollY > 8);

  revealVisible();

  if (progress){
    const pct = max > 0 ? Math.min(100, Math.max(0, (scrollY / max) * 100)) : 0;
    progress.style.setProperty('--p', pct.toFixed(2) + '%');
  }

  ticking = false;
}
addEventListener('scroll', ()=>{
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(onScroll);
}, { passive:true });
addEventListener('resize', onScroll, { passive:true });
onScroll();
