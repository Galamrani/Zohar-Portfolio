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

/* ---------- פרויקטים: השוואת לפני ואחרי ----------
   כל כרטיס מציג את שני המצבים זה מעל זה. שכבת ה"לפני" נחתכת לפי
   --pos, ופס גרירה (input range שקוף מעל כל התמונה) מזיז את הקו.
   ב-RTL ה"לפני" יושב בצד ימין, כך שהקו נגרר בכיוון הקריאה.         */
(function(){
  const W = CONTENT.work;
  const host = document.getElementById('projects');

  /* ---------- איתור הקבצים בתיקיית הפרויקט ----------
     אתר סטטי לא יכול לקרוא את רשימת הקבצים בתיקייה, ולכן מנסים את
     השמות הצפויים (before.jpg, before.mp4 ...) ובודקים מה נטען בפועל.
     הסדר ברשימה הוא סדר העדיפות: וידאו, אחר כך תמונה, ורק בסוף ה-SVG
     הזמני — כך שקובץ אמיתי גובר עליו מעצמו.
     הבדיקה עובדת גם בפתיחה ישירה של index.html מהמחשב (file://),
     כי היא טוענת את הקבצים כמו הדפדפן ולא דרך fetch.                  */
  const MEDIA_ROOT = 'media/';
  const VIDEO_EXT  = ['mp4', 'webm'];
  const IMAGE_EXT  = ['jpg', 'jpeg', 'png', 'webp'];
  const TEMP_EXT   = ['svg'];

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

  /* מחזיר { type, src, poster } לצד אחד של הפרויקט, או null אם אין כלום */
  async function findMedia(folder, side){
    const base = MEDIA_ROOT + folder + '/' + side + '.';
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

  function mediaEl(m, alt){
    if (m.type === 'video'){
      const v = el('video', 'ba__media');
      Object.assign(v, { src:m.src, muted:true, loop:true, autoplay:true, playsInline:true, preload:'metadata' });
      v.setAttribute('aria-label', alt);
      if (m.poster) v.poster = m.poster;
      return v;
    }
    const img = el('img', 'ba__media');
    Object.assign(img, { src:m.src, alt, decoding:'async' });
    return img;
  }

  /* מסגרת ריקה — מוצגת בזמן החיפוש, ונשארת אם בתיקייה אין אף קובץ */
  function emptyFrame(side){
    const ph = el('div', 'ba__ph');
    ph.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="2"/><circle cx="8.5" cy="10" r="1.8"/><path d="M21.5 16l-5.5-5.5L6 19.5"/></svg>';
    ph.append(el('span', null, side + ' · ' + W.placeholder));
    return ph;
  }

  /* ממלא שכבה אחת (לפני / אחרי) ברגע שהקובץ נמצא */
  async function fill(layer, folder, side, label, title){
    const m = await findMedia(folder, side);
    if (!m) return;
    layer.querySelector('.ba__ph')?.replaceWith(mediaEl(m, label + ' — ' + title));
    if (m.temp) layer.classList.add('is-temp');
  }

  /* החיפוש מתחיל רק כשהכרטיס מתקרב למסך, כדי לא לטעון את כל
     הגלריה מראש. בלי IntersectionObserver — טוענים הכול מיד.     */
  const load = card => {
    const { folder, title } = card._project;
    if (!folder) return;
    fill(card.querySelector('.ba__before'), folder, 'before', W.before, title);
    fill(card.querySelector('.ba__after'),  folder, 'after',  W.after,  title);
  };
  const lazy = 'IntersectionObserver' in window
    ? new IntersectionObserver((es, obs) => es.forEach(x => {
        if (x.isIntersecting){ obs.unobserve(x.target); load(x.target); }
      }), { rootMargin:'400px 0px' })
    : { observe: load };

  W.projects.forEach(p => {
    const card = el('article', 'project');
    card.dataset.cat = p.category;
    card._project = p;

    const ba = el('div', 'ba');
    const after = el('div', 'ba__layer ba__after');
    after.append(emptyFrame(W.after), el('span', 'ba__label', W.after));
    const before = el('div', 'ba__layer ba__before');
    before.append(emptyFrame(W.before), el('span', 'ba__label', W.before));
    const handle = el('span', 'ba__handle');
    handle.setAttribute('aria-hidden', 'true');
    const range = el('input', 'ba__range');
    Object.assign(range, { type:'range', min:0, max:100, value:50 });
    range.setAttribute('aria-label', W.before + ' / ' + W.after + ': ' + p.title);
    range.addEventListener('input', () => ba.style.setProperty('--pos', range.value + '%'));
    ba.append(after, before, handle, range);

    const body = el('div', 'project__body');
    const meta = el('div', 'project__meta');
    meta.append(el('span', 'tag', p.category));
    if (p.place) meta.append(el('span', 'project__place', p.place));
    body.append(meta, el('h3', 'project__title', p.title));
    if (p.text) body.append(el('p', 'project__text', p.text));

    card.append(ba, body);
    host.append(card);
    lazy.observe(card);
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
