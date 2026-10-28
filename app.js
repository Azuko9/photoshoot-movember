/* Chemins des images (extraites de l'ancien objet ASSETS en base64, voir scripts/extraire-assets.mjs) */
const ASSETS = {
  "m_shebear": "assets/m_shebear.png",
  "s2": "assets/s2.jpg",
  "s4": "assets/s4.jpg",
  "titre": "assets/titre.png",
  "infos": "assets/infos.png",
  "m_resina": "assets/m_resina.png",
  "s5": "assets/s5.jpg",
  "m_pintxours": "assets/m_pintxours.png",
  "s3": "assets/s3.jpg",
  "m_rainbow": "assets/m_rainbow.png",
  "m_mourstache": "assets/m_mourstache.png",
  "explications": "assets/explications.jpg",
  "m_oursonne": "assets/m_oursonne.png",
  "affiche": "assets/affiche.jpg",
  "m_fluours": "assets/m_fluours.png",
  "fond": "assets/fond.jpg",
  "empreinte": "assets/empreinte.png",
  "logo": "assets/logo.png",
  "s1": "assets/s1.jpg",
  "m_classique": "assets/m_classique.png",
  "m_bearnaise": "assets/m_bearnaise.png"
};

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
const CAPTION = "Je porte la moustache pour #Movember avec l'association Bear @nousnours64.40 🐻🥸 Participez à la prévention de la santé masculine et faites un don sur fr.movember.com. Soirée caritative dimanche 22 novembre dès 18h au 42 Bar, 42 rue Pannecau, Bayonne : tombola, entrée gratuite, buffet offert ! #Movember #NousNours #Bayonne #lgbt #Bear";

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
function scriptLoad(url){ return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=url; s.crossOrigin='anonymous'; s.onload=res; s.onerror=()=>rej(new Error('load '+url)); document.head.appendChild(s); }); }
const lerp = (a,b,t) => a + (b-a)*t;

/* ---------- accueil / carrousel ---------- */
(() => {                                                   // diaporama automatique de l'accueil
  const sl = [...document.querySelectorAll('#slides .slide')]; let n = 0;
  if(sl.length < 2) return;
  setInterval(() => { if(document.hidden || S.view!=='landing') return; sl[n].classList.remove('on'); n = (n+1) % sl.length; sl[n].classList.add('on'); }, 3200);
})();
$('#tiles').innerHTML = TILES.map(id => MUSTACHES.find(m => m.id===id)).map(m => `<div class="tile"><img src="${ASSETS['m_'+m.id]}" alt="${m.name}"></div>`).join('');
const car = $('#carousel');
car.innerHTML = MUSTACHES.map((m,i) => `<button class="card" role="option" data-i="${i}" aria-pressed="${i===S.mi}"><div class="im">${m.none ? '<span class="nf">🧔</span>' : `<img src="${ASSETS['m_'+m.id]}" alt="">`}</div><b>${m.name}</b><i>${m.vibe}</i></button>`).join('');
car.addEventListener('click', e => {
  const b = e.target.closest('.card'); if(!b) return;
  S.mi = +b.dataset.i;
  car.querySelectorAll('.card').forEach(c => c.setAttribute('aria-pressed', c===b));
  b.scrollIntoView({inline:'center', block:'nearest', behavior:'smooth'});
});
$('#sl-mscale').oninput = e => S.mscale = +e.target.value;
$('#sl-my').oninput     = e => S.my = +e.target.value;
$('#sl-zoom').oninput   = e => S.zoom = +e.target.value;
$('#btn-timer').onclick = () => {
  S.timer = S.timer ? 0 : 3;
  const b=$('#btn-timer'); b.innerHTML = S.timer ? 'Minuteur<br>3 s' : 'Minuteur<br>off'; b.setAttribute('aria-pressed', !!S.timer);
};

/* ---------- modèles de détourage (MediaPipe, via CDN) ---------- */
async function initModels(){
  if(S.modelsReady || S.modelsFailed) return;
  try{
    await Promise.all([
      scriptLoad('https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/selfie_segmentation.js'),
      scriptLoad('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js'),
    ]);
    S.seg = new SelfieSegmentation({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/${f}`});
    S.seg.setOptions({modelSelection:0});
    S.seg.onResults(onSeg);
    S.fm = new FaceMesh({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${f}`});
    S.fm.setOptions({maxNumFaces:1, refineLandmarks:false, minDetectionConfidence:.5, minTrackingConfidence:.5});
    S.fm.onResults(r => { S.lm = (r.multiFaceLandmarks && r.multiFaceLandmarks[0]) || null; });
    await S.seg.initialize();
    S.modelsReady = true;
    S.fm.initialize().catch(()=>{ S.fm = null; });   // le visage est un plus : sans lui, moustache placée au jugé
  }catch(err){
    console.warn(err); S.modelsFailed = true; S.seg = null; S.fm = null;
    toast("Détourage indisponible (connexion ?) : mode simplifié activé.", 5000);
  }
}

/* ---------- caméra ---------- */
async function startCamera(){
  S.staticMode = false; S.hasMask = false; S.tr = null; S.lm = null; S.m = null;
  show('camera');
  $('#cam-error').hidden = true; $('#loading').hidden = false; $('#loading-text').textContent = 'Chargement du détourage…';
  await assetsReady;
  try{
    if(S.stream) S.stream.getTracks().forEach(t=>t.stop());
    S.stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:S.facing, width:{ideal:1280}, height:{ideal:1280}}, audio:false});
    vid.srcObject = S.stream; await vid.play();
    S.src = vid; S.mirror = S.facing === 'user';
  }catch(err){
    $('#loading').hidden = true;
    $('#cam-error-text').textContent = "Impossible d'accéder à la caméra. Autorise-la dans ton navigateur, ou choisis une photo dans ta galerie.";
    $('#cam-error').hidden = false;
    S.src = null;
  }
  await initModels();
  $('#loading').hidden = true;
  cancelAnimationFrame(S.raf); S.raf = requestAnimationFrame(tick);
}
function stopCamera(){
  cancelAnimationFrame(S.raf);
  if(S.stream){ S.stream.getTracks().forEach(t=>t.stop()); S.stream=null; }
}
$('#btn-flip').onclick = () => { S.facing = S.facing==='user' ? 'environment' : 'user'; startCamera(); };
$('#btn-close').onclick = () => { stopCamera(); show('landing'); };
$('#btn-start').onclick = startCamera;
$('#btn-err-file').onclick = () => $('#file').click();

$('#file').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if(!f) return;
  const img = await load(URL.createObjectURL(f));
  if(S.stream){ S.stream.getTracks().forEach(t=>t.stop()); S.stream=null; }
  $('#cam-error').hidden = true; $('#loading').hidden = false;
  S.src = img; S.mirror = false; S.staticMode = true; S.hasMask = false; S.tr = null; S.lm = null; S.m = null;
  S.vw = img.naturalWidth; S.vh = img.naturalHeight;
  await assetsReady; await initModels();
  await processOnce();
  $('#loading').hidden = true;
  cancelAnimationFrame(S.raf); S.raf = requestAnimationFrame(tick);
};
async function processOnce(){
  if(S.fm){ for(let i=0;i<2;i++){ try{ await S.fm.send({image:S.src}); }catch(e){} } }
  if(S.seg){ try{ await S.seg.send({image:S.src}); }catch(e){} }
  else fallbackPerson();
}

/* ---------- détourage : masque -> silhouette + repères tête ---------- */
function onSeg(res){
  const w = S.src.videoWidth || S.src.naturalWidth, h = S.src.videoHeight || S.src.naturalHeight;
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
  const w = S.src.videoWidth || S.src.naturalWidth, h = S.src.videoHeight || S.src.naturalHeight; if(!w) return;
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
  const ready = S.src && (S.staticMode || (S.src.readyState>=2 && S.src.videoWidth));
  if(ready && !S.staticMode && !S.busy){
    S.busy = true;
    try{
      if(S.seg){ await S.seg.send({image:S.src}); } else fallbackPerson();
      if(S.fm && S.frame%3===0) await S.fm.send({image:S.src});
    }catch(e){}
    S.busy = false; S.frame++;
  }
  smooth();
  render(pc, PW, PH);
  const seen = performance.now()-S.lastSeen < 1500;
  $('#hint').textContent = !S.src ? 'Caméra indisponible' : (seen || !S.hasMask) ? 'Aligne ta tête sous le toupet' : 'Je ne te vois pas : place-toi face à la caméra';
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
  ctx.save();
  ctx.font = `600 ${Math.round(0.034*w)}px Fredoka, "Geist", system-ui, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(6,32,47,.75)'; ctx.shadowBlur = 8*k; ctx.shadowOffsetY = 2*k;
  ctx.fillStyle = '#fff'; ctx.fillText('Faites un don sur fr.movember.com', 0.5*w, 0.846*h);
  ctx.restore();
}

/* ---------- capture ---------- */
$('#btn-shutter').onclick = () => {
  if(!S.hasMask){ toast('Un instant, le détourage démarre…'); return; }
  if(!S.timer){ capture(); return; }
  const c = $('#count'); let n = S.timer; c.hidden = false; c.textContent = n; $('#btn-shutter').disabled = true;
  const iv = setInterval(() => { n--; if(n>0){ c.textContent = n; } else { clearInterval(iv); c.hidden = true; $('#btn-shutter').disabled = false; capture(); } }, 1000);
};
async function capture(){
  const f = $('#flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  try{ await document.fonts.load('600 40px Fredoka'); }catch(e){}
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  render(c.getContext('2d'), W, H);
  S.blob = await new Promise(r => c.toBlob(r, 'image/jpeg', .93));
  if(S.url) URL.revokeObjectURL(S.url);
  S.url = URL.createObjectURL(S.blob);
  stopCamera();
  $('#res-img').src = S.url; $('#pk1').src = S.url; $('#res-name').textContent = MUSTACHES[S.mi].name;
  $('#cap-text').textContent = CAPTION;
  show('result');
  prepareFiles();
}

/* ---------- partage ---------- */
const dataToFile = async (data, name, type) => new File([await (await fetch(data)).blob()], name, {type});
async function prepareFiles(){
  S.files = null;
  S.files = [
    new File([S.blob], 'nousnours-movember-moi.jpg', {type:'image/jpeg'}),
    await dataToFile(ASSETS.explications, 'nousnours-movember-explications.jpg', 'image/jpeg'),
    await dataToFile(ASSETS.affiche, 'nousnours-movember-tombola-42bar.jpg', 'image/jpeg'),
  ];
}
function download(file){ const a=document.createElement('a'); a.href=URL.createObjectURL(file); a.download=file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),4000); }
async function copyCaption(){ try{ await navigator.clipboard.writeText(CAPTION); return true; }catch(e){ return false; } }
$('#btn-dl').onclick = () => { download(new File([S.blob],'nousnours-movember-moi.jpg',{type:'image/jpeg'})); };
$('#btn-cap').onclick = async () => toast(await copyCaption() ? 'Légende copiée ✔' : 'Copie impossible : sélectionne le texte à la main.');
$('#btn-retake').onclick = startCamera;
$('#btn-share').onclick = async () => {
  if(!S.files){ toast('Préparation des images…'); await prepareFiles(); }
  const data = {files:S.files, title:'Movember · Nous Nours', text:CAPTION};
  if(navigator.canShare && navigator.canShare({files:S.files})){
    copyCaption();                                         // Instagram ignore le texte : on le met au presse-papier
    try{ await navigator.share(data); toast("Légende copiée : colle-la dans ta publication 🐻"); }
    catch(e){ if(e.name!=='AbortError'){ console.warn(e); fallbackAll(); } }
  }else fallbackAll();
};
async function fallbackAll(){
  await copyCaption();
  S.files.forEach((f,i) => setTimeout(() => download(f), i*600));
  toast("Partage direct indisponible ici : les 3 images sont téléchargées et la légende est copiée. Poste-les en carrousel !", 6500);
}

/* sécurité : on coupe la caméra si l'onglet passe en arrière-plan */
document.addEventListener('visibilitychange', () => { if(document.hidden && S.view==='camera' && !S.staticMode) stopCamera(); else if(!document.hidden && S.view==='camera' && !S.staticMode && !S.stream) startCamera(); });
})();
