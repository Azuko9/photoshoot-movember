/* Chemins des images (extraites de l'ancien objet ASSETS en base64, voir scripts/extraire-assets.mjs) */
const ASSETS = {
  "m_shebear": "assets/m_shebear.webp",
  "s2": "assets/s2.webp",
  "s4": "assets/s4.webp",
  "titre": "assets/titre.webp",
  "infos": "assets/infos.webp",
  "m_resina": "assets/m_resina.webp",
  "s5": "assets/s5.webp",
  "m_pintxours": "assets/m_pintxours.webp",
  "s3": "assets/s3.webp",
  "m_rainbow": "assets/m_rainbow.webp",
  "m_mourstache": "assets/m_mourstache.webp",
  "explications": "assets/explications.webp",
  "m_oursonne": "assets/m_oursonne.webp",
  "affiche": "assets/affiche.webp",
  "m_fluours": "assets/m_fluours.webp",
  "fond": "assets/fond.webp",
  "empreinte": "assets/empreinte.webp",
  "logo": "assets/logo.webp",
  "s1": "assets/s1.webp",
  "m_classique": "assets/m_classique.webp",
  "m_bearnaise": "assets/m_bearnaise.webp"
};

// JPEG partagés tels quels (Instagram et les messageries veulent du JPEG ; l'affichage utilise les WebP ci-dessus)
const SHARE = { explications: "assets/explications.jpg", affiche: "assets/affiche.jpg" };

(() => {
'use strict';
const $ = s => document.querySelector(s);
const W = 1080, H = 1350;                       // taille finale (4:5)
const PW = 540, PH = 675;                       // taille de l'aperçu
// Calage sur le toupet de l'overlay : sommet des cheveux, centre, largeur de visage cible
const HEAD_Y = 0.385 * H, HEAD_X = 0.505 * W, FACE_W = 0.28 * W;

const MUSTACHES = [
  {id:'none',      name:'Ma vraie moustache',    vibe:'au naturel',                  none:true},
  {id:'pintxours', name:"La PINTX'Ours",         vibe:'gourmande et piquante',       wf:2.00, ay:.40},
  {id:'bearnaise', name:"L'haleine BEARnaise",   vibe:'douce et bouclée',            wf:1.70, ay:.18},
  {id:'resina',    name:'La BEAR Résina',        vibe:'collante mais Landaise',      wf:2.20, ay:.42},
  {id:'mourstache',name:'La mOURStache',         vibe:'charnue et chaleureuse',      wf:1.80, ay:.35},
  {id:'rainbow',   name:'La RainbowBEAR',        vibe:'fière et grande',             wf:2.30, ay:.50},
  {id:'classique', name:'La Classique',          vibe:'class et chic',               wf:1.90, ay:.45},
  {id:'shebear',   name:'La SheBEARpunk',        vibe:'poétique et engagée',         wf:1.60, ay:.50},
  {id:'oursonne',  name:"L'Oursonne Mo Sistas",  vibe:'alliée et protectrice',       wf:2.10, ay:.50},
  {id:'fluours',   name:'La FluOURS !',          vibe:'club et friendly',            wf:1.95, ay:.38},
];
const TILES = ['rainbow','pintxours','classique','mourstache'];
const CAPTION_BASE = "Je porte la moustache pour #Movember avec l'association Bear @nousnours64.40 🐻🥸 Participez à la prévention de la santé masculine et faites un don sur fr.movember.com. Soirée caritative dimanche 22 novembre dès 18h au 42 Bar, 42 rue Pannecau, Bayonne : tombola, entrée gratuite, buffet offert ! #Movember #NousNours #Bayonne";
const TAGS = " #lgbt #Bear";                               // hashtags ajoutés par défaut, décochables avant le partage
const caption = () => CAPTION_BASE + ($('#cap-tags').checked ? TAGS : '');

/* ---------- assets ---------- */
document.querySelectorAll('img[data-asset]').forEach(i => i.src = ASSETS[i.dataset.asset]);
const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(i); i.src = src; });
const IMG = {};
const assetsReady = Promise.all([
  load(ASSETS.fond).then(i => IMG.fond = i),
  load(ASSETS.infos).then(i => IMG.infos = i),
  ...MUSTACHES.filter(m => !m.none).map(m => load(ASSETS['m_' + m.id]).then(i => m.img = i)),
]);

/* ---------- état ---------- */
const S = {
  view:'landing', mi:1, mscale:1, my:0, zoom:1, timer:0,
  facing:'user', mirror:true, stream:null, raf:0, busy:false, frame:0,
  src:null, staticMode:false, vw:0, vh:0,
  seg:null, fm:null, modelsReady:false, modelsFailed:false,
  person:document.createElement('canvas'), hasMask:false, lastSeen:0,
  tgt:null, tr:null,              // cible / valeur lissée {topX, topY, faceW}
  lm:null,                        // landmarks visage
  m:null, mt:null,                // moustache lissée / cible {x,y,w,a} (fractions)
  blob:null, files:null, url:null,
  camGen:0,                       // invalide tout démarrage de caméra en cours (Fermer, ⟲, galerie, onglet masqué)
  camDenied:false, resume:false, countId:0, capturing:false,
  modelsPromise:null, fmInit:null, fmReady:false, lastAI:0, settle:0, hintTxt:'', prepGen:0,
};
const pctx = S.person.getContext('2d', {willReadFrequently:false});
const small = document.createElement('canvas'); const sctx = small.getContext('2d', {willReadFrequently:true});
const vid = $('#vid'), prev = $('#preview'), pc = prev.getContext('2d');

/* ---------- utilitaires ---------- */
function toast(t, ms=3200){ const e=$('#toast'); e.textContent=t; e.classList.add('on'); clearTimeout(toast.t); toast.t=setTimeout(()=>e.classList.remove('on'),ms); }
function show(v){
  S.view = v;
  $('#s-landing').hidden = v!=='landing';
  $('#s-camera').hidden  = v!=='camera';
  $('#s-result').hidden  = v!=='result';
  document.body.style.overflow = v==='camera' ? 'hidden' : '';
  window.scrollTo(0,0);
}
const scripts = {};
function scriptLoad(url){
  return scripts[url] ||= new Promise((res,rej)=>{
    const s=document.createElement('script'); s.src=url;
    s.onload=res; s.onerror=()=>{ delete scripts[url]; s.remove(); rej(new Error('load '+url)); };
    document.head.appendChild(s);
  });
}
const withTimeout = (p, ms) => Promise.race([p, new Promise((_,rej) => setTimeout(() => rej(new Error('délai dépassé')), ms))]);
const touch = () => { S.settle = 60; };                     // photo fixe : on ne redessine que quelques images après un changement
const lerp = (a,b,t) => a + (b-a)*t;

/* ---------- accueil / carrousel ---------- */
(() => {                                                   // diaporama automatique de l'accueil
  const sl = [...document.querySelectorAll('#slides .slide')]; let n = 0;
  if(sl.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;   // pas d'animation si l'utilisateur l'a demandé
  setInterval(() => { if(document.hidden || S.view!=='landing') return; sl[n].classList.remove('on'); n = (n+1) % sl.length; sl[n].classList.add('on'); }, 3200);
})();
$('#tiles').innerHTML = TILES.map(id => MUSTACHES.find(m => m.id===id)).map(m => `<div class="tile"><img src="${ASSETS['m_'+m.id]}" alt="${m.name}"></div>`).join('');
const car = $('#carousel');
car.innerHTML = MUSTACHES.map((m,i) => `<button class="card" data-i="${i}" aria-pressed="${i===S.mi}"><div class="im">${m.none ? '<span class="nf">🧔</span>' : `<img src="${ASSETS['m_'+m.id]}" alt="">`}</div><b>${m.name}</b><i>${m.vibe}</i></button>`).join('');
car.addEventListener('click', e => {
  const b = e.target.closest('.card'); if(!b) return;
  S.mi = +b.dataset.i; touch();
  car.querySelectorAll('.card').forEach(c => c.setAttribute('aria-pressed', c===b));
  b.scrollIntoView({inline:'center', block:'nearest', behavior:'smooth'});
});
$('#sl-mscale').oninput = e => { S.mscale = +e.target.value; touch(); };
$('#sl-my').oninput     = e => { S.my = +e.target.value; touch(); };
$('#sl-zoom').oninput   = e => { S.zoom = +e.target.value; touch(); };
$('#btn-timer').onclick = () => {
  S.timer = S.timer ? 0 : 3;
  const b=$('#btn-timer'); b.innerHTML = S.timer ? 'Minuteur<br>3 s' : 'Minuteur<br>off'; b.setAttribute('aria-pressed', !!S.timer);
};

/* ---------- modèles de détourage (MediaPipe Tasks Vision, hébergés dans vendor/mediapipe-tasks/) ---------- */
// Deux petits adaptateurs gardent l'interface d'avant : seg.send({image}) → onSeg ; fm.initialize() puis fm.send({image}) → S.lm.
const TASKS = 'vendor/mediapipe-tasks/';
let fileset = null;
async function buildModels(h){
  await scriptLoad(TASKS + 'vision_bundle.js');            // définit la variable globale « Vision »
  fileset ||= await Vision.FilesetResolver.forVisionTasks(TASKS + 'wasm');
  const segmenter = await Vision.ImageSegmenter.createFromOptions(fileset, {
    baseOptions:{modelAssetPath: TASKS + 'selfie_segmenter.tflite', delegate:'CPU'},
    runningMode:'IMAGE', outputConfidenceMasks:true, outputCategoryMask:false,
  });
  const maskCv = document.createElement('canvas'), mctx = maskCv.getContext('2d');
  h.seg = {
    send: async ({image}) => {
      const res = segmenter.segment(image);
      try{
        const m = res.confidenceMasks && res.confidenceMasks[res.confidenceMasks.length - 1];
        if(!m) return;
        const mw = m.width, mh = m.height, f = m.getAsFloat32Array();
        if(maskCv.width !== mw || maskCv.height !== mh){ maskCv.width = mw; maskCv.height = mh; }
        const px = mctx.createImageData(mw, mh), d = px.data;
        for(let i=0, n=mw*mh; i<n; i++) d[i*4+3] = Math.max(0, Math.min(255, f[i]*255));   // l'opacité = probabilité « personne »
        mctx.putImageData(px, 0, 0);
        onSeg({segmentationMask: maskCv});
      }finally{ res.close(); }
    },
    close: () => segmenter.close(),
  };
  let landmarker = null;
  h.fm = {
    initialize: async () => {
      landmarker = await Vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions:{modelAssetPath: TASKS + 'face_landmarker.task', delegate:'CPU'},
        runningMode:'IMAGE', numFaces:1, minFaceDetectionConfidence:.5, minTrackingConfidence:.5,
      });
    },
    send: async ({image}) => {
      if(!landmarker) return;
      const r = landmarker.detect(image);
      S.lm = (r.faceLandmarks && r.faceLandmarks[0]) || null;
    },
    close: () => landmarker && landmarker.close(),
  };
}
// Une seule initialisation à la fois ; deux essais de 20 s au plus ; « Réessayer » repart de zéro.
function initModels(){
  if(S.modelsReady) return Promise.resolve(true);
  if(S.modelsFailed) return Promise.resolve(false);
  return S.modelsPromise ||= (async () => {
    for(let essai=0; essai<2; essai++){
      const h = {};
      try{
        await withTimeout(buildModels(h), 20000);
        S.seg = h.seg; S.fm = h.fm; S.modelsReady = true;
        const fm = S.fm;                                   // le visage est un plus : sans lui, moustache placée au jugé
        S.fmInit = fm.initialize().then(() => { S.fmReady = true; }).catch(() => { if(S.fm === fm) S.fm = null; });   // rien n'est envoyé au visage avant la fin
        return true;
      }catch(err){
        console.warn(err);
        try{ h.seg && h.seg.close(); }catch(e){}
        try{ h.fm && h.fm.close(); }catch(e){}
      }
    }
    S.modelsFailed = true; S.seg = null; S.fm = null; S.modelsPromise = null;
    return false;
  })();
}
function camMessage(err){
  const n = err && err.name;
  if(n==='NotAllowedError' || n==='SecurityError') return "La caméra est refusée. Autorise-la dans les réglages de ton navigateur, ou choisis une photo.";
  if(n==='NotFoundError' || n==='OverconstrainedError') return "Aucune caméra trouvée sur cet appareil. Choisis une photo à la place.";
  if(n==='NotReadableError' || n==='AbortError') return "La caméra est utilisée par une autre application. Ferme-la puis réessaie, ou choisis une photo.";
  if(!window.isSecureContext) return "La caméra demande une connexion sécurisée (HTTPS). Choisis une photo à la place.";
  return "Impossible d'accéder à la caméra. Choisis une photo à la place.";
}
function showError(text, boutons){                         // boutons : ids à afficher parmi file, retry, continue
  $('#cam-error-text').textContent = text;
  for(const id of ['file','retry','continue']) $('#btn-err-'+id).hidden = !boutons.includes(id);
  $('#cam-error').hidden = false;
}
const showModelsError = () => showError("Le détourage n'a pas pu se charger (connexion ?). Tu peux réessayer, ou continuer avec une découpe simplifiée.", ['retry','continue']);

/* ---------- caméra ---------- */
const setCamControls = off => { $('#btn-flip').disabled = off; $('#btn-retake').disabled = off; };
function stopStream(){
  if(S.stream){ S.stream.getTracks().forEach(t=>t.stop()); S.stream = null; }
  vid.srcObject = null;
}
function clearCountdown(){
  if(S.countId){ clearInterval(S.countId); S.countId = 0; }
  $('#count').hidden = true; $('#btn-shutter').disabled = false; S.capturing = false;
}
async function startCamera(){
  const my = ++S.camGen, stale = () => my !== S.camGen;
  S.staticMode = false; S.hasMask = false; S.tr = null; S.lm = null; S.m = null; S.camDenied = false;
  cancelAnimationFrame(S.raf); stopStream(); clearCountdown(); setCamControls(true);
  show('camera');
  $('#cam-error').hidden = true; $('#loading').hidden = false; $('#loading-text').textContent = 'Chargement du détourage…';
  try{
    await assetsReady; if(stale()) return;
    let st = null;
    try{
      st = await navigator.mediaDevices.getUserMedia({video:{facingMode:S.facing, width:{ideal:1280}, height:{ideal:1280}}, audio:false});
      if(stale()){ st.getTracks().forEach(t=>t.stop()); return; }       // « Fermer » pendant l'invite d'autorisation
      S.stream = st; vid.srcObject = st; await vid.play();
      if(stale()) return;                                               // stopCamera a déjà coupé le flux
      S.src = vid; S.mirror = S.facing === 'user';
    }catch(err){
      if(st){ st.getTracks().forEach(t=>t.stop()); if(S.stream===st) S.stream = null; }   // play() a échoué : le voyant s'éteint
      if(stale()) return;
      S.camDenied = err && (err.name==='NotAllowedError' || err.name==='SecurityError');
      $('#loading').hidden = true;
      showError(camMessage(err), ['file']);
      S.src = null;
      S.raf = requestAnimationFrame(tick);
      return;                                                           // caméra refusée : les modèles ne se chargent que si on choisit une photo
    }
    $('#loading').hidden = true;                                        // aperçu simple : les modèles ne se chargent qu'après la photo
    S.raf = requestAnimationFrame(tick);
  }finally{ if(!stale()) setCamControls(false); }
}
function stopCamera(){
  S.camGen++;
  cancelAnimationFrame(S.raf); clearCountdown(); stopStream(); setCamControls(false);
}
$('#btn-flip').onclick = () => { S.facing = S.facing==='user' ? 'environment' : 'user'; startCamera(); };
$('#btn-close').onclick = () => { stopCamera(); show('landing'); };
$('#btn-start').onclick = startCamera;

/* navigateurs intégrés (Instagram, Facebook, TikTok) : la caméra y est souvent bloquée → on propose l'appareil photo natif ou un navigateur normal */
const IN_APP = /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Snapchat/i.test(navigator.userAgent);
const NO_CAM = !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia;
if(IN_APP || NO_CAM){
  $('#iab-text').textContent = IN_APP
    ? "Pour prendre la photo, ouvre ce lien dans Safari ou Chrome (menu ⋯ → Ouvrir dans le navigateur). Tu peux aussi choisir une photo, ou en prendre une avec l'appareil photo de ton téléphone :"
    : "La caméra n'est pas disponible dans ce navigateur (ou la page n'est pas en HTTPS). Choisis une photo, ou prends-en une avec l'appareil photo de ton téléphone :";
  $('#iab').hidden = false;
}
$('#btn-gallery').onclick = () => $('#file').click();
$('#btn-err-file').onclick = () => $('#file-cam').click();
$('#btn-err-continue').onclick = () => { $('#cam-error').hidden = true; };
$('#btn-err-retry').onclick = () => {
  S.modelsFailed = false; S.modelsPromise = null;
  if(S.staticMode){ $('#cam-error').hidden = true; $('#loading').hidden = false; finishStatic(S.camGen); }
  else startCamera();
};

// Lit une photo de la galerie : refuse ce que le navigateur ne sait pas décoder ; au-delà de 2048 px sur le grand côté,
// la réduit (PNG sans perte). Sinon l'image d'origine est gardée telle quelle (aucun ré-encodage).
async function readPhoto(f){
  const url = URL.createObjectURL(f);
  try{
    const img = await load(url);
    if(!img.naturalWidth) throw new Error('illisible');
    const k = Math.min(1, 2048 / Math.max(img.naturalWidth, img.naturalHeight));
    if(k === 1) return img;                                // décodée : elle reste utilisable après la révocation de l'adresse
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth*k); c.height = Math.round(img.naturalHeight*k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    if(!blob) throw new Error('réduction impossible');
    const u2 = URL.createObjectURL(blob);
    try{ const r = await load(u2); if(!r.naturalWidth) throw new Error('illisible'); return r; }
    finally{ URL.revokeObjectURL(u2); }
  } finally { URL.revokeObjectURL(url); }
}
const onPhoto = async e => {
  const f = e.target.files[0]; e.target.value = ''; if(!f) return;
  let img;
  try{ img = await readPhoto(f); }
  catch(err){ toast("Cette photo ne peut pas être lue (essaie un JPEG ou PNG).", 5000); return; }   // l'écran reste dans son état précédent
  const my = ++S.camGen;                                   // annule toute caméra en cours de démarrage
  cancelAnimationFrame(S.raf); stopStream(); clearCountdown(); setCamControls(false);
  show('camera');                                          // depuis l'accueil (photo choisie sans passer par la caméra)
  $('#cam-error').hidden = true; $('#loading').hidden = false; $('#loading-text').textContent = 'Chargement du détourage…';
  S.src = img; S.mirror = false; S.staticMode = true; S.hasMask = false; S.tr = null; S.lm = null; S.m = null; S.camDenied = false;
  S.vw = img.naturalWidth; S.vh = img.naturalHeight;
  await assetsReady;
  if(my === S.camGen) await finishStatic(my);
};
$('#file').onchange = onPhoto; $('#file-cam').onchange = onPhoto;
async function finishStatic(my){
  const ok = await initModels(); if(my !== S.camGen) return;
  await processOnce(); if(my !== S.camGen) return;
  $('#loading').hidden = true;
  if(!ok) showModelsError();
  touch();
  cancelAnimationFrame(S.raf); S.raf = requestAnimationFrame(tick);
}
async function processOnce(){
  if(S.fm){ try{ await withTimeout(S.fmInit, 10000); }catch(e){} }
  if(S.fm && S.fmReady){ for(let i=0;i<2;i++){ try{ await withTimeout(S.fm.send({image:S.src}), 10000); }catch(e){} } }
  if(S.seg){ try{ await withTimeout(S.seg.send({image:S.src}), 10000); }catch(e){ fallbackPerson(); } }
  else fallbackPerson();
}

/* ---------- détourage : masque -> silhouette + repères tête ---------- */
function onSeg(res){
  const w = S.src.videoWidth || S.src.naturalWidth || S.src.width, h = S.src.videoHeight || S.src.naturalHeight || S.src.height;
  if(!w) return;
  S.vw = w; S.vh = h;
  if(S.person.width!==w || S.person.height!==h){ S.person.width=w; S.person.height=h; }
  pctx.globalCompositeOperation = 'source-over';
  pctx.clearRect(0,0,w,h);
  pctx.drawImage(res.segmentationMask, 0, 0, w, h);
  pctx.globalCompositeOperation = 'source-in';
  pctx.drawImage(S.src, 0, 0, w, h);
  pctx.globalCompositeOperation = 'source-over';
  S.hasMask = true;
  analyseMask(res.segmentationMask, w, h);
}
function analyseMask(mask, w, h){
  const sw = 96, sh = Math.max(8, Math.round(96*h/w));
  if(small.width!==sw || small.height!==sh){ small.width=sw; small.height=sh; }
  sctx.clearRect(0,0,sw,sh); sctx.drawImage(mask,0,0,sw,sh);
  const d = sctx.getImageData(0,0,sw,sh).data;
  const on = (x,y) => d[(y*sw+x)*4+3] > 140;
  let top = -1;
  for(let y=0;y<sh && top<0;y++){ let c=0; for(let x=0;x<sw;x++) if(on(x,y)) c++; if(c>=Math.max(3,sw*.04)) top=y; }
  if(top<0){ return; }                                    // personne dans le champ
  S.lastSeen = performance.now();
  let sx=0, n=0;
  for(let y=top;y<Math.min(sh,top+Math.round(sh*.08));y++) for(let x=0;x<sw;x++) if(on(x,y)){ sx+=x; n++; }
  const topX = (sx/Math.max(1,n)+.5)/sw*w, topY = top/sh*h;
  // largeur de visage : joue à joue si on a les repères, sinon estimée sur le masque
  let faceW;
  if(S.lm){ faceW = Math.hypot((S.lm[234].x-S.lm[454].x)*w, (S.lm[234].y-S.lm[454].y)*h); }
  else{
    const ry = Math.min(sh-1, top + Math.round(sh*.11)); let a=sw,b=-1;
    for(let x=0;x<sw;x++) if(on(x,ry)){ if(x<a)a=x; if(x>b)b=x; }
    faceW = Math.max(sw*.12, (b-a+1)) / sw * w * .92;
  }
  S.tgt = {topX, topY, faceW: Math.max(faceW, w*.08)};
}
function fallbackPerson(){                                 // si MediaPipe n'est pas dispo : découpe ovale simple
  const w = S.src.videoWidth || S.src.naturalWidth || S.src.width, h = S.src.videoHeight || S.src.naturalHeight || S.src.height; if(!w) return;
  S.vw=w; S.vh=h;
  if(S.person.width!==w || S.person.height!==h){ S.person.width=w; S.person.height=h; }
  pctx.clearRect(0,0,w,h); pctx.save(); pctx.beginPath();
  pctx.ellipse(w/2, h*.55, w*.32, h*.42, 0, 0, Math.PI*2); pctx.clip(); pctx.drawImage(S.src,0,0,w,h); pctx.restore();
  S.hasMask = true; S.lastSeen = performance.now();
  S.tgt = {topX:w/2, topY:h*.13, faceW:w*.30};
}

/* ---------- boucle ---------- */
async function tick(){
  if(S.view!=='camera') return;
  try{
    const now = performance.now();
    const mode = S.staticMode ? 'photo' : 'live';
    if($('#s-camera').dataset.mode !== mode) $('#s-camera').dataset.mode = mode;
    const ready = S.src && (S.staticMode || (S.src.readyState>=2 && S.src.videoWidth));
    if(ready && !S.staticMode){                                        // en direct : la caméra seule, sans IA (économise la batterie)
      const v = S.src, vw = v.videoWidth, vh = v.videoHeight, sc = Math.max(PW/vw, PH/vh);
      pc.save(); pc.clearRect(0,0,PW,PH);
      if(S.mirror){ pc.translate(PW,0); pc.scale(-1,1); }
      pc.drawImage(v, (PW-vw*sc)/2, (PH-vh*sc)/2, vw*sc, vh*sc); pc.restore();
    }else if(!S.staticMode || S.settle > 0){                                 // photo fixe : on ne redessine que quand une valeur a changé
      smooth();
      render(pc, PW, PH);
      if(S.staticMode) S.settle--;
    }
    const seen = performance.now()-S.lastSeen < 1500;
    const txt = !S.src ? 'Caméra indisponible' : !S.staticMode ? 'Cadre ton visage, puis déclenche' : S.camDenied || !S.src ? 'Caméra indisponible' : 'Ajuste si besoin, puis valide';
    if(txt !== S.hintTxt){ S.hintTxt = txt; $('#hint').textContent = txt; }
  }catch(err){ console.warn(err); }
  S.raf = requestAnimationFrame(tick);
}

/* ---------- géométrie ---------- */
function scaleNow(){ return S.tr ? (FACE_W/S.tr.faceW)*S.zoom : 1; }
function mapPt(p){                                         // repère vidéo normalisé -> repère 1080x1350
  const s = scaleNow(), dir = S.mirror ? -1 : 1;
  return {x: HEAD_X + dir*(p.x*S.vw - S.tr.topX)*s, y: HEAD_Y + (p.y*S.vh - S.tr.topY)*s};
}
function smooth(){
  if(S.tgt){ S.tr = S.tr ? {topX:lerp(S.tr.topX,S.tgt.topX,.25), topY:lerp(S.tr.topY,S.tgt.topY,.25), faceW:lerp(S.tr.faceW,S.tgt.faceW,.2)} : {...S.tgt}; }
  if(!S.tr) return;
  let t;
  if(S.lm){
    const nose=mapPt(S.lm[2]), lip=mapPt(S.lm[0]), mL=mapPt(S.lm[61]), mR=mapPt(S.lm[291]);
    let cL=mapPt(S.lm[234]), cR=mapPt(S.lm[454]); if(cR.x<cL.x) [cL,cR]=[cR,cL];
    const mw = Math.hypot(mL.x-mR.x, mL.y-mR.y);
    t = {x:(nose.x*.45+lip.x*.55)/W, y:(nose.y*.45+lip.y*.55)/H, w:mw/W, a:Math.atan2(cR.y-cL.y, cR.x-cL.x)};
  }else{
    t = {x:HEAD_X/W, y:.655, w:.17, a:0};                   // position moyenne si pas de repères
  }
  S.m = S.m ? {x:lerp(S.m.x,t.x,.35), y:lerp(S.m.y,t.y,.35), w:lerp(S.m.w,t.w,.3), a:lerp(S.m.a,t.a,.3)} : t;
}

/* ---------- rendu : fond -> silhouette -> moustache -> infos -> texte ---------- */
function render(ctx, w, h){
  const k = w/W;
  ctx.clearRect(0,0,w,h);
  ctx.drawImage(IMG.fond, 0, 0, w, h);
  if(S.hasMask && S.tr && S.vw){
    const s = scaleNow()*k, dir = S.mirror ? -1 : 1;
    ctx.save(); ctx.translate(HEAD_X*k, HEAD_Y*k); ctx.scale(dir*s, s); ctx.translate(-S.tr.topX, -S.tr.topY);
    ctx.drawImage(S.person, 0, 0); ctx.restore();
  }
  const mu = MUSTACHES[S.mi];
  if(S.hasMask && S.m && mu.img && mu.img.naturalWidth){
    const mw = S.m.w*W*mu.wf*S.mscale*k, mh = mw*mu.img.naturalHeight/mu.img.naturalWidth;
    const cy = S.m.y*H*k + (S.my/100)*S.m.w*W*k;
    ctx.save(); ctx.translate(S.m.x*W*k, cy); ctx.rotate(S.m.a);
    ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 6*k; ctx.shadowOffsetY = 3*k;
    ctx.drawImage(mu.img, -mw/2, -mu.ay*mh, mw, mh); ctx.restore();
  }
  ctx.drawImage(IMG.infos, 0, 0, w, h);
  // « Faites un don sur fr.movember.com » est déjà dans l'image infos : ne pas le redessiner (texte doublé)
}

/* ---------- capture ---------- */
async function freezeFrame(){                              // fige l'image de la caméra, puis pose la moustache comme sur une photo importée
  const v = S.src; if(!v || !v.videoWidth){ S.capturing = false; return; }
  const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
  const x = c.getContext('2d'); if(S.mirror){ x.translate(c.width, 0); x.scale(-1, 1); } x.drawImage(v, 0, 0);
  const my = ++S.camGen;
  cancelAnimationFrame(S.raf); stopStream(); clearCountdown(); setCamControls(false);
  $('#loading').hidden = false; $('#loading-text').textContent = 'Pose de la moustache…';
  S.src = c; S.mirror = false; S.staticMode = true; S.hasMask = false; S.tr = null; S.lm = null; S.m = null; S.camDenied = false;
  S.vw = c.width; S.vh = c.height;
  await assetsReady;
  if(my === S.camGen) await finishStatic(my);
}
$('#btn-shutter').onclick = () => {
  if(S.capturing) return;                                  // anti double appui
  const go = () => S.staticMode ? capture() : freezeFrame();
  if(S.staticMode && !S.hasMask){ toast('Un instant, le détourage démarre…'); return; }
  S.capturing = true;
  if(!S.timer){ go(); return; }
  const c = $('#count'); let n = S.timer; c.hidden = false; c.textContent = n; $('#btn-shutter').disabled = true;
  S.countId = setInterval(() => {
    n--;
    if(n>0){ c.textContent = n; return; }
    clearInterval(S.countId); S.countId = 0; c.hidden = true; $('#btn-shutter').disabled = false;
    go();
  }, 1000);
};
async function capture(){
  const gen = S.camGen;
  try{
    if(S.view!=='camera') return;
    const f = $('#flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
    try{ await withTimeout(document.fonts.load('600 40px Fredoka'), 2000); }catch(e){}
    if(gen !== S.camGen || S.view!=='camera') return;      // fermé pendant l'attente : aucune photo
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    render(c.getContext('2d'), W, H);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', .93));
    if(!blob){ toast("La photo n'a pas pu être créée. Réessaie.", 4500); return; }
    if(gen !== S.camGen || S.view!=='camera') return;
    const ancienne = S.url;
    S.blob = blob; S.url = URL.createObjectURL(blob);
    stopCamera();
    $('#res-img').src = S.url; $('#pk1').src = S.url; $('#res-name').textContent = MUSTACHES[S.mi].name;
    $('#cap-text').textContent = caption();
    show('result');
    if(ancienne) URL.revokeObjectURL(ancienne);            // révoquée seulement une fois la nouvelle affichée
    prepareFiles();
  }catch(err){
    console.warn(err); toast("La photo n'a pas pu être créée. Réessaie.", 4500);
  }finally{ S.capturing = false; }
}

/* ---------- partage ---------- */
const dataToFile = async (data, name, type) => {
  const r = await fetch(data); if(!r.ok) throw new Error('fetch '+data);
  return new File([await r.blob()], name, {type});
};
async function prepareFiles(){
  const my = ++S.prepGen, blob = S.blob;                   // un résultat périmé n'écrase pas S.files
  S.files = null; $('#dl-list').hidden = true;
  try{
    const files = [
      new File([blob], 'nousnours-movember-moi.jpg', {type:'image/jpeg'}),
      await dataToFile(SHARE.explications, 'nousnours-movember-explications.jpg', 'image/jpeg'),
      await dataToFile(SHARE.affiche, 'nousnours-movember-tombola-42bar.jpg', 'image/jpeg'),
    ];
    if(my === S.prepGen) S.files = files;
  }catch(err){ console.warn(err); }
}
function download(file){ const a=document.createElement('a'); a.href=URL.createObjectURL(file); a.download=file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),4000); }
async function copyCaption(){ try{ await navigator.clipboard.writeText(caption()); return true; }catch(e){ return false; } }
function selectCaption(){ const r = document.createRange(); r.selectNodeContents($('#cap-text')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
$('#cap-tags').onchange = () => { $('#cap-text').textContent = caption(); };
$('#btn-dl').onclick = () => { download(new File([S.blob],'nousnours-movember-moi.jpg',{type:'image/jpeg'})); };
$('#btn-cap').onclick = async () => { if(await copyCaption()) toast('Légende copiée ✔'); else { selectCaption(); toast('Copie impossible : la légende est sélectionnée, copie-la à la main.', 4500); } };
$('#btn-retake').onclick = startCamera;
$('#btn-share').onclick = () => shareFiles();
async function shareFiles(){
  if(!S.files){ toast('Préparation des images…'); await prepareFiles(); }
  if(!S.files){ toast("Les images n'ont pas pu être préparées. Réessaie.", 4500); return; }
  const data = {files:S.files, title:'Movember · Nous Nours', text:caption()};
  if(navigator.canShare && navigator.canShare({files:S.files})){
    copyCaption();                                         // Instagram ignore le texte : on le met au presse-papier
        try{ await navigator.share(data); toast("Légende copiée : colle-la dans ta publication 🐻"); }
    catch(e){ if(e.name!=='AbortError'){ console.warn(e); fallbackAll(); } }
  }else fallbackAll();
}
async function fallbackAll(){                              // pas de téléchargements en rafale : un bouton par image
  const ok = await copyCaption();
  $('#dl-list').hidden = false;
  toast(ok ? "Partage direct indisponible ici : la légende est copiée, télécharge les images ci-dessous." : "Partage direct indisponible ici : télécharge les images ci-dessous.", 5500);
}
document.querySelectorAll('#dl-list [data-dl]').forEach(b => b.onclick = () => { if(S.files) download(S.files[+b.dataset.dl]); });

/* sécurité : on coupe la caméra si l'onglet passe en arrière-plan ; au retour on la relance seulement si elle tournait (ou démarrait) et n'a pas été refusée */
document.addEventListener('visibilitychange', () => {
  if(document.hidden){
    if(S.view==='camera' && !S.staticMode){ S.resume = !S.camDenied; stopCamera(); }
  }else if(S.resume && S.view==='camera' && !S.staticMode){
    S.resume = false; startCamera();
  }
});

/* hors ligne : service worker (seulement en HTTPS ou sur localhost) */
if('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')){
  navigator.serviceWorker.register('sw.js').catch(e => console.warn('sw', e));
}
})();
