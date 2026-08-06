(async () => {
try {
const ALERT_VERSION = "1";
const ALERT_MESSAGE = "met le raccourci a jour: https://www.icloud.com/shortcuts/13f1b93cdd114e37ac7a76c1c9aa85b6";
if (localStorage.getItem('ed_alert_version') !== ALERT_VERSION) {
alert(ALERT_MESSAGE);
localStorage.setItem('ed_alert_version', ALERT_VERSION);
}
let tok = null;
let id = null;
let cpt = null;
try {
const idt = JSON.parse(sessionStorage.getItem("credentials"));
if (idt && idt.payload && idt.payload.authToken) {
tok = idt.payload.authToken;
cpt = JSON.parse(sessionStorage.getItem("accounts"));
if (cpt && cpt.payload && cpt.payload.accounts && cpt.payload.accounts[0]) {
id = cpt.payload.accounts[0].id;
}
}
} catch (e) {}
if (!tok || !id) {
alert("Aucune session\nConnectez-vous sur ecoledirecte.com puis relancez le raccourci.");
completion("Erreur: Aucune session");
return;
}
var prof = cpt.payload.accounts[0];
var pren = prof.prenom || 'First';
var nom = prof.nom || 'Last';
var clas = prof.classe || prof.profile?.classe || null;
var clasTxt = '';
if (typeof clas === 'object' && clas !== null) {
clasTxt = clas.libelle || clas.code || '';
} else if (typeof clas === 'string') {
clasTxt = clas;
}
if (!clasTxt && prof.libelleClasse) {
clasTxt = prof.libelleClasse;
}
var logs = [];
var deb = false;
var maj = false;
var sur = localStorage.getItem('ed_notesSur') || '20';
var profNom = localStorage.getItem('ed_showProfName') === 'true';
var aff = localStorage.getItem('ed_notesDisplay') || 'pastilles';
var simu = JSON.parse(localStorage.getItem('ed_simulatedGrades') || '{}');
var simuAct = JSON.parse(localStorage.getItem('ed_enabledSimulated') || '{}');
var desact = JSON.parse(localStorage.getItem('ed_disabledGrades') || '{}');
var cache = JSON.parse(localStorage.getItem('ed_maskedGrades') || '{}');
var expCache = JSON.parse(localStorage.getItem('ed_maskedSenders') || '[]');
var rond = parseInt(localStorage.getItem('ed_roundness') || '8');
function logApi(url, code, duree) {
if (!deb) return;
logs.unshift({ heure: new Date().toLocaleString('fr-FR'), url: url, code: code, duree: duree + "ms" });
if (logs.length > 100) logs.pop();
}
function fetchTime(url, opts, timeout = 5000) {
return Promise.race([
fetch(url, opts),
new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
]);
}
function decodeTexte(str) {
if (!str) return "";
try {
if (/^[A-Za-z0-9+\/=]+$/.test(str) && str.length % 4 === 0) {
try {
var decode = atob(str);
var bytes = [];
for (var i = 0; i < decode.length; i++) bytes.push(decode.charCodeAt(i) & 0xFF);
return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
} catch (e) {}
}
var fix = str;
var corr = {
'Ã©': 'é', 'Ã¨': 'è', 'Ãª': 'ê', 'Ã«': 'ë', 'Ã¤': 'ä',
'Ã¢': 'â', 'Ã®': 'î', 'Ã¯': 'ï', 'Ã¶': 'ö', 'Ã¹': 'ù',
'Ã»': 'û', 'Ã¼': 'ü', 'Ã§': 'ç', 'â‚¬': '€', 'â€™': "'",
'â€œ': '"', 'â€': '"', 'â€"': '-', 'Â°': '°'
};
for (var mauvais in corr) {
while (fix.indexOf(mauvais) !== -1) fix = fix.split(mauvais).join(corr[mauvais]);
}
return fix;
} catch (e) {
return str;
}
}
function formaterDate(str) {
var d = new Date(str);
var jours = ["DIMANCHE", "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
var mois = ["JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE"];
return { jour: jours[d.getDay()], date: d.getDate() + " " + mois[d.getMonth()], complet: str };
}
function couleurMoy(m) {
if (m === null || isNaN(m)) return '#667080';
if (m < 10) return '#667080';
if (m < 12) return '#9aa3b1';
if (m < 14) return '#e9ecf2';
return '#e8f1ff';
}
function messageMoy(moy) {
if (moy === null || isNaN(moy)) return "Pret a commencer l'annee !";
var msgs = [];
if (moy >= 0 && moy < 5) msgs = ["La, va falloir bosser", "Le bon cote des choses, c'est que tu peux difficilement faire pire", "Attention a ne pas faire tomber ta moyenne en negatif"];
else if (moy >= 5 && moy < 10) msgs = ["Euuuuuuuuuuuuuh", "Bah fais tes devoirs aussi", "Pense a ton futur"];
else if (moy >= 10 && moy < 13) msgs = ["Au moins tu as une moyenne a 2 chiffre", "Arrete de jouer a Valo", "Dis toi que c'est 10/10 et pas 10/20"];
else if (moy >= 13 && moy < 15) msgs = ["Bon bah c ok", "Lache pas trop quand meme", "Dis toi que l'art et la musique ne comptent pas au exams"];
else if (moy >= 15 && moy < 17) msgs = ["Bon travail ! Tu peux geekhumtravailler !", "Vzy t chill", "async function etreAuTop()"];
else if (moy >= 17 && moy < 18.5) msgs = ["Cool cool cool", "T bien soigne", "Bravo, tu es au top !"];
else if (moy >= 18.5 && moy < 20) msgs = ["Faut pas copier sur tes voisins tu sais ?", "Bon amuse toi un peu", "L3G3ND3"];
else if (moy === 20) msgs = ["Tu as cheat comment ?"];
if (msgs.length > 0) return msgs[Math.floor(Math.random() * msgs.length)];
return "Continue tes efforts !";
}
function nbFil() {
var w = window.innerWidth;
if (w < 600) return 1;
if (w < 900) return 2;
if (w < 1200) return 3;
return 4;
}
var pNotes = fetchTime(`https://api.ecoledirecte.com/v3/eleves/${id}/notes.awp?verbe=get&v=6.17.0`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Token": tok }, body: "data=" + encodeURIComponent(JSON.stringify({ anneeScolaire: "" })) }, 5000).then(r => r.ok ? r.json() : { data: { notes: [] } }).catch(() => ({ data: { notes: [] } }));
var pDevoirs = fetchTime(`https://api.ecoledirecte.com/v3/Eleves/${id}/cahierdetexte.awp?verbe=get&v=4.98.0`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Token": tok }, body: "data=" + encodeURIComponent(JSON.stringify({})) }, 5000).then(r => r.ok ? r.json() : { data: {} }).catch(() => ({ data: {} }));
var pCarnet2 = fetchTime(`https://api.ecoledirecte.com/v3/eleves/${id}/eleveCarnetCorrespondance.awp?verbe=get&v=4.98.0`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Token": tok }, body: "data=" + encodeURIComponent(JSON.stringify({})) }, 5000).then(r => r.ok ? r.json() : { data: { correspondances: [] } }).catch(() => ({ data: { correspondances: [] } }));
var pVie = fetchTime(`https://api.ecoledirecte.com/v3/eleves/${id}/viescolaire.awp?verbe=get&v=4.98.0`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Token": tok }, body: "data=" + encodeURIComponent(JSON.stringify({})) }, 5000).then(r => r.ok ? r.json() : { data: { absencesRetards: [], sanctionsEncouragements: [] } }).catch(() => ({ data: { absencesRetards: [], sanctionsEncouragements: [] } }));
var pMessages = fetchTime(`https://api.ecoledirecte.com/v3/eleves/${id}/messages.awp?verbe=get&v=4.98.0`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Token": tok }, body: "data=" + encodeURIComponent(JSON.stringify({})) }, 5000).then(r => r.ok ? r.json() : { data: { messages: { received: [], sent: [], draft: [], archived: [] } } }).catch(() => ({ data: { messages: { received: [], sent: [], draft: [], archived: [] } } }));
var pFil = fetchTime(`https://api.ecoledirecte.com/v3/eleves/${id}/timeline.awp?verbe=get&v=4.98.0`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Token": tok }, body: "data=" + encodeURIComponent(JSON.stringify({})) }, 5000).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] }));
await new Promise(function(resolve) { setTimeout(resolve, 0); });
var res = await Promise.all([pNotes, pDevoirs, pCarnet2, pVie, pMessages, pFil]);
var jsonNotes = res[0], jsonDevoirs = res[1], jsonCarnet2 = res[2], jsonVie = res[3], jsonMessages = res[4], jsonFil = res[5];
var data = jsonNotes.data || {};
var notesOrig = data.notes || [];
var cahier = jsonDevoirs.data || {};
var carnet2 = jsonCarnet2.data || { correspondances: [] };
var vie = jsonVie.data || { absencesRetards: [], sanctionsEncouragements: [] };
var fil = Array.isArray(jsonFil.data) ? jsonFil.data : (Array.isArray(jsonFil) ? jsonFil : []);
var tris = {
"A001": { nom: "1er Trimestre", matieres: {} },
"A002": { nom: "2eme Trimestre", matieres: {} },
"A003": { nom: "3eme Trimestre", matieres: {} }
};
if (data.notes && Array.isArray(data.notes)) {
data.notes.slice(0, 500).forEach(function(n) {
var val = n.valeur;
var codePer = n.codePeriode;
if (val && val !== "" && val !== "NE" && val !== "Abs" && tris[codePer]) {
var num = parseFloat(val.replace(',', '.'));
if (!isNaN(num)) {
var surNote = parseFloat(n.noteSur) || 20;
var val20 = (num / surNote) * 20;
var mat = n.libelleMatiere;
var coef = parseFloat(n.coef) || 1;
if (!tris[codePer].matieres[mat]) tris[codePer].matieres[mat] = { somme: 0, sommeCoef: 0, nb: 0 };
tris[codePer].matieres[mat].somme += val20 * coef;
tris[codePer].matieres[mat].sommeCoef += coef;
tris[codePer].matieres[mat].nb++;
}
}
});
}
Object.keys(tris).forEach(function(t) {
Object.keys(tris[t].matieres).forEach(function(m) {
var mat = tris[t].matieres[m];
mat.moy = mat.somme / mat.sommeCoef;
});
});
var widget = document.createElement('div');
widget.id = 'ed-widget';
widget.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#17191f;z-index:999999;overflow:auto;font-family:sans-serif;';
var onglet = "accueil";
var triActuel = "A001";
var cacheJour = {};
var vuePrec = null;
var scrollPositions = {};
document.body.appendChild(widget);
await new Promise(function(resolve) { setTimeout(resolve, 0); });
setTimeout(function() {
var ICONS = {
inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>',
send: '<line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>',
file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>',
star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>',
trash: '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>',
search: '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>',
plus: '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>',
reply: '<polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>',
forward: '<polyline points="15 14 20 9 15 4"></polyline><path d="M4 20v-7a4 4 0 0 1 4-4h12"></path>',
more: '<circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none"></circle><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"></circle><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none"></circle>',
spam: '<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>',
eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>',
eyeoff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path><line x1="1" y1="1" x2="23" y2="23"></line>',
chevdown: '<polyline points="6 9 12 15 18 9"></polyline>'
};
function ic(n, extra) { return '<svg class="mi' + (extra ? ' ' + extra : '') + '" viewBox="0 0 24 24">' + (ICONS[n] || '') + '</svg>'; }
function triDefaut() {
var dispo = Object.keys(tris).filter(function(t) { return Object.keys(tris[t].matieres).length > 0; });
return dispo.length > 0 ? dispo[dispo.length - 1] : "A001";
}
triActuel = triDefaut();
function appliquerRond(r) {
rond = parseInt(r);
localStorage.setItem('ed_roundness', rond);
var style = document.getElementById('ed-rond-style');
if (!style) { style = document.createElement('style'); style.id = 'ed-rond-style'; document.head.appendChild(style); }
var px = rond + 'px';
style.textContent = `#ed-widget .subject-card, #ed-widget .stat-card, #ed-widget .home-card, #ed-widget .annual-card, #ed-widget .task-card, #ed-widget .home-hero, #ed-widget .hero-card, #ed-widget .carnet2-card, #ed-widget .message-item, #ed-widget .tab-bar, #ed-widget .trimester-selector, #ed-widget .tab-btn.active, #ed-widget .trimester-option.active, #ed-widget input, #ed-widget select, #ed-widget button, #ed-widget .profile-dropdown, #ed-widget .notes-table-ed, #ed-widget #ed-side-nav, #refreshFab, #ed-menu-fab, #ed-widget .mui-app, #ed-widget .mui-side, #ed-widget .mui-list, #ed-widget .mui-reader, #ed-widget .mui-mail, #ed-widget .set-card, #ed-widget .cdt-card, #ed-widget .cdt-sched-item, #ed-widget .cdt-inst, #ed-widget .cdt-mark-btn, #ed-widget .cdt-btn { border-radius: ${px} !important; }`;
}
function ouvrirSideNav() {
var nav = document.getElementById('ed-side-nav');
var ov = document.getElementById('ed-side-overlay');
if (nav) nav.classList.add('open');
widget.classList.add('nav-open');
if (ov) ov.classList.add('active');
}
function fermerSideNav() {
var nav = document.getElementById('ed-side-nav');
var ov = document.getElementById('ed-side-overlay');
if (nav) nav.classList.remove('open');
widget.classList.remove('nav-open');
if (ov) ov.classList.remove('active');
}
function basculerSideToggle() {
if (window.innerWidth <= 768) {
var nav = document.getElementById('ed-side-nav');
if (nav && nav.classList.contains('open')) fermerSideNav();
else ouvrirSideNav();
} else {
widget.classList.toggle('nav-collapsed');
}
}
window.basculerSideToggle = basculerSideToggle;
function majCountsSide() {
var cN = document.getElementById('sideCntNotes');
var cD = document.getElementById('sideCntDevoirs');
var cM = document.getElementById('sideCntMsg');
if (cN) { var tot = 0; for (var t in tris) for (var m in tris[t].matieres) tot += tris[t].matieres[m].nb; cN.textContent = tot || ''; }
if (cD) { var nb = 0; for (var d in cahier) { var tt = cahier[d] || []; for (var i = 0; i < tt.length; i++) if (tt[i].effectue === false) nb++; } cD.textContent = nb || ''; }
if (cM) { var jm = (jsonMessages && jsonMessages.data && jsonMessages.data.messages && jsonMessages.data.messages.received) ? jsonMessages.data.messages.received : []; cM.textContent = jm.length || ''; }
}
function moyMatiereAvecSimu(matiere, triKey) {
var mat = tris[triKey].matieres[matiere];
if (!mat) return null;
if (desact[matiere]) return null;
var notesMatiere = notesOrig.filter(function(n){ return n.libelleMatiere===matiere && n.codePeriode===triKey; });
var masque = cache[matiere] || [];
var totalSomme = 0, totalCoef = 0;
for (var i=0; i<notesMatiere.length; i++) {
if (masque.includes(i)) continue;
var n = notesMatiere[i];
var v = n.valeur;
if (!v || v==="" || v==="NE" || v==="Abs" || n.nonSignificatif) continue;
var nv = parseFloat(v.replace(',','.'));
if (isNaN(nv)) continue;
var ns = parseFloat(n.noteSur)||20;
var co = parseFloat(n.coef) || 1;
totalSomme += (nv/ns)*20*co;
totalCoef += co;
}
var simGrades = simu[matiere] || [];
var enabSim = simuAct[matiere] || [];
for (var s=0; s<simGrades.length; s++) {
if (enabSim[s] !== false) {
var sim = simGrades[s];
var simVal = parseFloat(sim.value);
var simMax = parseFloat(sim.max);
var simCoef = parseFloat(sim.coef) || 1;
if (!isNaN(simVal) && !isNaN(simMax) && simMax > 0) {
totalSomme += (simVal / simMax) * 20 * simCoef;
totalCoef += simCoef;
}
}
}
return totalCoef > 0 ? totalSomme / totalCoef : null;
}
function moyTriAvecSimu(triKey) {
var triData = tris[triKey];
var sumMoys = 0, countMats = 0;
for (var mat in triData.matieres) {
if (desact[mat]) continue;
var m = triData.matieres[mat];
if (m.sommeCoef > 0) {
sumMoys += m.somme / m.sommeCoef;
countMats++;
}
var simGrades = simu[mat] || [];
var enabSim = simuAct[mat] || [];
var simTotal = 0, simCoefTotal = 0;
for (var s=0; s<simGrades.length; s++) {
if (enabSim[s] !== false) {
var sim = simGrades[s];
var simVal = parseFloat(sim.value), simMax = parseFloat(sim.max), simCoef = parseFloat(sim.coef)||1;
if (!isNaN(simVal) && !isNaN(simMax) && simMax > 0) {
simTotal += (simVal/simMax)*20*simCoef;
simCoefTotal += simCoef;
}
}
}
if (simCoefTotal > 0) {
sumMoys += simTotal / simCoefTotal;
countMats++;
}
}
return countMats > 0 ? sumMoys / countMats : null;
}
function moyAnnuelleAvecSimu() {
var allMats = {};
for (var t in tris) {
for (var m in tris[t].matieres) {
if (desact[m]) continue;
if (!allMats[m]) allMats[m] = { sommeMoys: 0, nbTris: 0 };
var mat = tris[t].matieres[m];
if (mat.sommeCoef > 0) {
allMats[m].sommeMoys += mat.somme / mat.sommeCoef;
allMats[m].nbTris++;
}
var simGrades = simu[m] || [];
var enabSim = simuAct[m] || [];
var simTotal = 0, simCoefTotal = 0;
for (var s=0; s<simGrades.length; s++) {
if (enabSim[s] !== false) {
var sim = simGrades[s];
var simVal = parseFloat(sim.value), simMax = parseFloat(sim.max), simCoef = parseFloat(sim.coef)||1;
if (!isNaN(simVal) && !isNaN(simMax) && simMax > 0) {
simTotal += (simVal/simMax)*20*simCoef;
simCoefTotal += simCoef;
}
}
}
if (simCoefTotal > 0) {
allMats[m].sommeMoys += simTotal / simCoefTotal;
allMats[m].nbTris++;
}
}
}
var sumMoys = 0, countMats = 0;
for (var m in allMats) {
if (allMats[m].nbTris > 0) {
sumMoys += allMats[m].sommeMoys / allMats[m].nbTris;
countMats++;
}
}
return countMats > 0 ? sumMoys / countMats : null;
}
window.basculerMasque = function(matiere, idx) {
if (!cache[matiere]) cache[matiere] = [];
var i = cache[matiere].indexOf(idx);
if (i === -1) cache[matiere].push(idx);
else cache[matiere].splice(i, 1);
localStorage.setItem('ed_maskedGrades', JSON.stringify(cache));
voirNotesMatiere(matiere);
};
window.marquerDevoir = function(idDev, fait, btn) {
if (maj) { alert("Veuillez patienter..."); return; }
maj = true;
var texteOrig = btn.textContent;
var bloc = btn.closest('.task-block') || btn.closest('.task-card');
var statutSpan = bloc ? bloc.querySelector('.task-status') : null;
btn.textContent = "...";
btn.disabled = true;
var bodyObj = fait ? { idDevoirsEffectues: [idDev], idDevoirsNonEffectues: [] } : { idDevoirsEffectues: [], idDevoirsNonEffectues: [idDev] };
var formData = new URLSearchParams();
formData.append("data", JSON.stringify(bodyObj));
fetch(`https://api.ecoledirecte.com/v3/Eleves/${id}/cahierdetexte.awp?verbe=put&v=4.98.0`, {
method: "POST",
headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Token": tok },
body: formData.toString()
}).then(r => r.json()).then(rep => {
maj = false;
if (rep.code === 200) {
btn.setAttribute('data-done', fait ? 'true' : 'false');
if (statutSpan) { statutSpan.textContent = fait ? "FAIT" : "A FAIRE"; statutSpan.style.color = fait ? "#e8f1ff" : "#9aa3b1"; }
btn.textContent = fait ? "Non fait" : "Fait";
btn.disabled = false;
if (bloc) bloc.style.borderLeftColor = fait ? '#e8f1ff' : '#9aa3b1';
for (var dateKey in cahier) {
var taches = cahier[dateKey];
for (var i = 0; i < taches.length; i++) {
if ((taches[i].idDevoir || taches[i].id) === idDev) {
taches[i].effectue = fait;
if (cacheJour[dateKey]) {
for (var j = 0; j < cacheJour[dateKey].length; j++) {
if ((cacheJour[dateKey][j].idDevoir || cacheJour[dateKey][j].id) === idDev) {
cacheJour[dateKey][j].effectue = fait;
break;
}
}
}
break;
}
}
}
var cont = document.getElementById('ed-content');
if (cont && cont.innerHTML.indexOf('class="task-card"') !== -1) {
var dateKeyVisible = null;
for (var d in cacheJour) {
if (cont.innerHTML.includes('data-date="' + d + '"') || cont.innerHTML.includes(d.substring(0, 10))) {
dateKeyVisible = d;
break;
}
}
if (dateKeyVisible && cacheJour[dateKeyVisible]) {
afficherJour(dateKeyVisible, cacheJour[dateKeyVisible]);
}
}
if (onglet === 'accueil') accueil();
majCountsSide();
} else {
btn.textContent = texteOrig;
btn.disabled = false;
alert("Erreur: " + rep.message);
}
}).catch(err => {
maj = false;
btn.textContent = texteOrig;
btn.disabled = false;
alert("Erreur: " + err.message);
});
};
async function voirJour(dateKey) {
var cont = document.getElementById('ed-content');
if (!cont) return;
vuePrec = onglet;
if (cacheJour[dateKey]) {
var tachesCachees = cacheJour[dateKey];
for (var i = 0; i < tachesCachees.length; i++) {
var t = tachesCachees[i], tid = t.idDevoir || t.id;
if (cahier[dateKey]) {
for (var j = 0; j < cahier[dateKey].length; j++) {
var st = cahier[dateKey][j];
if ((st.idDevoir || st.id) === tid) { t.effectue = st.effectue; break; }
}
}
}
afficherJour(dateKey, tachesCachees);
return;
}
cont.innerHTML = '<div class="empty-state"><p>Chargement...</p></div>';
try {
var rep = await fetch(`https://api.ecoledirecte.com/v3/Eleves/${id}/cahierdetexte/${dateKey}.awp?verbe=get&v=4.98.0`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Token": tok }, body: "data=" + encodeURIComponent(JSON.stringify({})) });
var json = await rep.json();
var matieres = json.data.matieres || [], taches = [];
for (var i = 0; i < matieres.length; i++) {
if (matieres[i].aFaire) {
var tache = matieres[i].aFaire;
tache.matiere = matieres[i].matiere;
tache.codeMatiere = matieres[i].codeMatiere;
tache.interrogation = matieres[i].interrogation || false;
if (cahier[dateKey]) {
for (var j = 0; j < cahier[dateKey].length; j++) {
var st = cahier[dateKey][j];
if ((st.idDevoir || st.id) === (tache.idDevoir || tache.id)) { tache.effectue = st.effectue; break; }
}
}
taches.push(tache);
}
}
cacheJour[dateKey] = taches;
afficherJour(dateKey, taches);
} catch (e) {
cont.innerHTML = '<div class="empty-state"><p>Erreur: ' + e.message + '</p><button class="btn-ed ghost" style="margin-top:20px;" onclick="window.retour()">← Retour</button></div>';
}
}
function afficherJour(dateKey, taches) {
var formate = formaterDate(dateKey);
var cont = document.getElementById('ed-content');
if (!cont) return;
if (cahier[dateKey]) {
for (var i = 0; i < taches.length; i++) {
var tid = taches[i].idDevoir || taches[i].id;
for (var j = 0; j < cahier[dateKey].length; j++) {
if ((cahier[dateKey][j].idDevoir || cahier[dateKey][j].id) === tid) {
taches[i].effectue = cahier[dateKey][j].effectue;
break;
}
}
}
}
var html = '<div style="margin-bottom:20px;">';
html += '<button class="btn-ed ghost sm" style="margin-bottom:12px;" onclick="window.retour()">← Retour</button>';
html += '<div style="margin-bottom:16px;"><h2 style="color:#e8f1ff;margin-bottom:2px;">' + formate.jour + '</h2><p style="color:#9aa3b1;font-size:13px;">' + formate.date + '</p></div>';
for (var i = 0; i < taches.length; i++) {
var t = taches[i], fait = (t.effectue === true), type = t.interrogation ? "Interrogation" : "Devoir";
var contenu = decodeTexte(typeof t.contenu === 'string' ? t.contenu : ''), idTache = t.idDevoir || t.id;
var dernier = i === taches.length - 1;
html += '<div class="task-card" data-task-id="' + idTache + '" style="background:transparent;padding:12px 0;margin-bottom:0;border-left:none;' + (dernier ? '' : 'border-bottom:1px solid rgba(255,255,255,0.08);') + '">';
html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:6px;">';
html += '<div style="display:flex;align-items:center;gap:8px;">';
html += '<span style="width:6px;height:6px;border-radius:50%;background:' + (fait ? '#e8f1ff' : '#9aa3b1') + ';"></span>';
html += '<span style="font-weight:600;color:#e9ecf2;font-size:14px;">' + t.matiere + '</span>';
html += '<span style="color:#9aa3b1;font-size:11px;">' + type + '</span></div>';
html += '<div style="display:flex;align-items:center;gap:10px;">';
html += '<span class="task-status" style="color:' + (fait ? '#e8f1ff' : '#9aa3b1') + ';font-size:11px;">' + (fait ? 'FAIT' : 'A FAIRE') + '</span>';
html += '<button class="mark-homework-btn btn-ed sm" data-id="' + idTache + '" data-done="' + fait + '" data-datekey="' + dateKey + '">' + (fait ? 'Non fait' : 'Fait') + '</button></div></div>';
if (contenu) html += '<div style="color:#9aa3b1;font-size:13px;line-height:1.5;padding-left:14px;">' + contenu + '</div>';
html += '</div>';
}
html += '</div>';
cont.innerHTML = html;
var btns = document.querySelectorAll('.mark-homework-btn');
for (var i = 0; i < btns.length; i++) {
btns[i].addEventListener('click', function(e) {
e.stopPropagation();
var btn = this, idTache = parseInt(btn.getAttribute('data-id')), fait = btn.getAttribute('data-done') === 'true', dateKey = btn.getAttribute('data-datekey');
window.marquerDevoir(idTache, !fait, btn);
});
}
}
async function voirPieceJointe(idFichier, nomFichier) {
var modal = document.createElement('div');
modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(10,12,16,0.8);backdrop-filter:blur(8px);z-index:10000000;display:flex;align-items:center;justify-content:center;';
var contenu = document.createElement('div');
contenu.style.cssText = 'background:#1b1e25;border-radius:14px;padding:20px;width:90vw;height:90vh;display:flex;flex-direction:column;border:1px solid rgba(255,255,255,0.16);';
var entete = document.createElement('div');
entete.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;';
entete.innerHTML = '<span style="color:#e9ecf2;font-size:16px;">' + nomFichier + '</span>';
var groupeBtn = document.createElement('div');
groupeBtn.style.cssText = 'display:flex;gap:10px;';
var telecharger = document.createElement('a');
telecharger.textContent = 'Telecharger';
telecharger.className = 'btn-ed primary sm';
telecharger.style.opacity = '0.4';
telecharger.style.pointerEvents = 'none';
var fermer = document.createElement('button');
fermer.textContent = '✕';
fermer.className = 'btn-ed ghost sm';
fermer.onclick = function() { modal.remove(); };
groupeBtn.appendChild(telecharger);
groupeBtn.appendChild(fermer);
entete.appendChild(groupeBtn);
var corps = document.createElement('div');
corps.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;background:#14161c;border-radius:7px;overflow:auto;';
corps.innerHTML = '<div style="color:#9aa3b1;padding:40px;">Chargement...</div>';
contenu.appendChild(entete);
contenu.appendChild(corps);
modal.appendChild(contenu);
document.body.appendChild(modal);
modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
try {
var formData = new URLSearchParams();
formData.append("data", JSON.stringify({ forceDownload: 0, anneeMessages: "2025-2026" }));
var rep = await fetch(`https://api.ecoledirecte.com/v3/telechargement.awp?verbe=get&fichierId=${idFichier}&leTypeDeFichier=PIECE_JOINTE&v=4.98.0`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Token": tok }, body: formData.toString() });
if (!rep.ok) throw new Error('HTTP ' + rep.status);
var blob = await rep.blob();
var urlBlob = URL.createObjectURL(blob);
telecharger.href = urlBlob;
telecharger.download = nomFichier;
telecharger.style.opacity = '1';
telecharger.style.pointerEvents = 'auto';
if (blob.type.startsWith('image/')) corps.innerHTML = '<img src="' + urlBlob + '" style="max-width:100%;max-height:100%;object-fit:contain;">';
else if (blob.type === 'application/pdf') corps.innerHTML = '<embed src="' + urlBlob + '" type="application/pdf" style="width:100%;height:100%;border:none;">';
else corps.innerHTML = '<div style="color:#9aa3b1;text-align:center;"><div style="font-size:48px;margin-bottom:16px;">📄</div><div>Fichier telecharge</div></div>';
} catch (err) {
corps.innerHTML = '<div style="color:#9aa3b1;text-align:center;"><div style="font-size:48px;">❌</div><div>Impossible de charger</div></div>';
}
}
window.voirPieceJointe = voirPieceJointe;
function getHomeStats() {
var now = new Date();
var startOfWeek = new Date(now);
var day = startOfWeek.getDay();
var diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
startOfWeek.setDate(diff);
startOfWeek.setHours(0,0,0,0);
var endOfWeek = new Date(startOfWeek);
endOfWeek.setDate(startOfWeek.getDate() + 6);
endOfWeek.setHours(23,59,59,999);
var startOfLastWeek = new Date(startOfWeek);
startOfLastWeek.setDate(startOfWeek.getDate() - 7);
var endOfLastWeek = new Date(startOfWeek);
endOfLastWeek.setDate(startOfWeek.getDate() - 1);
endOfLastWeek.setHours(23,59,59,999);
var tomorrow = new Date(now);
tomorrow.setDate(now.getDate() + 1);
tomorrow.setHours(0,0,0,0);
var endOfTomorrow = new Date(tomorrow);
endOfTomorrow.setHours(23,59,59,999);
var today = new Date(now);
today.setHours(0,0,0,0);
var endOfToday = new Date(today);
endOfToday.setHours(23,59,59,999);
var dem = 0, auj = 0;
for (var d in cahier) {
var dt = new Date(d);
if (dt >= tomorrow && dt <= endOfTomorrow) dem += cahier[d].length;
if (dt >= today && dt <= endOfToday) auj += cahier[d].length;
}
var demPct = auj > 0 ? Math.round(((dem - auj) / auj) * 100) : (dem > 0 ? 100 : 0);
var moyGen = moyTriAvecSimu(triActuel);
var moyAnn = moyAnnuelleAvecSimu();
var absSem = 0, absLast = 0;
var absRet = vie.absencesRetards || [];
for (var i=0; i<absRet.length; i++) {
var dtStr = absRet[i].date || absRet[i].displayDate;
if (dtStr) {
var dt = new Date(dtStr);
if (dt >= startOfWeek && dt <= endOfWeek) absSem++;
if (dt >= startOfLastWeek && dt <= endOfLastWeek) absLast++;
}
}
var absPct = absLast > 0 ? Math.round(((absSem - absLast) / absLast) * 100) : (absSem > 0 ? 100 : 0);
var devSem = 0;
var subjectCounts = {};
for (var d in cahier) {
var dt = new Date(d);
if (dt >= startOfWeek && dt <= endOfWeek) {
var tasks = cahier[d];
devSem += tasks.length;
for (var j=0; j<tasks.length; j++) {
var mat = tasks[j].matiere || 'Autre';
subjectCounts[mat] = (subjectCounts[mat] || 0) + 1;
}
}
}
var topSubjects = Object.keys(subjectCounts).map(function(k) {
return { name: k, count: subjectCounts[k] };
}).sort(function(a, b) { return b.count - a.count; }).slice(0, 3);
var notesSem = 0, nFaible = 0, nCorrect = 0, nExcell = 0;
for (var i=0; i<notesOrig.length; i++) {
var n = notesOrig[i];
var dtStr = n.date || n.dateSaisie;
if (dtStr) {
var dt = new Date(dtStr);
if (dt >= startOfWeek && dt <= endOfWeek) {
notesSem++;
var v = parseFloat((n.valeur || "0").replace(',', '.'));
var ns = parseFloat(n.noteSur) || 20;
var val20 = (v / ns) * 20;
if (val20 < 10) nFaible++;
else if (val20 < 15) nCorrect++;
else nExcell++;
}
}
}
return { dem: dem, demPct: demPct, moyGen: moyGen, moyAnn: moyAnn, absSem: absSem, absPct: absPct, devSem: devSem, topSubjects: topSubjects, notesSem: notesSem, nFaible: nFaible, nCorrect: nCorrect, nExcell: nExcell };
}
function generateDonut(total, segments) {
var C = 502.65;
var gap = 8;
var cumStart = 14;
var arcs = '';
if (total > 0) {
for (var i = 0; i < segments.length; i++) {
var seg = segments[i];
var frac = seg.value / total;
if (frac <= 0) continue;
var rawLen = frac * C;
var arcLen = Math.max(rawLen - gap, 2);
arcs += '<circle cx="100" cy="100" r="80" stroke="' + seg.color + '" stroke-dasharray="' + arcLen.toFixed(2) + ' ' + (C - arcLen).toFixed(2) + '" stroke-dashoffset="-' + cumStart.toFixed(2) + '"></circle>';
cumStart += rawLen;
}
} else {
arcs = '<circle cx="100" cy="100" r="80" stroke="#e5e5e5"></circle>';
}
return arcs;
}
function accueil() {
var cont = document.getElementById('ed-content');
if (!cont) return;
var stats = getHomeStats();
var now = new Date();
var dateStr = now.toLocaleDateString('fr-FR');
var timeStr = now.getHours().toString().padStart(2, '0') + 'h' + now.getMinutes().toString().padStart(2, '0');
var demClass = stats.demPct >= 0 ? 'dash-down' : 'dash-up';
var demArrow = stats.demPct >= 0 ? '↑' : '↓';
var absClass = stats.absPct >= 0 ? 'dash-down' : 'dash-up';
var absArrow = stats.absPct >= 0 ? '↑' : '↓';
var moyGenTxt = stats.moyGen !== null ? stats.moyGen.toFixed(2) : '—';
var moyAnnTxt = stats.moyAnn !== null ? stats.moyAnn.toFixed(2) : '—';
var devColors = ['#4ca070', '#eec643', '#3d6ede', '#e07b4c', '#a855f7', '#f43f5e'];
var devSegments = [];
var devLegend = '';
if (stats.topSubjects && stats.topSubjects.length > 0) {
for (var i = 0; i < stats.topSubjects.length; i++) {
var subj = stats.topSubjects[i];
var color = devColors[i % devColors.length];
devSegments.push({ value: subj.count, color: color });
devLegend += '<li><span class="dash-dot" style="background:' + color + '"></span>' + subj.name + '<b>' + subj.count + '</b></li>';
}
} else {
devLegend += '<li><span class="dash-dot" style="background:#ccc"></span>none<b>0</b></li>';
}
var devTotal = stats.devSem;
var devDonut = generateDonut(devTotal, devSegments);
var notesTotal = stats.notesSem;
var notesDonut = generateDonut(notesTotal, [
{ value: stats.nCorrect, color: '#7c6ff0' },
{ value: stats.nExcell, color: '#52c5b0' },
{ value: stats.nFaible, color: '#e8944a' }
]);
var html = '<div class="light-wrap" style="background:#f5f5f7;min-height:100vh;">';
html += '<section class="dash-stats">';
html += '<div class="dash-stat"><div class="dash-label">devoirs pour demain</div><div class="dash-num">' + stats.dem + '</div><div class="dash-delta"><span class="' + demClass + '">' + demArrow + ' ' + Math.abs(stats.demPct) + '%</span> qu\'aujourd\'hui</div></div>';
html += '<div class="dash-stat"><div class="dash-label">moyenne generale</div><div class="dash-num">' + moyGenTxt + '</div><div class="dash-delta">annuelle: ' + moyAnnTxt + '</div></div>';
html += '<div class="dash-stat"><div class="dash-label">retards/absence cette semaine</div><div class="dash-num">' + stats.absSem + '</div><div class="dash-delta"><span class="' + absClass + '">' + absArrow + ' ' + Math.abs(stats.absPct) + '%</span> par rapport a la semaine derniere</div></div>';
html += '<div class="dash-stat"><div class="dash-label">date</div><div class="dash-num" style="font-size:24px;line-height:1.2;">' + dateStr + '<br>' + timeStr + '</div></div>';
html += '</section>';
html += '<section class="dash-row">';
html += '<div class="dash-card"><div class="dash-card-head"><h2>devoirs</h2><span class="dash-text">semaine</span></div>';
html += '<div class="dash-donut-wrap"><svg width="210" height="210" viewBox="0 0 200 200">';
html += '<g transform="rotate(-90 100 100)" fill="none" stroke-width="22" stroke-linecap="round">' + devDonut + '</g>';
html += '<circle cx="100" cy="100" r="62" fill="#fff"></circle><circle cx="100" cy="100" r="50" fill="#f8f8f8"></circle>';
html += '<text x="100" y="96" text-anchor="middle" font-size="22" font-weight="700" fill="#1a1a1a">' + devTotal + '</text>';
html += '<text x="100" y="114" text-anchor="middle" font-size="11" fill="#888">devoirs</text>';
html += '</svg></div>';
html += '<ul class="dash-legend">';
html += devLegend;
html += '</ul></div>';
html += '<div class="dash-card"><div class="dash-card-head"><h2>notes</h2><span class="dash-text">semaine</span></div>';
html += '<div class="dash-donut-wrap"><svg width="210" height="210" viewBox="0 0 200 200">';
html += '<g transform="rotate(-90 100 100)" fill="none" stroke-width="22" stroke-linecap="round">' + notesDonut + '</g>';
html += '<circle cx="100" cy="100" r="62" fill="#fff"></circle><circle cx="100" cy="100" r="50" fill="#f8f8f8"></circle>';
html += '<text x="100" y="96" text-anchor="middle" font-size="22" font-weight="700" fill="#1a1a1a">' + notesTotal + '</text>';
html += '<text x="100" y="114" text-anchor="middle" font-size="11" fill="#888">notes</text>';
html += '</svg></div>';
html += '<ul class="dash-legend">';
html += '<li><span class="dash-dot" style="background:#7c6ff0"></span>correct (10-14)<b>' + stats.nCorrect + '</b></li>';
html += '<li><span class="dash-dot" style="background:#52c5b0"></span>excellent (15-20)<b>' + stats.nExcell + '</b></li>';
html += '<li><span class="dash-dot" style="background:#e8944a"></span>faible (0-9)<b>' + stats.nFaible + '</b></li>';
html += '</ul></div>';
html += '</section></div>';
cont.innerHTML = html;
}
function sauvegarderScroll() {
var cont = document.getElementById('ed-content');
if (cont) { scrollPositions[onglet] = cont.scrollTop; }
}
function restaurerScroll() {
var cont = document.getElementById('ed-content');
if (cont && scrollPositions[onglet] !== undefined) {
setTimeout(function() { cont.scrollTop = scrollPositions[onglet]; }, 50);
}
}
function notes() {
var cont = document.getElementById('ed-content');
if (!cont) return;
cont.innerHTML = '';
var triData = tris[triActuel];
var listeMatieres = [];
var totalNotesAnnee = 0;
for (var t in tris) for (var m in tris[t].matieres) totalNotesAnnee += tris[t].matieres[m].nb;
for (var mat in triData.matieres) {
var matDonnees = triData.matieres[mat];
var notesMatiere = notesOrig.filter(function(n) { return n.libelleMatiere === mat && n.codePeriode === triActuel; });
listeMatieres.push({ nom: mat, moyenne: matDonnees.moy, nb: matDonnees.nb, sommeCoef: matDonnees.sommeCoef, notes: notesMatiere });
}
listeMatieres.sort(function(a, b) { return b.moyenne - a.moyenne; });
var moyTri = moyTriAvecSimu(triActuel);
var moyAnnuelle = moyAnnuelleAvecSimu();
var nbSur = parseFloat(sur);
var convert = nbSur !== 20;
var affMoyTri = moyTri !== null && convert ? (moyTri / 20) * nbSur : moyTri;
var affMoyAnnuelle = moyAnnuelle !== null && convert ? (moyAnnuelle / 20) * nbSur : moyAnnuelle;
var totalNotes = 0;
for (var m in triData.matieres) totalNotes += triData.matieres[m].nb;
var html = '';
if (listeMatieres.length === 0) {
html += '<div class="empty-state"><p>Aucune note pour ce trimestre</p></div>';
} else {
html += '<div class="stats-grid">';
html += '<div class="stat-card"><div class="stat-label">MOYENNE GENERALE</div><div class="stat-value">' + (affMoyTri !== null ? affMoyTri.toFixed(2) : '—') + '</div><div class="stat-sub">Coefficientee</div></div>';
html += '<div class="stat-card"><div class="stat-label">NOMBRE DE NOTES</div><div class="stat-value">' + totalNotes + '</div><div class="stat-sub">Ce trimestre</div></div>';
html += '</div>';
if (aff === 'liste') {
html += '<div style="overflow-x:auto;margin-bottom:24px;">';
html += '<table class="notes-table-ed" style="width:100%;border-collapse:collapse;min-width:600px;">';
html += '<thead><tr>';
html += '<th style="padding:10px 14px;text-align:left;">DISCIPLINES</th>';
html += '<th style="padding:10px 14px;text-align:left;">EVALUATIONS</th>';
html += '<th style="padding:10px 14px;text-align:center;">MOYENNE</th>';
html += '<tr></thead><tbody>';
for (var i = 0; i < listeMatieres.length; i++) {
var mat = listeMatieres[i];
var estDesact = desact[mat.nom] === true;
var moyAvecSimu = moyMatiereAvecSimu(mat.nom, triActuel);
var coul = couleurMoy(moyAvecSimu);
var affMoy = moyAvecSimu !== null && convert ? (moyAvecSimu / 20) * nbSur : moyAvecSimu;
html += '<tr class="notes-table-row" data-subject="' + mat.nom.replace(/'/g, "\\'") + '" style="cursor:pointer;">';
html += '<td style="padding:10px 14px;"><div style="font-weight:700;color:#e9ecf2;">' + mat.nom + '</div></td>';
html += '<td style="padding:10px 14px;"><div style="display:flex;flex-wrap:wrap;gap:5px;">';
if (!estDesact) {
for (var g = 0; g < mat.notes.length; g++) {
var grade = mat.notes[g], gv = grade.valeur, ns = grade.noteSur || 20, isNS = grade.nonSignificatif === true;
var ov = parseFloat(gv.replace(',', '.')), gp = ov / ns * 20, gc = couleurMoy(gp);
var dv = gv, dm = ns;
if (convert && !isNS) { dv = ((ov / ns) * nbSur).toFixed(2).replace('.', ','); dm = nbSur; }
if (isNS) html += '<span style="font-size:12px;color:#9aa3b1;">(' + gv + '/' + ns + ')</span>';
else html += '<span style="display:inline-flex;align-items:center;gap:3px;font-size:12px;color:#e9ecf2;"><span style="width:8px;height:8px;border-radius:50%;background:' + gc + ';"></span>' + dv + '<span style="font-size:9px;color:#9aa3b1;">/' + dm + '</span>' + (grade.coef && grade.coef !== '1' && grade.coef !== 1 ? '<span style="font-size:9px;color:#9aa3b1;">(' + grade.coef + ')</span>' : '') + '</span>';
}
var simGrades = simu[mat.nom] || [], enabSim = simuAct[mat.nom] || [];
for (var s = 0; s < simGrades.length; s++) { if (enabSim[s] !== false) { var sim = simGrades[s]; var sp = (parseFloat(sim.value) / parseFloat(sim.max)) * 20; var sc = couleurMoy(sp); html += '<span style="display:inline-flex;align-items:center;gap:3px;font-size:12px;color:#e8f1ff;"><span style="width:8px;height:8px;border-radius:50%;background:' + sc + ';"></span>' + sim.value + '<span style="font-size:9px;color:#9aa3b1;">/' + sim.max + '</span></span>'; } }
}
html += '</div></td>';
html += '<td style="padding:10px 14px;text-align:center;">';
if (!estDesact && moyAvecSimu !== null) html += '<span style="font-weight:700;font-size:16px;color:' + coul + ';">' + (affMoy !== null ? affMoy.toFixed(2) : '—') + '</span>';
else html += '<span style="font-weight:700;font-size:16px;color:#9aa3b1;">—</span>';
html += '</tr>';
}
html += '</tbody></table></div>';
html += '<div id="graph-container" style="margin-top:16px;"></div>';
if (moyAnnuelle !== null) {
html += '<div class="annual-card" style="margin-top:16px;">';
html += '<div class="annual-label">MOYENNE ANNUELLE</div>';
html += '<div class="annual-value">' + (affMoyAnnuelle !== null ? affMoyAnnuelle.toFixed(2) : '—') + '</div>';
html += '<div class="annual-note-count">' + totalNotesAnnee + ' notes sur toute l\'annee</div>';
html += '</div>';
}
} else {
html += '<div class="subjects-grid">';
for (var i = 0; i < listeMatieres.length; i++) {
var mat = listeMatieres[i];
var estDesact = desact[mat.nom] === true;
var moyAvecSimu = moyMatiereAvecSimu(mat.nom, triActuel);
var coul = couleurMoy(moyAvecSimu);
var affMoy = moyAvecSimu !== null && convert ? (moyAvecSimu / 20) * nbSur : moyAvecSimu;
var diff = moyAvecSimu !== null && moyTri !== null ? moyAvecSimu - moyTri : 0;
var diffCoul = diff > 0 ? '#e8f1ff' : diff < 0 ? '#667080' : '#9aa3b1';
var diffTexte = diff > 0 ? '+' + diff.toFixed(2) : diff.toFixed(2);
html += '<div class="subject-card" data-subject="' + mat.nom.replace(/'/g, "\\'") + '" style="cursor:pointer;">';
html += '<div class="subject-header"><div style="display:flex;align-items:center;gap:6px;"><span class="subject-name">' + mat.nom + '</span></div>';
html += '<span class="subject-average" style="color:' + (estDesact ? '#9aa3b1' : coul) + ';"> ' + (estDesact || moyAvecSimu === null ? '—' : affMoy !== null ? affMoy.toFixed(2) : '—') + '</span></div>';
html += '<div class="subject-stats"><span><span class="grade-indicator" style="background:' + coul + ';"></span>' + mat.nb + ' note(s)</span><span>Coeff. ' + mat.sommeCoef.toFixed(1) + '</span>';
html += '<div style="font-size:12px;color:' + diffCoul + ';">' + diffTexte + '</div></div>';
if (mat.notes.length > 0) {
html += '<div style="margin-top:14px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.08);">';
html += '<div style="font-size:11px;color:#9aa3b1;margin-bottom:6px;">Notes recentes:</div>';
var rec = mat.notes.slice(0, 4);
for (var g = 0; g < rec.length; g++) {
var grade = rec[g], gv = grade.valeur, ns = grade.noteSur || 20, isNS = grade.nonSignificatif === true, ov = parseFloat(gv.replace(',', '.'));
var ds = grade.date || grade.dateSaisie, sd = ds ? ds.substring(5, 10).replace(/-/g, '/') : '';
var dv = gv, dm = ns;
if (convert && !isNS) { dv = ((ov / ns) * nbSur).toFixed(2).replace('.', ','); dm = nbSur; }
var gc = couleurMoy(ov / ns * 20);
html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:12px;">';
html += '<span style="color:#9aa3b1;">' + sd + '</span>';
if (isNS) html += '<span style="color:' + gc + ';font-weight:500;">(' + gv + '/' + ns + ')</span>';
else html += '<span style="color:' + gc + ';font-weight:500;">' + dv + '/' + dm + '</span>';
html += '</div>';
}
if (mat.notes.length > 4) html += '<div style="text-align:center;margin-top:5px;"><span style="font-size:10px;color:#9aa3b1;">+' + (mat.notes.length - 4) + ' autres</span></div>';
html += '</div>';
}
var simGrades = simu[mat.nom] || [], enabSim = simuAct[mat.nom] || [];
var aSimActive = simGrades.some(function(_, s) { return enabSim[s] !== false; });
if (aSimActive) {
html += '<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);"><div style="font-size:11px;color:#9aa3b1;margin-bottom:6px;">Notes simulees:</div>';
for (var s = 0; s < simGrades.length; s++) { if (enabSim[s] !== false) { var sim = simGrades[s]; html += '<div style="display:flex;justify-content:space-between;font-size:12px;color:#e8f1ff;padding:4px 0;"><span style="color:#9aa3b1;">Simulee</span><span>' + sim.value + '/' + sim.max + '</span></div>'; } }
html += '</div>';
}
html += '</div>';
}
html += '</div>';
if (moyAnnuelle !== null) {
html += '<div class="annual-card" style="margin-top:16px;">';
html += '<div class="annual-label">MOYENNE ANNUELLE</div>';
html += '<div class="annual-value">' + (affMoyAnnuelle !== null ? affMoyAnnuelle.toFixed(2) : '—') + '</div>';
html += '<div class="annual-note-count">' + totalNotesAnnee + ' notes sur toute l\'annee</div>';
html += '</div>';
}
html += '<div id="graph-container" style="margin-top:16px;"></div>';
}
}
cont.innerHTML = html;
cont.querySelectorAll('.subject-card[data-subject]').forEach(function(el) {
el.addEventListener('click', function() { voirNotesMatiere(this.getAttribute('data-subject')); });
});
cont.querySelectorAll('.notes-table-row[data-subject]').forEach(function(el) {
el.addEventListener('click', function() { voirNotesMatiere(this.getAttribute('data-subject')); });
});
}
function voirNotesMatiere(matiere) {
var cont = document.getElementById('ed-content');
if (!cont) return;
vuePrec = 'notes';
var notesMatiere = notesOrig.filter(function(n) { return n.libelleMatiere === matiere && n.codePeriode === triActuel; });
var affichageTri = notesMatiere.length > 0 ? tris[triActuel].nom : 'Toutes les periodes';
if (!notesMatiere.length) notesMatiere = notesOrig.filter(function(n) { return n.libelleMatiere === matiere; });
var html = '<div style="margin-bottom:20px;">';
html += '<button id="retour-notes" class="btn-ed ghost" style="margin-bottom:16px;">← Retour aux notes</button>';
html += '<div style="background:#1b1e25;border-radius:14px;padding:20px;margin-bottom:16px;border:1px solid rgba(255,255,255,0.08);">';
html += '<h2 style="color:#e8f1ff;margin-bottom:4px;">' + matiere + '</h2>';
html += '<p style="color:#9aa3b1;">' + affichageTri + '</p></div>';
html += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">';
html += '<button id="ajoutSimuBtn" class="btn-ed primary">+ Note simulee</button>';
html += '<button id="viderSimuBtn" class="btn-ed danger">Effacer toutes les simulees</button>';
html += '</div>';
if (notesMatiere.length === 0 && (!simu[matiere] || !simu[matiere].length)) {
html += '<div class="empty-state"><p>Aucune note</p></div>';
} else {
html += '<div style="background:#1b1e25;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">';
var masques = cache[matiere] || [];
for (var i = 0; i < notesMatiere.length; i++) {
var grade = notesMatiere[i], gv = grade.valeur, ns = grade.noteSur || 20, isNS = grade.nonSignificatif === true, ov = parseFloat(gv.replace(',', '.'));
var coul = couleurMoy(ov / ns * 20), dateStr = grade.date || grade.dateSaisie, fd = dateStr ? new Date(dateStr).toLocaleDateString('fr-FR') : 'Date inconnue';
var commentDecode = decodeTexte(grade.commentaire || '');
var dv = gv, dm = ns;
if (sur !== '20' && !isNS) { var nm = parseFloat(sur); dv = ((ov / ns) * nm).toFixed(2).replace('.', ','); dm = sur; }
var estMasque = masques.includes(i);
html += '<div style="padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;' + (estMasque ? 'opacity:0.4;' : '') + '">';
html += '<div>';
html += '<div style="font-size:15px;font-weight:600;color:#e9ecf2;margin-bottom:2px;">' + (isNS ? '(' + gv + '/' + ns + ')' : dv + '/' + dm) + (estMasque ? ' <span style="font-size:10px;color:#9aa3b1;background:rgba(233,236,242,0.05);padding:1px 6px;border-radius:4px;">masque</span>' : '') + '</div>';
if (profNom && grade.professeurs && grade.professeurs.length > 0) {
var p = grade.professeurs[0];
html += '<div style="font-size:11px;color:#e8f1ff;">' + (p.prenom ? p.prenom.charAt(0) + '. ' : '') + p.nom + '</div>';
}
html += '<div style="font-size:11px;color:#9aa3b1;">' + fd + '</div>';
if (commentDecode) html += '<div style="font-size:12px;color:#9aa3b1;margin-top:6px;">' + commentDecode + '</div>';
html += '</div>';
html += '<div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:6px;">';
html += '<div style="font-size:22px;font-weight:700;color:' + coul + ';"> ' + (isNS ? '(' + gv + ')' : dv) + '</div>';
html += '<div style="font-size:10px;color:#9aa3b1;">Coeff. ' + (grade.coef || 1) + '</div>';
html += '<button class="masquer-note-btn btn-ed sm" data-subject="' + matiere.replace(/"/g, '&quot;') + '" data-index="' + i + '">' + (estMasque ? 'Demasquer' : 'Masquer') + '</button>';
html += '</div></div>';
}
var simGrades = simu[matiere] || [], enabSim = simuAct[matiere] || [];
for (var s = 0; s < simGrades.length; s++) {
var sim = simGrades[s], sp = (parseFloat(sim.value) / parseFloat(sim.max)) * 20, sc = couleurMoy(sp);
var estActif = enabSim[s] !== false;
html += '<div class="sim-grade-row" data-subject="' + matiere.replace(/"/g, '&quot;') + '" data-simidx="' + s + '" style="padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;background:rgba(232,241,255,0.02);">';
html += '<div><div style="font-size:15px;font-weight:600;color:#e8f1ff;">' + sim.value + '/' + sim.max + ' <span style="font-size:11px;color:#9aa3b1;font-style:italic;">Simulee</span></div>';
html += '<div style="font-size:11px;color:#9aa3b1;">coeff. ' + sim.coef + '</div></div>';
html += '<div style="text-align:right;display:flex;align-items:center;gap:10px;">';
html += '<label class="check" style="margin:0;"><input type="checkbox" class="sim-active-cb" data-subject="' + matiere.replace(/"/g, '&quot;') + '" data-simidx="' + s + '" ' + (estActif ? 'checked' : '') + '><span class="box"><svg width="9" height="8" viewBox="0 0 10 8"><path d="M1 4l2.5 2.5L9 1" stroke="currentColor" stroke-width="1.6" fill="none"/></svg></span>Activer</label>';
html += '<span style="font-size:20px;font-weight:700;color:' + sc + ';">' + sim.value + '</span>';
html += '<button class="sim-suppr-btn btn-ed danger sm" data-subject="' + matiere.replace(/"/g, '&quot;') + '" data-simidx="' + s + '">✕</button>';
html += '</div></div>';
}
html += '</div>';
}
html += '</div>';
cont.innerHTML = html;
document.getElementById('retour-notes').addEventListener('click', function() { notes(); });
document.getElementById('ajoutSimuBtn').addEventListener('click', function() { modalAjoutSimu(matiere); });
document.querySelectorAll('.masquer-note-btn').forEach(function(btn) {
btn.addEventListener('click', function(e) {
e.stopPropagation();
window.basculerMasque(this.getAttribute('data-subject'), parseInt(this.getAttribute('data-index')));
});
});
document.querySelectorAll('.sim-active-cb').forEach(function(cb) {
cb.addEventListener('change', function() {
var sn = this.getAttribute('data-subject');
var idx = parseInt(this.getAttribute('data-simidx'));
if (!simuAct[sn]) simuAct[sn] = [];
simuAct[sn][idx] = this.checked;
localStorage.setItem('ed_enabledSimulated', JSON.stringify(simuAct));
voirNotesMatiere(sn);
});
});
document.querySelectorAll('.sim-suppr-btn').forEach(function(btn) {
btn.addEventListener('click', function(e) {
e.stopPropagation();
var sn = this.getAttribute('data-subject');
var idx = parseInt(this.getAttribute('data-simidx'));
if (confirm('Supprimer cette note simulee ?')) {
if (!simu[sn]) return;
simu[sn].splice(idx, 1);
if (simuAct[sn]) simuAct[sn].splice(idx, 1);
localStorage.setItem('ed_simulatedGrades', JSON.stringify(simu));
localStorage.setItem('ed_enabledSimulated', JSON.stringify(simuAct));
voirNotesMatiere(sn);
}
});
});
document.getElementById('viderSimuBtn').addEventListener('click', function() {
if (confirm('Effacer toutes les notes simulees pour cette matiere ?')) {
simu[matiere] = [];
simuAct[matiere] = [];
localStorage.setItem('ed_simulatedGrades', JSON.stringify(simu));
localStorage.setItem('ed_enabledSimulated', JSON.stringify(simuAct));
voirNotesMatiere(matiere);
}
});
}
function modalAjoutSimu(matiere) {
var modal = document.createElement('div');
modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(10,12,16,0.8);backdrop-filter:blur(8px);z-index:10000001;display:flex;align-items:center;justify-content:center;';
var contenu = document.createElement('div');
contenu.style.cssText = 'background:#1b1e25;border-radius:14px;padding:24px;max-width:380px;width:90%;border:1px solid rgba(255,255,255,0.16);';
contenu.innerHTML = `<h2 style="color:#e8f1ff;margin-bottom:14px;">Note simulee</h2>
<div style="margin-bottom:10px;"><label style="color:#e9ecf2;display:block;margin-bottom:3px;">Note obtenue</label>
<input type="number" id="simValeur" step="0.01" min="0"></div>
<div style="margin-bottom:10px;"><label style="color:#e9ecf2;display:block;margin-bottom:3px;">Note sur</label>
<input type="number" id="simMax" step="0.01" min="0" value="20"></div>
<div style="margin-bottom:10px;"><label style="color:#e9ecf2;display:block;margin-bottom:3px;">Coefficient</label>
<input type="number" id="simCoef" step="0.01" min="0" value="1"></div>
<div style="display:flex;gap:10px;margin-top:14px;">
<button id="simSauve" class="btn-ed primary" style="flex:1;">Ajouter</button>
<button id="simAnnule" class="btn-ed ghost" style="flex:1;">Annuler</button>
</div>`;
modal.appendChild(contenu);
document.body.appendChild(modal);
modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
document.getElementById('simAnnule').addEventListener('click', function() { modal.remove(); });
document.getElementById('simSauve').addEventListener('click', function() {
var val = parseFloat(document.getElementById('simValeur').value), max = parseFloat(document.getElementById('simMax').value), coef = parseFloat(document.getElementById('simCoef').value);
if (isNaN(val) || isNaN(max) || isNaN(coef)) { alert('invalide'); return; }
if (val < 0 || max <= 0 || coef <= 0) { alert('faut pas abuser quand meme'); return; }
if (val > max) { alert('La note ne peut depasser le max'); return; }
if (!simu[matiere]) simu[matiere] = [];
if (!simuAct[matiere]) simuAct[matiere] = [];
simu[matiere].push({ value: val, max: max, coef: coef });
simuAct[matiere].push(true);
localStorage.setItem('ed_simulatedGrades', JSON.stringify(simu));
localStorage.setItem('ed_enabledSimulated', JSON.stringify(simuAct));
modal.remove();
voirNotesMatiere(matiere);
});
}
function devoirs() {
var cont = document.getElementById('ed-content');
if (!cont) return;

var cdtCurrentMonth = new Date();
cdtCurrentMonth.setDate(1);
var cdtSelectedDate = null;

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function dateKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function parseDateKey(k) { var p = k.split('-'); return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2])); }
function isSameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function moisFr(m) {
var noms = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
return noms[m];
}

function getWeekStats() {
var now = new Date();
var start = new Date(now);
var day = start.getDay();
var diff = start.getDate() - day + (day === 0 ? -6 : 1);
start.setDate(diff);
start.setHours(0, 0, 0, 0);
var end = new Date(start);
end.setDate(start.getDate() + 6);
end.setHours(23, 59, 59, 999);

var total = 0, fait = 0, parJour = {};
for (var i = 0; i < 7; i++) {
var d = new Date(start);
d.setDate(start.getDate() + i);
parJour[dateKey(d)] = { total: 0, fait: 0 };
}
for (var k in cahier) {
var d = parseDateKey(k);
if (d >= start && d <= end) {
var dk = dateKey(d);
parJour[dk].total += cahier[k].length;
for (var i = 0; i < cahier[k].length; i++) {
total++;
if (cahier[k][i].effectue === true) {
fait++;
parJour[dk].fait++;
}
}
}
}
var maxParJour = 0;
for (var k in parJour) if (parJour[k].total > maxParJour) maxParJour = parJour[k].total;
var reste = total - fait;
var pct = total > 0 ? Math.round((fait / total) * 100) : 0;
return { total: total, fait: fait, reste: reste, pct: pct, maxParJour: maxParJour, parJour: parJour, start: start };
}

function getTomorrowReste() {
var tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
var dk = dateKey(tomorrow);
var reste = 0;
if (cahier[dk]) {
for (var i = 0; i < cahier[dk].length; i++) {
if (cahier[dk][i].effectue !== true) reste++;
}
}
return reste;
}

function getTopMatieres() {
var now = new Date();
var start = new Date(now);
var day = start.getDay();
var diff = start.getDate() - day + (day === 0 ? -6 : 1);
start.setDate(diff);
start.setHours(0, 0, 0, 0);
var end = new Date(start);
end.setDate(start.getDate() + 6);

var counts = {};
var totals = {};
for (var k in cahier) {
var d = parseDateKey(k);
if (d >= start && d <= end) {
for (var i = 0; i < cahier[k].length; i++) {
var mat = cahier[k][i].matiere || 'Autres';
if (!counts[mat]) counts[mat] = { total: 0, fait: 0, jours: {} };
counts[mat].total++;
counts[mat].jours[dateKey(d)] = (counts[mat].jours[dateKey(d)] || 0) + 1;
if (cahier[k][i].effectue === true) counts[mat].fait++;
}
totals[mat] = (totals[mat] || 0) + 1;
}
}
var arr = [];
for (var m in counts) {
var nbJours = Object.keys(counts[m].jours).length;
arr.push({ nom: m, count: counts[m].total, fait: counts[m].fait, jours: nbJours });
}
arr.sort(function(a, b) { return b.count - a.count; });
var top = arr.slice(0, 2);
var autresCount = 0, autresFait = 0, autresTotal = 0;
for (var i = 2; i < arr.length; i++) {
autresCount += arr[i].jours;
autresFait += arr[i].fait;
autresTotal += arr[i].count;
}
if (autresTotal > 0) {
top.push({ nom: 'Autres', count: autresTotal, fait: autresFait, jours: autresCount, isAutres: true });
}
return { top: top, total: arr.reduce(function(s, x) { return s + x.count; }, 0) };
}

function buildWeekChart(stats) {
var days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
var maxVal = 0;
var vals = [];
for (var i = 0; i < 7; i++) {
var d = new Date(stats.start);
d.setDate(stats.start.getDate() + i);
var dk = dateKey(d);
var v = stats.parJour[dk] ? stats.parJour[dk].total : 0;
vals.push(v);
if (v > maxVal) maxVal = v;
}
if (maxVal < 1) maxVal = 5;
var svg = '<svg class="cdt-chart" viewBox="0 0 460 240">';
svg += '<defs><linearGradient id="cdtArea" x1="0" y1="0" x2="0" y2="1">';
svg += '<stop offset="0%" stop-color="#dd8f2d" stop-opacity=".85"/>';
svg += '<stop offset="100%" stop-color="#dd8f2d" stop-opacity=".05"/>';
svg += '</linearGradient></defs>';
svg += '<g font-size="9" fill="#8a94a0">';
var ySteps = [0, 20, 40, 60, 80, 100];
for (var i = 0; i < ySteps.length; i++) {
var y = 209 - (ySteps[i] / 100) * (209 - 14);
var val = Math.round((ySteps[i] / 100) * maxVal);
svg += '<text x="20" y="' + (y + 3) + '" text-anchor="end">' + val + '</text>';
svg += '<line x1="30" y1="' + y + '" x2="450" y2="' + y + '" stroke="#e7dbc9" stroke-width="1"/>';
}
svg += '</g>';
var points = [];
for (var i = 0; i < 7; i++) {
var x = 40 + i * (400 / 6);
var y = 209 - (vals[i] / maxVal) * (209 - 14);
points.push({ x: x, y: y });
}
var pathLine = 'M' + points[0].x + ',' + points[0].y;
for (var i = 1; i < points.length; i++) {
var prev = points[i - 1];
var cur = points[i];
var cpx1 = prev.x + (cur.x - prev.x) / 3;
var cpx2 = prev.x + 2 * (cur.x - prev.x) / 3;
pathLine += ' C' + cpx1 + ',' + prev.y + ' ' + cpx2 + ',' + cur.y + ' ' + cur.x + ',' + cur.y;
}
var pathArea = pathLine + ' L' + points[points.length - 1].x + ',209 L' + points[0].x + ',209 Z';
svg += '<path d="' + pathArea + '" fill="url(#cdtArea)"/>';
svg += '<path d="' + pathLine + '" fill="none" stroke="#d8842c" stroke-width="2.5" stroke-linecap="round"/>';
for (var i = 0; i < points.length; i++) {
svg += '<circle cx="' + points[i].x + '" cy="' + points[i].y + '" r="3.5" fill="#fff" stroke="#d8842c" stroke-width="2"/>';
}
svg += '<g font-size="9" fill="#8a94a0" text-anchor="middle">';
for (var i = 0; i < 7; i++) {
svg += '<text x="' + points[i].x + '" y="230">' + days[i] + '</text>';
}
svg += '</g>';
svg += '</svg>';
return svg;
}

function buildCalendar() {
var y = cdtCurrentMonth.getFullYear();
var m = cdtCurrentMonth.getMonth();
var firstDay = new Date(y, m, 1);
var startDow = firstDay.getDay();
startDow = startDow === 0 ? 6 : startDow - 1;
var daysInMonth = new Date(y, m + 1, 0).getDate();
var prevDays = new Date(y, m, 0).getDate();
var today = new Date();
today.setHours(0, 0, 0, 0);

var h = '<div class="cdt-cal">';
h += '<div class="cdt-cal-head">';
h += '<button id="cdtPrev"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></button>';
h += '<span>' + moisFr(m) + ' ' + y + '</span>';
h += '<button id="cdtNext"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></button>';
h += '</div>';
h += '<div class="cdt-cal-grid">';
var dows = ['L', 'M', 'Me', 'J', 'V', 'S', 'D'];
for (var i = 0; i < 7; i++) h += '<span class="cdt-dow">' + dows[i] + '</span>';
for (var i = startDow - 1; i >= 0; i--) {
h += '<span class="cdt-day dim">' + (prevDays - i) + '</span>';
}
for (var d = 1; d <= daysInMonth; d++) {
var dt = new Date(y, m, d);
var dk = dateKey(dt);
var hasHw = cahier[dk] && cahier[dk].length > 0;
var isToday = isSameDay(dt, today);
var isSelected = cdtSelectedDate && isSameDay(dt, cdtSelectedDate);
var cls = 'cdt-day';
if (hasHw) cls += ' att';
if (isToday) cls += ' today';
if (isSelected) cls += ' selected';
h += '<span class="' + cls + '" data-dk="' + dk + '">' + d + '</span>';
}
var totalCells = startDow + daysInMonth;
var trailing = (7 - (totalCells % 7)) % 7;
for (var i = 1; i <= trailing; i++) {
h += '<span class="cdt-day dim">' + i + '</span>';
}
h += '</div></div>';
return h;
}

function buildSelectedList() {
if (!cdtSelectedDate) {
return '<div class="cdt-empty"><p>Choisis un jour dans le calendrier</p></div>';
}
var dk = dateKey(cdtSelectedDate);
var taches = cahier[dk] || [];
var jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
var titre = 'Devoirs pour le ' + cdtSelectedDate.getDate() + ' ' + moisFr(cdtSelectedDate.getMonth()).toLowerCase() + ' ' + cdtSelectedDate.getFullYear();
var h = '<div class="cdt-card">';
h += '<div class="cdt-card-head"><h2>' + titre + '</h2></div>';
if (taches.length === 0) {
h += '<div class="cdt-empty"><p>Aucun devoir ce jour-la</p></div>';
} else {
for (var i = 0; i < taches.length; i++) {
var t = taches[i];
var fait = t.effectue === true;
var type = t.interrogation ? 'EVALUATION' : 'Devoir';
var mat = t.matiere || 'Autre';
var tid = t.idDevoir || t.id;
h += '<div class="cdt-sched-item">';
h += '<div class="cdt-date-blk"><b>' + cdtSelectedDate.getDate() + '</b><i>' + moisFr(cdtSelectedDate.getMonth()).substring(0, 3).toLowerCase() + '</i></div>';
h += '<div class="cdt-sched-mid"><h3>' + mat + '</h3></div>';
h += '<div class="cdt-times">' + type + '<br>';
h += '<span style="color:' + (fait ? '#35c26e' : '#dd8f2d') + ';font-weight:600;">' + (fait ? 'Fait' : 'NON FAIT') + '</span>';
h += '</div>';
h += '<button class="cdt-mark-btn cdt-btn-sm" data-id="' + tid + '" data-done="' + fait + '">' + (fait ? 'Annuler' : 'Marquer fait') + '</button>';
h += '</div>';
}
}
h += '</div>';
return h;
}

function buildTopMatieres() {
var data = getTopMatieres();
var h = '<div class="cdt-inst-grid">';
for (var i = 0; i < data.top.length; i++) {
var m = data.top[i];
h += '<div class="cdt-inst">';
h += '<div class="cdt-inst-top"><div><b>' + m.nom + '</b><small>' + m.jours + ' fois cette semaine</small></div></div>';
h += '<button class="cdt-btn solid">' + m.nom.toUpperCase() + '</button>';
h += '<button class="cdt-btn outline">' + m.fait + '/' + m.count + ' devoirs</button>';
h += '</div>';
}
if (data.top.length === 0) {
h += '<div class="cdt-empty"><p>Aucun devoir cette semaine</p></div>';
}
h += '</div>';
return h;
}

function render() {
var stats = getWeekStats();
var tomorrowReste = getTomorrowReste();
var now = new Date();
var startWeek = new Date(now);
var day = startWeek.getDay();
var diff = startWeek.getDate() - day + (day === 0 ? -6 : 1);
startWeek.setDate(diff);
var endWeek = new Date(startWeek);
endWeek.setDate(startWeek.getDate() + 6);
var semaineTxt = 'du ' + startWeek.getDate() + ' au ' + endWeek.getDate();

var h = '<div class="cdt-wrap">';
h += '<div class="cdt-welcome">';
h += '<div><h1>Cahier de Texte</h1><p>devoirs restant pour demain: ' + tomorrowReste + '</p></div>';
h += '<div class="cdt-stats">';
h += '<div class="cdt-stat"><div class="cdt-row"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg><span class="cdt-num">' + stats.fait + '</span></div><div class="cdt-lbl">fait pour la semaine</div></div>';
h += '<div class="cdt-stat"><div class="cdt-row"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span class="cdt-num">' + stats.maxParJour + '</span></div><div class="cdt-lbl">devoirs max par jour</div></div>';
h += '<div class="cdt-stat"><div class="cdt-row"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="14" r="8"/><line x1="12" y1="14" x2="12" y2="10"/><line x1="9" y1="2" x2="15" y2="2"/><line x1="12" y1="2" x2="12" y2="6"/></svg><span class="cdt-num">' + stats.reste + '</span></div><div class="cdt-lbl">a terminer</div></div>';
h += '</div></div>';

h += '<div class="cdt-grid-mid">';
h += '<div class="cdt-card"><h2>devoirs hebdomadaires</h2>';
h += '<p class="cdt-module">cette semaine, ' + semaineTxt + '</p>';
h += '<div class="cdt-track"><div class="cdt-fill" style="width:' + stats.pct + '%;"></div></div>';
h += '<p class="cdt-pct">' + stats.pct + '% termine</p>';
h += buildWeekChart(stats);
h += '<p class="cdt-pct">devoirs par jour de la semaine</p></div>';

h += '<div class="cdt-card"><div class="cdt-card-head" style="margin-bottom:6px;"><h2>calendrier</h2></div>';
h += '<p class="cdt-att-sub">choisis un jour pour voir les devoirs</p>';
h += buildCalendar();
h += '</div>';

h += '<div id="cdtListe">' + buildSelectedList() + '</div>';
h += '</div>';

h += '<div class="cdt-grid-bot">';
h += '<div class="cdt-card"><h2>matieres les plus presentes cette semaine</h2>';
h += buildTopMatieres();
h += '</div>';
h += '<div class="cdt-card"><div class="cdt-card-head"><h2>INFOS</h2></div><small>rien pour l\'instant...</small></div>';
h += '</div>';
h += '</div>';

cont.innerHTML = h;
bind();
}

function bind() {
var prev = document.getElementById('cdtPrev');
var next = document.getElementById('cdtNext');
if (prev) prev.addEventListener('click', function(e) {
e.stopPropagation();
cdtCurrentMonth.setMonth(cdtCurrentMonth.getMonth() - 1);
render();
});
if (next) next.addEventListener('click', function(e) {
e.stopPropagation();
cdtCurrentMonth.setMonth(cdtCurrentMonth.getMonth() + 1);
render();
});
cont.querySelectorAll('.cdt-day[data-dk]').forEach(function(el) {
el.addEventListener('click', function(e) {
e.stopPropagation();
cdtSelectedDate = parseDateKey(this.getAttribute('data-dk'));
render();
});
});
cont.querySelectorAll('.cdt-mark-btn').forEach(function(btn) {
btn.addEventListener('click', function(e) {
e.stopPropagation();
var idTache = parseInt(this.getAttribute('data-id'));
var faitActuel = this.getAttribute('data-done') === 'true';
window.marquerDevoir(idTache, !faitActuel, this);
setTimeout(render, 400);
});
});
}

render();
}
function carnet2() {
var cont = document.getElementById('ed-content');
if (!cont) return;
function afficherCarnet2UI() {
var correspondances = carnet2.correspondances || [];
cont.innerHTML = '';
function estSigne(msg) {
if (!msg.signature) return false;
var sigs = Array.isArray(msg.signature) ? msg.signature : [msg.signature];
return sigs.some(function(s) { return s && (s.dateValidation || s.datevalidation); });
}
function aSignature(msg) { return msg.isSignatureDemandee === true; }
function dateCourte(str) {
if (!str) return "";
var d = new Date(str);
var jours = ["DIMANCHE", "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
var mois = ["JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE"];
return jours[d.getDay()] + " " + d.getDate() + " " + mois[d.getMonth()];
}
function getSignature(msg) { return Array.isArray(msg.signature) ? msg.signature[0] : msg.signature; }
var html = '<div>';
html += '<div style="margin-bottom:16px;position:sticky;top:0;background:#17191f;padding:8px 0;z-index:10;">';
html += '<div style="display:flex;gap:10px;align-items:center;background:#1b1e25;border-radius:14px;padding:6px 12px;border:1px solid rgba(255,255,255,0.08);">';
html += '<span style="color:#9aa3b1;">🔍</span>';
html += '<input type="text" id="carnet2Recherche" placeholder="Rechercher..." style="flex:1;background:transparent;border:none;color:#e9ecf2;outline:none;">';
html += '<button id="carnet2Effacer" class="btn-ed ghost sm">Effacer</button></div>';
html += '<div style="display:flex;gap:6px;margin-top:6px;">';
html += '<button class="filtre2-btn btn-ed sm" data-filtre="all">Tous</button>';
html += '<button class="filtre2-btn btn-ed sm" data-filtre="unsigned">Non signes</button>';
html += '<button class="filtre2-btn btn-ed sm" data-filtre="signed">Signes</button>';
html += '</div></div>';
html += '<div id="carnet2Messages"></div></div>';
cont.innerHTML = html;
var filtreActuel = "all";
function afficherCarnet2(texteRecherche, typeFiltre) {
var divMsg = document.getElementById('carnet2Messages');
if (!divMsg) return;
var filtrees = correspondances.filter(function(msg) {
var auteur = msg.auteur || {};
var an = ((auteur.nom || "") + " " + (auteur.prenom || "")).toLowerCase();
var matchT = texteRecherche === "" || an.indexOf(texteRecherche.toLowerCase()) !== -1 || (msg.contenu || "").toLowerCase().indexOf(texteRecherche.toLowerCase()) !== -1;
var signe = estSigne(msg);
var matchF = typeFiltre === "signed" ? signe : typeFiltre === "unsigned" ? (aSignature(msg) && !signe) : true;
return matchT && matchF;
});
if (!filtrees.length) { divMsg.innerHTML = '<div class="empty-state"><p>Aucun message trouve</p></div>'; return; }
var h = '';
for (var i = 0; i < filtrees.length; i++) {
var msg = filtrees[i];
var auteur = msg.auteur || {};
var signe = estSigne(msg);
var aOpt = aSignature(msg);
var sig = getSignature(msg);
var an = (auteur.nom || "") + " " + (auteur.prenom || "");
var contenuPropre = decodeTexte(msg.contenu || "");
h += '<div class="carnet2-card">';
h += '<div style="display:flex;justify-content:space-between;margin-bottom:10px;">';
var displayName = an;
if (profNom && an) { var parts = an.split(' '); if (parts.length >= 2) { displayName = parts[0].charAt(0) + '. ' + parts[parts.length - 1]; } }
h += '<div><strong style="color:#e8f1ff;">' + displayName + '</strong> <span style="color:#9aa3b1;font-size:11px;">(' + (msg.type || "") + ')</span></div>';
h += '<div style="color:#9aa3b1;font-size:11px;">' + dateCourte(msg.dateCreation || "") + '</div></div>';
h += '<div style="color:#e9ecf2;font-size:13px;line-height:1.5;margin-bottom:10px;">' + contenuPropre + '</div>';
h += '<div style="margin-top:10px;">';
if (signe && sig) { var sd = sig.dateValidation || sig.datevalidation || ""; h += '<span style="color:#e8f1ff;font-size:11px;">✓ Signe par ' + (sig.nom || "") + " " + (sig.prenom || "") + " le " + dateCourte(sd) + '</span>'; }
else if (aOpt) { h += '<span style="color:#9aa3b1;font-size:11px;">○ En attente de signature</span>'; }
h += '</div></div>';
}
divMsg.innerHTML = h;
}
var inp = document.getElementById('carnet2Recherche');
var eff = document.getElementById('carnet2Effacer');
function majCarnet2() { afficherCarnet2(inp ? inp.value : "", filtreActuel); }
if (inp) inp.addEventListener('input', majCarnet2);
if (eff) eff.addEventListener('click', function() { if (inp) inp.value = ''; majCarnet2(); });
document.querySelectorAll('.filtre2-btn').forEach(function(btn, i) {
btn.style.opacity = i === 0 ? "1" : "0.6";
btn.addEventListener('click', function() {
filtreActuel = this.getAttribute('data-filtre');
document.querySelectorAll('.filtre2-btn').forEach(function(b) { b.style.opacity = "0.6"; });
this.style.opacity = "1";
majCarnet2();
});
});
afficherCarnet2("", "all");
}
if (!carnet2.correspondances || carnet2.correspondances.length === 0) {
cont.innerHTML = '<div class="empty-state"><p>Chargement des messages...</p></div>';
(async function() {
try {
var rep = await fetch(`https://api.ecoledirecte.com/v3/eleves/${id}/eleveCarnetCorrespondance.awp?verbe=get&v=4.98.0`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Token": tok }, body: "data=" + encodeURIComponent(JSON.stringify({})) });
var json = await rep.json();
if (json.code === 200 && json.data && json.data.correspondances) { carnet2.correspondances = json.data.correspondances; afficherCarnet2UI(); }
else { cont.innerHTML = '<div class="empty-state"><p>Aucun message trouve</p></div>'; }
} catch (e) { cont.innerHTML = '<div class="empty-state"><p>Erreur de chargement</p></div>'; }
})();
} else { afficherCarnet2UI(); }
}
function edt() {
var cont = document.getElementById('ed-content');
if (!cont) return;
var vue = 'jour';
var dateChoisie = new Date();
var debutSemaine = getJoursSemaine(new Date())[0];
function formatHeure(str) { var d = new Date(str); return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0'); }
function minutesDepuis(t) { var p = t.split(':'); return parseInt(p[0]) * 60 + parseInt(p[1]); }
function heureDepuisMinutes(m) { return Math.floor(m / 60).toString().padStart(2, '0') + ':' + (m % 60).toString().padStart(2, '0'); }
function getJoursSemaine(date) {
var jrs = [], lun = new Date(date);
var jour = lun.getDay();
var diff = lun.getDate() - jour + (jour === 0 ? -6 : 1);
lun.setDate(diff);
for (var i = 0; i < 5; i++) { var dd = new Date(lun); dd.setDate(lun.getDate() + i); jrs.push(dd); }
return jrs;
}
async function fetchEdt(debut, fin) {
try {
var rep = await fetch(`https://api.ecoledirecte.com/v3/E/${id}/emploidutemps.awp?verbe=get&v=4.98.0`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Token": tok }, body: "data=" + encodeURIComponent(JSON.stringify({ dateDebut: debut.toISOString().split('T')[0], dateFin: fin.toISOString().split('T')[0], avecTrous: true })) });
var json = await rep.json();
return json.code === 200 && Array.isArray(json.data) ? json.data : [];
} catch (e) { return []; }
}
function getCreneauxAvecTrous(cours) {
if (!cours || !cours.length) return [];
var tries = cours.slice().sort(function(a, b) { return minutesDepuis(a.start_date.split(' ')[1]) - minutesDepuis(b.start_date.split(' ')[1]); });
var reels = tries.filter(function(c) { return c.matiere && c.matiere !== "Pas de cours" && c.matiere.trim() !== ""; });
if (!reels.length) return [];
var fusion = [], cur = reels[0];
var curFin = minutesDepuis(cur.end_date.split(' ')[1]);
for (var i = 1; i < reels.length; i++) {
var next = reels[i];
var nextStart = minutesDepuis(next.start_date.split(' ')[1]);
var gap = nextStart - curFin;
if (cur.matiere === next.matiere && cur.prof === next.prof && cur.salle === next.salle && gap <= 5) { cur.end_date = next.end_date; curFin = minutesDepuis(cur.end_date.split(' ')[1]); }
else { fusion.push(cur); cur = next; curFin = minutesDepuis(cur.end_date.split(' ')[1]); }
}
fusion.push(cur);
var creneaux = [], prevFin = null;
for (var i = 0; i < fusion.length; i++) {
var c = fusion[i];
var st = c.start_date.split(' ')[1];
var et = c.end_date.split(' ')[1];
var sm = minutesDepuis(st);
var em = minutesDepuis(et);
if (prevFin !== null) {
var gap = sm - prevFin;
if (gap > 0) {
var typeGap = gap <= 5 ? "intercours" : (gap < 30 ? "recre" : "pause");
creneaux.push({ start: heureDepuisMinutes(prevFin), end: heureDepuisMinutes(sm), type: typeGap, duree: gap, cours: [] });
}
}
creneaux.push({ start: st, end: et, type: "cours", duree: em - sm, cours: [c] });
prevFin = em;
}
return creneaux;
}
function afficherJourEdt(cours, date) {
var coursJour = cours.filter(function(c) { return c.start_date.split(' ')[0] === date.toISOString().split('T')[0]; });
var creneaux = getCreneauxAvecTrous(coursJour);
var jours = ["DIMANCHE", "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
var mois = ["JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE"];
var h = '<div style="margin-bottom:16px;">';
h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">';
h += '<div style="background:#1b1e25;border-radius:14px;padding:10px 16px;border:1px solid rgba(255,255,255,0.08);"><span style="font-weight:700;color:#e8f1ff;">' + jours[date.getDay()] + '</span><span style="color:#9aa3b1;margin-left:10px;font-size:13px;">' + date.getDate() + ' ' + mois[date.getMonth()] + ' ' + date.getFullYear() + '</span></div>';
h += '<div style="display:flex;gap:10px;"><button id="jourPrec" class="btn-ed ghost sm">← Precedent</button><button id="jourSuiv" class="btn-ed ghost sm">Suivant →</button></div></div>';
if (!creneaux.length) { h += '<div style="background:#1b1e25;border-radius:14px;padding:32px;text-align:center;color:#9aa3b1;border:1px solid rgba(255,255,255,0.08);">Aucun cours aujourd\'hui</div>'; }
else {
for (var i = 0; i < creneaux.length; i++) {
var slot = creneaux[i];
if (slot.type === "cours") {
var c = slot.cours[0];
var estAnn = c.isAnnule === true;
var maintenant = new Date();
var estMaintenant = (date.toDateString() === maintenant.toDateString() && slot.start <= formatHeure(maintenant) && slot.end >= formatHeure(maintenant));
var hauteur = Math.max(56, (slot.duree / 60) * 68);
var coulBg = estAnn ? '#667080' : estMaintenant ? '#e8f1ff' : '#1b1e25';
var textColor = estMaintenant ? '#17191f' : '#e9ecf2';
h += '<div style="background:' + coulBg + ';border-radius:14px;padding:10px 14px;margin-bottom:3px;height:' + hauteur + 'px;display:flex;align-items:center;border:1px solid rgba(255,255,255,0.08);">';
h += '<div style="width:70px;"><div style="color:' + textColor + ';font-size:12px;font-weight:500;">' + slot.start + '</div><div style="color:' + textColor + ';font-size:10px;opacity:0.7;">' + slot.end + '</div></div>';
h += '<div style="flex:1;"><div style="font-weight:600;color:' + textColor + ';font-size:14px;">' + (c.text || c.matiere) + '</div>';
h += '<div style="display:flex;gap:12px;margin-top:4px;">';
if (c.prof) h += '<div style="color:' + textColor + ';font-size:11px;opacity:0.8;">' + c.prof + '</div>';
if (c.salle) h += '<div style="color:' + textColor + ';font-size:11px;opacity:0.8;">' + c.salle + '</div>';
if (estAnn) h += '<div style="color:' + textColor + ';font-size:11px;">Annule</div>';
h += '</div></div></div>';
} else if (slot.type === "intercours") { h += '<div style="height:2px;background:transparent;"></div>'; }
else if (slot.type === "recre") { var hauteurRecre = Math.max(16, (slot.duree / 60) * 36); h += '<div style="height:' + hauteurRecre + 'px;"></div>'; }
else if (slot.type === "pause") { var hauteurPause = Math.max(48, (slot.duree / 60) * 56); h += '<div style="height:' + hauteurPause + 'px;"></div>'; }
}
}
h += '</div>';
return h;
}
function afficherSemaine(cours, debutSem) {
var joursSem = getJoursSemaine(debutSem);
var jours = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI"];
var mois = ["JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE"];
var h = '<div style="margin-bottom:16px;">';
h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">';
h += '<div style="background:#1b1e25;border-radius:14px;padding:10px 16px;border:1px solid rgba(255,255,255,0.08);"><span style="font-weight:700;color:#e8f1ff;">Semaine du ' + joursSem[0].getDate() + ' ' + mois[joursSem[0].getMonth()] + '</span></div>';
h += '<div style="display:flex;gap:10px;"><button id="semPrec" class="btn-ed ghost sm">← Precedente</button><button id="semSuiv" class="btn-ed ghost sm">Suivante →</button></div></div>';
h += '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;min-height:500px;">';
for (var i = 0; i < joursSem.length; i++) {
var dd = joursSem[i];
var ds = dd.toISOString().split('T')[0];
var coursJour = cours.filter(function(c) { return c.start_date.split(' ')[0] === ds; });
var creneaux = getCreneauxAvecTrous(coursJour);
var estAuj = (dd.toDateString() === new Date().toDateString());
var hauteurTotale = 0;
for (var s = 0; s < creneaux.length; s++) {
var slot = creneaux[s];
if (slot.type === "cours") { hauteurTotale += Math.max(56, (slot.duree / 60) * 68) + 3; }
else if (slot.type === "intercours") { hauteurTotale += 2; }
else if (slot.type === "recre") { hauteurTotale += Math.max(16, (slot.duree / 60) * 36); }
else if (slot.type === "pause") { hauteurTotale += Math.max(48, (slot.duree / 60) * 56); }
}
hauteurTotale = Math.max(hauteurTotale, 400);
h += '<div style="background:#1b1e25;border-radius:14px;padding:12px;border:1px solid ' + (estAuj ? '#e8f1ff' : 'rgba(255,255,255,0.08)') + ';min-height:' + hauteurTotale + 'px;display:flex;flex-direction:column;">';
h += '<div style="font-weight:700;color:#e8f1ff;margin-bottom:10px;">' + jours[i] + '<span style="color:#9aa3b1;margin-left:6px;">' + dd.getDate() + '</span></div>';
if (!creneaux.length) { h += '<div style="flex:1;display:flex;align-items:center;justify-content:center;color:#9aa3b1;font-size:12px;">Aucun cours</div>'; }
else {
h += '<div style="flex:1;overflow-y:auto;">';
for (var s = 0; s < creneaux.length; s++) {
var slot = creneaux[s];
if (slot.type === "cours") {
var c = slot.cours[0];
var estAnn = c.isAnnule === true;
var hauteur = Math.max(56, (slot.duree / 60) * 68);
h += '<div style="background:' + (estAnn ? '#667080' : '#14161c') + ';border-radius:7px;padding:8px;margin-bottom:6px;height:' + hauteur + 'px;border:1px solid rgba(255,255,255,0.08);">';
h += '<div style="font-size:10px;color:#e9ecf2;margin-bottom:4px;">' + slot.start + '-' + slot.end + '</div>';
h += '<div style="font-size:12px;font-weight:500;color:#e9ecf2;">' + (c.text || c.matiere) + '</div>';
if (c.salle) h += '<div style="font-size:10px;color:#9aa3b1;margin-top:2px;">' + c.salle + '</div>';
if (estAnn) h += '<div style="font-size:10px;color:#e9ecf2;margin-top:2px;">Annule</div>';
h += '</div>';
} else if (slot.type === "intercours") { h += '<div style="height:2px;"></div>'; }
else if (slot.type === "recre") { var hr = Math.max(16, (slot.duree / 60) * 36); h += '<div style="height:' + hr + 'px;"></div>'; }
else if (slot.type === "pause") { var hp = Math.max(48, (slot.duree / 60) * 56); h += '<div style="height:' + hp + 'px;"></div>'; }
}
h += '</div>';
}
h += '</div>';
}
h += '</div></div>';
return h;
}
var h = '<div style="display:flex;gap:10px;margin-bottom:20px;background:#1b1e25;padding:6px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);">';
h += '<button id="vueJourBtn" class="btn-ed primary" style="flex:1;">Jour</button>';
h += '<button id="vueSemaineBtn" class="btn-ed ghost" style="flex:1;">Semaine</button>';
h += '</div><div id="edtAffichage"></div>';
cont.innerHTML = h;
var affDiv = document.getElementById('edtAffichage');
var btnJour = document.getElementById('vueJourBtn');
var btnSem = document.getElementById('vueSemaineBtn');
async function chargerJour() {
var cours = await fetchEdt(new Date(dateChoisie), new Date(dateChoisie));
affDiv.innerHTML = afficherJourEdt(cours, dateChoisie);
setTimeout(function() {
var pb = document.getElementById('jourPrec');
var nb = document.getElementById('jourSuiv');
if (pb) pb.addEventListener('click', function() { dateChoisie.setDate(dateChoisie.getDate() - 1); chargerJour(); });
if (nb) nb.addEventListener('click', function() { dateChoisie.setDate(dateChoisie.getDate() + 1); chargerJour(); });
}, 100);
}
async function chargerSemaine() {
var deb = new Date(debutSemaine);
var fin = new Date(debutSemaine);
fin.setDate(debutSemaine.getDate() + 6);
var cours = await fetchEdt(deb, fin);
affDiv.innerHTML = afficherSemaine(cours, debutSemaine);
setTimeout(function() {
var pb = document.getElementById('semPrec');
var nb = document.getElementById('semSuiv');
if (pb) pb.addEventListener('click', function() { debutSemaine.setDate(debutSemaine.getDate() - 7); chargerSemaine(); });
if (nb) nb.addEventListener('click', function() { debutSemaine.setDate(debutSemaine.getDate() + 7); chargerSemaine(); });
}, 100);
}
btnJour.addEventListener('click', function() { vue = 'jour'; btnJour.className = 'btn-ed primary'; btnSem.className = 'btn-ed ghost'; dateChoisie = new Date(); chargerJour(); });
btnSem.addEventListener('click', function() { vue = 'semaine'; btnSem.className = 'btn-ed primary'; btnJour.className = 'btn-ed ghost'; debutSemaine = getJoursSemaine(new Date())[0]; chargerSemaine(); });
chargerJour();
}
function vieScolaire() {
var cont = document.getElementById('ed-content');
if (!cont) return;
cont.innerHTML = '';
var absRet = vie.absencesRetards || [], sanctEnc = vie.sanctionsEncouragements || [];
var absences = absRet.filter(function(i) { return i.typeElement === "Absence"; });
var retards = absRet.filter(function(i) { return i.typeElement === "Retard"; });
var repas = absRet.filter(function(i) { return i.typeElement === "Repas"; });
var punitions = sanctEnc.filter(function(i) { return i.typeElement === "Punition"; });
var encouragements = sanctEnc.filter(function(i) { return i.typeElement === "Encouragement"; });
var html = '<div>';
function section(titre, items, ligneFn) {
if (!items.length) return '';
var h = '<div style="background:#1b1e25;border-radius:14px;padding:16px;margin-bottom:16px;border:1px solid rgba(255,255,255,0.08);">';
h += '<h3 style="color:#e8f1ff;margin-bottom:12px;">' + titre + '</h3>';
for (var i = 0; i < items.length; i++) h += ligneFn(items[i]);
return h + '</div>';
}
html += section("Absences", absences, function(a) { return '<div style="border-bottom:1px solid rgba(255,255,255,0.08);padding:10px 0;"><div><strong>' + a.displayDate + '</strong></div><div style="color:#9aa3b1;font-size:12px;">' + a.libelle + '</div><div style="color:' + (a.justifie ? '#e8f1ff' : '#9aa3b1') + ';font-size:12px;">' + (a.justifie ? 'Justifiee' : 'Non justifiee') + '</div></div>'; });
html += section("Retards", retards, function(r) { return '<div style="border-bottom:1px solid rgba(255,255,255,0.08);padding:10px 0;"><strong>' + r.displayDate + '</strong><div style="color:#9aa3b1;font-size:12px;">' + r.libelle + '</div><div style="color:' + (r.justifie ? '#e8f1ff' : '#667080') + ';font-size:12px;">' + (r.justifie ? 'Justifie' : 'Non justifie') + '</div></div>'; });
html += section("Absences cantine", repas, function(rp) { return '<div style="border-bottom:1px solid rgba(255,255,255,0.08);padding:10px 0;"><strong>' + rp.displayDate + '</strong><div style="color:#9aa3b1;font-size:12px;">' + rp.libelle + '</div></div>'; });
html += section("Punitions", punitions, function(p) { return '<div style="border-bottom:1px solid rgba(255,255,255,0.08);padding:10px 0;"><strong>' + p.libelle + '</strong> - ' + p.date + '<div style="color:#e9ecf2;font-size:12px;">Par: ' + p.par + '</div>' + (p.motif ? '<div style="color:#9aa3b1;font-size:12px;">' + p.motif + '</div>' : '') + '</div>'; });
html += section("Encouragements", encouragements, function(e) { return '<div style="border-bottom:1px solid rgba(255,255,255,0.08);padding:10px 0;"><strong>' + e.libelle + '</strong> - ' + e.date + (e.motif ? '<div style="color:#e9ecf2;font-size:12px;">' + e.motif + '</div>' : '') + '</div>'; });
if (!absences.length && !retards.length && !repas.length && !punitions.length && !encouragements.length) { html += '<div class="empty-state"><p>Aucune information de vie scolaire</p></div>'; }
html += '</div>';
cont.innerHTML = html;
}
function messagerie() {
var cont = document.getElementById('ed-content');
if (!cont) return;
cont.innerHTML = '<div class="light-wrap"><div class="mui-app"><aside class="mui-side" id="muiSide"></aside><section class="mui-list" id="muiList"></section><main class="mui-reader" id="muiReader"></main></div></div>';
var recus = [], envoyes = [], brouillons = [], archives = [];
var dossierActuel = "recus", tagActif = null, recherche = "", msgActuel = null;
var tags = JSON.parse(localStorage.getItem('ed_tags') || '[]');
var msgTags = JSON.parse(localStorage.getItem('ed_msgTags') || '{}');
var starred = JSON.parse(localStorage.getItem('ed_starredMsgs') || '[]');
var TAG_COLORS = ['#35c24e', '#2f6bff', '#a855f7', '#f59e0b', '#f43f5e', '#14b8a6'];
function saveTags() { localStorage.setItem('ed_tags', JSON.stringify(tags)); }
function saveMsgTags() { localStorage.setItem('ed_msgTags', JSON.stringify(msgTags)); }
function saveStarred() { localStorage.setItem('ed_starredMsgs', JSON.stringify(starred)); }
function decodeBase64(str) {
if (!str) return "";
try { var b = atob(str), bytes = []; for (var i = 0; i < b.length; i++) bytes.push(b.charCodeAt(i) & 0xFF); return new TextDecoder('utf-8').decode(new Uint8Array(bytes)); } catch (e) { return str; }
}
function getExpediteur(msg) {
if (envoyes.indexOf(msg) !== -1 && msg.to && msg.to[0]) return (msg.to[0].prenom || "") + " " + (msg.to[0].nom || "");
if (msg.from) return (msg.from.prenom || "") + " " + (msg.from.nom || "");
return "";
}
function expediteurEstMasque(nom) { return expCache.indexOf(nom.trim()) !== -1; }
function basculerMasqueExpediteur(nom) {
nom = nom.trim();
var idx = expCache.indexOf(nom);
if (idx === -1) expCache.push(nom); else expCache.splice(idx, 1);
localStorage.setItem('ed_maskedSenders', JSON.stringify(expCache));
}
function tousMsgs() { return [].concat(recus, envoyes, brouillons, archives); }
function masquesCount() { return tousMsgs().filter(function(m) { return expediteurEstMasque(getExpediteur(m)); }).length; }
function tagCount(tid) { return tousMsgs().filter(function(m) { return (msgTags[m.id] || []).indexOf(tid) !== -1; }).length; }
function dateCourte(d) { if (!d) return ''; var dt = new Date(d); var mois = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; return mois[dt.getMonth()] + ' ' + dt.getDate(); }
function avatarColor(nom) { var hsh = 0; for (var i = 0; i < nom.length; i++) hsh = (hsh * 31 + nom.charCodeAt(i)) % 360; return 'hsl(' + hsh + ',45%,45%)'; }
function initials(nom) { var p = nom.trim().split(/\s+/); var s = (p[0] || '?').charAt(0) + ((p[1] || '').charAt(0) || ''); return s.toUpperCase(); }
function modeDe(m) {
if (envoyes.indexOf(m) !== -1) return 'expediteur';
if (brouillons.indexOf(m) !== -1) return 'brouillon';
return 'destinataire';
}
function getMsgs() {
var msgs;
if (tagActif !== null) {
msgs = tousMsgs().filter(function(m) { return (msgTags[m.id] || []).indexOf(tagActif) !== -1; });
} else if (dossierActuel === 'recus') msgs = recus.slice();
else if (dossierActuel === 'envoyes') msgs = envoyes.slice();
else if (dossierActuel === 'brouillons') msgs = brouillons.slice();
else if (dossierActuel === 'archives') msgs = archives.slice();
else if (dossierActuel === 'masques') msgs = tousMsgs().filter(function(m) { return expediteurEstMasque(getExpediteur(m)); });
else msgs = [];
if (dossierActuel !== 'masques') msgs = msgs.filter(function(m) { return !expediteurEstMasque(getExpediteur(m)); });
if (recherche) {
var q = recherche.toLowerCase();
msgs = msgs.filter(function(m) { return getExpediteur(m).toLowerCase().indexOf(q) !== -1 || (m.subject || '').toLowerCase().indexOf(q) !== -1; });
}
return msgs.sort(function(a, b) { return new Date(b.date || 0) - new Date(a.date || 0); });
}
function renderSide() {
var el = document.getElementById('muiSide'); if (!el) return;
var folders = [
['recus', 'inbox', 'Recus', recus.length],
['envoyes', 'send', 'Envoyes', envoyes.length],
['brouillons', 'file', 'Brouillons', brouillons.length],
['masques', 'eyeoff', 'Masquees', masquesCount()],
['spam', 'spam', 'Spam', 0],
['archives', 'trash', 'Archivees', archives.length]
];
var h = '<div class="mui-nav">';
for (var i = 0; i < folders.length; i++) {
var f = folders[i];
var act = (tagActif === null && dossierActuel === f[0]);
h += '<button class="mui-item' + (act ? ' active' : '') + '" data-folder="' + f[0] + '">' + ic(f[1]) + '<span>' + f[2] + '</span><b class="mui-count">' + f[3] + '</b></button>';
}
h += '</div><div>';
h += '<div class="mui-tagshead"><span>tags</span></div>';
for (var t = 0; t < tags.length; t++) {
var tg = tags[t];
var act2 = tagActif === tg.id;
h += '<button class="mui-item' + (act2 ? ' active' : '') + '" data-tag="' + tg.id + '"><i class="mui-dot" style="background:' + tg.color + '"></i><span>' + tg.name + '</span><b class="mui-count">' + tagCount(tg.id) + '</b></button>';
}
h += '<button class="mui-item" id="muiNewTag" style="color:#8a94a6;">' + ic('plus') + '<span>ajouter un tag</span></button>';
h += '</div>';
el.innerHTML = h;
el.querySelectorAll('[data-folder]').forEach(function(b) { b.addEventListener('click', function() { dossierActuel = this.getAttribute('data-folder'); tagActif = null; msgActuel = null; renderSide(); renderList(); renderReader(); }); });
el.querySelectorAll('[data-tag]').forEach(function(b) { b.addEventListener('click', function() { var tid = parseInt(this.getAttribute('data-tag')); tagActif = (tagActif === tid ? null : tid); msgActuel = null; renderSide(); renderList(); renderReader(); }); });
var nt = document.getElementById('muiNewTag'); if (nt) nt.addEventListener('click', function() { modalNouveauTag(); });
}
function itemHtml(m) {
var exp = getExpediteur(m);
var masque = expediteurEstMasque(exp);
var sel = msgActuel && String(msgActuel.id) === String(m.id);
var h = '<div class="mui-mail' + (sel ? ' selected' : '') + '" data-id="' + m.id + '">';
h += '<div class="mui-row1"><h4>' + (m.subject || '(Sans objet)') + '</h4><time>' + dateCourte(m.date) + '</time></div>';
h += '<div class="mui-sub"><span class="mui-sender">' + (masque ? 'Expediteur masque' : (exp || '(Sans nom)')) + '</span>';
h += '<button class="mui-addtag" data-tagmsg="' + m.id + '" title="Ajouter un tag">' + ic('plus', 'sm') + '</button></div>';
var preview = m.content ? decodeBase64(m.content).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) : '';
if (preview) h += '<p class="mui-preview">' + preview + '</p>';
var tgs = msgTags[m.id] || [];
if ((m.files && m.files.length) || tgs.length) {
h += '<div class="mui-chips">';
for (var g = 0; g < tgs.length; g++) { var tg = tags.filter(function(t) { return t.id === tgs[g]; })[0]; if (tg) h += '<span class="mui-tagchip"><i class="mui-dot" style="background:' + tg.color + '"></i>' + tg.name + '</span>'; }
if (m.files) for (var f = 0; f < Math.min(m.files.length, 2); f++) h += '<span class="mui-chip">' + ic('file', 'sm') + m.files[f].libelle + '</span>';
h += '</div>';
}
h += '</div>';
return h;
}
function bindItems(wrap) {
wrap.querySelectorAll('.mui-mail').forEach(function(d) {
d.addEventListener('click', function(e) {
if (e.target.closest('.mui-addtag')) return;
ouvrirMessage(this.getAttribute('data-id'));
});
});
wrap.querySelectorAll('.mui-addtag').forEach(function(b) {
b.addEventListener('click', function(e) { e.stopPropagation(); modalTagsMessage(this.getAttribute('data-tagmsg')); });
});
}
function refreshItems() {
var wrap = document.getElementById('muiMailList'); if (!wrap) return;
var msgs = getMsgs();
var cnt = document.getElementById('muiCountLabel'); if (cnt) cnt.textContent = msgs.length + ' Messages';
if (!msgs.length) { wrap.innerHTML = '<div class="mui-empty"><p>Aucun message</p></div>'; return; }
var h = '';
for (var i = 0; i < msgs.length; i++) h += itemHtml(msgs[i]);
wrap.innerHTML = h;
bindItems(wrap);
}
function renderList() {
var el = document.getElementById('muiList'); if (!el) return;
var label;
if (tagActif !== null) { var tg = tags.filter(function(t) { return t.id === tagActif; })[0]; label = tg ? tg.name : 'Tag'; }
else label = { recus: 'Recus', envoyes: 'Envoyes', brouillons: 'Brouillons', masques: 'Masquees', spam: 'Spam', archives: 'Archivees' }[dossierActuel];
var h = '<div class="mui-listhead">';
h += '<p class="mui-listcount" id="muiCountLabel"></p>';
h += '<div class="mui-searchrow"><label class="mui-search">' + ic('search') + '<input type="text" id="muiSearch" placeholder="recherche" value="' + recherche.replace(/"/g, '&quot;') + '"></label></div>';
h += '<button class="mui-chipfilter">' + label + ' ' + ic('chevdown', 'sm') + '</button>';
h += '</div><div class="mui-maillist" id="muiMailList"></div>';
el.innerHTML = h;
var si = document.getElementById('muiSearch');
if (si) si.addEventListener('input', function() { recherche = this.value; refreshItems(); });
refreshItems();
}
function renderReader() {
var el = document.getElementById('muiReader'); if (!el) return;
if (!msgActuel) {
el.innerHTML = '<div class="mui-readertop"></div><div class="mui-readerscroll"><div class="mui-empty"><p>Selectionnez un message</p></div></div>';
return;
}
var m = msgActuel;
var exp = getExpediteur(m);
var masque = expediteurEstMasque(exp);
var isStar = starred.indexOf(String(m.id)) !== -1;
var h = '<div class="mui-readertop"><button class="mui-eyebtn' + (masque ? ' on' : '') + '" id="muiEye" title="Masquer / demasquer l\'expediteur">' + ic(masque ? 'eyeoff' : 'eye') + '</button></div>';
h += '<div class="mui-readerscroll">';
h += '<div class="mui-msghead"><div class="mui-avatar" style="background:' + (masque ? '#8a94a6' : avatarColor(exp)) + '">' + (masque ? '?' : initials(exp)) + '</div>';
h += '<div class="mui-who"><strong>' + (masque ? 'Expediteur masque' : (exp || '(Sans nom)')) + '</strong><span>From: ' + (masque ? '•••' : ((m.from && m.from.email) ? m.from.email : '—')) + ' &nbsp;•&nbsp; To: Me</span></div>';
h += '<div class="mui-meta"><time>' + (m.date || '').replace(/-/g, '/').substring(0, 16) + '</time>';
h += '<button class="mui-eyebtn mui-star' + (isStar ? ' on' : '') + '" id="muiStar" title="Favori">' + ic('star') + '</button>';
h += '<button class="mui-eyebtn">' + ic('reply') + '</button>';
h += '<button class="mui-eyebtn">' + ic('forward') + '</button>';
h += '<button class="mui-eyebtn">' + ic('more') + '</button></div></div>';
h += '<h3 class="mui-subject">' + (m.subject || '(Sans objet)') + '</h3>';
h += '<div class="mui-body">' + decodeBase64(m.content || '') + '</div>';
var tgs = msgTags[m.id] || [];
h += '<div class="mui-attachhead"><h5>tags</h5></div><div class="mui-chips" style="margin-top:10px;">';
for (var g = 0; g < tgs.length; g++) { var tg = tags.filter(function(t) { return t.id === tgs[g]; })[0]; if (tg) h += '<span class="mui-tagchip"><i class="mui-dot" style="background:' + tg.color + '"></i>' + tg.name + '</span>'; }
h += '<button class="mui-addtag" id="muiReaderAddTag" title="Ajouter un tag">' + ic('plus', 'sm') + '</button></div>';
if (m.files && m.files.length) {
h += '<div class="mui-attachhead"><h5>piece(s) jointe(s)</h5></div><div class="mui-attachgrid">';
for (var f = 0; f < m.files.length; f++) {
h += '<button class="mui-attach" data-file="' + f + '"><span class="mui-fileic">' + ic('file') + '</span><div><strong>' + m.files[f].libelle + '</strong><span>PDF</span></div></button>';
}
h += '</div>';
}
h += '</div>';
el.innerHTML = h;
document.getElementById('muiEye').addEventListener('click', function() {
basculerMasqueExpediteur(exp);
renderSide(); refreshItems(); renderReader();
});
document.getElementById('muiStar').addEventListener('click', function() {
var sid = String(m.id);
var i = starred.indexOf(sid);
if (i === -1) starred.push(sid); else starred.splice(i, 1);
saveStarred();
renderReader();
});
var ra = document.getElementById('muiReaderAddTag');
if (ra) ra.addEventListener('click', function() { modalTagsMessage(String(m.id)); });
el.querySelectorAll('.mui-attach').forEach(function(b) {
b.addEventListener('click', function() {
var f = m.files[parseInt(this.getAttribute('data-file'))];
window.voirPieceJointe(f.id, f.libelle);
});
});
}
function ouvrirMessage(mid) {
var m = tousMsgs().filter(function(x) { return String(x.id) === String(mid); })[0];
if (!m) return;
msgActuel = m;
refreshItems();
renderReader();
fetch(`https://api.ecoledirecte.com/v3/eleves/${id}/messages/${mid}.awp?verbe=get&mode=${modeDe(m)}&v=4.98.0`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Token": tok }, body: "data=" + encodeURIComponent(JSON.stringify({})) })
.then(function(r) { return r.json(); })
.then(function(json) {
if (json.data && msgActuel && String(msgActuel.id) === String(mid)) {
msgActuel = Object.assign({}, msgActuel, json.data);
renderReader();
}
}).catch(function() {});
}
function modalNouveauTag() {
var modal = document.createElement('div');
modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,.45);backdrop-filter:blur(8px);z-index:10000001;display:flex;align-items:center;justify-content:center;';
var c = document.createElement('div');
c.style.cssText = 'background:#fff;border-radius:16px;padding:22px;max-width:340px;width:90%;color:#0f172a;font-family:Inter,system-ui,sans-serif;box-shadow:0 30px 60px rgba(15,23,42,.25);';
var h = '<h2 style="font-size:16px;font-weight:700;margin-bottom:14px;">Nouveau tag</h2>';
h += '<label style="font-size:12px;color:#3f4757;display:block;margin-bottom:6px;">Nom</label>';
h += '<input id="tagNameInput" type="text" style="width:100%;padding:10px 12px;border:1px solid #edeff4;border-radius:10px;font:inherit;font-size:13px;outline:none;margin-bottom:12px;">';
h += '<div style="display:flex;gap:8px;margin-bottom:16px;">';
for (var i = 0; i < TAG_COLORS.length; i++) h += '<button class="tagcol" data-c="' + TAG_COLORS[i] + '" style="width:26px;height:26px;border-radius:50%;background:' + TAG_COLORS[i] + ';border:2px solid transparent;cursor:pointer;"></button>';
h += '</div>';
h += '<div style="display:flex;gap:10px;"><button id="tagSave" style="flex:1;padding:11px;border:none;border-radius:10px;background:#1a56ff;color:#fff;font-weight:600;font-size:13px;cursor:pointer;">Creer</button><button id="tagCancel" style="flex:1;padding:11px;border:1px solid #edeff4;border-radius:10px;background:#fff;font-size:13px;cursor:pointer;">Annuler</button></div>';
c.innerHTML = h;
modal.appendChild(c);
document.body.appendChild(modal);
var chosen = TAG_COLORS[0];
c.querySelectorAll('.tagcol')[0].style.borderColor = '#0f172a';
c.querySelectorAll('.tagcol').forEach(function(b) {
b.addEventListener('click', function() {
chosen = this.getAttribute('data-c');
c.querySelectorAll('.tagcol').forEach(function(x) { x.style.borderColor = 'transparent'; });
this.style.borderColor = '#0f172a';
});
});
modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
document.getElementById('tagCancel').onclick = function() { modal.remove(); };
document.getElementById('tagSave').onclick = function() {
var name = document.getElementById('tagNameInput').value.trim();
if (!name) return;
tags.push({ id: Date.now(), name: name, color: chosen });
saveTags();
modal.remove();
renderSide(); refreshItems(); renderReader();
};
}
function modalTagsMessage(msgId) {
var modal = document.createElement('div');
modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,.45);backdrop-filter:blur(8px);z-index:10000001;display:flex;align-items:center;justify-content:center;';
var c = document.createElement('div');
c.style.cssText = 'background:#fff;border-radius:16px;padding:22px;max-width:340px;width:90%;color:#0f172a;font-family:Inter,system-ui,sans-serif;box-shadow:0 30px 60px rgba(15,23,42,.25);';
var assigned = msgTags[msgId] || [];
var h = '<h2 style="font-size:16px;font-weight:700;margin-bottom:14px;">Tags du message</h2>';
if (!tags.length) h += '<p style="font-size:12px;color:#8a94a6;margin-bottom:12px;">Aucun tag pour l\'instant. Cree-en un.</p>';
for (var i = 0; i < tags.length; i++) {
var tg = tags[i];
h += '<label style="display:flex;align-items:center;gap:10px;padding:8px 0;font-size:13px;color:#3f4757;cursor:pointer;"><input type="checkbox" class="mtag-cb" data-id="' + tg.id + '" ' + (assigned.indexOf(tg.id) !== -1 ? 'checked' : '') + ' style="accent-color:' + tg.color + ';width:15px;height:15px;"><i class="mui-dot" style="background:' + tg.color + '"></i>' + tg.name + '</label>';
}
h += '<div style="display:flex;gap:10px;margin-top:14px;"><button id="mtagDone" style="flex:1;padding:11px;border:none;border-radius:10px;background:#1a56ff;color:#fff;font-weight:600;font-size:13px;cursor:pointer;">OK</button><button id="mtagNew" style="flex:1;padding:11px;border:1px solid #edeff4;border-radius:10px;background:#fff;font-size:13px;cursor:pointer;">+ nouveau tag</button></div>';
c.innerHTML = h;
modal.appendChild(c);
document.body.appendChild(modal);
modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
c.querySelectorAll('.mtag-cb').forEach(function(cb) {
cb.addEventListener('change', function() {
var tid = parseInt(this.getAttribute('data-id'));
if (!msgTags[msgId]) msgTags[msgId] = [];
var i = msgTags[msgId].indexOf(tid);
if (this.checked && i === -1) msgTags[msgId].push(tid);
if (!this.checked && i !== -1) msgTags[msgId].splice(i, 1);
saveMsgTags();
});
});
document.getElementById('mtagDone').onclick = function() { modal.remove(); renderSide(); refreshItems(); renderReader(); };
document.getElementById('mtagNew').onclick = function() { modal.remove(); modalNouveauTag(); };
}
function chargerTousMessages() {
Promise.all([
fetch(`https://api.ecoledirecte.com/v3/eleves/${id}/messages.awp?force=false&typeRecuperation=received&idClasseur=0&orderBy=date&order=desc&query=&onlyRead=&page=0&itemsPerPage=1000&getAll=0&verbe=get&v=4.98.0`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Token": tok }, body: "data=" + encodeURIComponent(JSON.stringify({})) }).then(r => r.json()),
fetch(`https://api.ecoledirecte.com/v3/eleves/${id}/messages.awp?force=false&typeRecuperation=sent&idClasseur=0&orderBy=date&order=desc&query=&onlyRead=&page=0&itemsPerPage=1000&getAll=0&verbe=get&v=4.98.0`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Token": tok }, body: "data=" + encodeURIComponent(JSON.stringify({})) }).then(r => r.json()),
fetch(`https://api.ecoledirecte.com/v3/eleves/${id}/messages.awp?force=false&typeRecuperation=draft&idClasseur=0&orderBy=date&order=desc&query=&onlyRead=&page=0&itemsPerPage=1000&getAll=0&verbe=get&v=4.98.0`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Token": tok }, body: "data=" + encodeURIComponent(JSON.stringify({})) }).then(r => r.json()),
fetch(`https://api.ecoledirecte.com/v3/eleves/${id}/messages.awp?force=false&typeRecuperation=archived&idClasseur=0&orderBy=date&order=desc&query=&onlyRead=&page=0&itemsPerPage=1000&getAll=0&verbe=get&v=4.98.0`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Token": tok }, body: "data=" + encodeURIComponent(JSON.stringify({})) }).then(r => r.json())
]).then(function(resultats) {
if (resultats[0].code === 200) recus = resultats[0].data.messages.received || [];
if (resultats[1].code === 200) envoyes = resultats[1].data.messages.sent || [];
if (resultats[2].code === 200) brouillons = resultats[2].data.messages.draft || [];
if (resultats[3].code === 200) archives = resultats[3].data.messages.archived || [];
renderSide(); renderList(); renderReader();
majCountsSide();
}).catch(function() { renderSide(); renderList(); renderReader(); });
}
chargerTousMessages();
}
function apiLog() {
var cont = document.getElementById('ed-content');
if (!cont) return;
if (!logs.length) { cont.innerHTML = '<div class="empty-state"><p>Aucun log API.</p></div>'; return; }
var html = '<div style="background:#1b1e25;border-radius:14px;padding:16px;border:1px solid rgba(255,255,255,0.08);"><h2 style="color:#e8f1ff;margin-bottom:12px;">API Logs</h2><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">';
html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.08);"><th style="text-align:left;padding:6px;color:#9aa3b1;">Date</th><th style="text-align:left;padding:6px;color:#9aa3b1;">API</th><th style="text-align:left;padding:6px;color:#9aa3b1;">Status</th><th style="text-align:left;padding:6px;color:#9aa3b1;">Duree</th></tr>';
for (var i = 0; i < logs.length; i++) {
var l = logs[i];
var coulCode = l.code === 200 ? '#e8f1ff' : '#667080';
html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.08);"><td style="padding:6px;font-size:11px;color:#9aa3b1;">' + l.heure + '</td><td style="padding:6px;font-size:11px;">' + (l.url.length > 50 ? l.url.substring(0, 50) + '...' : l.url) + '</td><td style="padding:6px;font-size:11px;color:' + coulCode + ';">' + l.code + '</td><td style="padding:6px;font-size:11px;color:#9aa3b1;">' + l.duree + '</td></tr>';
}
html += '</table></div></div>';
cont.innerHTML = html;
}
function isVerified(devString, baseUrl) {
var checkStr = (devString + " " + baseUrl).toLowerCase();
var verifiedList = [
"kyten13.codeberg.page",
"noodlelover1.codeberg.page",
"notanumber-dev.github.io",
"cdn.jsdelivr.net/gh/notanumber-dev/",
"💎.pages.dev",
"xn--978h.pages.dev"
];
for (var v = 0; v < verifiedList.length; v++) {
if (checkStr.includes(verifiedList[v].toLowerCase())) return true;
}
return false;
}
function parseDatTxt(text) {
var meta = { require: '', dev: '', ver: '', name: '', desc: '', img: '' };
text.split('\n').forEach(function(line) {
line = line.trim();
if (!line) return;
var mReq = line.match(/^require\s*[:=_]\s*(.*)$/i);
var mDev = line.match(/^dev\s*[:=_@]\s*(.*)$/i);
var mVer = line.match(/^ver\s*[:=_]\s*(.*)$/i);
var mName = line.match(/^name\s*[:=_]\s*(.*)$/i);
var mDesc = line.match(/^desc\s*[:=_]\s*(.*)$/i);
var mImg = line.match(/^img\s*[:=_]\s*(.*)$/i);
if (mReq) meta.require = mReq[1].trim();
else if (mDev) meta.dev = mDev[1].trim();
else if (mVer) meta.ver = mVer[1].trim();
else if (mName) meta.name = mName[1].trim();
else if (mDesc) meta.desc = mDesc[1].trim();
else if (mImg) meta.img = mImg[1].trim();
});
return meta;
}
function modalAjoutApp() {
var modal = document.createElement('div');
modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(10,12,16,0.8);backdrop-filter:blur(8px);z-index:10000001;display:flex;align-items:center;justify-content:center;';
var contenu = document.createElement('div');
contenu.style.cssText = 'background:#1b1e25;border-radius:14px;padding:24px;max-width:400px;width:90%;border:1px solid rgba(255,255,255,0.16);';
contenu.innerHTML = '<h2 style="color:#e8f1ff;margin-bottom:14px;">Ajouter une app</h2>'
+ '<div style="margin-bottom:10px;">'
+ '<label style="color:#e9ecf2;display:block;margin-bottom:3px;">lien de l\'app</label>'
+ '<input type="text" id="appUrlInput" placeholder="https://...">'
+ '<div id="appUrlWarning" style="color:#667080;font-size:11px;margin-top:4px;display:none;">développeur inconnu, nous ne sommes pas responsables du contenu</div>'
+ '</div>'
+ '<div style="display:flex;gap:10px;margin-top:14px;">'
+ '<button id="appSauve" class="btn-ed primary" style="flex:1;">Ajouter</button>'
+ '<button id="appAnnule" class="btn-ed ghost" style="flex:1;">Annuler</button>'
+ '</div>';
modal.appendChild(contenu);
document.body.appendChild(modal);
modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
document.getElementById('appAnnule').onclick = function() { modal.remove(); };
var urlInput = document.getElementById('appUrlInput');
var warning = document.getElementById('appUrlWarning');
var btnSave = document.getElementById('appSauve');
urlInput.addEventListener('input', function() {
var val = urlInput.value.trim().toLowerCase();
if (!val) { warning.style.display = 'none'; return; }
var isTrusted = isVerified("", val);
warning.style.display = isTrusted ? 'none' : 'block';
});
btnSave.onclick = function() {
var val = urlInput.value.trim();
if (!val) return;
var baseUrl = val;
if (!baseUrl.endsWith('/')) {
if (baseUrl.endsWith('dat.txt')) baseUrl = baseUrl.substring(0, baseUrl.length - 7);
else baseUrl += '/';
}
var appData = { baseUrl: baseUrl, name: 'ping..', desc: '?', ver: '?', require: '', dev: '', img: '', verified: false, broken: true };
fetch(baseUrl + 'dat.txt').then(function(r) {
if (!r.ok) throw new Error();
return r.text();
}).then(function(text) {
var meta = parseDatTxt(text);
if (meta.require) {
appData = Object.assign(appData, meta);
appData.broken = false;
appData.verified = isVerified(meta.dev, baseUrl);
}
}).catch(function() {}).finally(function() {
var savedApps = JSON.parse(localStorage.getItem('ed_custom_apps') || '[]');
savedApps = savedApps.filter(function(a) { return a.baseUrl !== baseUrl; });
savedApps.push(appData);
localStorage.setItem('ed_custom_apps', JSON.stringify(savedApps));
modal.remove();
if (onglet === 'apps') apps();
});
};
}
function refreshBrokenApp(idx, btn) {
var savedApps = JSON.parse(localStorage.getItem('ed_custom_apps') || '[]');
var app = savedApps[idx];
if (!app) return;
btn.disabled = true;
btn.textContent = '...';
fetch(app.baseUrl + 'dat.txt').then(function(r) {
if (!r.ok) throw new Error();
return r.text();
}).then(function(text) {
var meta = parseDatTxt(text);
if (!meta.require) throw new Error('No require');
savedApps[idx] = Object.assign({}, app, meta);
savedApps[idx].broken = false;
savedApps[idx].verified = isVerified(meta.dev, app.baseUrl);
localStorage.setItem('ed_custom_apps', JSON.stringify(savedApps));
apps();
}).catch(function() {
btn.disabled = false;
btn.textContent = '↻';
alert('Toujours introuvable.');
});
}
function ouvrirApp(appData) {
if (appData.broken || !appData.require) {
alert("Cette app est introuvable. Utilisez le bouton ↻ pour réessayer.");
return;
}
var overlay = document.createElement('div');
overlay.id = 'ed-app-overlay';
overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#17191f;z-index:10000002;display:flex;flex-direction:column;';
var header = document.createElement('div');
header.style.cssText = 'height:50px;background:#1b1e25;display:flex;align-items:center;padding:0 16px;gap:12px;flex-shrink:0;border-bottom:1px solid rgba(255,255,255,0.08);';
var imgHtml = appData.img
? '<img src="' + appData.baseUrl + appData.img + '" style="width:28px;height:28px;border-radius:7px;object-fit:cover;background:#14161c;" onerror="this.outerHTML=\'<div style=\\\'width:28px;height:28px;border-radius:7px;background:#14161c;\\\'></div>\'">'
: '<div style="width:28px;height:28px;border-radius:7px;background:#14161c;"></div>';
header.innerHTML = '<button id="closeAppBtn" class="btn-ed ghost sm" style="width:36px;height:36px;border-radius:50%;padding:0;display:flex;align-items:center;justify-content:center;">←</button>'
+ imgHtml
+ '<div style="color:#e9ecf2;font-weight:600;font-size:16px;">' + (appData.name || 'App') + '</div>'
+ '<div style="color:#9aa3b1;font-size:12px;margin-left:8px;">par ' + (appData.dev || 'Inconnu') + (appData.verified ? ' <span style="color:#e8f1ff;" title="Développeur vérifié">✓</span>' : '') + '</div>';
var iframeContainer = document.createElement('div');
iframeContainer.style.cssText = 'flex:1;position:relative;background:#14161c;';
iframeContainer.innerHTML = '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#9aa3b1;">Chargement de l\'app...</div>';
overlay.appendChild(header);
overlay.appendChild(iframeContainer);
document.body.appendChild(overlay);
document.getElementById('closeAppBtn').onclick = function() { overlay.remove(); };
fetch(appData.baseUrl + appData.require).then(function(r) {
if (!r.ok) throw new Error('HTTP ' + r.status);
return r.text();
}).then(function(htmlText) {
iframeContainer.innerHTML = '';
var iframe = document.createElement('iframe');
iframe.style.cssText = 'width:100%;height:100%;border:none;background:#17191f;';
iframe.srcdoc = htmlText;
iframeContainer.appendChild(iframe);
}).catch(function(err) {
iframeContainer.innerHTML = '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#667080;text-align:center;">Erreur: ' + err.message + '<br><button onclick="this.closest(\'#ed-app-overlay\').remove()" class="btn-ed ghost" style="margin-top:16px;">Fermer</button></div>';
});
}
function appDataImg(app) { return app.baseUrl + app.img; }
function apps() {
var cont = document.getElementById('ed-content');
if (!cont) return;
cont.innerHTML = '';
var savedApps = JSON.parse(localStorage.getItem('ed_custom_apps') || '[]');
var html = '<div style="margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">';
html += '<h2 style="color:#e8f1ff;margin:0;">Applications</h2>';
html += '<button id="addAppBtn" class="btn-ed primary">+ Ajouter une app web</button>';
html += '</div>';
if (savedApps.length === 0) {
html += '<div class="empty-state"><p>Aucune application.<br>ajoute-en une</p></div>';
} else {
html += '<div class="subjects-grid">';
for (var i = 0; i < savedApps.length; i++) {
var app = savedApps[i];
var isBroken = app.broken || !app.require;
var devDisplay = app.dev || 'Inconnu';
var checkmark = app.verified ? '<span style="color:#e8f1ff;margin-left:4px;" title="Développeur vérifié">✓</span>' : '';
var imgHtml = app.img && !isBroken
? '<img src="' + appDataImg(app) + '" style="width:48px;height:48px;border-radius:8px;object-fit:cover;background:#14161c;margin-bottom:12px;">'
: '<div style="width:48px;height:48px;border-radius:8px;background:#14161c;margin-bottom:12px;"></div>';
var openBtnClass = isBroken ? 'btn-ed ghost' : 'btn-ed primary';
var openBtnText = isBroken ? 'Indispo' : 'Ouvrir';
var refreshBtn = isBroken ? '<button class="refresh-app-btn btn-ed ghost sm" data-idx="' + i + '">↻</button>' : '';
html += '<div class="subject-card" style="cursor:default;">';
html += imgHtml;
html += '<div class="subject-header"><div style="display:flex;align-items:center;gap:6px;"><span class="subject-name">' + (app.name || 'Sans nom') + '</span></div>';
html += '<span class="subject-average" style="color:#9aa3b1;font-size:14px;">v' + (app.ver || '?') + '</span></div>';
html += '<div style="color:#9aa3b1;font-size:12px;margin-bottom:12px;min-height:36px;">' + (app.desc || 'Aucune description') + '</div>';
html += '<div style="font-size:12px;color:#9aa3b1;margin-bottom:16px;">Par: <strong style="color:#e9ecf2;">' + devDisplay + '</strong>' + checkmark + '</div>';
html += '<div style="display:flex;gap:8px;">';
html += '<button class="open-app-btn ' + openBtnClass + '" data-idx="' + i + '" style="flex:1;"' + (isBroken ? ' disabled' : '') + '>' + openBtnText + '</button>';
html += refreshBtn;
html += '<button class="del-app-btn btn-ed danger sm" data-idx="' + i + '">✕</button>';
html += '</div></div>';
}
html += '</div>';
}
cont.innerHTML = html;
document.getElementById('addAppBtn').addEventListener('click', modalAjoutApp);
document.querySelectorAll('.open-app-btn').forEach(function(btn) {
btn.addEventListener('click', function() {
var idx = parseInt(this.getAttribute('data-idx'));
ouvrirApp(savedApps[idx]);
});
});
document.querySelectorAll('.refresh-app-btn').forEach(function(btn) {
btn.addEventListener('click', function() {
var idx = parseInt(this.getAttribute('data-idx'));
refreshBrokenApp(idx, this);
});
});
document.querySelectorAll('.del-app-btn').forEach(function(btn) {
btn.addEventListener('click', function() {
var idx = parseInt(this.getAttribute('data-idx'));
if (confirm("Supprimer l'app '" + (savedApps[idx].name || 'Sans nom') + "' ?")) {
savedApps.splice(idx, 1);
localStorage.setItem('ed_custom_apps', JSON.stringify(savedApps));
apps();
}
});
});
}
function param() {
var cont = document.getElementById('ed-content');
if (!cont) return;
var saveSur = localStorage.getItem('ed_notesSur') || '20';
var saveProf = localStorage.getItem('ed_showProfName') === 'true';
var saveRond = parseInt(localStorage.getItem('ed_roundness') || '8');
var saveAppsTab = localStorage.getItem('ed_showAppsTab') !== 'false';
var html = '<div class="light-wrap"><div class="set-app">';
html += '<div class="set-head"><h1>Parametres</h1><span class="set-tab">Visuel</span></div>';
html += '<div class="set-card"><div class="set-row"><div>';
html += '<div class="set-title">Afficher apps</div>';
html += '<div class="set-desc">Afficher l\'onglet application dans le menu</div>';
html += '</div><label class="set-switch"><input type="checkbox" id="appsTabToggle" ' + (saveAppsTab ? 'checked' : '') + '><span class="sl"></span></label></div></div>';
html += '<div class="set-card"><div class="set-row"><div>';
html += '<div class="set-title">Masquer les noms</div>';
html += '<div class="set-desc">Masque les noms des professeurs dans vie scolaire et messagerie (BETA)</div>';
html += '</div><label class="set-switch"><input type="checkbox" id="profToggle" ' + (saveProf ? 'checked' : '') + '><span class="sl"></span></label></div></div>';
html += '<div class="set-card">';
html += '<div class="set-row"><div class="set-title">Arrondi</div><span class="set-val" id="rondValLabel">' + saveRond + 'px</span></div>';
html += '<input type="range" id="rondSlider" class="set-range" min="0" max="50" value="' + saveRond + '">';
html += '</div>';
html += '<div class="set-card"><div class="set-row"><div>';
html += '<div class="set-title">Notes sur</div>';
html += '<div class="set-desc">note sur cette valeur</div>';
html += '</div><input type="number" id="notesSurInput" class="set-num" value="' + saveSur + '" step="1" min="0" max="20"></div></div>';
html += '<button id="confirmReset" class="set-confirm">suprimer les cookies</button>';
html += '</div></div>';
cont.innerHTML = html;
function appliquerParams() {
var inpSur = document.getElementById('notesSurInput');
var toggleProf = document.getElementById('profToggle');
var appsTab = document.getElementById('appsTabToggle');
if (inpSur) { localStorage.setItem('ed_notesSur', inpSur.value); sur = inpSur.value; }
if (toggleProf) { localStorage.setItem('ed_showProfName', toggleProf.checked); profNom = toggleProf.checked; }
if (appsTab) { localStorage.setItem('ed_showAppsTab', appsTab.checked); updateAppsVisibility(); }
if (onglet === 'notes') notes();
else if (onglet === 'accueil') accueil();
else if (onglet === 'carnet2') carnet2();
}
document.getElementById('appsTabToggle').addEventListener('change', appliquerParams);
document.getElementById('profToggle').addEventListener('change', appliquerParams);
document.getElementById('notesSurInput').addEventListener('change', appliquerParams);
var slRond = document.getElementById('rondSlider');
var lbRond = document.getElementById('rondValLabel');
if (slRond) slRond.addEventListener('input', function() {
lbRond.textContent = this.value + 'px';
appliquerRond(parseInt(this.value));
});
var btnConf = document.getElementById('confirmReset');
var arme = false, timerConf = null;
btnConf.addEventListener('click', function() {
if (!arme) {
arme = true;
btnConf.classList.add('armed');
btnConf.textContent = 'est tu sur? cette action est irreversible.';
timerConf = setTimeout(function() {
arme = false;
btnConf.classList.remove('armed');
btnConf.textContent = 'suprimer les cookies';
}, 3000);
} else {
clearTimeout(timerConf);
var keys = [];
for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.startsWith('ed_')) keys.push(k); }
keys.forEach(function(k) { localStorage.removeItem(k); });
sessionStorage.removeItem("credentials");
sessionStorage.removeItem("accounts");
location.reload();
}
});
}
async function rafraichirNotes() {
var fab = document.getElementById('refreshFab');
if (fab) { fab.style.opacity = '0.5'; fab.style.pointerEvents = 'none'; }
try {
var rep = await fetchTime(`https://api.ecoledirecte.com/v3/eleves/${id}/notes.awp?verbe=get&v=6.17.0`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Token": tok }, body: "data=" + encodeURIComponent(JSON.stringify({ anneeScolaire: "" })) }, 5000);
var json = await rep.json(), nouvData = json.data || {}, nouvNotes = nouvData.notes || [];
for (var t in tris) tris[t].matieres = {};
nouvNotes.forEach(function(n) {
var v = n.valeur, cp = n.codePeriode;
if (v && v !== "" && v !== "NE" && v !== "Abs" && tris[cp]) {
var nv = parseFloat(v.replace(',', '.'));
if (!isNaN(nv)) {
var ns = parseFloat(n.noteSur) || 20, vo = (nv / ns) * 20, sub = n.libelleMatiere, co = parseFloat(n.coef) || 1;
if (!tris[cp].matieres[sub]) tris[cp].matieres[sub] = { somme: 0, sommeCoef: 0, nb: 0 };
tris[cp].matieres[sub].somme += vo * co;
tris[cp].matieres[sub].sommeCoef += co;
tris[cp].matieres[sub].nb++;
}
}
});
for (var t in tris) { for (var m in tris[t].matieres) { var mat = tris[t].matieres[m]; mat.moy = mat.somme / mat.sommeCoef; } }
notesOrig = nouvNotes;
if (onglet === "notes") notes();
else if (onglet === "accueil") accueil();
majCountsSide();
if (fab) { fab.style.opacity = '1'; fab.style.pointerEvents = 'auto'; }
} catch (e) {
if (fab) { fab.style.opacity = '1'; fab.style.pointerEvents = 'auto'; }
alert("Erreur: " + e.message);
}
}
window.rafraichirNotes = rafraichirNotes;
var refreshFab = document.createElement('button');
refreshFab.id = 'refreshFab';
refreshFab.className = 'btn-ed primary';
refreshFab.style.cssText += 'position:fixed;bottom:24px;right:24px;width:48px;height:48px;border-radius:50%;font-size:20px;box-shadow:0 4px 12px rgba(232,241,255,0.2);z-index:100000;display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(0.8);transition:all 0.3s ease;pointer-events:none;padding:0;';
refreshFab.innerHTML = '↻';
refreshFab.onclick = function() { window.rafraichirNotes(); };
document.body.appendChild(refreshFab);
window.montrerRefresh = function(show) {
var fab = document.getElementById('refreshFab');
if (fab) {
if (show) { fab.style.opacity = '1'; fab.style.transform = 'scale(1)'; fab.style.pointerEvents = 'auto'; }
else { fab.style.opacity = '0'; fab.style.transform = 'scale(0.8)'; fab.style.pointerEvents = 'none'; }
}
};
function updateAppsVisibility() {
var show = localStorage.getItem('ed_showAppsTab') !== 'false';
document.querySelectorAll('.tab-btn[data-tab="apps"]').forEach(function(btn) {
btn.style.display = show ? 'flex' : 'none';
});
}
function afficherContenu() {
sauvegarderScroll();
if (onglet === "accueil") { accueil(); window.montrerRefresh(true); }
else if (onglet === "notes") { notes(); window.montrerRefresh(true); }
else if (onglet === "devoirs") { devoirs(); window.montrerRefresh(false); }
else if (onglet === "carnet2") { carnet2(); window.montrerRefresh(false); }
else if (onglet === "viescolaire") { vieScolaire(); window.montrerRefresh(false); }
else if (onglet === "messagerie") { messagerie(); window.montrerRefresh(false); }
else if (onglet === "apilog") { apiLog(); window.montrerRefresh(false); }
else if (onglet === "settings") { param(); window.montrerRefresh(false); }
else if (onglet === "edt") { edt(); window.montrerRefresh(false); }
else if (onglet === "apps") { apps(); window.montrerRefresh(false); }
restaurerScroll();
}
var iconeAccueil = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTUgMjF2LThhMSAxIDAgMCAwLTEtMWgtNGExIDEgMCAwIDAtMSAxdjgiLz48cGF0aCBkPSJNMyAxMGEyIDIgMCAwIDEgLjcwOS0xLjUyOGw3LTZhMiAyIDAgMCAxIDIuNTgyIDBsNyA2QTIgMiAwIDAgMSAyMSAxMHY5YTIgMiAwIDAgMS0yIDJINWEyIDIgMCAwIDEtMi0yeiIvPjwvc3ZnPg==';
var iconeNotes = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTEgNWgxMCIvPjxwYXRoIGQ9Ik0xMSAxMmgxMCIvPjxwYXRoIGQ9Ik0xMSAxOWgxMCIvPjxwYXRoIGQ9Ik00IDRoMXY1Ii8+PHBhdGggZD0iTTQgOWgyIi8+PHBhdGggZD0iTTYuNSAyMEgzLjRjMC0xIDIuNi0xLjkyNSAyLjYtMy41YTEuNSAxLjUgMCAwIDAtMi42LTEuMDIiLz48L3N2Zz4=';
var iconeDevoirs = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNNCA0LjV2LTVBMS41IDEuNSAwIDAgMSA2LjUgMkgxOWExIDEgMCAwIDEgMSAxdjE4YTEgMSAwIDAgMS0xIDFINi41YTEgMSAwIDAgMSAwLTVIMjAiLz48cGF0aCBkPSJNOCAxMWg4Ii8+PHBhdGggZD0iTTggN2g2Ii8+PC9zdmc+';
var iconeEdt = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTYgMTR2Mi4ybDEuNiAxIi8+PHBhdGggZD0iTTE2IDJ2NCIvPjxwYXRoIGQ9Ik0yMSA3LjVWNmEyIDIgMCAwIDAtMi0ySDVhMiAyIDAgMCAwLTIgMnYxNGEyIDIgMCAwIDAgMiAyaDMuNSIvPjxwYXRoIGQ9Ik0zIDEwaDUiLz48cGF0aCBkPSJNOCAydjQiLz48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSI2Ii8+PC9zdmc+';
var iconeCarnet2 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTUgMTNhMyAzIDAgMSAwLTYgMCIvPjxwYXRoIGQ9Ik00IDQuNXYtMTVBMi41IDIuNSAwIDAgMSA2LjUgMkgxOWExIDEgMCAwIDEgMSAxdjE4YTEgMSAwIDAgMS0xIDFINi41YTEgMSAwIDAgMSAwLTVIMjAiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjgiIHI9IjIiLz48L3N2Zz4=';
var iconeVie = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMiA2aDQiLz48cGF0aCBkPSJNMiAxMGg0Ii8+PHBhdGggZD0iTTIgMTRoNCIvPjxwYXRoIGQ9Ik0yIDE4aDQiLz48cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iMjAiIHg9IjQiIHk9IjIiIHJ4PSIyIi8+PHBhdGggZD0iTTE1IDJ2MjAiLz48cGF0aCBkPSJNMTUgN2g1Ii8+PHBhdGggZD0iTTE1IDEyaDUiLz48cGF0aCBkPSJNMTUgMTdoNSIvPjwvc3ZnPg==';
var iconeMessages = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJtMjIgNy04Ljk5MSA1LjcyN2EyIDIgMCAwIDEtMi4wMDkgMEwyIDciLz48cmVjdCB4PSIyIiB5PSI0IiB3aWR0aD0iMjAiIGhlaWdodD0iMTYiIHJ4PSIyIi8+PC9zdmc+';
var iconeParam = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI4IDI4IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNOS42NzEgNC4xMzZhMi4zNCAyLjM0IDAgMCAxIDQuNjU5IDAgMi4zNCAyLjM0IDAgMCAwIDMuMzE5IDEuOTE1IDIuMzQgMi4zNCAwIDAgMSAyLjMzIDQuMDMzIDIuMzQgMi4zNCAwIDAgMCAwIDMuODMxIDIuMzQgMi4zNCAwIDAgMS0yLjM0IDQuMDMzdi0yLjM0IDIuMzQgMCAwIDAtMy4zMTkgMS45MTUgMi4zNCAyLjM0IDAgMCAxLTQuNjU5IDAgMi4zNCAyLjM0IDAgMCAwLTMuMzItMS45MTUgMi4zNCAyLjM0IDAgMCAxLTIuMzMtNC4wMzMgMi4zNCAyLjM0IDAgMCAwIDAtMy44MzFBMi4zNCAyLjM0IDAgMCAxIDYuMzUgNi4wNTFhMi4zNCAyLjM0IDAgMCAwIDMuMzE5LTEuOTE1Ii8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIvPjwvc3ZnPg==';
var iconeApps = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iNyIgaGVpZ2h0PSI3IiByeD0iMSIvPjxyZWN0IHg9IjE0IiB5PSIzIiB3aWR0aD0iNyIgaGVpZ2h0PSI3IiByeD0iMSIvPjxyZWN0IHg9IjMiIHk9IjE0IiB3aWR0aD0iNyIgaGVpZ2h0PSI3IiByeD0iMSIvPjxyZWN0IHg9IjE0IiB5PSIxNCIgd2lkdGg9IjciIGhlaWdodD0iNyIgcng9IjEiLz48L3N2Zz4=';
widget.innerHTML = `
<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: 'Space Grotesk', system-ui, sans-serif; }
#ed-widget { background-color:#17191f; color:#e9ecf2; font-family: 'Space Grotesk', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
.m-container { padding:24px 28px; margin-left:260px; transition:margin-left 0.3s cubic-bezier(.15,.83,.66,1); position:relative; z-index:1; }
#ed-side-nav { position:fixed; left:0; top:0; bottom:0; width:260px; background:#fff; display:flex; flex-direction:column; z-index:260; overflow:hidden; border-right:1px solid #edeff4; transition:width 0.3s cubic-bezier(.15,.83,.66,1), transform 0.32s cubic-bezier(.15,.83,.66,1); }
.side-head { display:flex; align-items:center; justify-content:space-between; padding:14px 12px; gap:8px; }
.logo-text { color:#0f172a; font-weight:700; font-size:15px; padding-left:6px; white-space:nowrap; display:flex; align-items:center; gap:8px; font-family:'Inter',system-ui,sans-serif; }
.logo-dot { width:10px; height:10px; border-radius:3px; background:linear-gradient(135deg,#5b8cff,#1a56ff); flex-shrink:0; }
.side-toggle { width:36px; height:36px; border-radius:50%; background:#f2f4f8; border:1px solid #edeff4; color:#8a94a6; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:background 0.2s; padding:0; }
.side-toggle:hover { background:#e8ebf1; }
#ed-side-nav .tab-bar { flex-direction:column; align-items:stretch; background:transparent !important; margin:0; padding:8px; gap:2px; border:none !important; border-radius:0 !important; flex:1; overflow-y:auto; display:flex; }
#ed-side-nav .tab-btn { justify-content:flex-start; color:#3f4757; font-size:13.5px; font-weight:500; padding:10px 12px; border-radius:10px; border:none; background:transparent; width:100%; display:flex; align-items:center; gap:11px; cursor:pointer; transition:background 0.2s; white-space:nowrap; font-family:'Inter',system-ui,sans-serif; }
#ed-side-nav .tab-btn:hover { background:#f5f7fb; }
#ed-side-nav .tab-btn.active { background:#eef3ff; color:#1a56ff; font-weight:600; }
#ed-side-nav .tab-btn img { filter:brightness(0); opacity:0.5; flex-shrink:0; }
#ed-side-nav .tab-btn.active img { opacity:1; }
.btn-label { white-space:nowrap; overflow:hidden; }
.side-count { margin-left:auto; font-size:10.5px; font-weight:500; color:#8a94a6; }
#ed-side-nav .tab-btn.active .side-count { color:#1a56ff; }
.side-user { display:flex; align-items:center; gap:10px; padding:14px 12px; border-top:1px solid #edeff4; cursor:pointer; transition:background 0.2s; }
.side-user:hover { background:#f5f7fb; }
.side-avatar { width:34px; height:34px; border-radius:50%; background:#eef3ff; border:1px solid #d5e1ff; color:#1a56ff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; flex-shrink:0; margin-left:6px; }
.side-user-name { color:#0f172a; font-size:14px; font-weight:600; white-space:nowrap; overflow:hidden; }
#ed-menu-fab { position:fixed; top:14px; left:14px; width:44px; height:44px; border-radius:50%; background:rgba(255,255,255,0.92); border:1px solid #edeff4; display:none; align-items:center; justify-content:center; cursor:pointer; z-index:300; color:#0f172a; padding:0; }
#ed-side-overlay { position:fixed; inset:0; background:rgba(10,12,16,0.6); backdrop-filter:blur(4px); z-index:250; opacity:0; pointer-events:none; transition:opacity 0.3s ease; }
#ed-side-overlay.active { opacity:1; pointer-events:auto; }
@media(min-width:769px){
#ed-menu-fab { display:none !important; }
#ed-side-overlay { display:none; }
#ed-side-nav { transform:none !important; }
#ed-widget.nav-collapsed #ed-side-nav { width:64px; }
#ed-widget.nav-collapsed .m-container { margin-left:64px; }
#ed-widget.nav-collapsed .logo-text, #ed-widget.nav-collapsed .btn-label, #ed-widget.nav-collapsed .side-user-name, #ed-widget.nav-collapsed .side-count { display:none; }
#ed-widget.nav-collapsed .side-head { justify-content:center; padding:14px 0; }
#ed-widget.nav-collapsed .tab-btn { justify-content:center; padding:11px 0; }
#ed-widget.nav-collapsed .side-user { justify-content:center; }
#ed-widget.nav-collapsed .side-avatar { margin:0; }
}
#ed-widget .mi{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
#ed-widget .mi.sm{width:12px;height:12px}
.light-wrap{margin:-24px -28px;min-height:calc(100vh - 48px);padding:24px 28px;background:linear-gradient(180deg,#e9ecf1 0%,#ccd2db 100%);font-family:'Inter',system-ui,sans-serif;color:#0f172a;}
@media(max-width:768px){.light-wrap{margin:-70px -14px -14px;padding:70px 14px 14px;}}
.set-app{max-width:720px;margin:0 auto;font-family:'Inter',system-ui,sans-serif;color:#0f172a;}
.set-head{display:flex;align-items:center;gap:12px;margin-bottom:26px;flex-wrap:wrap;}
.set-head h1{font-size:30px;font-weight:700;letter-spacing:-0.02em;color:#0f172a;}
.set-tab{padding:5px 13px;border-radius:999px;background:#eef3ff;color:#1a56ff;font-size:12px;font-weight:600;}
.set-card{background:#fff;border:1px solid #edeff4;border-radius:16px;padding:20px 22px;margin-bottom:14px;box-shadow:0 2px 8px rgba(15,23,42,0.05);}
.set-row{display:flex;justify-content:space-between;align-items:center;gap:20px;}
.set-title{font-size:15px;font-weight:600;color:#0f172a;}
.set-desc{font-size:12.5px;color:#8a94a6;margin-top:4px;line-height:1.5;max-width:440px;}
.set-switch{position:relative;display:inline-block;width:46px;height:26px;flex-shrink:0;}
.set-switch input{opacity:0;width:0;height:0;}
.set-switch .sl{position:absolute;cursor:pointer;inset:0;background:#e2e6ee;border-radius:999px;transition:.25s;}
.set-switch .sl:before{content:"";position:absolute;height:20px;width:20px;left:3px;top:3px;background:#fff;border-radius:50%;transition:.25s;box-shadow:0 1px 3px rgba(15,23,42,.25);}
.set-switch input:checked + .sl{background:#1a56ff;}
.set-switch input:checked + .sl:before{transform:translateX(20px);}
.set-range{width:100%;accent-color:#1a56ff;margin-top:16px;cursor:pointer;}
.set-val{color:#1a56ff;font-weight:700;font-size:13px;}
.set-num{width:110px;padding:10px 12px;border:1px solid #edeff4;border-radius:10px;font:inherit;font-size:14px;color:#0f172a;background:#f8fafc;outline:none;transition:.2s;}
.set-num:focus{border-color:#1a56ff;background:#fff;box-shadow:0 0 0 3px rgba(26,86,255,.12);}
.set-confirm{width:100%;margin-top:22px;padding:15px;border:none;border-radius:14px;background:#0f172a;color:#fff;font:600 14px 'Inter',system-ui,sans-serif;cursor:pointer;transition:.25s;}
.set-confirm:hover{background:#1e293b;}
.set-confirm.armed{background:#f43f5e;}
.hui-hero{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;background:#fff;padding:24px;box-shadow:0 10px 30px rgba(15,23,42,.08);margin-bottom:16px;border-radius:20px;}
.hui-eyebrow{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#8a94a6;font-weight:700;margin-bottom:6px;}
.hui-title{font-size:28px;font-weight:700;letter-spacing:-.02em;color:#0f172a;}
.hui-msg{color:#8a94a6;font-size:13px;margin-top:10px;}
.hui-stats{width:280px;background:#f8fafc;border:1px solid #edeff4;padding:18px;display:grid;gap:12px;border-radius:16px;}
.hui-stat span{font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;color:#8a94a6;font-weight:700;}
.hui-stat strong{display:block;font-size:26px;color:#1a56ff;font-weight:700;}
.hui-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;}
.hui-card{background:#fff;padding:20px;box-shadow:0 10px 30px rgba(15,23,42,.08);border-radius:16px;}
.hui-cardtitle{font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8a94a6;margin-bottom:12px;}
.hui-row{display:flex;justify-content:space-between;font-size:13px;color:#3f4757;margin-bottom:10px;}
.hui-row strong{color:#0f172a;}
.mui-app{display:flex;width:100%;height:calc(100vh - 96px);min-height:540px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 30px 60px rgba(15,23,42,.18);}
.mui-side{width:225px;flex-shrink:0;border-right:1px solid #edeff4;padding:18px 12px;display:flex;flex-direction:column;gap:14px;overflow-y:auto;}
.mui-nav{display:flex;flex-direction:column;gap:2px;}
.mui-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:9px;font-size:13px;color:#3f4757;cursor:pointer;transition:.15s;background:none;border:none;width:100%;text-align:left;font-family:inherit;}
.mui-item:hover{background:#f5f7fb;}
.mui-item.active{background:#eef3ff;color:#1a56ff;font-weight:600;}
.mui-item .mi{color:#8a94a6;}
.mui-item.active .mi{color:#1a56ff;}
.mui-count{margin-left:auto;font-size:10.5px;font-weight:500;color:#8a94a6;font-style:normal;}
.mui-tagshead{display:flex;align-items:center;justify-content:space-between;padding:0 10px;margin-bottom:4px;}
.mui-tagshead span{font-size:10.5px;font-weight:700;letter-spacing:.09em;color:#8a94a6;}
.mui-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;display:inline-block;}
.mui-list{width:330px;flex-shrink:0;border-right:1px solid #edeff4;display:flex;flex-direction:column;}
.mui-listhead{padding:18px 16px 12px;}
.mui-listcount{font-size:11px;color:#8a94a6;margin-bottom:10px;}
.mui-searchrow{display:flex;gap:8px;}
.mui-search{flex:1;display:flex;align-items:center;gap:8px;height:38px;padding:0 12px;border-radius:10px;background:#f2f4f8;color:#8a94a6;}
.mui-search input{flex:1;border:none;outline:none;background:transparent;font:inherit;font-size:12px;color:#0f172a;}
.mui-chipfilter{display:inline-flex;align-items:center;gap:7px;margin-top:10px;padding:6px 11px;border:1px solid #edeff4;border-radius:8px;font-size:11px;color:#3f4757;background:#fff;cursor:pointer;font-family:inherit;}
.mui-maillist{flex:1;overflow-y:auto;border-top:1px solid #edeff4;}
.mui-mail{padding:13px 14px;border-bottom:1px solid #f2f4f8;cursor:pointer;position:relative;}
.mui-mail:hover{background:#f8fafc;}
.mui-mail.selected{background:#eef3ff;}
.mui-mail.selected::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:#1a56ff;}
.mui-row1{display:flex;align-items:center;gap:8px;}
.mui-row1 h4{flex:1;font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#0f172a;}
.mui-row1 time{font-size:10px;color:#8a94a6;}
.mui-sub{display:flex;align-items:center;gap:6px;margin-top:5px;}
.mui-sender{font-size:11.5px;color:#3f4757;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mui-addtag{width:22px;height:22px;border-radius:6px;display:grid;place-items:center;color:#8a94a6;background:none;border:none;cursor:pointer;}
.mui-addtag:hover{background:#eef3ff;color:#1a56ff;}
.mui-preview{margin-top:5px;font-size:10.5px;line-height:1.55;color:#8a94a6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.mui-chips{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;align-items:center;}
.mui-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border:1px solid #edeff4;border-radius:8px;background:#fff;font-size:9.5px;color:#8a94a6;}
.mui-tagchip{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border-radius:999px;font-size:9.5px;color:#3f4757;background:#f2f4f8;}
.mui-reader{flex:1;min-width:0;display:flex;flex-direction:column;}
.mui-readertop{display:flex;align-items:center;justify-content:center;padding:12px 20px;border-bottom:1px solid #edeff4;position:relative;min-height:57px;}
.mui-eyebtn{position:relative;width:32px;height:32px;border-radius:9px;display:grid;place-items:center;color:#8a94a6;cursor:pointer;background:none;border:none;}
.mui-eyebtn:hover{background:#f2f4f8;color:#0f172a;}
.mui-eyebtn.on{color:#1a56ff;}
.mui-readerscroll{flex:1;overflow-y:auto;padding:24px 30px;}
.mui-msghead{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.mui-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:600;font-size:12px;flex-shrink:0;}
.mui-who{min-width:0;}
.mui-who strong{font-size:13.5px;display:block;color:#0f172a;}
.mui-who span{font-size:10.5px;color:#8a94a6;display:block;margin-top:2px;}
.mui-meta{margin-left:auto;display:flex;align-items:center;gap:4px;color:#8a94a6;}
.mui-meta time{font-size:10px;margin-right:8px;white-space:nowrap;}
.mui-star.on{color:#f2a516;}
.mui-star.on .mi{fill:currentColor;}
.mui-subject{font-size:17px;font-weight:700;margin:20px 0 16px;color:#0f172a;}
.mui-body p, .mui-body div{font-size:12.5px;line-height:1.75;color:#3f4757;margin-bottom:12px;}
.mui-attachhead{display:flex;align-items:center;justify-content:space-between;margin-top:22px;padding-top:16px;border-top:1px solid #edeff4;}
.mui-attachhead h5{font-size:10.5px;font-weight:700;letter-spacing:.08em;color:#8a94a6;}
.mui-attachgrid{display:flex;gap:12px;margin-top:12px;flex-wrap:wrap;}
.mui-attach{display:flex;align-items:center;gap:10px;min-width:170px;padding:10px 14px;border:1px solid #edeff4;border-radius:12px;cursor:pointer;background:#fff;font-family:inherit;text-align:left;}
.mui-attach:hover{border-color:#c9d4ff;box-shadow:0 6px 14px rgba(15,23,42,.06);}
.mui-fileic{width:34px;height:34px;border-radius:9px;background:#f2f4f8;display:grid;place-items:center;color:#8a94a6;}
.mui-attach strong{font-size:11.5px;display:block;color:#0f172a;}
.mui-attach span{font-size:9.5px;color:#8a94a6;}
.mui-empty{min-height:200px;height:100%;display:flex;align-items:center;justify-content:center;color:#8a94a6;font-size:12px;}
@media(max-width:1000px){.mui-side{display:none}}
@media(max-width:700px){.mui-list{width:100%}.mui-reader{display:none}}
.selector-container { margin-bottom:20px; }
.trimester-selector { background:#1b1e25; border-radius:14px; padding:6px; display:flex; gap:6px; border:1px solid rgba(255,255,255,0.08); }
.trimester-option { flex:1; padding:12px; text-align:center; font-size:13px; font-weight:500; color:#9aa3b1; background:transparent; border:none; border-radius:7px; cursor:pointer; transition: all 0.25s cubic-bezier(.15,.83,.66,1); }
.trimester-option.active { background:rgba(255,255,255,0.05); color:#e8f1ff; border:1px solid rgba(255,255,255,0.16); }
.stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px; margin-bottom:24px; }
.stat-card { background:#1b1e25; border-radius:14px; padding:16px; text-align:center; border:1px solid rgba(255,255,255,0.08); }
.stat-label { font-size:11px; color:#667080; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.1em; font-family: 'JetBrains Mono', monospace; }
.stat-value { font-size:40px; font-weight:700; color:#e8f1ff; }
.stat-sub { font-size:11px; color:#9aa3b1; margin-top:6px; }
.subjects-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:12px; margin-bottom:24px; }
.subject-card { background:#1b1e25; border-radius:14px; padding:16px; cursor:pointer; transition:border-color 0.25s cubic-bezier(.15,.83,.66,1); border:1px solid rgba(255,255,255,0.08); }
.subject-card:hover { border-color:rgba(255,255,255,0.16); }
.subject-header { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.08); }
.subject-name { font-size:15px; font-weight:600; color:#e9ecf2; }
.subject-average { font-size:24px; font-weight:700; color:#e8f1ff; }
.subject-stats { display:flex; justify-content:space-between; color:#9aa3b1; font-size:12px; }
.grade-indicator { width:7px; height:7px; border-radius:50%; display:inline-block; margin-right:5px; background:#e8f1ff; }
.annual-card { background:#1b1e25; border-radius:14px; padding:24px; text-align:center; border:1px solid rgba(232,241,255,0.2); margin-top:8px; }
.annual-label { font-size:11px; color:#667080; margin-bottom:10px; text-transform:uppercase; letter-spacing:0.1em; font-family: 'JetBrains Mono', monospace; }
.annual-value { font-size:48px; font-weight:800; color:#e8f1ff; }
.annual-note-count { font-size:12px; color:#9aa3b1; margin-top:10px; }
.home-hero { display:flex; flex-direction:row; background:#1b1e25; padding:24px; border-radius:14px; margin-bottom:20px; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:16px; border:1px solid rgba(255,255,255,0.08); }
.hero-copy { max-width:480px; }
.eyebrow { font-size:10.5px; letter-spacing:0.14em; text-transform:uppercase; color:#667080; margin-bottom:6px; font-family: 'JetBrains Mono', monospace; }
.title-container { display:flex; align-items:baseline; gap:8px; margin-bottom:10px; }
.home-hero h1 { font-size:30px; color:#e9ecf2; margin:0; font-weight:700; letter-spacing:-0.02em; }
.dash-animated { display:inline-block; font-size:1.8em; color:#e8f1ff; }
.hero-card { max-width:300px; width:300px; background:#14161c; border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:20px; display:grid; gap:14px; height:fit-content; flex-shrink:0; }
.hero-stats { display:flex; flex-direction:column; color:#e9ecf2; gap:6px; }
.hero-stats span { color:#667080; font-size:10.5px; text-transform:uppercase; letter-spacing:0.1em; font-family: 'JetBrains Mono', monospace; }
.hero-stats strong { font-size:28px; color:#e8f1ff; }
.home-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px; margin-bottom:20px; }
.home-card { background:#1b1e25; border-radius:14px; padding:18px; border:1px solid rgba(255,255,255,0.08); }
.card-title { color:#667080; font-size:10.5px; margin-bottom:12px; text-transform:uppercase; letter-spacing:0.14em; font-family: 'JetBrains Mono', monospace; }
.home-subject { display:flex; justify-content:space-between; margin-bottom:10px; color:#e9ecf2; font-size:14px; }
.task-card { background:#1b1e25; border-radius:14px; padding:14px; margin-bottom:10px; border:1px solid rgba(255,255,255,0.08); }
.task-meta { display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:8px; }
.task-meta span { color:#9aa3b1; font-size:11px; }
.task-content { color:#e9ecf2; font-size:13px; line-height:1.6; margin-top:8px; white-space:pre-line; }
.task-badge { font-size:10px; text-transform:uppercase; padding:3px 7px; border-radius:999px; background:rgba(232,241,255,0.1); color:#e8f1ff; border:1px solid rgba(255,255,255,0.08); letter-spacing:0.05em; }
.empty-state { text-align:center; padding:48px 20px; background:#1b1e25; border-radius:14px; border:1px solid rgba(255,255,255,0.08); }
.empty-state p { color:#9aa3b1; font-size:15px; }
.date-pill { background:#1b1e25; border-radius:14px; padding:12px 16px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; border:1px solid rgba(255,255,255,0.08); transition: all 0.25s; }
.date-pill:hover { border-color:rgba(255,255,255,0.16); background:#20242c; }
.carnet2-card { background:#1b1e25; border-radius:14px; padding:16px; margin-bottom:12px; border:1px solid rgba(255,255,255,0.08); transition: all 0.25s; }
.carnet2-card:hover { border-color:rgba(255,255,255,0.16); background:#20242c; }
.profile-overlay { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(10,12,16,0.62); backdrop-filter:blur(8px); z-index:100000; opacity:0; pointer-events:none; transition:opacity 0.2s ease; }
.profile-overlay.active { opacity:1; pointer-events:auto; }
.profile-dropdown { position:fixed; top:50% !important; left:50% !important; transform:translate(-50%,-44%) !important; width:300px; background:#1b1e25; border-radius:14px; padding:24px; z-index:100001; opacity:0; pointer-events:none; transition:opacity 0.22s ease,transform 0.22s ease; border:1px solid rgba(255,255,255,0.16); box-shadow:0 24px 60px rgba(0,0,0,0.6); }
.profile-dropdown.active { transform:translate(-50%,-50%) !important; opacity:1; pointer-events:auto; }
.profile-pic { width:56px; height:56px; border-radius:50%; background:#20242c; border:1px solid rgba(255,255,255,0.16); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:22px; color:#e8f1ff; }
.profile-signout { width:100%; padding:12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.16); border-radius:7px; color:#e9ecf2; font-size:14px; font-weight:600; cursor:pointer; margin-top:14px; transition: all 0.25s; }
.profile-signout:hover { background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.3); }
.notes-table-ed { border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,0.08); }
.notes-table-ed thead tr { background:#20242c; }
.notes-table-ed tbody tr { background:#1b1e25; border-bottom:1px solid rgba(255,255,255,0.08); }
.notes-table-ed tbody tr:hover { background:#20242c; }
.notes-table-ed th { color:#e8f1ff !important; font-family: 'JetBrains Mono', monospace; font-size:11px; text-transform:uppercase; letter-spacing:0.1em; }
.notes-table-ed td { color:#e9ecf2 !important; }
.settings-container label { color:#e9ecf2; }
.settings-container strong { color:#e9ecf2; }
.settings-container input[type="number"], .settings-container input[type="text"], .settings-container select { width:100%; color:#e9ecf2; font:400 13px 'Space Grotesk', sans-serif; background:#14161c; border:1px solid rgba(255,255,255,0.08); border-radius:7px; padding:10px 12px; transition:all 0.25s; appearance:none; }
.settings-container input:hover, .settings-container select:hover { border-color:rgba(255,255,255,0.16); }
.settings-container input:focus, .settings-container select:focus { outline:none; border-color:rgba(255,255,255,0.28); box-shadow:0 0 0 1px rgba(232,241,255,0.55),0 0 18px rgba(210,228,255,0.15); }
.settings-container input[type="range"] { accent-color:#e8f1ff; }
.check{display:flex;align-items:center;gap:8px;font-size:13px;color:#9aa3b1;cursor:pointer;position:relative; margin-bottom:12px;}
.check input{position:absolute;opacity:0}
.check .box{width:16px;height:16px;border-radius:4px;border:1px solid rgba(255,255,255,0.16);background:#14161c;display:grid;place-items:center;color:#e8f1ff;transition:all .25s cubic-bezier(.15,.83,.66,1)}
.check .box svg{opacity:0;transform:scale(.4);transition:all .25s cubic-bezier(.15,.83,.66,1)}
.check input:checked ~ .box{background:#20242c;border-color:rgba(255,255,255,0.3);box-shadow:0 0 10px rgba(210,228,255,0.12)}
.check input:checked ~ .box svg{opacity:1;transform:scale(1)}
.check:hover{color:#e9ecf2}
.btn-ed { position:relative; display:inline-flex; align-items:center; gap:8px; cursor:pointer; font:500 13px/1 'Space Grotesk', sans-serif; color:#e9ecf2; padding:11px 16px; border-radius:7px; border:1px solid rgba(255,255,255,0.16); background:rgba(255,255,255,0.02); transition:border-color 0.25s, background 0.25s; }
.btn-ed:hover { border-color:rgba(255,255,255,0.3); background:rgba(255,255,255,0.05); }
.btn-ed.primary { background:radial-gradient(120% 110% at 50% 100%,rgba(210,225,255,.16),transparent 55%) #171a20; color:#e8f1ff; }
.btn-ed.ghost { background:rgba(255,255,255,0.02); border-color:rgba(255,255,255,0.08); }
.btn-ed.sm { padding:8px 12px; font-size:12px; }
.btn-ed.danger { color:#e9ecf2; border-color:rgba(255,255,255,0.16); }
.message-item { background:#1b1e25; border-radius:14px; padding:14px; margin-bottom:10px; cursor:pointer; border:1px solid rgba(255,255,255,0.08); transition:all 0.25s; }
.message-item:hover { border-color:rgba(255,255,255,0.16); background:#20242c; }
.dash-stats{background:#fff;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:28px 16px;display:grid;grid-template-columns:repeat(4,1fr);margin-bottom:24px;border:1px solid rgba(0,0,0,0.06);}
.dash-stat{padding:0 20px;}
.dash-stat+.dash-stat{border-left:1px solid rgba(0,0,0,0.06);}
.dash-stat .dash-label{font-size:12px;font-weight:500;color:#666;}
.dash-stat .dash-num{font-size:32px;font-weight:700;margin:10px 0 8px;color:#1a1a1a;}
.dash-stat .dash-delta{font-size:12px;color:#888;}
.dash-up{color:#35c24e;font-weight:600;}
.dash-down{color:#f43f5e;font-weight:600;}
.dash-row{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.dash-card{background:#fff;border-radius:16px;padding:24px;border:1px solid rgba(0,0,0,0.06);box-shadow:0 2px 8px rgba(0,0,0,.06);}
.dash-card-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
.dash-card-head h2{font-size:17px;font-weight:600;color:#1a1a1a;}
.dash-card-head .dash-text{color:#999;font-size:12px;}
.dash-donut-wrap{position:relative;display:flex;justify-content:center;margin:20px 0 24px;}
.dash-legend{list-style:none;padding:0;}
.dash-legend li{display:flex;align-items:center;font-size:13px;color:#555;margin:10px 0;}
.dash-legend .dash-dot{width:10px;height:10px;border-radius:50%;margin-right:10px;display:inline-block;flex-shrink:0;}
.dash-legend b{margin-left:auto;color:#1a1a1a;font-size:14px;font-weight:600;}
@media(max-width:768px){
.dash-stats{grid-template-columns:1fr 1fr;row-gap:20px;}
.dash-row{grid-template-columns:1fr;}
}
@media(max-width:768px){
.m-container { margin-left:0 !important; padding:70px 14px 14px; }
#ed-menu-fab { display:flex; }
#ed-widget.nav-open #ed-menu-fab { display:none; }
#ed-side-nav { width:280px; transform:translateX(-100%); }
#ed-side-nav.open { transform:translateX(0); }
.subjects-grid{grid-template-columns:1fr;}
.stat-value{font-size:32px;}
.annual-value{font-size:40px;}
}
.cdt-wrap{margin:-24px -28px;padding:24px 28px;min-height:calc(100vh - 48px);background:linear-gradient(120deg,#fdf9f2 0%,#faeadb 55%,#f8e1cb 100%);color:var(--navy,#1f3a52);font-family:'Inter',sans-serif;}
@media(max-width:768px){.cdt-wrap{margin:-70px -14px -14px;padding:70px 14px 14px;}}
.cdt-wrap *{box-sizing:border-box;}
.cdt-welcome{display:flex;justify-content:space-between;align-items:flex-end;margin:26px 0 34px;flex-wrap:wrap;gap:24px;}
.cdt-welcome h1{font-size:32px;font-weight:600;color:#21384d;}
.cdt-welcome p{margin-top:10px;font-size:18px;color:#33475b;}
.cdt-stats{display:flex;gap:48px;}
.cdt-stat{text-align:center;}
.cdt-row{display:flex;align-items:center;gap:10px;justify-content:center;color:#31485d;}
.cdt-num{font-size:46px;font-weight:600;color:#21384d;line-height:1;}
.cdt-lbl{font-size:12px;color:#4d6072;margin-top:6px;}
.cdt-card{background:rgba(255,253,248,.55);border:1px solid rgba(255,255,255,.65);border-radius:18px;padding:24px;box-shadow:0 10px 28px rgba(180,120,60,.08);}
.cdt-card h2{font-size:20px;font-weight:600;color:#21384d;}
.cdt-grid-mid{display:grid;grid-template-columns:1.35fr .82fr 1fr;gap:24px;margin-bottom:24px;}
.cdt-grid-bot{display:grid;grid-template-columns:2.05fr 1fr;gap:24px;}
.cdt-card-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
.cdt-module{font-size:13px;color:#5c6c7c;margin:6px 0 18px;}
.cdt-track{height:8px;background:#e9ddcc;border-radius:99px;overflow:hidden;}
.cdt-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#d8801f,#e8a33c);}
.cdt-pct{font-size:11px;color:#5c6c7c;margin:8px 0 6px;}
.cdt-chart{width:100%;height:auto;display:block;}
.cdt-att-sub{font-size:13px;color:#33475b;margin:4px 0 18px;}
.cdt-cal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding:0 6px;}
.cdt-cal-head span{font-size:14px;font-weight:600;color:#21384d;}
.cdt-cal-head button{background:none;border:none;cursor:pointer;color:#21384d;display:flex;padding:4px;}
.cdt-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);row-gap:10px;text-align:center;}
.cdt-dow{font-size:11px;font-weight:600;color:#d9962b;}
.cdt-day{font-size:13px;color:#31485d;width:32px;height:32px;display:flex;align-items:center;justify-content:center;margin:0 auto;border-radius:50%;cursor:pointer;transition:.2s;}
.cdt-day.dim{color:#9aa7b4;cursor:default;}
.cdt-day.att{color:#dd8f2d;font-weight:600;}
.cdt-day.today{background:#dd8f2d;color:#fff;font-weight:600;}
.cdt-day.selected{background:#1f3a52;color:#fff;font-weight:600;}
.cdt-day:not(.dim):hover{background:rgba(221,143,45,.2);}
.cdt-sched-item{display:flex;gap:14px;background:rgba(255,255,255,.45);border-radius:14px;padding:16px;margin-bottom:14px;align-items:center;}
.cdt-sched-item:last-child{margin-bottom:0;}
.cdt-date-blk{text-align:center;min-width:34px;}
.cdt-date-blk b{display:block;font-size:17px;color:#21384d;}
.cdt-date-blk i{font-style:normal;font-size:11px;color:#7d8b99;}
.cdt-sched-mid{flex:1;}
.cdt-sched-mid h3{font-size:14px;font-weight:500;color:#21384d;line-height:1.45;}
.cdt-times{text-align:right;font-size:12px;color:#33475b;line-height:1.7;white-space:nowrap;margin-right:10px;}
.cdt-mark-btn{background:#f0e0cb;border:1px solid #f0e0cb;border-radius:8px;font-size:11px;font-weight:500;color:#21384d;cursor:pointer;padding:6px 12px;transition:.2s;font-family:inherit;}
.cdt-mark-btn:hover{background:#e9d5bb;}
.cdt-btn-sm{font-size:11px;padding:6px 12px;}
.cdt-inst-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px;}
.cdt-inst{background:rgba(255,255,255,.4);border-radius:14px;padding:18px 14px;}
.cdt-inst-top{display:flex;align-items:center;gap:10px;margin-bottom:16px;}
.cdt-inst-top b{display:block;font-size:14px;font-weight:600;color:#21384d;line-height:1.3;}
.cdt-inst-top small{font-size:11px;color:#7d8b99;}
.cdt-btn{display:block;width:100%;padding:9px 0;border-radius:8px;font-size:12px;font-weight:500;color:#21384d;cursor:pointer;margin-bottom:10px;transition:.2s;text-align:center;font-family:inherit;}
.cdt-btn:last-child{margin-bottom:0;}
.cdt-btn.solid{background:#f0e0cb;border:1px solid #f0e0cb;}
.cdt-btn.solid:hover{background:#e9d5bb;}
.cdt-btn.outline{background:transparent;border:1px solid #d9c7ae;}
.cdt-btn.outline:hover{background:rgba(217,199,174,.25);}
.cdt-empty{text-align:center;padding:24px 10px;color:#5c6c7c;font-size:13px;}
@media(max-width:1080px){.cdt-grid-mid,.cdt-grid-bot{grid-template-columns:1fr;}.cdt-inst-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:560px){.cdt-inst-grid{grid-template-columns:1fr;}.cdt-stats{gap:28px;flex-wrap:wrap;justify-content:center;}}
</style>
<div class="profile-overlay" id="profileOverlay"></div>
<div class="profile-dropdown" id="profileDropdown">
<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.08);">
<div class="profile-pic">${pren.charAt(0)}${nom.charAt(0)}</div>
<div><div style="color:#e9ecf2;font-size:18px;font-weight:700;">${pren} ${nom}</div><div style="color:#9aa3b1;font-size:13px;margin-top:2px;">${clasTxt}</div></div>
</div>
<button class="profile-signout" id="profileSignout">Se deconnecter</button>
</div>
<div id="ed-side-overlay"></div>
<button id="ed-menu-fab" aria-label="Ouvrir le menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9h16"></path><path d="M4 15h10"></path></svg></button>
<div id="ed-side-nav">
<div class="side-head">
<span class="logo-text"><span class="logo-dot"></span>EcoleDirecte</span>
<button id="side-toggle" class="side-toggle" aria-label="Ouvrir/fermer le menu"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"></rect><path d="M9.5 4v16"></path></svg></button>
</div>
<div class="tab-bar side-tab-bar">
<button class="tab-btn" data-tab="accueil"><img src="${iconeAccueil}" width="18" height="18"><span class="btn-label">Accueil</span></button>
<button class="tab-btn" data-tab="notes"><img src="${iconeNotes}" width="18" height="18"><span class="btn-label">Notes</span><b class="side-count" id="sideCntNotes"></b></button>
<button class="tab-btn" data-tab="devoirs"><img src="${iconeDevoirs}" width="18" height="18"><span class="btn-label">Devoirs</span><b class="side-count" id="sideCntDevoirs"></b></button>
<button class="tab-btn" data-tab="edt"><img src="${iconeEdt}" width="18" height="18"><span class="btn-label">Emploi du temps</span></button>
<button class="tab-btn" data-tab="carnet2"><img src="${iconeCarnet2}" width="18" height="18"><span class="btn-label">Carnet</span></button>
<button class="tab-btn" data-tab="viescolaire"><img src="${iconeVie}" width="18" height="18"><span class="btn-label">Vie scolaire</span></button>
<button class="tab-btn" data-tab="messagerie"><img src="${iconeMessages}" width="18" height="18"><span class="btn-label">Messages</span><b class="side-count" id="sideCntMsg"></b></button>
<button class="tab-btn" data-tab="apps"><img src="${iconeApps}" width="18" height="18"><span class="btn-label">Apps</span></button>
<button class="tab-btn" data-tab="settings"><img src="${iconeParam}" width="18" height="18"><span class="btn-label">Parametres</span></button>
</div>
<div class="side-user" id="sideUser">
<div class="side-avatar">${pren.charAt(0)}${nom.charAt(0)}</div>
<span class="side-user-name">${pren} ${nom}</span>
</div>
</div>
<div class="m-container">
<div id="ed-content"></div>
</div>
`;
appliquerRond(rond);
updateAppsVisibility();
var menuFab = document.getElementById('ed-menu-fab');
if (menuFab) menuFab.addEventListener('click', function(e) { e.stopPropagation(); ouvrirSideNav(); });
var sideOverlay = document.getElementById('ed-side-overlay');
if (sideOverlay) sideOverlay.addEventListener('click', function() { fermerSideNav(); });
var sideToggle = document.getElementById('side-toggle');
if (sideToggle) sideToggle.addEventListener('click', function(e) { e.stopPropagation(); basculerSideToggle(); });
var sideUser = document.getElementById('sideUser');
if (sideUser) sideUser.addEventListener('click', function(e) { e.stopPropagation(); basculerProfil(); });
window.retour = function() { if (vuePrec === 'devoirs') devoirs(); else if (vuePrec === 'notes') notes(); else devoirs(); };
function brancherBtns() {
document.querySelectorAll('#ed-widget .tab-btn').forEach(function(btn) { btn.replaceWith(btn.cloneNode(true)); });
document.querySelectorAll('#ed-widget .tab-btn').forEach(function(btn) { btn.addEventListener('click', function() { changerOnglet(this.getAttribute('data-tab')); }); });
}
brancherBtns();
function changerOnglet(tab) {
onglet = tab;
document.querySelectorAll('#ed-widget .tab-btn').forEach(function(btn) { btn.classList.remove('active'); });
document.querySelectorAll('#ed-widget .tab-btn[data-tab="' + tab + '"]').forEach(function(btn) { btn.classList.add('active'); });
var sel = document.querySelector('#ed-widget .selector-container');
if (sel) sel.style.display = tab === "notes" ? 'block' : 'none';
if (window.innerWidth <= 768) fermerSideNav();
afficherContenu();
}
function basculerProfil() {
var profilDrop = document.getElementById('profileDropdown'), profilOver = document.getElementById('profileOverlay');
if (!profilDrop) return;
var ouvert = profilDrop.classList.contains('active');
if (ouvert) { profilDrop.classList.remove('active'); profilOver.classList.remove('active'); }
else { profilDrop.classList.add('active'); profilOver.classList.add('active'); }
}
window.changerOnglet = changerOnglet;
document.querySelectorAll('#ed-widget .tab-btn[data-tab="accueil"]').forEach(function(b) { b.classList.add('active'); });
var selTri = document.createElement('div');
selTri.className = 'selector-container';
selTri.innerHTML = '<div class="trimester-selector"><button class="trimester-option" data-tri="A001">1er Trimestre</button><button class="trimester-option" data-tri="A002">2eme Trimestre</button><button class="trimester-option" data-tri="A003">3eme Trimestre</button></div>';
var contDiv = document.getElementById('ed-content');
contDiv.parentNode.insertBefore(selTri, contDiv);
selTri.style.display = 'none';
afficherContenu();
majCountsSide();
document.querySelectorAll('#ed-widget .trimester-option').forEach(function(btn) {
btn.addEventListener('click', function() {
triActuel = this.getAttribute('data-tri');
document.querySelectorAll('#ed-widget .trimester-option').forEach(function(b) { b.classList.remove('active'); });
this.classList.add('active');
if (onglet === "notes") notes();
});
});
var actifTri = document.querySelector('#ed-widget .trimester-option[data-tri="' + triActuel + '"]');
if (actifTri) actifTri.classList.add('active');
var profilOverlay = document.getElementById('profileOverlay');
var profilDropdown = document.getElementById('profileDropdown');
if (profilOverlay) profilOverlay.addEventListener('click', function() { profilDropdown.classList.remove('active'); profilOverlay.classList.remove('active'); });
var profilDeconnexion = document.getElementById('profileSignout');
if (profilDeconnexion) profilDeconnexion.addEventListener('click', function() {
if (confirm('Se deconnecter ?')) {
sessionStorage.removeItem('credentials');
sessionStorage.removeItem('accounts');
location.reload();
}
});
document.addEventListener('click', function(e) {
var pd = document.getElementById('profileDropdown');
var su = document.getElementById('sideUser');
if (pd && pd.classList.contains('active') && !pd.contains(e.target) && !(su && su.contains(e.target))) {
pd.classList.remove('active');
document.getElementById('profileOverlay').classList.remove('active');
}
});
completion("Chargé");
}, 50);
} catch (erreur) {
completion("Erreur: " + (erreur.message || "Erreur inconnue"));
}
})();