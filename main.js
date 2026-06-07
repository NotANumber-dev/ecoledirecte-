/* ========================================================
   EcoleDirecte -
   👋 Salut
   https://github.com/NotANumber-dev/ecoledirecte-
   Apache 2.0 License - (c) NotANumber-dev, noodlelover1
   🔗 💎.pages.dev/ed-/manuel  |  nan-dev.pages.dev
======================================================== */


(async () => {
  try {
    document.documentElement.innerHTML = '';
    document.body.style.backgroundColor = '#000000';
    var idt = JSON.parse(sessionStorage.getItem("credentials"));
    var tok = idt.payload.authToken;
    var cpt = JSON.parse(sessionStorage.getItem("accounts"));
    var id = cpt.payload.accounts[0].id;
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
    var pos = localStorage.getItem('ed_menuPos') || 'haut';
    var aff = localStorage.getItem('ed_notesDisplay') || 'pastilles';
    var place = localStorage.getItem('ed_iconPlace') || '1';
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

    async function fetchLog(url, opts, logUrl) {
      var debut = Date.now();
      try {
        var rep = await fetch(url, opts);
        logApi(logUrl || url, rep.status, Date.now() - debut);
        return rep;
      } catch(e) {
        logApi(logUrl || url, "ERREUR", Date.now() - debut);
        throw e;
      }
    }

    function fetchTime(url, opts, timeout = 5000) {
      return Promise.race([
        fetch(url, opts),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
      ]);
    }

    var placeHolder = document.createElement('div');
    placeHolder.id = 'ed-placeholder';
    placeHolder.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#0B0B1A;z-index:999998;overflow:auto;color:#FFFFFF;font-family:sans-serif;';
    placeHolder.innerHTML = '<div style="padding:24px;">Chargement...</div>';
    document.body.appendChild(placeHolder);

    var pNotes = fetchTime(`https://api.ecoledirecte.com/v3/eleves/${id}/notes.awp?verbe=get&v=6.17.0`, { method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded","X-Token":tok}, body:"data="+encodeURIComponent(JSON.stringify({anneeScolaire:""})) }, 5000).then(r=>r.ok?r.json():{data:{notes:[]}}).catch(()=>({data:{notes:[]}}));
    var pDevoirs = fetchTime(`https://api.ecoledirecte.com/v3/Eleves/${id}/cahierdetexte.awp?verbe=get&v=4.98.0`, { method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded","X-Token":tok}, body:"data="+encodeURIComponent(JSON.stringify({})) }, 5000).then(r=>r.ok?r.json():{data:{}}).catch(()=>({data:{}}));
    var pCarnet2 = fetchTime(`https://api.ecoledirecte.com/v3/eleves/${id}/eleveCarnetCorrespondance.awp?verbe=get&v=4.98.0`, { method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded","X-Token":tok}, body:"data="+encodeURIComponent(JSON.stringify({})) }, 5000).then(r=>r.ok?r.json():{data:{correspondances:[]}}).catch(()=>({data:{correspondances:[]}}));
    var pVie = fetchTime(`https://api.ecoledirecte.com/v3/eleves/${id}/viescolaire.awp?verbe=get&v=4.98.0`, { method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded","X-Token":tok}, body:"data="+encodeURIComponent(JSON.stringify({})) }, 5000).then(r=>r.ok?r.json():{data:{absencesRetards:[],sanctionsEncouragements:[]}}).catch(()=>({data:{absencesRetards:[],sanctionsEncouragements:[]}}));
    var pMessages = fetchTime(`https://api.ecoledirecte.com/v3/eleves/${id}/messages.awp?verbe=get&v=4.98.0`, { method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded","X-Token":tok}, body:"data="+encodeURIComponent(JSON.stringify({})) }, 5000).then(r=>r.ok?r.json():{data:{messages:{received:[],sent:[],draft:[],archived:[]}}}).catch(()=>({data:{messages:{received:[],sent:[],draft:[],archived:[]}}}));
    var pFil = fetchTime(`https://api.ecoledirecte.com/v3/eleves/${id}/timeline.awp?verbe=get&v=4.98.0`, { method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded","X-Token":tok}, body:"data="+encodeURIComponent(JSON.stringify({})) }, 5000).then(r=>r.ok?r.json():{data:[]}).catch(()=>({data:[]}));

    var res = await Promise.all([pNotes, pDevoirs, pCarnet2, pVie, pMessages, pFil]);
    var jsonNotes = res[0], jsonDevoirs = res[1], jsonCarnet2 = res[2], jsonVie = res[3], jsonMessages = res[4], jsonFil = res[5];

    var data = jsonNotes.data || {};
    var notesOrig = data.notes || [];
    var cahier = jsonDevoirs.data || {};
    var carnet2 = jsonCarnet2.data || { correspondances: [] };
    var vie = jsonVie.data || { absencesRetards: [], sanctionsEncouragements: [] };
    var mess = jsonMessages.data || { messages: { received: [], sent: [], draft: [], archived: [] } };
    var fil = Array.isArray(jsonFil.data) ? jsonFil.data : (Array.isArray(jsonFil) ? jsonFil : []);

    var chargement = document.createElement('div');
    chargement.id = 'ed-chargement';
    chargement.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1C1C2E;color:#FFFFFF;padding:20px;border-radius:8px;z-index:1000000;font-family:sans-serif;';
    chargement.innerHTML = '<div style="text-align:center;"><div>Chargement...</div><div style="width:40px;height:4px;background:#2C2C44;border-radius:2px;overflow:hidden;margin:8px auto 0;"><div style="width:100%;height:100%;background:#5E5EFF;border-radius:2px;animation:load 1.5s ease infinite;"></div></div></div><style>@keyframes load{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}</style>';
    document.body.appendChild(chargement);
    var placeElem = document.getElementById('ed-placeholder');
    if (placeElem) placeElem.remove();

    var tris = {
      "A001": { nom: "1er Trimestre", matieres: {} },
      "A002": { nom: "2eme Trimestre", matieres: {} },
      "A003": { nom: "3eme Trimestre", matieres: {} }
    };

    if (data.notes && Array.isArray(data.notes)) {
      data.notes.slice(0,500).forEach(function(n) {
        var val = n.valeur;
        var codePer = n.codePeriode;
        if (val && val !== "" && val !== "NE" && val !== "Abs" && tris[codePer]) {
          var num = parseFloat(val.replace(',','.'));
          if (!isNaN(num)) {
            var surNote = parseFloat(n.noteSur) || 20;
            var val20 = (num / surNote) * 20;
            var mat = n.libelleMatiere;
            var coef = parseFloat(n.coef) || 1;
            if (!tris[codePer].matieres[mat]) tris[codePer].matieres[mat] = { somme:0, sommeCoef:0, nb:0 };
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

    var loadElem = document.getElementById('ed-chargement');
    if (loadElem) loadElem.remove();
    var ancienWidget = document.getElementById('ed-widget');
    if (ancienWidget) ancienWidget.remove();

    var widget = document.createElement('div');
    widget.id = 'ed-widget';
    widget.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#0B0B1A;z-index:999999;overflow:auto;font-family:sans-serif;';

    var onglet = "accueil";
    var triActuel = "A001";
    var cacheJour = {};
    var vuePrec = null;
    var scrollPositions = {};

    document.body.appendChild(widget);

    var themeSauve = localStorage.getItem('ed_theme') || 'ED-classic';

    setTimeout(function() {

    function triDefaut() {
      var dispo = Object.keys(tris).filter(function(t) { return Object.keys(tris[t].matieres).length > 0; });
      return dispo.length > 0 ? dispo[dispo.length - 1] : "A001";
    }
    triActuel = triDefaut();

    function messageMoy(moy) {
      if (moy === null || isNaN(moy)) return "Pret a commencer l'annee !";
      var msgs = [];
      if (moy >= 0 && moy < 5) msgs = ["Là, va falloir bosser","Le bon coté des choses, c'est que tu peux difficilement faire pire","Attention a ne pas faire tomber ta moyenne en negatif"];
      else if (moy >= 5 && moy < 10) msgs = ["Euuuuuuuuuuuuuh","Bah fais tes devoirs aussi","Pense a ton futur"];
      else if (moy >= 10 && moy < 13) msgs = ["Au moins tu as une moyenne à 2 chiffre","Arrête de jouer à Valo","Dis toi que c'est 10/10 et pas 10/20"];
      else if (moy >= 13 && moy < 15) msgs = ["Bon bah c ok","Lache pas trop quand meme","Dis toi que l'art et la musique ne comptent pas au exams"];
      else if (moy >= 15 && moy < 17) msgs = ["Bon travail ! Tu peux geekhumtravailler !","Vzy t chill","async function etreAuTop()"];
      else if (moy >= 17 && moy < 18.5) msgs = ["Cool cool cool","T bien soigné","Bravo, tu es au top !"];
      else if (moy >= 18.5 && moy < 20) msgs = ["Faut pas copier sur tes voisins tu sais ?","Bon amuse toi un peu","L3G3ND3"];
      else if (moy === 20) msgs = ["Tu as cheat comment ?"];
      if (msgs.length > 0) return msgs[Math.floor(Math.random() * msgs.length)];
      return "Continue tes efforts !";
    }

    function couleurMoy(m) {
      if (m === null || isNaN(m)) return '#8E8E93';
      if (m < 10) return '#FF6B6B';
      if (m < 12) return '#FFB340';
      if (m < 14) return '#5E5EFF';
      return '#40D9A4';
    }

    function nbFil() {
      var w = window.innerWidth;
      if (w < 600) return 1;
      if (w < 900) return 2;
      if (w < 1200) return 3;
      return 4;
    }

    function formaterDate(str) {
      var d = new Date(str);
      var jours = ["DIMANCHE","LUNDI","MARDI","MERCREDI","JEUDI","VENDREDI","SAMEDI"];
      var mois = ["JANVIER","FEVRIER","MARS","AVRIL","MAI","JUIN","JUILLET","AOUT","SEPTEMBRE","OCTOBRE","NOVEMBRE","DECEMBRE"];
      return { jour: jours[d.getDay()], date: d.getDate()+" "+mois[d.getMonth()], complet: str };
    }

    function decodeTexte(str) {
      if (!str) return "";
      try {
        if (/^[A-Za-z0-9+\/=]+$/.test(str) && str.length % 4 === 0) {
          try {
            var decode = atob(str);
            var bytes = [];
            for (var i=0;i<decode.length;i++) bytes.push(decode.charCodeAt(i)&0xFF);
            return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
          } catch(e) {}
        }
        var fix = str;
        var corr = {'Ã©':'é','Ã¨':'è','Ãª':'ê','Ã«':'ë','Ã¤':'ä','Ã¢':'â','Ã®':'î','Ã¯':'ï','Ã¶':'ö','Ã¹':'ù','Ã»':'û','Ã¼':'ü','Ã§':'ç','â‚¬':'€','â€™':"'",'â€œ':'"','â€':'"','â€"':'-','Â°':'°'};
        for (var mauvais in corr) { while (fix.indexOf(mauvais)!==-1) fix=fix.split(mauvais).join(corr[mauvais]); }
        return fix;
      } catch(e) { return str; }
    }

    function appliquerRond(r) {
      rond = parseInt(r);
      localStorage.setItem('ed_roundness', rond);
      var style = document.getElementById('ed-rond-style');
      if (!style) { style = document.createElement('style'); style.id = 'ed-rond-style'; document.head.appendChild(style); }
      var px = rond + 'px';
      style.textContent = `#ed-widget .subject-card, #ed-widget .stat-card, #ed-widget .home-card, #ed-widget .annual-card, #ed-widget .task-card, #ed-widget .home-hero, #ed-widget .hero-card, #ed-widget .carnet2-card, #ed-widget .message-item, #ed-widget .tab-bar, #ed-widget .trimester-selector, #ed-widget .tab-btn.active, #ed-widget .trimester-option.active, #ed-widget input, #ed-widget select, #ed-widget button, #ed-widget .profile-dropdown, #ed-widget .notes-table-ed, #ed-widget #ed-side-nav, #refreshFab { border-radius: ${px} !important; }`;
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
        var co = parseFloat(n.coef)||1;
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
      var totalW = 0, totalC = 0;
      for (var mat in triData.matieres) {
        if (desact[mat]) continue;
        var m = triData.matieres[mat];
        totalW += m.somme;
        totalC += m.sommeCoef;
        var simGrades = simu[mat] || [];
        var enabSim = simuAct[mat] || [];
        for (var s=0; s<simGrades.length; s++) {
          if (enabSim[s] !== false) {
            var sim = simGrades[s];
            var simVal = parseFloat(sim.value), simMax = parseFloat(sim.max), simCoef = parseFloat(sim.coef)||1;
            if (!isNaN(simVal) && !isNaN(simMax) && simMax > 0) {
              totalW += (simVal/simMax)*20*simCoef;
              totalC += simCoef;
            }
          }
        }
      }
      return totalC > 0 ? totalW / totalC : null;
    }

    function moyAnnuelleAvecSimu() {
      var totalW = 0, totalC = 0;
      for (var t in tris) {
        for (var m in tris[t].matieres) {
          if (desact[m]) continue;
          var mat = tris[t].matieres[m];
          totalW += mat.somme; totalC += mat.sommeCoef;
          var simGrades = simu[m] || [];
          var enabSim = simuAct[m] || [];
          for (var s=0; s<simGrades.length; s++) {
            if (enabSim[s] !== false) {
              var sim = simGrades[s];
              var simVal = parseFloat(sim.value), simMax = parseFloat(sim.max), simCoef = parseFloat(sim.coef)||1;
              if (!isNaN(simVal) && !isNaN(simMax) && simMax > 0) {
                totalW += (simVal/simMax)*20*simCoef;
                totalC += simCoef;
              }
            }
          }
        }
      }
      return totalC > 0 ? totalW / totalC : null;
    }

    function noteEstMasquee(matiere, idx) {
      return (cache[matiere] || []).includes(idx);
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
      btn.textContent = "..."; btn.disabled = true;
      var bodyObj = fait ? {idDevoirsEffectues:[idDev],idDevoirsNonEffectues:[]} : {idDevoirsEffectues:[],idDevoirsNonEffectues:[idDev]};
      var formData = new URLSearchParams();
      formData.append("data", JSON.stringify(bodyObj));
      fetch(`https://api.ecoledirecte.com/v3/Eleves/${id}/cahierdetexte.awp?verbe=put&v=4.98.0`, {
        method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded","X-Token":tok}, body:formData.toString()
      }).then(r=>r.json()).then(rep=>{
        maj = false;
        if (rep.code === 200) {
          btn.setAttribute('data-done', fait?'true':'false');
          if (statutSpan) { statutSpan.textContent = fait?"FAIT":"A FAIRE"; statutSpan.style.color = fait?"#5E5EFF":"#FFB340"; }
          btn.textContent = fait?"Non fait":"Fait"; btn.disabled = false;
          if (bloc) bloc.style.borderLeftColor = fait?'#5E5EFF':'#FFB340';
          
          for (var dateKey in cahier) {
            var taches = cahier[dateKey];
            for (var i=0;i<taches.length;i++) {
              if ((taches[i].idDevoir||taches[i].id)===idDev) {
                taches[i].effectue = fait;
                if (cacheJour[dateKey]) {
                  for (var j=0; j<cacheJour[dateKey].length; j++) {
                    if ((cacheJour[dateKey][j].idDevoir||cacheJour[dateKey][j].id)===idDev) {
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
              if (cont.innerHTML.includes('data-date="'+d+'"') || cont.innerHTML.includes(d.substring(0,10))) {
                dateKeyVisible = d;
                break;
              }
            }
            if (dateKeyVisible && cacheJour[dateKeyVisible]) {
              afficherJour(dateKeyVisible, cacheJour[dateKeyVisible]);
            }
          }
          
          if (onglet==='accueil') accueil();
        } else {
          btn.textContent=texteOrig; btn.disabled=false; alert("Erreur: "+rep.message);
        }
      }).catch(err=>{
        maj=false; btn.textContent=texteOrig; btn.disabled=false; alert("Erreur: "+err.message);
      });
    };

    async function voirJour(dateKey) {
      var cont = document.getElementById('ed-content');
      if (!cont) return;
      vuePrec = onglet;
      if (cacheJour[dateKey]) {
        var tachesCachees = cacheJour[dateKey];
        for (var i=0;i<tachesCachees.length;i++) {
          var t=tachesCachees[i], tid=t.idDevoir||t.id;
          if (cahier[dateKey]) for (var j=0;j<cahier[dateKey].length;j++) { var st=cahier[dateKey][j]; if ((st.idDevoir||st.id)===tid) { t.effectue=st.effectue; break; } }
        }
        afficherJour(dateKey, tachesCachees); return;
      }
      cont.innerHTML = '<div class="empty-state"><p>Chargement...</p></div>';
      try {
        var rep = await fetch(`https://api.ecoledirecte.com/v3/Eleves/${id}/cahierdetexte/${dateKey}.awp?verbe=get&v=4.98.0`, { method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded","X-Token":tok}, body:"data="+encodeURIComponent(JSON.stringify({})) });
        var json = await rep.json();
        var matieres = json.data.matieres || [], taches = [];
        for (var i=0;i<matieres.length;i++) {
          if (matieres[i].aFaire) {
            var tache = matieres[i].aFaire;
            tache.matiere = matieres[i].matiere; tache.codeMatiere = matieres[i].codeMatiere; tache.interrogation = matieres[i].interrogation || false;
            if (cahier[dateKey]) for (var j=0;j<cahier[dateKey].length;j++) { var st=cahier[dateKey][j]; if ((st.idDevoir||st.id)===(tache.idDevoir||tache.id)) { tache.effectue=st.effectue; break; } }
            taches.push(tache);
          }
        }
        cacheJour[dateKey] = taches;
        afficherJour(dateKey, taches);
      } catch(e) {
        cont.innerHTML = '<div class="empty-state"><p>Erreur: '+e.message+'</p><button style="background:#2C2C44;border:none;color:white;padding:8px 16px;border-radius:6px;cursor:pointer;margin-top:20px;" onclick="window.retour()">← Retour</button></div>';
      }
    }

    function afficherJour(dateKey, taches) {
      var formate = formaterDate(dateKey);
      var cont = document.getElementById('ed-content');
      if (!cont) return;
      
      if (cahier[dateKey]) {
        for (var i=0;i<taches.length;i++) {
          var tid = taches[i].idDevoir || taches[i].id;
          for (var j=0;j<cahier[dateKey].length;j++) {
            if ((cahier[dateKey][j].idDevoir||cahier[dateKey][j].id) === tid) {
              taches[i].effectue = cahier[dateKey][j].effectue;
              break;
            }
          }
        }
      }
      
      var html = '<div style="margin-bottom:20px;">';
      html += '<button style="background:transparent;border:none;color:#8E8E93;padding:0 0 12px 0;cursor:pointer;font-size:13px;" onclick="window.retour()">← Retour</button>';
      html += '<div style="margin-bottom:16px;"><h2 style="color:#5E5EFF;margin-bottom:2px;">'+formate.jour+'</h2><p style="color:#8E8E93;font-size:13px;">'+formate.date+'</p></div>';
      for (var i=0;i<taches.length;i++) {
        var t=taches[i], fait=(t.effectue===true), type=t.interrogation?"Interrogation":"Devoir";
        var contenu=decodeTexte(typeof t.contenu==='string'?t.contenu:''), idTache=t.idDevoir||t.id;
        var dernier = i === taches.length - 1;
        html += '<div class="task-card" data-task-id="'+idTache+'" style="background:transparent;padding:12px 0;margin-bottom:0;border-left:none;' + (dernier ? '' : 'border-bottom:1px solid #2C2C44;') + '">';
        html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:6px;">';
        html += '<div style="display:flex;align-items:center;gap:8px;">';
        html += '<span style="width:6px;height:6px;border-radius:50%;background:'+(fait?'#5E5EFF':'#FFB340')+';"></span>';
        html += '<span style="font-weight:600;color:white;font-size:14px;">'+t.matiere+'</span>';
        html += '<span style="color:#8E8E93;font-size:11px;">'+type+'</span></div>';
        html += '<div style="display:flex;align-items:center;gap:10px;">';
        html += '<span class="task-status" style="color:'+(fait?'#5E5EFF':'#FFB340')+';font-size:11px;">'+(fait?'FAIT':'A FAIRE')+'</span>';
        html += '<button class="mark-homework-btn" data-id="'+idTache+'" data-done="'+fait+'" data-datekey="'+dateKey+'" style="background:transparent;border:1px solid '+(fait?'#5E5EFF':'#FFB340')+';color:'+(fait?'#5E5EFF':'#FFB340')+';padding:3px 10px;border-radius:6px;cursor:pointer;font-size:11px;">'+(fait?'Non fait':'Fait')+'</button></div></div>';
        if (contenu) html += '<div style="color:#B3B3D2;font-size:13px;line-height:1.5;padding-left:14px;">'+contenu+'</div>';
        html += '</div>';
      }
      html += '</div>';
      cont.innerHTML = html;
      
      var btns = document.querySelectorAll('.mark-homework-btn');
      for (var i=0;i<btns.length;i++) {
        btns[i].addEventListener('click', function(e) {
          e.stopPropagation();
          var btn=this, idTache=parseInt(btn.getAttribute('data-id')), fait=btn.getAttribute('data-done')==='true', dateKey = btn.getAttribute('data-datekey');
          window.marquerDevoir(idTache, !fait, btn);
        });
      }
    }

    async function voirPieceJointe(idFichier, nomFichier) {
      var modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:10000000;display:flex;align-items:center;justify-content:center;';
      var contenu = document.createElement('div');
      contenu.style.cssText = 'background:#1C1C2E;border-radius:8px;padding:20px;width:90vw;height:90vh;display:flex;flex-direction:column;';
      var entete = document.createElement('div');
      entete.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;';
      entete.innerHTML = '<span style="color:white;font-size:16px;">'+nomFichier+'</span>';
      var groupeBtn = document.createElement('div'); groupeBtn.style.cssText = 'display:flex;gap:10px;';
      var telecharger = document.createElement('a');
      telecharger.textContent = 'Télécharger';
      telecharger.style.cssText = 'background:#5E5EFF;color:white;padding:6px 14px;border-radius:6px;text-decoration:none;font-size:13px;opacity:0.4;pointer-events:none;';
      var fermer = document.createElement('button');
      fermer.textContent = '✕';
      fermer.style.cssText = 'background:#2C2C44;border:none;color:white;padding:6px 14px;border-radius:6px;cursor:pointer;';
      fermer.onclick = function() { modal.remove(); };
      groupeBtn.appendChild(telecharger); groupeBtn.appendChild(fermer); entete.appendChild(groupeBtn);
      var corps = document.createElement('div');
      corps.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;background:#0B0B1A;border-radius:6px;overflow:auto;';
      corps.innerHTML = '<div style="color:#8E8E93;padding:40px;">Chargement...</div>';
      contenu.appendChild(entete); contenu.appendChild(corps); modal.appendChild(contenu); document.body.appendChild(modal);
      modal.onclick = function(e) { if (e.target===modal) modal.remove(); };
      try {
        var formData = new URLSearchParams();
        formData.append("data", JSON.stringify({forceDownload:0,anneeMessages:"2025-2026"}));
        var rep = await fetch(`https://api.ecoledirecte.com/v3/telechargement.awp?verbe=get&fichierId=${idFichier}&leTypeDeFichier=PIECE_JOINTE&v=4.98.0`, { method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded","X-Token":tok}, body:formData.toString() });
        if (!rep.ok) throw new Error('HTTP '+rep.status);
        var blob = await rep.blob();
        var urlBlob = URL.createObjectURL(blob);
        telecharger.href = urlBlob; telecharger.download = nomFichier; telecharger.style.opacity='1'; telecharger.style.pointerEvents='auto';
        if (blob.type.startsWith('image/')) corps.innerHTML = '<img src="'+urlBlob+'" style="max-width:100%;max-height:100%;object-fit:contain;">';
        else if (blob.type==='application/pdf') corps.innerHTML = '<embed src="'+urlBlob+'" type="application/pdf" style="width:100%;height:100%;border:none;">';
        else corps.innerHTML = '<div style="color:#8E8E93;text-align:center;"><div style="font-size:48px;margin-bottom:16px;">📄</div><div>Fichier téléchargé</div></div>';
      } catch(err) { corps.innerHTML = '<div style="color:#8E8E93;text-align:center;"><div style="font-size:48px;">❌</div><div>Impossible de charger</div></div>'; }
    }
    window.voirPieceJointe = voirPieceJointe;

    function accueil() {
      var cont = document.getElementById('ed-content');
      if (!cont) return;
      cont.innerHTML = '';
      var triCourant = tris[triActuel];
      var matieres = Object.keys(triCourant.matieres).map(function(m) {
        return { nom: m, moyenne: triCourant.matieres[m].moy, nb: triCourant.matieres[m].nb };
      }).sort(function(a,b) { return b.moyenne - a.moyenne; }).slice(0,4);
      var nbDevoirs = 0;
      var dates = Object.keys(cahier||{});
      for (var i=0;i<dates.length;i++) { var taches=cahier[dates[i]]||[]; for (var j=0;j<taches.length;j++) { if (taches[j].effectue===false) nbDevoirs++; } }
      var moyTri = moyTriAvecSimu(triActuel);
      var html = '';
      html += '<div class="home-hero">';
      html += '<div class="hero-copy">';
      html += '<div class="eyebrow">Accueil</div>';
      html += '<div class="title-container"><h1>EcoleDirecte</h1><span class="dash-animated">—</span></div>';
      html += '<p style="color:#B3B3D2;margin-top:12px;font-size:15px;">'+messageMoy(moyTri)+'</p>';
      html += '</div>';
      html += '<div class="hero-card">';
      html += '<div class="hero-stats"><span>Devoirs à faire</span><strong>'+nbDevoirs+'</strong></div>';
      html += '<div class="hero-stats"><span>Moyenne générale</span><strong>'+(moyTri!==null?moyTri.toFixed(2):'—')+'</strong></div>';
      html += '</div></div>';
      html += '<div class="home-grid">';
      if (matieres.length > 0) {
        html += '<div class="home-card"><div class="card-title">Top matières</div>';
        for (var k=0;k<matieres.length;k++) {
          var item=matieres[k];
          html += '<div class="home-subject"><span>'+item.nom+'</span><strong>'+item.moyenne.toFixed(2)+'</strong></div>';
        }
        html += '</div>';
      }
      html += '</div>';
      if (fil && fil.length > 0) {
        var nbFilAffiche = nbFil();
        var filAffiche = fil.slice(0,nbFilAffiche);
        html += '<div style="width:100%;margin:20px 0;"><div class="card-title" style="margin-bottom:12px;">Timeline récente</div>';
        html += '<div style="display:flex;gap:12px;flex-wrap:wrap;">';
        for (var t=0;t<filAffiche.length;t++) {
          var evt=filAffiche[t];
          var dateEvt=evt.date?new Date(evt.date).toLocaleDateString('fr-FR'):'Date inconnue';
          html += '<div style="flex:1;min-width:240px;background:#111123;border:1px solid #2C2C44;border-radius:8px;padding:16px;">';
          html += '<div style="font-size:14px;font-weight:700;color:#FFFFFF;margin-bottom:6px;">'+(evt.titre||'Événement')+'</div>';
          if (evt.soustitre) html += '<div style="font-size:12px;color:#8E8E93;margin-bottom:8px;">'+evt.soustitre+'</div>';
          html += '<div style="font-size:11px;color:#8E8E93;margin-bottom:10px;">'+dateEvt+'</div>';
          if (evt.contenu) html += '<div style="color:#DFE0FF;font-size:13px;line-height:1.5;">'+evt.contenu+'</div>';
          html += '</div>';
        }
        html += '</div></div>';
      }
      cont.innerHTML = html;
    }

    function sauvegarderScroll() {
      var cont = document.getElementById('ed-content');
      if (cont) {
        scrollPositions[onglet] = cont.scrollTop;
      }
    }

    function restaurerScroll() {
      var cont = document.getElementById('ed-content');
      if (cont && scrollPositions[onglet] !== undefined) {
        setTimeout(function() {
          cont.scrollTop = scrollPositions[onglet];
        }, 50);
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
            var notesMatiere = notesOrig.filter(function(n) { return n.libelleMatiere===mat && n.codePeriode===triActuel; });
            listeMatieres.push({ nom:mat, moyenne:matDonnees.moy, nb:matDonnees.nb, sommeCoef:matDonnees.sommeCoef, notes:notesMatiere });
          }
          listeMatieres.sort(function(a,b) { return b.moyenne - a.moyenne; });

          var moyTri = moyTriAvecSimu(triActuel);
          var moyAnnuelle = moyAnnuelleAvecSimu();

          var nbSur = parseFloat(sur);
          var convert = nbSur !== 20;
          var affMoyTri = moyTri !== null && convert ? (moyTri/20)*nbSur : moyTri;
          var affMoyAnnuelle = moyAnnuelle !== null && convert ? (moyAnnuelle/20)*nbSur : moyAnnuelle;

          var totalNotes = 0;
          for (var m in triData.matieres) totalNotes += triData.matieres[m].nb;

          var html = '';
          if (listeMatieres.length === 0) {
            html += '<div class="empty-state"><p>Aucune note pour ce trimestre</p></div>';
          } else {
            html += '<div class="stats-grid">';
            html += '<div class="stat-card"><div class="stat-label">MOYENNE GENERALE</div><div class="stat-value">'+(affMoyTri!==null?affMoyTri.toFixed(2):'—')+'</div><div class="stat-sub">Coefficientée</div></div>';
            html += '<div class="stat-card"><div class="stat-label">NOMBRE DE NOTES</div><div class="stat-value">'+totalNotes+'</div><div class="stat-sub">Ce trimestre</div></div>';
            html += '</div>';

            if (aff === 'liste') {
              html += '<div style="overflow-x:auto;margin-bottom:24px;">';
              html += '<table class="notes-table-ed" style="width:100%;border-collapse:collapse;min-width:600px;">';
              html += '<thead><tr style="background:#5E5EFF;color:white;">';
              html += '<th style="padding:10px 14px;text-align:left;">DISCIPLINES</th>';
              html += '<th style="padding:10px 14px;text-align:left;">EVALUATIONS</th>';
              html += '<th style="padding:10px 14px;text-align:center;">MOYENNE</th>';
              html += '</tr></thead><tbody>';
              for (var i=0;i<listeMatieres.length;i++) {
                var mat=listeMatieres[i];
                var estDesact=desact[mat.nom]===true;
                var moyAvecSimu=moyMatiereAvecSimu(mat.nom,triActuel);
                var coul=couleurMoy(moyAvecSimu);
                var affMoy=moyAvecSimu!==null&&convert?(moyAvecSimu/20)*nbSur:moyAvecSimu;
                html += '<tr class="notes-table-row" data-subject="'+mat.nom.replace(/'/g,"\\'")+'" style="border-bottom:1px solid #2C2C44;cursor:pointer;">';
                html += '<td style="padding:10px 14px;"><div style="font-weight:700;color:white;">'+mat.nom+'</div></td>';
                html += '<td style="padding:10px 14px;"><div style="display:flex;flex-wrap:wrap;gap:5px;">';
                if (!estDesact) {
                  for (var g=0;g<mat.notes.length;g++) {
                    var grade=mat.notes[g], gv=grade.valeur, ns=grade.noteSur||20, isNS=grade.nonSignificatif===true;
                    var ov=parseFloat(gv.replace(',','.')), gp=ov/ns*20, gc=couleurMoy(gp);
                    var dv=gv, dm=ns;
                    if (convert&&!isNS) { dv=((ov/ns)*nbSur).toFixed(2).replace('.',','); dm=nbSur; }
                    if (isNS) html += '<span style="font-size:12px;color:#8E8E93;">('+gv+'/'+ns+')</span>';
                    else html += '<span style="display:inline-flex;align-items:center;gap:3px;font-size:12px;color:white;"><span style="width:8px;height:8px;border-radius:50%;background:'+gc+';"></span>'+dv+'<span style="font-size:9px;color:#8E8E93;">/'+dm+'</span>'+(grade.coef&&grade.coef!=='1'&&grade.coef!==1?'<span style="font-size:9px;color:#8E8E93;">('+grade.coef+')</span>':'')+'</span>';
                  }
                  var simGrades=simu[mat.nom]||[], enabSim=simuAct[mat.nom]||[];
                  for (var s=0;s<simGrades.length;s++) { if (enabSim[s]!==false) { var sim=simGrades[s]; var sp=(parseFloat(sim.value)/parseFloat(sim.max))*20; var sc=couleurMoy(sp); html += '<span style="display:inline-flex;align-items:center;gap:3px;font-size:12px;color:#FFA500;"><span style="width:8px;height:8px;border-radius:50%;background:'+sc+';"></span>'+sim.value+'<span style="font-size:9px;color:#8E8E93;">/'+sim.max+'</span></span>'; } }
                }
                html += '</div></td>';
                html += '<td style="padding:10px 14px;text-align:center;">';
                if (!estDesact&&moyAvecSimu!==null) html += '<span style="font-weight:700;font-size:16px;color:'+coul+';">'+(affMoy!==null?affMoy.toFixed(2):'—')+'</span>';
                else html += '<span style="font-weight:700;font-size:16px;color:#8E8E93;">—</span>';
                html += '</td></tr>';
              }
              html += '</tbody></table></div>';
              html += '<div id="graph-container" style="margin-top:16px;"></div>';
              if (moyAnnuelle !== null) {
                html += '<div class="annual-card" style="margin-top:16px;">';
                html += '<div class="annual-label">MOYENNE ANNUELLE</div>';
                html += '<div class="annual-value">'+(affMoyAnnuelle!==null?affMoyAnnuelle.toFixed(2):'—')+'</div>';
                html += '<div class="annual-note-count">'+totalNotesAnnee+' notes sur toute l\'année</div>';
                html += '</div>';
              }
            } else {
              html += '<div class="subjects-grid">';
              for (var i=0;i<listeMatieres.length;i++) {
                var mat=listeMatieres[i];
                var estDesact=desact[mat.nom]===true;
                var moyAvecSimu=moyMatiereAvecSimu(mat.nom,triActuel);
                var coul=couleurMoy(moyAvecSimu);
                var affMoy=moyAvecSimu!==null&&convert?(moyAvecSimu/20)*nbSur:moyAvecSimu;
                var diff=moyAvecSimu!==null&&moyTri!==null?moyAvecSimu-moyTri:0;
                var diffCoul=diff>0?'#40D9A4':diff<0?'#FF6B6B':'#8E8E93';
                var diffTexte=diff>0?'+'+diff.toFixed(2):diff.toFixed(2);
                html += '<div class="subject-card" data-subject="'+mat.nom.replace(/'/g,"\\'")+'" style="cursor:pointer;">';
                html += '<div class="subject-header"><div style="display:flex;align-items:center;gap:6px;"><span class="subject-name">'+mat.nom+'</span></div>';
                html += '<span class="subject-average" style="color:'+(estDesact?'#8E8E93':coul)+';"> '+(estDesact||moyAvecSimu===null?'—':affMoy!==null?affMoy.toFixed(2):'—')+'</span></div>';
                html += '<div class="subject-stats"><span><span class="grade-indicator" style="background:'+coul+';"></span>'+mat.nb+' note(s)</span><span>Coeff. '+mat.sommeCoef.toFixed(1)+'</span>';
                html += '<div style="font-size:12px;color:'+diffCoul+';">'+diffTexte+'</div></div>';
                if (mat.notes.length > 0) {
                  html += '<div style="margin-top:14px;padding-top:10px;border-top:1px solid #2C2C44;">';
                  html += '<div style="font-size:11px;color:#8E8E93;margin-bottom:6px;">Notes récentes:</div>';
                  var rec=mat.notes.slice(0,4);
                  for (var g=0;g<rec.length;g++) {
                    var grade=rec[g], gv=grade.valeur, ns=grade.noteSur||20, isNS=grade.nonSignificatif===true, ov=parseFloat(gv.replace(',','.'));
                    var ds=grade.date||grade.dateSaisie, sd=ds?ds.substring(5,10).replace(/-/g,'/'):'';
                    var dv=gv, dm=ns;
                    if (convert&&!isNS) { dv=((ov/ns)*nbSur).toFixed(2).replace('.',','); dm=nbSur; }
                    var gc=couleurMoy(ov/ns*20);
                    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:12px;">';
                    html += '<span style="color:#8E8E93;">'+sd+'</span>';
                    if (isNS) html += '<span style="color:'+gc+';font-weight:500;">('+gv+'/'+ns+')</span>';
                    else html += '<span style="color:'+gc+';font-weight:500;">'+dv+'/'+dm+'</span>';
                    html += '</div>';
                  }
                  if (mat.notes.length > 4) html += '<div style="text-align:center;margin-top:5px;"><span style="font-size:10px;color:#8E8E93;">+'+(mat.notes.length-4)+' autres</span></div>';
                  html += '</div>';
                }
                var simGrades=simu[mat.nom]||[], enabSim=simuAct[mat.nom]||[];
                var aSimActive=simGrades.some(function(_,s){return enabSim[s]!==false;});
                if (aSimActive) {
                  html += '<div style="margin-top:8px;padding-top:8px;border-top:1px solid #2C2C44;"><div style="font-size:11px;color:#8E8E93;margin-bottom:6px;">Notes simulées:</div>';
                  for (var s=0;s<simGrades.length;s++) { if (enabSim[s]!==false) { var sim=simGrades[s]; html += '<div style="display:flex;justify-content:space-between;font-size:12px;color:#FFA500;padding:4px 0;"><span style="color:#8E8E93;">Simulée</span><span>'+sim.value+'/'+sim.max+'</span></div>'; } }
                  html += '</div>';
                }
                html += '</div>';
              }
              html += '</div>';
              if (moyAnnuelle !== null) {
                html += '<div class="annual-card" style="margin-top:16px;">';
                html += '<div class="annual-label">MOYENNE ANNUELLE</div>';
                html += '<div class="annual-value">'+(affMoyAnnuelle!==null?affMoyAnnuelle.toFixed(2):'—')+'</div>';
                html += '<div class="annual-note-count">'+totalNotesAnnee+' notes sur toute l\'année</div>';
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

          graph(notesOrig, nbSur);
        }

    function graph(notes, surNum) {
      var conteneur = document.getElementById('graph-container');
      if (!conteneur) return;
      if (!notes || notes.length === 0) return;

      function construirePoints(notes, mode) {
        var pts = [];
        var triees = notes.filter(function(n) {
          if (!n.date && !n.dateSaisie) return false;
          var v = n.valeur;
          if (!v || v === "" || v === "NE" || v === "Abs" || n.nonSignificatif) return false;
          return !isNaN(parseFloat(v.replace(',','.')));
        }).map(function(n) {
          return {
            date: new Date(n.date || n.dateSaisie),
            valeur: parseFloat(n.valeur.replace(',','.')),
            sur: parseFloat(n.noteSur) || 20,
            coef: parseFloat(n.coef) || 1,
            matiere: n.libelleMatiere || ''
          };
        }).sort(function(a,b){ return a.date - b.date; });

        if (!triees.length) return [];

        if (mode === "notes") {
          triees.forEach(function(n) {
            var v20 = (n.valeur / n.sur) * 20;
            var disp = surNum !== 20 ? (v20/20)*surNum : v20;
            pts.push({ date: n.date, y: parseFloat(disp.toFixed(3)), label: n.matiere, brut: n.valeur+'/'+n.sur });
          });
        } else {
          var sommeW = 0, sommeC = 0;
          triees.forEach(function(n) {
            var v20 = (n.valeur / n.sur) * 20;
            sommeW += v20 * n.coef;
            sommeC += n.coef;
            var moy = sommeW / sommeC;
            var disp = surNum !== 20 ? (moy/20)*surNum : moy;
            pts.push({ date: n.date, y: parseFloat(disp.toFixed(3)), label: n.matiere });
          });
        }
        return pts;
      }

      var tousPts = construirePoints(notes, 'moyenne');
      if (!tousPts.length) return;
      var maxDate = tousPts[tousPts.length-1].date;

      var modeGraph = 'moyenne';
      var vueGraph = 'normal';
      var periode = 'trim';

      var idxTooltip = null;

      function filtrerPeriode(pts, p) {
        var maintenant = new Date(maxDate);
        var limite = new Date(maintenant);
        if      (p==='7d') limite.setDate(maintenant.getDate()-7);
        else if (p==='1m') limite.setMonth(maintenant.getMonth()-1);
        else if (p==='3m') limite.setMonth(maintenant.getMonth()-3);
        else if (p==='1y') limite.setFullYear(maintenant.getFullYear()-1);
        return pts.filter(function(pt){ return pt.date >= limite; });
      }

      function formaterY(val, plage) {
        var dec = plage < 0.5 ? 2 : plage < 2 ? 1 : 0;
        return val.toFixed(dec);
      }

      function dessiner() {
        var sourceNotes = periode === 'trim' ? notes.filter(function(n) { return n.codePeriode === triActuel; }) : notes;
        var bruts = construirePoints(sourceNotes, modeGraph);
        var pts = periode === 'trim' ? bruts : filtrerPeriode(bruts, periode);
        if (!pts.length) pts = bruts.slice(-10);
        if (!pts.length) return;

        var L = conteneur.clientWidth || 600;
        var H = vueGraph === 'trading' ? 300 : 210;
        var PAD = { haut:20, droite:52, bas:36, gauche:52 };
        var LW = L - PAD.gauche - PAD.droite;
        var LH = H - PAD.haut - PAD.bas;
        var maxY = surNum !== 20 ? surNum : 20;

        var minDonnees = pts.reduce(function(m,p){return Math.min(m,p.y);}, Infinity);
        var maxDonnees = pts.reduce(function(m,p){return Math.max(m,p.y);}, -Infinity);
        if (!isFinite(minDonnees)) { minDonnees=0; maxDonnees=maxY; }
        if (minDonnees === maxDonnees) { minDonnees=Math.max(0,minDonnees-1); maxDonnees=maxDonnees+1; }
        var marge = (maxDonnees-minDonnees)*0.18;
        var minY = Math.max(0, minDonnees - marge);
        var maxYgraph = Math.min(maxY, maxDonnees + marge);
        if (maxYgraph <= minY) maxYgraph = minY + 2;
        var plageY = maxYgraph - minY;

        function versY(v) {
          return PAD.haut + LH - ((v - minY)/(maxYgraph - minY))*LH;
        }

        function versXdate(d) {
          var t0=pts[0].date.getTime(), t1=pts[pts.length-1].date.getTime();
          if (t1===t0) return PAD.gauche + LW/2;
          return PAD.gauche + ((d.getTime()-t0)/(t1-t0))*LW;
        }

        var tendance = pts[pts.length-1].y >= pts[0].y;
        var coulLigne = tendance ? '#00C87A' : '#FF4E4E';
        var idGrad = 'g'+Math.floor(Math.random()*99999);

        var grille = '';
        var nbTicks = 5;
        for (var gi=0; gi<=nbTicks; gi++) {
          var gv = minY + plageY*(gi/nbTicks);
          var gy = versY(gv);
          grille += '<line x1="'+PAD.gauche+'" y1="'+gy.toFixed(1)+'" x2="'+(PAD.gauche+LW)+'" y2="'+gy.toFixed(1)+'" stroke="#2C2C44" stroke-width="1"/>';
          grille += '<text x="'+(PAD.gauche-8)+'" y="'+(gy+4).toFixed(1)+'" text-anchor="end" fill="#555577" font-size="10">'+formaterY(gv, plageY)+'</text>';
        }

        var svgGraph = '';
        var labelsX = '';
        var survol = '';

        if (vueGraph === 'trading') {
          var utiliserIndiv = pts.length <= 15;
          var bougies = [];

          if (utiliserIndiv) {
            for (var i=0; i<pts.length; i++) {
              var prevY = i > 0 ? pts[i-1].y : pts[i].y;
              var currY = pts[i].y;
              var haut = Math.max(prevY, currY);
              var bas = Math.min(prevY, currY);
              var plageY2 = maxYgraph - minY;
              var pxParUnite = LH / plageY2;
              var minMechPx = 3;
              var minMechData = minMechPx / pxParUnite;
              if (haut - bas < minMechData) {
                var milieu = (haut + bas) / 2;
                haut = milieu + minMechData;
                bas = milieu - minMechData;
              }
              bougies.push({
                open: prevY,
                close: currY,
                high: haut,
                low: bas,
                date: pts[i].date,
                idx: i
              });
            }
          } else {
            var targetBougies = Math.min(pts.length, Math.max(5, Math.floor(LW / 22)));
            var tailleBucket = Math.max(1, Math.ceil(pts.length / targetBougies));
            for (var bi=0; bi<pts.length; bi+=tailleBucket) {
              var sl = pts.slice(bi, Math.min(bi+tailleBucket, pts.length));
              if (!sl.length) continue;
              bougies.push({
                open:  sl[0].y,
                close: sl[sl.length-1].y,
                high:  sl.reduce(function(m,p){return Math.max(m,p.y);},-Infinity),
                low:   sl.reduce(function(m,p){return Math.min(m,p.y);},Infinity),
                date:  sl[Math.floor(sl.length/2)].date,
                idx:   Math.floor((bi + bi+sl.length-1)/2)
              });
            }
          }

          var nbB = bougies.length;
          var largeurSlot = LW / Math.max(nbB, 1);
          var largeurCorps = Math.max(3, Math.min(largeurSlot * 0.65, 18));

          bougies.forEach(function(b, ci) {
            var cx = PAD.gauche + (ci + 0.5) * largeurSlot;
            var col = b.close >= b.open ? '#00C87A' : '#FF4E4E';
            var yHaut  = versY(b.high);
            var yBas   = versY(b.low);
            var yOpen  = versY(b.open);
            var yClose = versY(b.close);
            var hautCorps = Math.min(yOpen, yClose);
            var hauteurCorps = Math.max(4, Math.abs(yOpen - yClose));

            var hautMech = Math.min(yHaut, hautCorps);
            var basMech = Math.max(yBas, hautCorps + hauteurCorps);
            if (Math.abs(hautMech - basMech) < 3) {
              hautMech = Math.min(hautMech, hautCorps - 2);
              basMech = Math.max(basMech, hautCorps + hauteurCorps + 2);
            }

            svgGraph += '<line x1="'+cx.toFixed(1)+'" y1="'+hautMech.toFixed(1)+'" x2="'+cx.toFixed(1)+'" y2="'+basMech.toFixed(1)+'" stroke="'+col+'" stroke-width="1.5"/>';
            svgGraph += '<rect x="'+(cx-largeurCorps/2).toFixed(1)+'" y="'+hautCorps.toFixed(1)+'" width="'+largeurCorps.toFixed(1)+'" height="'+hauteurCorps.toFixed(1)+'" fill="'+col+'" stroke="'+col+'" stroke-width="0.5" rx="1"/>';
          });

          var pasX = Math.max(1, Math.floor(nbB/5));
          for (var ci=0; ci<nbB; ci+=pasX) {
            var cx = PAD.gauche + (ci + 0.5) * largeurSlot;
            var label = bougies[ci].date.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'});
            labelsX += '<text x="'+cx.toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle" fill="#555577" font-size="10">'+label+'</text>';
          }

        } else {
          var cheminLigne='', cheminZone='';
          pts.forEach(function(pt, i) {
            var x=versXdate(pt.date), y=versY(pt.y);
            if (i===0) { cheminLigne+='M'+x.toFixed(1)+' '+y.toFixed(1); cheminZone+='M'+x.toFixed(1)+' '+(PAD.haut+LH).toFixed(1)+' L'+x.toFixed(1)+' '+y.toFixed(1); }
            else        { cheminLigne+=' L'+x.toFixed(1)+' '+y.toFixed(1); cheminZone+=' L'+x.toFixed(1)+' '+y.toFixed(1); }
          });
          var dernierX = versXdate(pts[pts.length-1].date);
          cheminZone += ' L'+dernierX.toFixed(1)+' '+(PAD.haut+LH).toFixed(1)+' Z';

          svgGraph  = '<defs><linearGradient id="'+idGrad+'" x1="0" y1="0" x2="0" y2="1">';
          svgGraph += '<stop offset="0%" stop-color="'+coulLigne+'" stop-opacity="0.3"/>';
          svgGraph += '<stop offset="100%" stop-color="'+coulLigne+'" stop-opacity="0.03"/>';
          svgGraph += '</linearGradient></defs>';
          svgGraph += '<path d="'+cheminZone+'" fill="url(#'+idGrad+')" />';
          svgGraph += '<path d="'+cheminLigne+'" fill="none" stroke="'+coulLigne+'" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
          if (modeGraph === 'notes') {
            pts.forEach(function(pt) {
              var dc=couleurMoy((pt.y/surNum)*20);
              svgGraph += '<circle cx="'+versXdate(pt.date).toFixed(1)+'" cy="'+versY(pt.y).toFixed(1)+'" r="3" fill="'+dc+'" stroke="#1C1C2E" stroke-width="1"/>';
            });
          }

          var pasX2 = Math.max(1, Math.floor(pts.length/5));
          for (var xi=0; xi<pts.length; xi+=pasX2) {
            var xp=versXdate(pts[xi].date);
            labelsX += '<text x="'+xp.toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle" fill="#555577" font-size="10">'+pts[xi].date.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})+'</text>';
          }

          pts.forEach(function(pt, i) {
            var cx = versXdate(pt.date).toFixed(1);
            var cy = versY(pt.y).toFixed(1);
            var largeurHit = Math.max(12, LW / Math.max(pts.length, 1));
            survol += '<rect class="graph-hit" data-idx="'+i+'" x="'+(parseFloat(cx)-largeurHit/2).toFixed(1)+'" y="'+PAD.haut+'" width="'+largeurHit.toFixed(1)+'" height="'+LH+'" fill="transparent" style="cursor:crosshair;"/>';
          });
        }

        var dernierPt = pts[pts.length-1];
        var posYder = versY(dernierPt.y);
        var lastLabel = '<rect x="'+(PAD.gauche+LW+2)+'" y="'+(posYder-9).toFixed(1)+'" width="44" height="14" fill="'+coulLigne+'" rx="3"/>';
        lastLabel += '<text x="'+(PAD.gauche+LW+24)+'" y="'+(posYder+3).toFixed(1)+'" text-anchor="middle" fill="#000" font-size="10" font-weight="700">'+dernierPt.y.toFixed(2)+'</text>';

        var curseur = '';
        if (vueGraph !== 'trading') {
          curseur += '<line id="graph-cross-v" x1="0" y1="'+PAD.haut+'" x2="0" y2="'+(PAD.haut+LH)+'" stroke="#ffffff44" stroke-width="1" stroke-dasharray="4,3" style="display:none;"/>';
          curseur += '<circle id="graph-cross-dot" cx="0" cy="0" r="5" fill="'+coulLigne+'" stroke="white" stroke-width="2" style="display:none;"/>';
          curseur += '<g id="graph-tooltip" style="display:none;">';
          curseur += '<rect id="graph-tt-bg" x="0" y="0" width="110" height="38" rx="5" fill="#1C1C2E" stroke="#2C2C44" stroke-width="1"/>';
          curseur += '<text id="graph-tt-val" x="0" y="0" fill="white" font-size="13" font-weight="700"></text>';
          curseur += '<text id="graph-tt-date" x="0" y="0" fill="#8E8E93" font-size="10"></text>';
          curseur += '</g>';
        }

        var variation = pts.length > 1 ? dernierPt.y - pts[0].y : 0;
        var pctVar = pts.length > 1 ? ((variation / Math.max(0.01,pts[0].y))*100) : 0;
        var varTexte = (variation >= 0 ? '+' : '') + variation.toFixed(2) + ' (' + (pctVar >= 0 ? '+' : '') + pctVar.toFixed(1) + '%)';
        var varCoul = variation >= 0 ? '#00C87A' : '#FF4E4E';

        var svgFinal = '<svg id="graph-svg" width="'+L+'" height="'+H+'" style="display:block;overflow:visible;">'
          + grille + labelsX + svgGraph
          + (vueGraph !== 'trading' ? survol : '')
          + lastLabel + curseur
          + '</svg>';

        conteneur.innerHTML = [
          '<div style="background:#1C1C2E;border-radius:8px;padding:16px 16px 8px 16px;margin-top:8px;">',
          '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px;">',
            '<div>',
              '<div style="font-size:11px;color:#8E8E93;text-transform:uppercase;margin-bottom:2px;">',
                modeGraph === 'moyenne' ? 'Evolution moyenne generale' : 'Notes individuelles',
              '</div>',
              '<div style="display:flex;align-items:baseline;gap:8px;">',
                '<span id="graph-header-val" style="font-size:22px;font-weight:700;color:white;">',dernierPt.y.toFixed(2),'</span>',
                '<span id="graph-header-change" style="font-size:13px;color:',varCoul,';">',varTexte,'</span>',
              '</div>',
            '</div>',
            '<div style="display:flex;gap:6px;flex-wrap:wrap;">',
              ['trim','7d','1m','3m','1y'].map(function(p) {
                return '<button class="graph-periode-btn" data-periode="'+p+'" style="padding:4px 10px;border:none;border-radius:5px;font-size:11px;font-weight:600;cursor:pointer;background:'+(periode===p?'#5E5EFF':'#2C2C44')+';color:'+(periode===p?'white':'#8E8E93')+';">'+p.toUpperCase()+'</button>';
              }).join(''),
              '<div style="width:1px;height:16px;background:#2C2C44;margin:0 2px;"></div>',
              '<button class="graph-mode-btn" data-mode="moyenne" style="padding:4px 10px;border:none;border-radius:5px;font-size:11px;font-weight:600;cursor:pointer;background:'+(modeGraph==='moyenne'?'#5E5EFF':'#2C2C44')+';color:'+(modeGraph==='moyenne'?'white':'#8E8E93')+';">Moy.</button>',
              '<button class="graph-mode-btn" data-mode="notes" style="padding:4px 10px;border:none;border-radius:5px;font-size:11px;font-weight:600;cursor:pointer;background:'+(modeGraph==='notes'?'#5E5EFF':'#2C2C44')+';color:'+(modeGraph==='notes'?'white':'#8E8E93')+';">Notes</button>',
              '<div style="width:1px;height:16px;background:#2C2C44;margin:0 2px;"></div>',
              '<button class="graph-vue-btn" data-vue="normal" style="padding:4px 10px;border:none;border-radius:5px;font-size:11px;font-weight:600;cursor:pointer;background:'+(vueGraph==='normal'?'#5E5EFF':'#2C2C44')+';color:'+(vueGraph==='normal'?'white':'#8E8E93')+';">Ligne</button>',
              '<button class="graph-vue-btn" data-vue="trading" style="padding:4px 10px;border:none;border-radius:5px;font-size:11px;font-weight:600;cursor:pointer;background:'+(vueGraph==='trading'?'#5E5EFF':'#2C2C44')+';color:'+(vueGraph==='trading'?'white':'#8E8E93')+';">Trading</button>',
            '</div>',
          '</div>',
          '<div style="overflow:hidden;">',svgFinal,'</div>',
          '</div>'
        ].join('');

        conteneur.querySelectorAll('.graph-periode-btn').forEach(function(btn){
          btn.addEventListener('click',function(){ periode=this.dataset.periode; idxTooltip=null; dessiner(); });
        });
        conteneur.querySelectorAll('.graph-mode-btn').forEach(function(btn){
          btn.addEventListener('click',function(){ modeGraph=this.dataset.mode; idxTooltip=null; dessiner(); });
        });
        conteneur.querySelectorAll('.graph-vue-btn').forEach(function(btn){
          btn.addEventListener('click',function(){ vueGraph=this.dataset.vue; idxTooltip=null; dessiner(); });
        });

        if (vueGraph !== 'trading') {
          var crossV = document.getElementById('graph-cross-v');
          var crossDot = document.getElementById('graph-cross-dot');
          var ttGroup = document.getElementById('graph-tooltip');
          var ttBg = document.getElementById('graph-tt-bg');
          var ttVal = document.getElementById('graph-tt-val');
          var ttDate = document.getElementById('graph-tt-date');
          var headerVal = document.getElementById('graph-header-val');

          function montrerTooltip(idx) {
            if (!pts[idx]) return;
            idxTooltip = idx;
            var pt = pts[idx];
            var cx = versXdate(pt.date);
            var cy = versY(pt.y);

            if (crossV) { crossV.setAttribute('x1', cx.toFixed(1)); crossV.setAttribute('x2', cx.toFixed(1)); crossV.style.display = ''; }
            if (crossDot) { crossDot.setAttribute('cx', cx.toFixed(1)); crossDot.setAttribute('cy', cy.toFixed(1)); crossDot.style.display = ''; }

            var ttW = 120, ttH = 38;
            var ttX = cx + 10; var ttY = cy - 20;
            if (ttX + ttW > L - PAD.droite) ttX = cx - ttW - 10;
            if (ttY < PAD.haut) ttY = PAD.haut + 4;

            if (ttGroup) {
              ttGroup.style.display = '';
              ttBg.setAttribute('x', ttX); ttBg.setAttribute('y', ttY); ttBg.setAttribute('width', ttW); ttBg.setAttribute('height', ttH);
              ttVal.setAttribute('x', ttX + 8); ttVal.setAttribute('y', ttY + 16);
              ttVal.textContent = pt.y.toFixed(2) + (modeGraph==='notes' && pt.brut ? ' ('+pt.brut+')' : '');
              ttDate.setAttribute('x', ttX + 8); ttDate.setAttribute('y', ttY + 30);
              ttDate.textContent = pt.date.toLocaleDateString('fr-FR', {day:'2-digit',month:'2-digit',year:'2-digit'}) + (pt.label ? ' · ' + pt.label.substring(0,12) : '');
            }
            if (headerVal) { headerVal.textContent = pt.y.toFixed(2); }
          }

          function cacherTooltip() {
            idxTooltip = null;
            if (crossV) crossV.style.display = 'none';
            if (crossDot) crossDot.style.display = 'none';
            if (ttGroup) ttGroup.style.display = 'none';
            if (headerVal) headerVal.textContent = dernierPt.y.toFixed(2);
          }

          conteneur.querySelectorAll('.graph-hit').forEach(function(rect) {
            rect.addEventListener('mouseover', function() { montrerTooltip(parseInt(this.dataset.idx)); });
            rect.addEventListener('mouseleave', cacherTooltip);
            rect.addEventListener('click', function() { montrerTooltip(parseInt(this.dataset.idx)); });
          });
        }
      }

      dessiner();
      var timerRedim;
      window.addEventListener('resize', function() {
        clearTimeout(timerRedim);
        timerRedim = setTimeout(function() {
          if (document.getElementById('graph-container')) dessiner();
        }, 150);
      });
    }

    function voirNotesMatiere(matiere) {
      var cont = document.getElementById('ed-content');
      if (!cont) return;
      vuePrec = 'notes';
      var notesMatiere = notesOrig.filter(function(n) { return n.libelleMatiere===matiere && n.codePeriode===triActuel; });
      var affichageTri = notesMatiere.length > 0 ? tris[triActuel].nom : 'Toutes les periodes';
      if (!notesMatiere.length) notesMatiere = notesOrig.filter(function(n) { return n.libelleMatiere===matiere; });

      var html = '<div style="margin-bottom:20px;">';
      html += '<button id="retour-notes" style="background:#2C2C44;border:none;color:white;padding:8px 16px;border-radius:6px;cursor:pointer;margin-bottom:16px;">← Retour aux notes</button>';
      html += '<div style="background:#1C1C2E;border-radius:8px;padding:20px;margin-bottom:16px;">';
      html += '<h2 style="color:#5E5EFF;margin-bottom:4px;">'+matiere+'</h2>';
      html += '<p style="color:#8E8E93;">'+affichageTri+'</p></div>';
      html += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">';
      html += '<button id="ajoutSimuBtn" style="background:#FFA500;border:none;padding:8px 14px;border-radius:6px;color:white;font-size:13px;font-weight:600;cursor:pointer;">+ Note simulée</button>';
      html += '<button id="viderSimuBtn" style="background:#FF2D2D;border:none;padding:8px 14px;border-radius:6px;color:white;font-size:13px;font-weight:600;cursor:pointer;">Effacer toutes les simulées</button>';
      html += '</div>';
      if (notesMatiere.length === 0 && (!simu[matiere]||!simu[matiere].length)) {
        html += '<div class="empty-state"><p>Aucune note</p></div>';
      } else {
        html += '<div style="background:#1C1C2E;border-radius:8px;overflow:hidden;">';
        var masques = cache[matiere] || [];
        for (var i=0;i<notesMatiere.length;i++) {
          var grade=notesMatiere[i], gv=grade.valeur, ns=grade.noteSur||20, isNS=grade.nonSignificatif===true, ov=parseFloat(gv.replace(',','.'));
          var coul=couleurMoy(ov/ns*20), dateStr=grade.date||grade.dateSaisie, fd=dateStr?new Date(dateStr).toLocaleDateString('fr-FR'):'Date inconnue';
          var commentDecode=decodeTexte(grade.commentaire||'');
          var dv=gv, dm=ns;
          if (sur!=='20'&&!isNS) { var nm=parseFloat(sur); dv=((ov/ns)*nm).toFixed(2).replace('.',','); dm=sur; }
          var estMasque = masques.includes(i);
          html += '<div style="padding:14px 18px;border-bottom:1px solid #2C2C44;display:flex;justify-content:space-between;align-items:center;'+(estMasque?'opacity:0.4;':'') +'">';
          html += '<div>';
          html += '<div style="font-size:15px;font-weight:600;color:#FFFFFF;margin-bottom:2px;">'+(isNS?'('+gv+'/'+ns+')':dv+'/'+dm)+(estMasque?' <span style="font-size:10px;color:#FF6B6B;background:rgba(255,107,107,0.15);padding:1px 6px;border-radius:4px;">masqué</span>':'')+'</div>';
          if (profNom&&grade.professeurs&&grade.professeurs.length>0) { var p=grade.professeurs[0]; html += '<div style="font-size:11px;color:#5E5EFF;">'+(p.prenom?p.prenom.charAt(0)+'. ':'')+p.nom+'</div>'; }
          html += '<div style="font-size:11px;color:#8E8E93;">'+fd+'</div>';
          if (commentDecode) html += '<div style="font-size:12px;color:#B3B3D2;margin-top:6px;">'+commentDecode+'</div>';
          html += '</div>';
          html += '<div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:6px;">';
          html += '<div style="font-size:22px;font-weight:700;color:'+coul+';"> '+(isNS?'('+gv+')':dv)+'</div>';
          html += '<div style="font-size:10px;color:#8E8E93;">Coeff. '+(grade.coef||1)+'</div>';
          html += '<button class="masquer-note-btn" data-subject="'+matiere.replace(/"/g,'&quot;')+'" data-index="'+i+'" style="background:'+(estMasque?'rgba(94,94,255,0.2)':'rgba(255,107,107,0.15)')+';border:none;color:'+(estMasque?'#5E5EFF':'#FF6B6B')+';padding:3px 8px;border-radius:5px;font-size:11px;cursor:pointer;">'+(estMasque?'Démasquer':'Masquer')+'</button>';
          html += '</div></div>';
        }

        var simGrades=simu[matiere]||[], enabSim=simuAct[matiere]||[];
        for (var s=0;s<simGrades.length;s++) {
          var sim=simGrades[s], sp=(parseFloat(sim.value)/parseFloat(sim.max))*20, sc=couleurMoy(sp);
          var estActif=enabSim[s]!==false;
          html += '<div class="sim-grade-row" data-subject="'+matiere.replace(/"/g,'&quot;')+'" data-simidx="'+s+'" style="padding:14px 18px;border-bottom:1px solid #2C2C44;display:flex;justify-content:space-between;align-items:center;background:rgba(255,165,0,0.05);">';
          html += '<div><div style="font-size:15px;font-weight:600;color:#FFA500;">'+sim.value+'/'+sim.max+' <span style="font-size:11px;color:#8E8E93;font-style:italic;">Simulée</span></div>';
          html += '<div style="font-size:11px;color:#8E8E93;">coeff. '+sim.coef+'</div></div>';
          html += '<div style="text-align:right;display:flex;align-items:center;gap:10px;">';
          html += '<label style="font-size:12px;color:#8E8E93;cursor:pointer;display:flex;align-items:center;gap:4px;"><input type="checkbox" class="sim-active-cb" data-subject="'+matiere.replace(/"/g,'&quot;')+'" data-simidx="'+s+'" '+(estActif?'checked':'')+' style="cursor:pointer;"> Activer</label>';
          html += '<span style="font-size:20px;font-weight:700;color:'+sc+';">'+sim.value+'</span>';
          html += '<button class="sim-suppr-btn" data-subject="'+matiere.replace(/"/g,'&quot;')+'" data-simidx="'+s+'" style="background:rgba(255,45,45,0.15);border:none;color:#FF4444;padding:4px 10px;border-radius:5px;font-size:13px;cursor:pointer;">✕</button>';
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
          if (confirm('Supprimer cette note simulée ?')) {
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
        if (confirm('Effacer toutes les notes simulées pour cette matière ?')) {
          simu[matiere]=[]; simuAct[matiere]=[];
          localStorage.setItem('ed_simulatedGrades',JSON.stringify(simu));
          localStorage.setItem('ed_enabledSimulated',JSON.stringify(simuAct));
          voirNotesMatiere(matiere);
        }
      });
    }

    function modalAjoutSimu(matiere) {
      var modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10000001;display:flex;align-items:center;justify-content:center;';
      var contenu = document.createElement('div');
      contenu.style.cssText = 'background:#1C1C2E;border-radius:8px;padding:24px;max-width:380px;width:90%;';
      contenu.innerHTML = `<h2 style="color:#FFA500;margin-bottom:14px;">Note simulée</h2>
        <div style="margin-bottom:10px;"><label style="color:white;display:block;margin-bottom:3px;">Note obtenue</label>
        <input type="number" id="simValeur" step="0.01" min="0" style="width:100%;padding:8px;background:#0B0B1A;border:1px solid #2C2C44;border-radius:6px;color:white;"></div>
        <div style="margin-bottom:10px;"><label style="color:white;display:block;margin-bottom:3px;">Note sur</label>
        <input type="number" id="simMax" step="0.01" min="0" value="20" style="width:100%;padding:8px;background:#0B0B1A;border:1px solid #2C2C44;border-radius:6px;color:white;"></div>
        <div style="margin-bottom:10px;"><label style="color:white;display:block;margin-bottom:3px;">Coefficient</label>
        <input type="number" id="simCoef" step="0.01" min="0" value="1" style="width:100%;padding:8px;background:#0B0B1A;border:1px solid #2C2C44;border-radius:6px;color:white;"></div>
        <div style="display:flex;gap:10px;margin-top:14px;">
          <button id="simSauve" style="flex:1;padding:10px;background:#FFA500;border:none;border-radius:6px;color:white;font-weight:600;cursor:pointer;">Ajouter</button>
          <button id="simAnnule" style="flex:1;padding:10px;background:#2C2C44;border:none;border-radius:6px;color:white;cursor:pointer;">Annuler</button>
        </div>`;
      modal.appendChild(contenu); document.body.appendChild(modal);
      modal.onclick = function(e) { if (e.target===modal) modal.remove(); };
      document.getElementById('simAnnule').addEventListener('click', function() { modal.remove(); });
      document.getElementById('simSauve').addEventListener('click', function() {
        var val=parseFloat(document.getElementById('simValeur').value), max=parseFloat(document.getElementById('simMax').value), coef=parseFloat(document.getElementById('simCoef').value);
        if (isNaN(val)||isNaN(max)||isNaN(coef)) { alert('invalide'); return; }
        if (val<0||max<=0||coef<=0) { alert('faut pas abuser quand meme'); return; }
        if (val>max) { alert('La note ne peut dépasser le max'); return; }
        if (!simu[matiere]) simu[matiere]=[];
        if (!simuAct[matiere]) simuAct[matiere]=[];
        simu[matiere].push({value:val,max:max,coef:coef});
        simuAct[matiere].push(true);
        localStorage.setItem('ed_simulatedGrades',JSON.stringify(simu));
        localStorage.setItem('ed_enabledSimulated',JSON.stringify(simuAct));
        modal.remove(); voirNotesMatiere(matiere);
      });
    }

    window.basculerDesact = function(matiere, desactive) {
      if (desactive) desact[matiere]=true; else delete desact[matiere];
      localStorage.setItem('ed_disabledGrades',JSON.stringify(desact));
      notes();
    };

              function devoirs() {
                var cont = document.getElementById('ed-content');
                if (!cont) return;
                cont.innerHTML = '';
                var dates = Object.keys(cahier).sort();
                var aTaches = false;
                var html = '<div>';
                for (var d=0;d<dates.length;d++) {
                  var dateKey=dates[d], taches=cahier[dateKey], formate=formaterDate(dateKey);
                  var nonFait=[], fait=[];
                  for (var i=0;i<taches.length;i++) { if (taches[i].effectue===false) nonFait.push(taches[i]); else fait.push(taches[i]); }
                  var toutes = nonFait.concat(fait);
                  if (toutes.length > 0) {
                    aTaches = true;
                    html += '<div style="margin-bottom:16px;">';
                    html += '<div class="date-pill" data-date="'+dateKey+'" style="background:#1C1C2E;border-radius:8px;padding:12px 16px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">';
                    html += '<div><span style="font-weight:700;color:#5E5EFF;">'+formate.jour+'</span><span style="color:#8E8E93;margin-left:10px;font-size:13px;">'+formate.date+'</span></div>';
                    html += '<div style="background:#2C2C44;padding:3px 8px;border-radius:6px;font-size:11px;color:#FFFFFF;">'+toutes.length+' devoir(s)</div></div>';
                    html += '<div style="margin-left:10px;">';
                    for (var i=0;i<toutes.length;i++) {
                      var tache=toutes[i], fait=(tache.effectue===true), type=tache.interrogation?"Interrogation":"Devoir";
                      var brut=typeof tache.contenu==='string'?tache.contenu:typeof tache.aFaire==='string'?tache.aFaire:'';
                      var tacheContenu=decodeTexte(brut);
                      var bordure=fait?'4px solid #5E5EFF':(tache.isAnnule?'none':'4px solid #FFB340');
                      var matiereNom = tache.matiere || '';
                      html += '<div class="task-card" data-date="'+dateKey+'" data-matiere="'+matiereNom.replace(/"/g,'&quot;')+'" style="border:'+bordure+';background:#1C1C2E;border-radius:8px;padding:14px;margin-bottom:10px;cursor:pointer;">';
                      html += '<div class="task-meta"><div><strong style="color:#FFFFFF;">'+tache.matiere+'</strong> <span class="task-badge" style="background:rgba(94,94,255,0.15);color:#5E5EFF;padding:3px 8px;border-radius:4px;font-size:10px;">'+type+'</span></div>';
                      html += '<div><span style="color:'+(fait?'#5E5EFF':'#FFB340')+';font-size:12px;font-weight:500;">'+(fait?'FAIT':'A FAIRE')+'</span></div></div>';
                      if (tacheContenu) html += '<div class="task-content" style="color:#B3B3D2;font-size:13px;line-height:1.5;margin-top:8px;">'+tacheContenu+'</div>';
                      html += '</div>';
                    }
                    html += '</div></div>';
                  }
                }
                if (!aTaches) html += '<div class="empty-state"><p>Aucun devoir à venir</p></div>';
                html += '</div>';
                cont.innerHTML = html;
                
                document.querySelectorAll('#ed-content .date-pill').forEach(function(el) {
                  el.addEventListener('click', function(e) {
                    e.stopPropagation();
                    voirJour(this.getAttribute('data-date'));
                  });
                });
                
                document.querySelectorAll('#ed-content .task-card').forEach(function(el) {
                  el.addEventListener('click', function(e) {
                    var dateKey = this.getAttribute('data-date');
                    if (dateKey) {
                      voirJour(dateKey);
                    }
                  });
                });
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
          var jours = ["DIMANCHE","LUNDI","MARDI","MERCREDI","JEUDI","VENDREDI","SAMEDI"];
          var mois = ["JANVIER","FEVRIER","MARS","AVRIL","MAI","JUIN","JUILLET","AOUT","SEPTEMBRE","OCTOBRE","NOVEMBRE","DECEMBRE"];
          return jours[d.getDay()] + " " + d.getDate() + " " + mois[d.getMonth()];
        }
        
        function getSignature(msg) { return Array.isArray(msg.signature) ? msg.signature[0] : msg.signature; }

        var html = '<div>';
        html += '<div style="margin-bottom:16px;position:sticky;top:0;background:#0B0B1A;padding:8px 0;z-index:10;">';
        html += '<div style="display:flex;gap:10px;align-items:center;background:#1C1C2E;border-radius:8px;padding:6px 12px;">';
        html += '<span style="color:#8E8E93;">🔍</span>';
        html += '<input type="text" id="carnet2Recherche" placeholder="Rechercher..." style="flex:1;background:transparent;border:none;color:white;outline:none;">';
        html += '<button id="carnet2Effacer" style="background:#2C2C44;border:none;color:#8E8E93;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:11px;">Effacer</button></div>';
        html += '<div style="display:flex;gap:6px;margin-top:6px;">';
        html += '<button class="filtre2-btn" data-filtre="all" style="background:#2C2C44;border:none;color:#5E5EFF;padding:5px 10px;border-radius:6px;cursor:pointer;">Tous</button>';
        html += '<button class="filtre2-btn" data-filtre="unsigned" style="background:#2C2C44;border:none;color:#FFB340;padding:5px 10px;border-radius:6px;cursor:pointer;">Non signés</button>';
        html += '<button class="filtre2-btn" data-filtre="signed" style="background:#2C2C44;border:none;color:#5E5EFF;padding:5px 10px;border-radius:6px;cursor:pointer;">Signés</button>';
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
          if (!filtrees.length) {
            divMsg.innerHTML = '<div class="empty-state"><p>Aucun message trouvé</p></div>';
            return;
          }
          var h = '';
          for (var i = 0; i < filtrees.length; i++) {
            var msg = filtrees[i];
            var auteur = msg.auteur || {};
            var signe = estSigne(msg);
            var aOpt = aSignature(msg);
            var sig = getSignature(msg);
            var an = (auteur.nom || "") + " " + (auteur.prenom || "");
            var contenuPropre = decodeTexte(msg.contenu || "");
            h += '<div class="carnet2-card" style="background:#1C1C2E;border-radius:8px;padding:16px;margin-bottom:12px;">';
            h += '<div style="display:flex;justify-content:space-between;margin-bottom:10px;">';
            h += '<div><strong style="color:#5E5EFF;">' + an + '</strong> <span style="color:#8E8E93;font-size:11px;">(' + (msg.type || "") + ')</span></div>';
            h += '<div style="color:#8E8E93;font-size:11px;">' + dateCourte(msg.dateCreation || "") + '</div></div>';
            h += '<div style="color:#E0E0E0;font-size:13px;line-height:1.5;margin-bottom:10px;">' + contenuPropre + '</div>';
            h += '<div style="margin-top:10px;">';
            if (signe && sig) {
              var sd = sig.dateValidation || sig.datevalidation || "";
              h += '<span style="color:#5E5EFF;font-size:11px;">✓ Signé par ' + (sig.nom || "") + " " + (sig.prenom || "") + " le " + dateCourte(sd) + '</span>';
            } else if (aOpt) {
              h += '<span style="color:#FFB340;font-size:11px;">○ En attente de signature</span>';
            }
            h += '</div></div>';
          }
          divMsg.innerHTML = h;
        }
        
        var inp = document.getElementById('carnet2Recherche');
        var eff = document.getElementById('carnet2Effacer');
        
        function majCarnet2() {
          afficherCarnet2(inp ? inp.value : "", filtreActuel);
        }
        
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
            var rep = await fetch(`https://api.ecoledirecte.com/v3/eleves/${id}/eleveCarnetCorrespondance.awp?verbe=get&v=4.98.0`, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Token": tok },
              body: "data=" + encodeURIComponent(JSON.stringify({}))
            });
            var json = await rep.json();
            if (json.code === 200 && json.data && json.data.correspondances) {
              carnet2.correspondances = json.data.correspondances;
              afficherCarnet2UI();
            } else {
              cont.innerHTML = '<div class="empty-state"><p>Aucun message trouvé</p></div>';
            }
          } catch(e) {
            cont.innerHTML = '<div class="empty-state"><p>Erreur de chargement</p></div>';
          }
        })();
      } else {
        afficherCarnet2UI();
      }
    }

          function edt() {
            var cont = document.getElementById('ed-content');
            if (!cont) return;
            var vue = 'jour';
            var dateChoisie = new Date();
            var debutSemaine = getJoursSemaine(new Date())[0];
            
            function formatHeure(str) {
              var d = new Date(str);
              return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
            }
            
            function minutesDepuis(t) {
              var p = t.split(':');
              return parseInt(p[0]) * 60 + parseInt(p[1]);
            }
            
            function heureDepuisMinutes(m) {
              return Math.floor(m / 60).toString().padStart(2, '0') + ':' + (m % 60).toString().padStart(2, '0');
            }
            
            function getJoursSemaine(date) {
              var jrs = [], lun = new Date(date);
              var jour = lun.getDay();
              var diff = lun.getDate() - jour + (jour === 0 ? -6 : 1);
              lun.setDate(diff);
              for (var i = 0; i < 5; i++) {
                var dd = new Date(lun);
                dd.setDate(lun.getDate() + i);
                jrs.push(dd);
              }
              return jrs;
            }
            
            async function fetchEdt(debut, fin) {
              try {
                var rep = await fetch(`https://api.ecoledirecte.com/v3/E/${id}/emploidutemps.awp?verbe=get&v=4.98.0`, {
                  method: "POST",
                  headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Token": tok },
                  body: "data=" + encodeURIComponent(JSON.stringify({ dateDebut: debut.toISOString().split('T')[0], dateFin: fin.toISOString().split('T')[0], avecTrous: true }))
                });
                var json = await rep.json();
                return json.code === 200 && Array.isArray(json.data) ? json.data : [];
              } catch(e) {
                return [];
              }
            }
            
            function getCreneauxAvecTrous(cours) {
              if (!cours || !cours.length) return [];
              
              var tries = cours.slice().sort(function(a, b) {
                return minutesDepuis(a.start_date.split(' ')[1]) - minutesDepuis(b.start_date.split(' ')[1]);
              });
              
              var reels = tries.filter(function(c) {
                return c.matiere && c.matiere !== "Pas de cours" && c.matiere.trim() !== "";
              });
              
              if (!reels.length) return [];
              
              var fusion = [], cur = reels[0];
              var curFin = minutesDepuis(cur.end_date.split(' ')[1]);
              for (var i = 1; i < reels.length; i++) {
                var next = reels[i];
                var nextStart = minutesDepuis(next.start_date.split(' ')[1]);
                var gap = nextStart - curFin;
                if (cur.matiere === next.matiere && cur.prof === next.prof && cur.salle === next.salle && gap <= 5) {
                  cur.end_date = next.end_date;
                  curFin = minutesDepuis(cur.end_date.split(' ')[1]);
                } else {
                  fusion.push(cur);
                  cur = next;
                  curFin = minutesDepuis(cur.end_date.split(' ')[1]);
                }
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
                    creneaux.push({
                      start: heureDepuisMinutes(prevFin),
                      end: heureDepuisMinutes(sm),
                      type: typeGap,
                      duree: gap,
                      cours: []
                    });
                  }
                }
                
                creneaux.push({
                  start: st,
                  end: et,
                  type: "cours",
                  duree: em - sm,
                  cours: [c]
                });
                prevFin = em;
              }
              
              return creneaux;
            }
            
            function afficherJour(cours, date) {
              var coursJour = cours.filter(function(c) {
                return c.start_date.split(' ')[0] === date.toISOString().split('T')[0];
              });
              var creneaux = getCreneauxAvecTrous(coursJour);
              var jours = ["DIMANCHE", "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
              var mois = ["JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE"];
              
              var h = '<div style="margin-bottom:16px;">';
              h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">';
              h += '<div style="background:#1C1C2E;border-radius:8px;padding:10px 16px;"><span style="font-weight:700;color:#5E5EFF;">' + jours[date.getDay()] + '</span><span style="color:#8E8E93;margin-left:10px;font-size:13px;">' + date.getDate() + ' ' + mois[date.getMonth()] + ' ' + date.getFullYear() + '</span></div>';
              h += '<div style="display:flex;gap:10px;"><button id="jourPrec" style="background:#2C2C44;border:none;color:white;padding:8px 14px;border-radius:6px;cursor:pointer;">← Précédent</button><button id="jourSuiv" style="background:#2C2C44;border:none;color:white;padding:8px 14px;border-radius:6px;cursor:pointer;">Suivant →</button></div></div>';
              
              if (!creneaux.length) {
                h += '<div style="background:#1C1C2E;border-radius:8px;padding:32px;text-align:center;color:#8E8E93;">Aucun cours aujourd\'hui</div>';
              } else {
                for (var i = 0; i < creneaux.length; i++) {
                  var slot = creneaux[i];
                  
                  if (slot.type === "cours") {
                    var c = slot.cours[0];
                    var estAnn = c.isAnnule === true;
                    var maintenant = new Date();
                    var estMaintenant = (date.toDateString() === maintenant.toDateString() && slot.start <= formatHeure(maintenant) && slot.end >= formatHeure(maintenant));
                    var hauteur = Math.max(56, (slot.duree / 60) * 68);
                    var coulBg = estAnn ? '#FF2D2D' : estMaintenant ? '#5E5EFF' : '#1C1C2E';
                    
                    h += '<div style="background:' + coulBg + ';border-radius:8px;padding:10px 14px;margin-bottom:3px;height:' + hauteur + 'px;display:flex;align-items:center;">';
                    h += '<div style="width:70px;"><div style="color:white;font-size:12px;font-weight:500;">' + slot.start + '</div><div style="color:white;font-size:10px;">' + slot.end + '</div></div>';
                    h += '<div style="flex:1;"><div style="font-weight:600;color:white;font-size:14px;">' + (c.text || c.matiere) + '</div>';
                    h += '<div style="display:flex;gap:12px;margin-top:4px;">';
                    if (c.prof) h += '<div style="color:white;font-size:11px;">' + c.prof + '</div>';
                    if (c.salle) h += '<div style="color:white;font-size:11px;">' + c.salle + '</div>';
                    if (estAnn) h += '<div style="color:white;font-size:11px;">Annulé</div>';
                    h += '</div></div></div>';
                  } else if (slot.type === "intercours") {
                    h += '<div style="height:2px;background:transparent;"></div>';
                  } else if (slot.type === "recre") {
                    var hauteurRecre = Math.max(16, (slot.duree / 60) * 36);
                    h += '<div style="height:' + hauteurRecre + 'px;"></div>';
                  } else if (slot.type === "pause") {
                    var hauteurPause = Math.max(48, (slot.duree / 60) * 56);
                    h += '<div style="height:' + hauteurPause + 'px;"></div>';
                  }
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
              h += '<div style="background:#1C1C2E;border-radius:8px;padding:10px 16px;"><span style="font-weight:700;color:#5E5EFF;">Semaine du ' + joursSem[0].getDate() + ' ' + mois[joursSem[0].getMonth()] + '</span></div>';
              h += '<div style="display:flex;gap:10px;"><button id="semPrec" style="background:#2C2C44;border:none;color:white;padding:8px 14px;border-radius:6px;cursor:pointer;">← Précédente</button><button id="semSuiv" style="background:#2C2C44;border:none;color:white;padding:8px 14px;border-radius:6px;cursor:pointer;">Suivante →</button></div></div>';
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
                  if (slot.type === "cours") {
                    hauteurTotale += Math.max(56, (slot.duree / 60) * 68) + 3;
                  } else if (slot.type === "intercours") {
                    hauteurTotale += 2;
                  } else if (slot.type === "recre") {
                    hauteurTotale += Math.max(16, (slot.duree / 60) * 36);
                  } else if (slot.type === "pause") {
                    hauteurTotale += Math.max(48, (slot.duree / 60) * 56);
                  }
                }
                hauteurTotale = Math.max(hauteurTotale, 400);
                
                h += '<div style="background:#1C1C2E;border-radius:8px;padding:12px;border:1px solid ' + (estAuj ? '#5E5EFF' : '#2C2C44') + ';min-height:' + hauteurTotale + 'px;display:flex;flex-direction:column;">';
                h += '<div style="font-weight:700;color:#5E5EFF;margin-bottom:10px;">' + jours[i] + '<span style="color:#8E8E93;margin-left:6px;">' + dd.getDate() + '</span></div>';
                
                if (!creneaux.length) {
                  h += '<div style="flex:1;display:flex;align-items:center;justify-content:center;color:#8E8E93;font-size:12px;">Aucun cours</div>';
                } else {
                  h += '<div style="flex:1;overflow-y:auto;">';
                  for (var s = 0; s < creneaux.length; s++) {
                    var slot = creneaux[s];
                    
                    if (slot.type === "cours") {
                      var c = slot.cours[0];
                      var estAnn = c.isAnnule === true;
                      var hauteur = Math.max(56, (slot.duree / 60) * 68);
                      
                      h += '<div style="background:' + (estAnn ? '#FF2D2D' : '#0B0B1A') + ';border-radius:6px;padding:8px;margin-bottom:6px;height:' + hauteur + 'px;">';
                      h += '<div style="font-size:10px;color:#FFFFFF;margin-bottom:4px;">' + slot.start + '-' + slot.end + '</div>';
                      h += '<div style="font-size:12px;font-weight:500;color:#FFFFFF;">' + (c.text || c.matiere) + '</div>';
                      if (c.salle) h += '<div style="font-size:10px;color:#8E8E93;margin-top:2px;">' + c.salle + '</div>';
                      if (estAnn) h += '<div style="font-size:10px;color:#FF5E5E;margin-top:2px;">Annulé</div>';
                      h += '</div>';
                    } else if (slot.type === "intercours") {
                      h += '<div style="height:2px;"></div>';
                    } else if (slot.type === "recre") {
                      var hr = Math.max(16, (slot.duree / 60) * 36);
                      h += '<div style="height:' + hr + 'px;"></div>';
                    } else if (slot.type === "pause") {
                      var hp = Math.max(48, (slot.duree / 60) * 56);
                      h += '<div style="height:' + hp + 'px;"></div>';
                    }
                  }
                  h += '</div>';
                }
                h += '</div>';
              }
              h += '</div></div>';
              return h;
            }
            
            var h = '<div style="display:flex;gap:10px;margin-bottom:20px;background:#1C1C2E;padding:6px;border-radius:8px;">';
            h += '<button id="vueJourBtn" style="flex:1;padding:10px;text-align:center;font-size:14px;font-weight:600;color:white;background:#5E5EFF;border:none;border-radius:6px;cursor:pointer;">Jour</button>';
            h += '<button id="vueSemaineBtn" style="flex:1;padding:10px;text-align:center;font-size:14px;font-weight:600;color:white;background:transparent;border:none;border-radius:6px;cursor:pointer;">Semaine</button>';
            h += '</div><div id="edtAffichage"></div>';
            cont.innerHTML = h;
            
            var affDiv = document.getElementById('edtAffichage');
            var btnJour = document.getElementById('vueJourBtn');
            var btnSem = document.getElementById('vueSemaineBtn');
            
            async function chargerJour() {
              var cours = await fetchEdt(new Date(dateChoisie), new Date(dateChoisie));
              affDiv.innerHTML = afficherJour(cours, dateChoisie);
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
            
            btnJour.addEventListener('click', function() {
              vue = 'jour';
              btnJour.style.background = '#5E5EFF';
              btnSem.style.background = 'transparent';
              dateChoisie = new Date();
              chargerJour();
            });
            
            btnSem.addEventListener('click', function() {
              vue = 'semaine';
              btnSem.style.background = '#5E5EFF';
              btnJour.style.background = 'transparent';
              debutSemaine = getJoursSemaine(new Date())[0];
              chargerSemaine();
            });
            
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
      
      function section(titre, coul, items, ligneFn) {
        if (!items.length) return '';
        var h = '<div style="background:#1C1C2E;border-radius:8px;padding:16px;margin-bottom:16px;">';
        h += '<h3 style="color:' + coul + ';margin-bottom:12px;">' + titre + '</h3>';
        for (var i = 0; i < items.length; i++) h += ligneFn(items[i]);
        return h + '</div>';
      }
      
      html += section("Absences", "#FF5E5E", absences, function(a) {
        return '<div style="border-bottom:1px solid #2C2C44;padding:10px 0;"><div><strong>' + a.displayDate + '</strong></div><div style="color:#8E8E93;font-size:12px;">' + a.libelle + '</div><div style="color:' + (a.justifie ? '#5E5EFF' : '#FFB340') + ';font-size:12px;">' + (a.justifie ? 'Justifiée' : 'Non justifiée') + '</div></div>';
      });
      
      html += section("Retards", "#FFB340", retards, function(r) {
        return '<div style="border-bottom:1px solid #2C2C44;padding:10px 0;"><strong>' + r.displayDate + '</strong><div style="color:#8E8E93;font-size:12px;">' + r.libelle + '</div><div style="color:' + (r.justifie ? '#5E5EFF' : '#FF5E5E') + ';font-size:12px;">' + (r.justifie ? 'Justifié' : 'Non justifié') + '</div></div>';
      });
      
      html += section("Absences cantine", "#FFB340", repas, function(rp) {
        return '<div style="border-bottom:1px solid #2C2C44;padding:10px 0;"><strong>' + rp.displayDate + '</strong><div style="color:#8E8E93;font-size:12px;">' + rp.libelle + '</div></div>';
      });
      
      html += section("Punitions", "#FF5E5E", punitions, function(p) {
        return '<div style="border-bottom:1px solid #2C2C44;padding:10px 0;"><strong>' + p.libelle + '</strong> - ' + p.date + '<div style="color:#E0E0E0;font-size:12px;">Par: ' + p.par + '</div>' + (p.motif ? '<div style="color:#8E8E93;font-size:12px;">' + p.motif + '</div>' : '') + '</div>';
      });
      
      html += section("Encouragements", "#5E5EFF", encouragements, function(e) {
        return '<div style="border-bottom:1px solid #2C2C44;padding:10px 0;"><strong>' + e.libelle + '</strong> - ' + e.date + (e.motif ? '<div style="color:#E0E0E0;font-size:12px;">' + e.motif + '</div>' : '') + '</div>';
      });
      
      if (!absences.length && !retards.length && !repas.length && !punitions.length && !encouragements.length) {
        html += '<div class="empty-state"><p>Aucune information de vie scolaire</p></div>';
      }
      html += '</div>';
      cont.innerHTML = html;
    }

    function messagerie() {
      var cont = document.getElementById('ed-content');
      if (!cont) return;
      cont.innerHTML = '';
      var recus = [], envoyes = [], brouillons = [], archives = [];
      var dossierActuel = "recus", recherche = "", pageActuelle = 1, parPage = 20, dossiersCharges = false;

      function chargerTousMessages() {
        cont.innerHTML = '<div style="color:#8E8E93;text-align:center;padding:40px;">Chargement...</div>';
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
          dossiersCharges = true;
          construireInterface();
        }).catch(function() { construireInterface(); });
      }

      function decodeBase64(str) {
        if (!str) return "";
        try {
          var b = atob(str), bytes = [];
          for (var i = 0; i < b.length; i++) bytes.push(b.charCodeAt(i) & 0xFF);
          return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
        } catch(e) { return str; }
      }

      function getExpediteur(msg) {
        if (dossierActuel === "envoyes" && msg.to && msg.to[0]) return (msg.to[0].prenom || "") + " " + (msg.to[0].nom || "");
        if (msg.from) return (msg.from.prenom || "") + " " + (msg.from.nom || "");
        return "";
      }

      function expediteurEstMasque(nom) {
        return expCache.indexOf(nom.trim()) !== -1;
      }

      function basculerMasqueExpediteur(nom) {
        nom = nom.trim();
        var idx = expCache.indexOf(nom);
        if (idx === -1) expCache.push(nom);
        else expCache.splice(idx, 1);
        localStorage.setItem('ed_maskedSenders', JSON.stringify(expCache));
      }

      function getMessagesDossier() {
        var msgs = [], tous = [].concat(recus, envoyes, brouillons, archives);
        if (dossierActuel === "masques") {
          msgs = tous.filter(function(msg) {
            var exped = "";
            if (msg.to && msg.to[0] && envoyes.indexOf(msg) !== -1) exped = (msg.to[0].prenom || "") + " " + (msg.to[0].nom || "");
            else if (msg.from) exped = (msg.from.prenom || "") + " " + (msg.from.nom || "");
            return expediteurEstMasque(exped);
          });
        } else {
          if (dossierActuel === "recus") msgs = recus.slice();
          else if (dossierActuel === "envoyes") msgs = envoyes.slice();
          else if (dossierActuel === "brouillons") msgs = brouillons.slice();
          else if (dossierActuel === "archives") msgs = archives.slice();
          msgs = msgs.filter(function(msg) { return !expediteurEstMasque(getExpediteur(msg)); });
        }
        return msgs.sort(function(a, b) { return new Date(b.date || 0) - new Date(a.date || 0); });
      }

      function voirDetailMessage(idMsg) {
        var detailDiv = document.getElementById('detailMessage');
        if (!detailDiv) return;
        detailDiv.innerHTML = '<div style="color:#8E8E93;text-align:center;padding:20px;">Chargement...</div>';
        var mode = dossierActuel === "envoyes" ? "expediteur" : dossierActuel === "brouillons" ? "brouillon" : "destinataire";
        fetch(`https://api.ecoledirecte.com/v3/eleves/${id}/messages/${idMsg}.awp?verbe=get&mode=${mode}&v=4.98.0`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Token": tok }, body: "data=" + encodeURIComponent(JSON.stringify({})) })
          .then(r => r.json()).then(function(json) {
            var msg = json.data;
            if (!msg) { detailDiv.innerHTML = '<div style="color:#FF5E5E;text-align:center;padding:20px;">Message non trouvé</div>'; return; }
            var contact = "";
            if (dossierActuel === "envoyes" && msg.to && msg.to[0]) contact = (msg.to[0].prenom || "") + " " + (msg.to[0].nom || "");
            else if (msg.from) contact = (msg.from.prenom || "") + " " + (msg.from.nom || "");
            contact = contact.trim();
            var expedMasque = expediteurEstMasque(contact);
            var date = (msg.date || "").replace(/-/g, '/').substring(0, 16);
            var contenuPropre = decodeBase64(msg.content || ""), sujet = msg.subject || "(Sans objet)", aPJ = msg.files && msg.files.length > 0;
            var h = '<div style="background:#1C1C2E;border-radius:8px;padding:20px;">';
            h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:10px;">';
            h += '<div style="display:flex;align-items:center;gap:10px;">';
            h += '<strong style="color:#5E5EFF;">' + contact + '</strong>';
            h += '<button class="toggle-exp-btn" data-exped="' + contact.replace(/"/g, '&quot;') + '" style="background:' + (expedMasque ? 'rgba(94,94,255,0.2)' : 'rgba(255,107,107,0.15)') + ';border:none;color:' + (expedMasque ? '#5E5EFF' : '#FF6B6B') + ';padding:3px 9px;border-radius:5px;font-size:11px;cursor:pointer;">' + (expedMasque ? 'Démasquer' : 'Masquer') + '</button>';
            h += '</div>';
            h += '<div style="color:#8E8E93;font-size:12px;">' + date + '</div></div>';
            h += '<div style="font-size:18px;font-weight:700;color:white;margin-bottom:16px;">' + sujet + '</div>';
            h += '<div style="color:#E0E0E0;line-height:1.6;">' + contenuPropre + '</div>';
            h += '</div>';
            detailDiv.innerHTML = h;
            var btnExp = detailDiv.querySelector('.toggle-exp-btn');
            if (btnExp) {
              btnExp.addEventListener('click', function() {
                var nomExp = this.getAttribute('data-exped');
                basculerMasqueExpediteur(nomExp);
                afficherMessages();
                var maintenantMasque = expediteurEstMasque(nomExp);
                this.textContent = maintenantMasque ? 'Démasquer' : 'Masquer';
                this.style.background = maintenantMasque ? 'rgba(94,94,255,0.2)' : 'rgba(255,107,107,0.15)';
                this.style.color = maintenantMasque ? '#5E5EFF' : '#FF6B6B';
                var btnMasque = document.getElementById('masques-folder-btn');
                if (btnMasque) {
                  var cnt = [].concat(recus, envoyes, brouillons, archives).filter(function(m) {
                    var s = "";
                    if (m.from) s = (m.from.prenom || "") + " " + (m.from.nom || "");
                    return expediteurEstMasque(s.trim());
                  }).length;
                  btnMasque.textContent = 'Masqués (' + cnt + ')';
                }
              });
            }
            if (aPJ) {
              var sectionPJ = document.createElement('div');
              sectionPJ.style.cssText = 'margin-top:16px;padding-top:12px;border-top:1px solid #2C2C44;';
              var label = document.createElement('span');
              label.textContent = 'Pièces jointes:';
              label.style.cssText = 'color:#8E8E93;display:block;margin-bottom:6px;';
              sectionPJ.appendChild(label);
              for (var i = 0; i < msg.files.length; i++) {
                (function(f) {
                  var btn = document.createElement('button');
                  btn.textContent = '📎 ' + f.libelle;
                  btn.style.cssText = 'background:#2C2C44;border:none;color:#5E5EFF;padding:8px 14px;border-radius:6px;cursor:pointer;margin-right:6px;margin-bottom:6px;font-size:13px;display:block;width:100%;text-align:left;';
                  btn.onclick = function(e) { e.preventDefault(); window.voirPieceJointe(f.id, f.libelle); };
                  sectionPJ.appendChild(btn);
                })(msg.files[i]);
              }
              detailDiv.querySelector('div').appendChild(sectionPJ);
            }
          }).catch(function(err) { detailDiv.innerHTML = '<div style="color:#FF5E5E;text-align:center;padding:20px;">Erreur: ' + err.message + '</div>'; });
      }

      function afficherMessages() {
        var tousMessages = getMessagesDossier();
        var filtres = tousMessages.filter(function(msg) {
          if (!recherche) return true;
          var exp = getExpediteur(msg);
          return exp.toLowerCase().indexOf(recherche.toLowerCase()) !== -1 || (msg.subject || "").toLowerCase().indexOf(recherche.toLowerCase()) !== -1;
        });
        var totalPages = Math.ceil(filtres.length / parPage), debut = (pageActuelle - 1) * parPage, pageMessages = filtres.slice(debut, debut + parPage);
        var listeDiv = document.getElementById('listeMessages');
        if (!listeDiv) return;
        if (!filtres.length) { listeDiv.innerHTML = '<div style="color:#8E8E93;text-align:center;padding:40px;">Aucun message</div>'; return; }
        var h = '<div style="margin-bottom:10px;color:#8E8E93;font-size:11px;">' + filtres.length + ' message(s)</div>';
        for (var i = 0; i < pageMessages.length; i++) {
          var msg = pageMessages[i], exp = getExpediteur(msg), date = (msg.date || "").replace(/-/g, '/').substring(0, 16), sujet = msg.subject || "(Sans objet)", aPJ = msg.files && msg.files.length > 0;
          h += '<div class="message-item" data-id="' + msg.id + '" style="background:#1C1C2E;border-radius:8px;padding:14px;margin-bottom:10px;cursor:pointer;">';
          h += '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><div><strong style="color:#5E5EFF;">' + exp + '</strong></div><div style="color:#8E8E93;font-size:11px;">' + date + '</div></div>';
          h += '<div style="font-weight:600;color:white;margin-bottom:4px;">' + sujet + '</div>';
          if (aPJ) h += '<div style="color:#5E5EFF;font-size:11px;">📎 ' + msg.files.length + ' pièce(s)</div>';
          h += '</div>';
        }
        if (totalPages > 1) {
          h += '<div style="display:flex;justify-content:center;gap:6px;margin-top:16px;">';
          if (pageActuelle > 1) {
            h += '<button class="page-msg" data-page="1" style="background:#2C2C44;border:none;color:white;padding:6px 10px;border-radius:6px;cursor:pointer;">«</button>';
            h += '<button class="page-msg" data-page="' + (pageActuelle - 1) + '" style="background:#2C2C44;border:none;color:white;padding:6px 10px;border-radius:6px;cursor:pointer;">←</button>';
          }
          for (var p = Math.max(1, pageActuelle - 2); p <= Math.min(totalPages, pageActuelle + 2); p++) {
            if (p === pageActuelle) h += '<span style="background:#5E5EFF;color:white;padding:6px 10px;border-radius:6px;">' + p + '</span>';
            else h += '<button class="page-msg" data-page="' + p + '" style="background:#2C2C44;border:none;color:white;padding:6px 10px;border-radius:6px;cursor:pointer;">' + p + '</button>';
          }
          if (pageActuelle < totalPages) {
            h += '<button class="page-msg" data-page="' + (pageActuelle + 1) + '" style="background:#2C2C44;border:none;color:white;padding:6px 10px;border-radius:6px;cursor:pointer;">→</button>';
            h += '<button class="page-msg" data-page="' + totalPages + '" style="background:#2C2C44;border:none;color:white;padding:6px 10px;border-radius:6px;cursor:pointer;">»</button>';
          }
          h += '</div>';
        }
        listeDiv.innerHTML = h;
        document.querySelectorAll('.message-item').forEach(function(el) { el.addEventListener('click', function() { voirDetailMessage(el.dataset.id); }); });
        document.querySelectorAll('.page-msg').forEach(function(el) { el.addEventListener('click', function() { pageActuelle = parseInt(el.dataset.page); afficherMessages(); document.getElementById('listeMessages').scrollTop = 0; }); });
      }

      function rafraichirUI() {
        pageActuelle = 1;
        afficherMessages();
        document.querySelectorAll('.dossier-btn').forEach(function(btn) {
          btn.style.background = btn.dataset.dossier === dossierActuel ? '#5E5EFF' : '#2C2C44';
        });
        var btnMasque = document.getElementById('masques-folder-btn');
        if (btnMasque) btnMasque.style.background = dossierActuel === "masques" ? '#FF6B6B' : '#2C2C44';
      }

      function construireInterface() {
        var masquesCount = [].concat(recus, envoyes, brouillons, archives).filter(function(msg) {
          var s = "";
          if (msg.from) s = (msg.from.prenom || "") + " " + (msg.from.nom || "");
          return expediteurEstMasque(s.trim());
        }).length;
        var h = '<div style="max-width:1400px;margin:0 auto;">';
        h += '<div style="margin-bottom:20px;">';
        h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">';
        h += '<button class="dossier-btn" data-dossier="recus" style="padding:8px 14px;background:#2C2C44;border:none;border-radius:6px;color:white;cursor:pointer;">Reçus (' + recus.length + ')</button>';
        h += '<button class="dossier-btn" data-dossier="envoyes" style="padding:8px 14px;background:#2C2C44;border:none;border-radius:6px;color:white;cursor:pointer;">Envoyés (' + envoyes.length + ')</button>';
        h += '<button class="dossier-btn" data-dossier="brouillons" style="padding:8px 14px;background:#2C2C44;border:none;border-radius:6px;color:white;cursor:pointer;">Brouillons (' + brouillons.length + ')</button>';
        h += '<button class="dossier-btn" data-dossier="archives" style="padding:8px 14px;background:#2C2C44;border:none;border-radius:6px;color:white;cursor:pointer;">Archivés (' + archives.length + ')</button>';
        h += '<button id="masques-folder-btn" style="padding:8px 14px;background:#2C2C44;border:none;border-radius:6px;color:#FF6B6B;cursor:pointer;">Masqués (' + masquesCount + ')</button>';
        h += '</div>';
        h += '<div style="background:#1C1C2E;border-radius:8px;padding:8px 12px;display:flex;gap:10px;align-items:center;">';
        h += '<span style="color:#8E8E93;">🔍</span><input type="text" id="rechercheInput" placeholder="Rechercher..." style="flex:1;background:transparent;border:none;color:white;outline:none;">';
        h += '<button id="effacerRecherche" style="background:#2C2C44;border:none;color:#8E8E93;padding:4px 10px;border-radius:6px;cursor:pointer;">Effacer</button></div></div>';
        h += '<div style="display:flex;gap:20px;">';
        h += '<div id="listeMessages" style="flex:1;max-height:600px;overflow-y:auto;"></div>';
        h += '<div id="detailMessage" style="flex:1;min-width:360px;"><div style="color:#8E8E93;text-align:center;padding:40px;">Sélectionnez un message</div></div>';
        h += '</div></div>';
        cont.innerHTML = h;
        document.querySelectorAll('.dossier-btn').forEach(function(btn) {
          btn.addEventListener('click', function() { dossierActuel = this.dataset.dossier; document.getElementById('rechercheInput').value = ''; recherche = ''; rafraichirUI(); });
        });
        document.getElementById('masques-folder-btn').addEventListener('click', function() {
          dossierActuel = "masques";
          document.getElementById('rechercheInput').value = '';
          recherche = '';
          rafraichirUI();
        });
        document.getElementById('rechercheInput').addEventListener('input', function(e) { recherche = e.target.value; pageActuelle = 1; afficherMessages(); });
        document.getElementById('effacerRecherche').addEventListener('click', function() { document.getElementById('rechercheInput').value = ''; recherche = ''; pageActuelle = 1; afficherMessages(); });
        rafraichirUI();
      }

      if (!dossiersCharges) chargerTousMessages();
      else construireInterface();
    }

    function apiLog() {
      var cont = document.getElementById('ed-content');
      if (!cont) return;
      if (!logs.length) { cont.innerHTML = '<div class="empty-state"><p>Aucun log API.</p></div>'; return; }
      var html = '<div style="background:#1C1C2E;border-radius:8px;padding:16px;"><h2 style="color:#5E5EFF;margin-bottom:12px;">API Logs</h2><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">';
      html += '<tr style="border-bottom:1px solid #2C2C44;"><th style="text-align:left;padding:6px;color:#8E8E93;">Date</th><th style="text-align:left;padding:6px;color:#8E8E93;">API</th><th style="text-align:left;padding:6px;color:#8E8E93;">Status</th><th style="text-align:left;padding:6px;color:#8E8E93;">Durée</th><tr>';
      for (var i = 0; i < logs.length; i++) {
        var l = logs[i];
        var coulCode = l.code === 200 ? '#5E5EFF' : '#FF5E5E';
        html += '<tr style="border-bottom:1px solid #2C2C44;"><td style="padding:6px;font-size:11px;color:#8E8E93;">' + l.heure + '</td><td style="padding:6px;font-size:11px;">' + (l.url.length > 50 ? l.url.substring(0, 50) + '...' : l.url) + '</td><td style="padding:6px;font-size:11px;color:' + coulCode + ';">' + l.code + '</td><td style="padding:6px;font-size:11px;color:#8E8E93;">' + l.duree + '</td></tr>';
      }
      html += '</div></div>';
      cont.innerHTML = html;
    }

              function param() {
                var cont = document.getElementById('ed-content');
                if (!cont) return;
                var saveSur = localStorage.getItem('ed_notesSur') || '20', saveProf = localStorage.getItem('ed_showProfName') === 'true', saveTheme = localStorage.getItem('ed_theme') || 'ED-classic';
                var savePos = localStorage.getItem('ed_menuPos') || 'haut', saveAff = localStorage.getItem('ed_notesDisplay') || 'pastilles', savePlace = localStorage.getItem('ed_iconPlace') || '1';
                var saveRond = parseInt(localStorage.getItem('ed_roundness') || '8');

                var html = '<div class="settings-container">';
                html += '<div style="background:#1C1C2E;border-radius:8px;padding:20px;margin-bottom:16px;">';
                html += '<h2 style="color:#5E5EFF;margin-bottom:16px;">Paramètres</h2>';

                html += '<div style="margin-bottom:16px;"><label style="color:white;display:block;margin-bottom:4px;">Notes sur</label>';
                html += '<input type="number" id="notesSurInput" value="' + saveSur + '" step="1" min="0" max="20" style="width:100%;padding:8px;background:#0B0B1A;border:1px solid #2C2C44;border-radius:6px;color:white;"></div>';

                html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #2C2C44;margin-bottom:14px;">';
                html += '<label style="color:white;">Masquer le nom du prof</label>';
                html += '<input type="checkbox" id="profToggle" ' + (saveProf ? 'checked' : '') + ' style="width:18px;height:18px;cursor:pointer;"></div>';

                html += '<div style="margin-bottom:14px;"><label style="color:white;display:block;margin-bottom:4px;">Thème [BETA]</label>';
                html += '<select id="themeSelect" style="width:100%;padding:8px;background:#0B0B1A;border:1px solid #2C2C44;border-radius:6px;color:white;">';
                ["ED-classic", "Solar Flare", "Neon Tide", "Dusk", "Arctic", "Glacier", "Emerald", "Blaze", "Solar", "ED-light", "ED-OLED", "custom1", "custom2", "feu", "world"].forEach(function(t) { html += '<option value="' + t + '" ' + (t === saveTheme ? 'selected' : '') + '>' + t + '</option>'; });
                html += '</select></div>';

                html += '<div style="margin-bottom:14px;"><label style="color:white;display:block;margin-bottom:4px;">Menu</label>';
                html += '<select id="menuPosSelect" style="width:100%;padding:8px;background:#0B0B1A;border:1px solid #2C2C44;border-radius:6px;color:white;">';
                html += '<option value="haut" ' + (savePos === 'haut' ? 'selected' : '') + '>Haut</option>';
                html += '<option value="cote" ' + (savePos === 'cote' ? 'selected' : '') + '>sidebar</option>';
                html += '</select></div>';

                html += '<div style="margin-bottom:14px;"><label style="color:white;display:block;margin-bottom:4px;">Affichage des notes</label>';
                html += '<select id="notesAffSelect" style="width:100%;padding:8px;background:#0B0B1A;border:1px solid #2C2C44;border-radius:6px;color:white;">';
                html += '<option value="pastilles" ' + (saveAff === 'pastilles' ? 'selected' : '') + '>blocs</option>';
                html += '<option value="liste" ' + (saveAff === 'liste' ? 'selected' : '') + '>Liste</option>';
                html += '</select></div>';

                html += '<div style="margin-bottom:14px;"><label style="color:white;display:block;margin-bottom:4px;">Photo de profil</label>';
                html += '<select id="placeIconeSelect" style="width:100%;padding:8px;background:#0B0B1A;border:1px solid #2C2C44;border-radius:6px;color:white;">';
                html += '<option value="1" ' + (savePlace === '1' ? 'selected' : '') + '>1</option>';
                html += '<option value="2" ' + (savePlace === '2' ? 'selected' : '') + '>2</option>';
                html += '</select></div>';

                html += '<div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #2C2C44;">';
                html += '<label style="color:white;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">arrondi <span id="rondValLabel" style="color:#5E5EFF;">' + saveRond + 'px</span></label>';
                html += '<div style="display:flex;align-items:center;gap:10px;">';
                html += '<span style="color:#8E8E93;">0</span>';
                html += '<input type="range" id="rondSlider" min="0" max="50" value="' + saveRond + '" style="flex:1;accent-color:#5E5EFF;cursor:pointer;">';
                html += '<span style="color:#8E8E93;">50px</span>';
                html += '</div></div>';

                html += '<div style="margin-bottom:16px;">';
                html += '<button id="manuelBtn" style="width:100%;padding:12px;background:#2C2C44;border:none;border-radius:6px;color:#5E5EFF;font-weight:600;cursor:pointer;margin-bottom:10px;">Manuel d\'utilisation</button>';
                html += '</div>';

                html += '<div style="margin-top:20px;padding-top:16px;border-top:1px solid #2C2C44;">';
                html += '<button id="effacerBtn" style="width:100%;padding:12px;background:#FF2D2D;border:none;border-radius:6px;color:white;font-weight:600;cursor:pointer;">Tout effacer</button>';
                html += '<div id="glisseConfirm" style="display:none;background:#1C1C2E;border-radius:8px;padding:4px;position:relative;height:50px;overflow:hidden;margin-top:10px;">';
                html += '<div id="glisseTrack" style="width:100%;height:100%;background:#2C2C44;border-radius:6px;position:relative;">';
                html += '<div id="glisseHandle" style="width:50px;height:50px;background:#FF2D2D;border-radius:6px;position:absolute;left:0;top:0;cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;z-index:2;">→</div>';
                html += '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#8E8E93;pointer-events:none;z-index:1;">Glisse pour confirmer</div>';
                html += '</div></div></div>';

                html += '<div style="margin-top:14px;"><button id="infoBtn" style="width:100%;padding:12px;background:#2C2C44;border:none;border-radius:6px;color:#5E5EFF;font-weight:600;cursor:pointer;">Info</button></div>';
                html += '</div></div>';
                cont.innerHTML = html;

                var inpSur = document.getElementById('notesSurInput'), toggleProf = document.getElementById('profToggle'), selTheme = document.getElementById('themeSelect');
                function appliquerParams() {
                  var nn = inpSur.value, np = toggleProf.checked, nt = selTheme.value;
                  var nm = document.getElementById('menuPosSelect').value, na = document.getElementById('notesAffSelect').value, ni = document.getElementById('placeIconeSelect').value;
                  localStorage.setItem('ed_notesSur', nn);
                  localStorage.setItem('ed_showProfName', np);
                  localStorage.setItem('ed_theme', nt);
                  localStorage.setItem('ed_menuPos', nm);
                  localStorage.setItem('ed_notesDisplay', na);
                  localStorage.setItem('ed_iconPlace', ni);
                  sur = nn;
                  profNom = np;
                  pos = nm;
                  aff = na;
                  place = ni;
                  appliquerTheme(nt);
                  appliquerMenu();
                  appliquerPlace();
                  if (onglet === 'notes') notes();
                  else if (onglet === 'accueil') accueil();
                }
                inpSur.addEventListener('change', appliquerParams);
                toggleProf.addEventListener('change', appliquerParams);
                selTheme.addEventListener('change', appliquerParams);
                document.getElementById('menuPosSelect').addEventListener('change', appliquerParams);
                document.getElementById('notesAffSelect').addEventListener('change', appliquerParams);
                document.getElementById('placeIconeSelect').addEventListener('change', appliquerParams);

                var slRond = document.getElementById('rondSlider');
                var lbRond = document.getElementById('rondValLabel');
                if (slRond) {
                  slRond.addEventListener('input', function() {
                    lbRond.textContent = this.value + 'px';
                    appliquerRond(parseInt(this.value));
                  });
                }
                
                var manuelBtn = document.getElementById('manuelBtn');
                if (manuelBtn) {
                  manuelBtn.addEventListener('click', function() {
                    ouvrirIframeModal('https://notanumber-dev.github.io/ed-/manuel', '💎.pages.dev/ed-/manuel');
                  });
                }

                var btnEffacer = document.getElementById('effacerBtn'), divGlisse = document.getElementById('glisseConfirm'), handleGlisse = document.getElementById('glisseHandle'), trackGlisse = document.getElementById('glisseTrack');
                if (btnEffacer) btnEffacer.addEventListener('click', function() { divGlisse.style.display = 'block'; handleGlisse.style.left = '0px'; });
                var glisseActif = false, debutX = 0, largeurHandle = 50, largeurTrack = 0;
                function demarrerGlisse(x) { glisseActif = true; debutX = x; largeurTrack = trackGlisse.offsetWidth; }
                function bougerGlisse(x) {
                  if (!glisseActif) return;
                  var d = x - debutX, nl = Math.max(0, Math.min(largeurTrack - largeurHandle, d));
                  handleGlisse.style.left = nl + 'px';
                  if (nl >= largeurTrack - largeurHandle - 5) {
                    glisseActif = false;
                    var keys = [];
                    for (var i = 0; i < localStorage.length; i++) {
                      var k = localStorage.key(i);
                      if (k && k.startsWith('ed_')) keys.push(k);
                    }
                    keys.forEach(function(k) { localStorage.removeItem(k); });
                    sessionStorage.clear();
                    location.reload();
                  }
                }
                function finGlisse() {
                  if (!glisseActif) return;
                  glisseActif = false;
                  var cl = parseInt(handleGlisse.style.left);
                  if (cl < largeurTrack - largeurHandle - 5) {
                    handleGlisse.style.transition = 'left 0.3s ease';
                    handleGlisse.style.left = '0px';
                    setTimeout(function() { handleGlisse.style.transition = ''; }, 300);
                  }
                }
                if (handleGlisse) {
                  handleGlisse.addEventListener('mousedown', function(e) { demarrerGlisse(e.clientX); });
                  handleGlisse.addEventListener('touchstart', function(e) { demarrerGlisse(e.touches[0].clientX); });
                }
                document.addEventListener('mousemove', function(e) { bougerGlisse(e.clientX); });
                document.addEventListener('mouseup', finGlisse);
                document.addEventListener('touchmove', function(e) { bougerGlisse(e.touches[0].clientX); });
                document.addEventListener('touchend', finGlisse);
                
                var btnInfo = document.getElementById('infoBtn');
                if (btnInfo) {
                  btnInfo.addEventListener('click', function() {
                    var m = document.createElement('div');
                    m.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10000001;display:flex;align-items:center;justify-content:center;';
                    var c = document.createElement('div');
                    c.style.cssText = 'background:#1C1C2E;border-radius:8px;padding:24px;max-width:360px;width:90%;text-align:center;';
                    c.innerHTML = '<h2 style="color:#5E5EFF;margin-bottom:10px;">EcoleDirecte -</h2><p style="color:#E0E0E0;font-size:13px;line-height:1.6;margin-bottom:16px;">v26.6.2<br>Beaucoup de changements<br>lis le manuel d\'utilisation <br>(vers11-15 juin) <br><a href="https://github.com/NotANumber-dev/ecoledirecte-" target="_blank" style="color:#5E5EFF;">GitHub</a></p><button id="closeInfo" style="background:#5E5EFF;border:none;padding:10px 20px;border-radius:6px;color:white;font-weight:600;cursor:pointer;">Fermer</button>';
                    m.appendChild(c);
                    document.body.appendChild(m);
                    m.onclick = function(e) { if (e.target === m) m.remove(); };
                    document.getElementById('closeInfo').addEventListener('click', function() { m.remove(); });
                  });
                }
              }
              
              function ouvrirIframeModal(url, afficherUrl) {
                var modal = document.createElement('div');
                modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000003;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);';
                
                var container = document.createElement('div');
                container.style.cssText = 'width:90vw;height:85vh;background:#FFFFFF;border-radius:12px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3);';
                
                var header = document.createElement('div');
                header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#F5F5F7;border-bottom:1px solid #E5E5EA;flex-shrink:0;';
                
                var closeBtn = document.createElement('button');
                closeBtn.textContent = '✕';
                closeBtn.style.cssText = 'background:transparent;border:none;color:#1C1C1E;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;';
                closeBtn.onmouseover = function() { this.style.background = '#E5E5EA'; };
                closeBtn.onmouseout = function() { this.style.background = 'transparent'; };
                closeBtn.onclick = function() { modal.remove(); };
                
                var urlContainer = document.createElement('div');
                urlContainer.style.cssText = 'display:flex;align-items:center;justify-content:center;flex:1;background:#FFFFFF;border-radius:8px;padding:6px 12px;margin:0 10px;border:1px solid #E5E5EA;';
                
                var urlText = document.createElement('span');
                urlText.textContent = afficherUrl;
                urlText.style.color = '#1C1C1E';
                urlText.style.fontSize = '13px';
                urlText.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                urlText.style.opacity = '0.7';
                
                urlContainer.appendChild(urlText);
                
                header.appendChild(closeBtn);
                header.appendChild(urlContainer);
                
                var iframe = document.createElement('iframe');
                iframe.src = url;
                iframe.style.cssText = 'width:100%;flex:1;border:none;background:#FFFFFF;';
                iframe.sandbox = 'allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation';
                
                container.appendChild(header);
                container.appendChild(iframe);
                modal.appendChild(container);
                
                document.body.appendChild(modal);
                
                modal.onclick = function(e) {
                  if (e.target === modal) modal.remove();
                };
                
                document.addEventListener('keydown', function(e) {
                  if (e.key === 'Escape' && document.body.contains(modal)) {
                    modal.remove();
                  }
                });
              }

    function appliquerMenu() {
      var w = document.getElementById('ed-widget');
      if (!w) return;
      var p = localStorage.getItem('ed_menuPos') || 'haut';
      if (p === 'cote') {
        w.classList.add('side-menu');
        w.classList.remove('top-menu');
      } else {
        w.classList.add('top-menu');
        w.classList.remove('side-menu');
      }
    }

    function appliquerPlace() {
      var w = document.getElementById('ed-widget');
      if (!w) return;
      var p = localStorage.getItem('ed_iconPlace') || '1';
      w.classList.remove('icons-pos-1', 'icons-pos-2');
      w.classList.add('icons-pos-' + p);
    }

    function appliquerTheme(nomTheme) {
      var themes = {
        "ED-classic": { bg: "#0B0B1A", card: "#1C1C2E", accent: "#5E5EFF", text: "#FFFFFF", textSecondary: "#8E8E93", gradient: "linear-gradient(135deg,#0B0B1A 0%,#1C1C2E 100%)", sideNav: "#4A3FC2" },
        "Solar Flare": { bg: "#1A0A00", card: "#2D1500", accent: "#FFAA00", text: "#FFE0B3", textSecondary: "#B3804D", gradient: "linear-gradient(180deg,#FFAA00 0%,#E803A1 100%)", sideNav: "#8A4500" },
        "Neon Tide": { bg: "#0A001A", card: "#15002D", accent: "#00FAA3", text: "#B3FFE0", textSecondary: "#4D8A70", gradient: "linear-gradient(180deg,#00FAA3 0%,#3B00FF 100%)", sideNav: "#003D28" },
        "Dusk": { bg: "#1A0014", card: "#2D0024", accent: "#FF5CBA", text: "#FFB3D9", textSecondary: "#8A4D70", gradient: "linear-gradient(180deg,#FF5CBA 0%,#2B00FF 100%)", sideNav: "#6A0040" },
        "Arctic": { bg: "#0A1628", card: "#142D50", accent: "#E8F5FF", text: "#FFFFFF", textSecondary: "#8A9AB3", gradient: "linear-gradient(180deg,#E8F5FF 0%,#0050D8 100%)", sideNav: "#1A4080" },
        "Glacier": { bg: "#000A14", card: "#001428", accent: "#A8E6FF", text: "#E0F7FF", textSecondary: "#4D6A80", gradient: "linear-gradient(180deg,#A8E6FF 0%,#001020 100%)", sideNav: "#003050" },
        "Emerald": { bg: "#000A02", card: "#001A08", accent: "#00C85A", text: "#B3FFCC", textSecondary: "#4D8A5A", gradient: "linear-gradient(180deg,#00C85A 0%,#001A08 100%)", sideNav: "#005024" },
        "Blaze": { bg: "#1A0000", card: "#2D0000", accent: "#FF2D2D", text: "#FFB3B3", textSecondary: "#8A4D4D", gradient: "linear-gradient(180deg,#1A0000 0%,#FF2D2D 100%)", sideNav: "#6A0000" },
        "Solar": { bg: "#1A1200", card: "#2D1E00", accent: "#FFC500", text: "#FFE8B3", textSecondary: "#8A7A4D", gradient: "linear-gradient(180deg,#FFC500 0%,#1A1200 100%)", sideNav: "#6A4A00" },
        "ED-light": { bg: "#FFFFFF", card: "#F0F0F0", accent: "#5E5EFF", text: "#000000", textSecondary: "#666666", gradient: "linear-gradient(180deg,#FFFFFF 0%,#E8E8FF 100%)", sideNav: "#6060E0" },
        "ED-OLED": { bg: "#000000", card: "#0A0A0A", accent: "#FFFFFF", text: "#FFFFFF", textSecondary: "#666666", gradient: "linear-gradient(180deg,#000000 0%,#0A0A0A 100%)", sideNav: "#181818" },
        "custom1": { bg: "#F2E6EE", card: "#E8D5E0", accent: "#977DDF", text: "#2D1B36", textSecondary: "#6B5B7A", gradient: "linear-gradient(180deg,#F2E6EE 0%,#977DDF 100%)", sideNav: "#7B60C8" },
        "custom2": { bg: "#2C3E50", card: "#34495E", accent: "#4CA1AF", text: "#FFFFFF", textSecondary: "#A8C8D0", gradient: "linear-gradient(180deg,#2C3E50 0%,#4CA1AF 100%)", sideNav: "#3A7D88" },
        "feu": { bg: "#100C08", card: "#1A0E0A", accent: "#95122C", text: "#FFD4C4", textSecondary: "#A87060", gradient: "linear-gradient(180deg,#100C08 0%,#95122C 100%)", sideNav: "#6A0A20" },
        "world": { bg: "#FFCCF2", card: "#FFDDF5", accent: "#0033FF", text: "#1A0033", textSecondary: "#6688CC", gradient: "linear-gradient(180deg,#FFCCF2 0%,#0033FF 100%)", sideNav: "#0022CC" }
      };
      var t = themes[nomTheme] || themes["ED-classic"];
      var coulSide = t.sideNav || t.accent;
      var w = document.getElementById('ed-widget');
      if (!w) return;
      var ancienStyle = document.getElementById('ed-theme-styles');
      if (ancienStyle) ancienStyle.remove();
      w.style.background = t.gradient;
      var lightTheme = (nomTheme === 'ED-light' || nomTheme === 'custom1' || nomTheme === 'world');
      var style = document.createElement('style');
      style.id = 'ed-theme-styles';
      style.textContent = `
        #ed-widget { background: ${t.gradient} !important; }
        #carnet2Recherche, #rechercheInput { background: ${t.card} !important; color: ${t.text} !important; border: 1px solid ${t.accent}44 !important; }
        .tab-bar, .trimester-selector { background: ${t.card} !important; }
        .tab-btn.active, .trimester-option.active { background: ${t.accent} !important; color: ${t.bg} !important; }
        .stat-value, .subject-average, .annual-value, .hero-stats strong, .eyebrow, .card-title, .task-badge { color: ${t.accent} !important; }
        .subject-name, h1, h2, h3, strong, .task-content, .hero-stats strong, .home-subject span, .task-meta strong, .carnet2-card strong, .message-item strong, .settings-container label, .settings-container strong { color: ${t.text} !important; }
        .stat-label, .stat-sub, .subject-stats, .task-meta span, .task-badge, .carnet2-card span, .annual-note-count, .hero-stats span, .empty-state p { color: ${t.textSecondary} !important; }
        .tab-btn, .trimester-option { color: ${t.text} !important; }
        .tab-btn.active, .trimester-option.active { color: ${t.bg} !important; }
        .notes-table-ed thead tr { background: ${t.accent} !important; }
        .notes-table-ed tbody tr { background: ${t.card} !important; border-bottom: 1px solid ${t.accent}33 !important; }
        .notes-table-ed tbody tr:hover { background: ${t.accent}22 !important; }
        .notes-table-ed th { color: ${t.bg} !important; }
        .notes-table-ed td { color: ${t.text} !important; }
        #ed-widget.side-menu #ed-side-nav { background: ${coulSide} !important; }
        #ed-widget.side-menu .tab-bar { background: ${coulSide} !important; }
        #ed-widget.side-menu .tab-btn { color: rgba(255,255,255,0.75) !important; }
        #ed-widget.side-menu .tab-btn:hover { background: rgba(255,255,255,0.14) !important; color: #fff !important; }
        #ed-widget.side-menu .tab-btn.active { background: rgba(255,255,255,0.22) !important; color: #fff !important; }
        #ed-widget.side-menu .logo { display: flex !important; background: rgba(0,0,0,0.15); }
        .tab-btn img { filter: ${lightTheme ? 'invert(0)' : 'brightness(0) invert(1)'} !important; }
        #ed-widget.side-menu .tab-btn img { filter: brightness(0) invert(1) !important; }
      `;
      document.head.appendChild(style);
      var sideNav = document.getElementById('ed-side-nav');
      if (sideNav) {
        sideNav.style.background = coulSide;
        var logo = sideNav.querySelector('.logo');
        if (logo) logo.style.background = 'rgba(0,0,0,0.15)';
      }
      var topBar = document.getElementById('top-tab-bar-container');
      if (topBar) {
        var actif = topBar.querySelector('.tab-btn.active');
        var ongletActif = actif ? actif.getAttribute('data-tab') : onglet || 'accueil';
        topBar.innerHTML = getTabBarHtml();
        brancherBtns();
        var nouveauActif = topBar.querySelector('.tab-btn[data-tab="' + ongletActif + '"]');
        if (nouveauActif) nouveauActif.classList.add('active');
        document.querySelectorAll('#ed-side-nav .tab-btn').forEach(function(b) { b.classList.remove('active'); });
        var sideActif = document.querySelector('#ed-side-nav .tab-btn[data-tab="' + ongletActif + '"]');
        if (sideActif) sideActif.classList.add('active');
      }
      localStorage.setItem('ed_theme', nomTheme);
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
        for (var t in tris) {
          for (var m in tris[t].matieres) {
            var mat = tris[t].matieres[m];
            mat.moy = mat.somme / mat.sommeCoef;
          }
        }
        notesOrig = nouvNotes;
        if (onglet === "notes") notes();
        else if (onglet === "accueil") accueil();
        if (fab) { fab.style.opacity = '1'; fab.style.pointerEvents = 'auto'; }
      } catch (e) {
        if (fab) { fab.style.opacity = '1'; fab.style.pointerEvents = 'auto'; }
        alert("Erreur: " + e.message);
      }
    }
    window.rafraichirNotes = rafraichirNotes;

    var refreshFab = document.createElement('button');
    refreshFab.id = 'refreshFab';
    refreshFab.style.cssText = 'position:fixed;bottom:24px;right:24px;width:48px;height:48px;border-radius:8px;background:#5E5EFF;border:none;color:white;font-size:20px;cursor:pointer;box-shadow:0 4px 12px rgba(94,94,255,0.4);z-index:100000;display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(0.8);transition:all 0.3s ease;pointer-events:none;';
    refreshFab.innerHTML = '↻';
    refreshFab.onclick = function() { window.rafraichirNotes(); };
    document.body.appendChild(refreshFab);

    window.montrerRefresh = function(show) {
      var fab = document.getElementById('refreshFab');
      if (fab) {
        if (show) {
          fab.style.opacity = '1';
          fab.style.transform = 'scale(1)';
          fab.style.pointerEvents = 'auto';
        } else {
          fab.style.opacity = '0';
          fab.style.transform = 'scale(0.8)';
          fab.style.pointerEvents = 'none';
        }
      }
    };

    var animStyle = document.createElement('style');
    animStyle.textContent = '@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(animStyle);

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
      restaurerScroll();
    }

    var iconeAccueil = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTUgMjF2LThhMSAxIDAgMCAwLTEtMWgtNGExIDEgMCAwIDAtMSAxdjgiLz48cGF0aCBkPSJNMyAxMGEyIDIgMCAwIDEgLjcwOS0xLjUyOGw3LTZhMiAyIDAgMCAxIDIuNTgyIDBsNyA2QTIgMiAwIDAgMSAyMSAxMHY5YTIgMiAwIDAgMS0yIDJINWEyIDIgMCAwIDEtMi0yeiIvPjwvc3ZnPg==';
    var iconeNotes = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTEgNWgxMCIvPjxwYXRoIGQ9Ik0xMSAxMmgxMCIvPjxwYXRoIGQ9Ik0xMSAxOWgxMCIvPjxwYXRoIGQ9Ik00IDRoMXY1Ii8+PHBhdGggZD0iTTQgOWgyIi8+PHBhdGggZD0iTTYuNSAyMEgzLjRjMC0xIDIuNi0xLjkyNSAyLjYtMy41YTEuNSAxLjUgMCAwIDAtMi42LTEuMDIiLz48L3N2Zz4=';
    var iconeDevoirs = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNNCA0LjV2LTVBMS41IDEuNSAwIDAgMSA2LjUgMkgxOWExIDEgMCAwIDEgMSAxdjE4YTEgMSAwIDAgMS0xIDFINi41YTEgMSAwIDAgMSAwLTVIMjAiLz48cGF0aCBkPSJNOCAxMWg4Ii8+PHBhdGggZD0iTTggN2g2Ii8+PC9zdmc+';
    var iconeEdt = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTYgMTR2Mi4ybDEuNiAxIi8+PHBhdGggZD0iTTE2IDJ2NCIvPjxwYXRoIGQ9Ik0yMSA3LjVWNmEyIDIgMCAwIDAtMi0ySDVhMiAyIDAgMCAwLTIgMnYxNGEyIDIgMCAwIDAgMiAyaDMuNSIvPjxwYXRoIGQ9Ik0zIDEwaDUiLz48cGF0aCBkPSJNOCAydjQiLz48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSI2Ii8+PC9zdmc+';
    var iconeCarnet2 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTUgMTNhMyAzIDAgMSAwLTYgMCIvPjxwYXRoIGQ9Ik00IDQuNXYtMTVBMi41IDIuNSAwIDAgMSA2LjUgMkgxOWExIDEgMCAwIDEgMSAxdjE4YTEgMSAwIDAgMS0xIDFINi41YTEgMSAwIDAgMSAwLTVIMjAiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjgiIHI9IjIiLz48L3N2Zz4=';
    var iconeVie = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMiA2aDQiLz48cGF0aCBkPSJNMiAxMGg0Ii8+PHBhdGggZD0iTTIgMTRoNCIvPjxwYXRoIGQ9Ik0yIDE4aDQiLz48cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iMjAiIHg9IjQiIHk9IjIiIHJ4PSIyIi8+PHBhdGggZD0iTTE1IDJ2MjAiLz48cGF0aCBkPSJNMTUgN2g1Ii8+PHBhdGggZD0iTTE1IDEyaDUiLz48cGF0aCBkPSJNMTUgMTdoNSIvPjwvc3ZnPg==';
    var iconeMessages = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJtMjIgNy04Ljk5MSA1LjcyN2EyIDIgMCAwIDEtMi4wMDkgMEwyIDciLz48cmVjdCB4PSIyIiB5PSI0IiB3aWR0aD0iMjAiIGhlaWdodD0iMTYiIHJ4PSIyIi8+PC9zdmc+';
    var iconeParam = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI4IDI4IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNOS42NzEgNC4xMzZhMi4zNCAyLjM0IDAgMCAxIDQuNjU5IDAgMi4zNCAyLjM0IDAgMCAwIDMuMzE5IDEuOTE1IDIuMzQgMi4zNCAwIDAgMSAyLjMzIDQuMDMzIDIuMzQgMi4zNCAwIDAgMCAwIDMuODMxIDIuMzQgMi4zNCAwIDAgMS0yLjMzIDQuMDMzIDIuMzQgMi4zNCAwIDAgMC0zLjMxOSAxLjkxNSAyLjM0IDIuMzQgMCAwIDEtNC42NTkgMCAyLjM0IDIuMzQgMCAwIDAtMy4zMi0xLjkxNSAyLjM0IDIuMzQgMCAwIDEtMi4zMy00LjAzMyAyLjM0IDIuMzQgMCAwIDAgMC0zLjgzMUEyLjM0IDIuMzQgMCAwIDEgNi4zNSA2LjA1MWEyLjM0IDIuMzQgMCAwIDAgMy4zMTktMS45MTUiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIzIi8+PC9zdmc+';

    function getTabBarHtml() {
      return `<div class="tab-bar">
          <button class="tab-btn" data-tab="accueil"><img src="${iconeAccueil}" width="16" height="16">Accueil</button>
          <button class="tab-btn" data-tab="notes"><img src="${iconeNotes}" width="16" height="16">Notes</button>
          <button class="tab-btn" data-tab="devoirs"><img src="${iconeDevoirs}" width="16" height="16">Devoirs</button>
          <button class="tab-btn" data-tab="edt"><img src="${iconeEdt}" width="16" height="16">Emploi du temps</button>
          <button class="tab-btn" data-tab="carnet2"><img src="${iconeCarnet2}" width="16" height="16">Carnet</button>
          <button class="tab-btn" data-tab="viescolaire"><img src="${iconeVie}" width="16" height="16">Vie scolaire</button>
          <button class="tab-btn" data-tab="messagerie"><img src="${iconeMessages}" width="16" height="16">Messages</button>
          <button class="tab-btn" data-tab="settings"><img src="${iconeParam}" width="16" height="16">Paramètres</button>
          <div class="profile-avatar" id="profileAvatar">${pren.charAt(0)}${nom.charAt(0)}</div>
        </div>`;
    }

    widget.innerHTML = `
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        #ed-widget { background-color:#0B0B1A; color:#FFFFFF; }
        .m-container { max-width:1200px; margin:0 auto; padding:20px; }
        .tab-bar { display:flex; gap:4px; margin-bottom:20px; background:#1C1C2E; padding:6px 8px; border-radius:8px; flex-wrap:wrap; align-items:center; }
        .tab-btn { flex:0 0 auto; padding:8px 12px; text-align:center; font-size:14px; font-weight:600; color:#8E8E93; background:transparent; border:none; border-radius:6px; cursor:pointer; transition:all 0.2s ease; display:flex; align-items:center; gap:6px; white-space:nowrap; }
        .tab-btn.active { background:#2C2C44; color:#5E5EFF; }
        .tab-btn img { width:16px; height:16px; }
        #ed-widget.side-menu { overflow:hidden; }
        #ed-widget.side-menu .logo { display:flex !important; }
        #ed-widget.side-menu > .profile-overlay,
        #ed-widget.side-menu > .profile-dropdown { position:fixed; }
        #ed-widget.side-menu .m-container { margin-left:220px; height:100vh; overflow:auto; padding:20px; }
        #ed-widget.side-menu .selector-container { margin-left:220px; padding:0 20px; }
        #ed-side-nav {
          position:fixed; left:0; top:0; bottom:0; width:220px;
          background:#3A2DB5;
          display:none; flex-direction:column;
          z-index:200; overflow-y:auto;
          box-shadow: 4px 0 20px rgba(0,0,0,0.3);
        }
        #ed-widget.side-menu #ed-side-nav { display:flex; }
        #ed-widget.side-menu .m-container { margin-left:220px; }
        #ed-widget.side-menu .selector-container { margin-left:220px; }
        #ed-side-nav .logo { display:flex; align-items:center; gap:10px; padding:20px 16px; border-bottom:1px solid rgba(255,255,255,0.15); }
        #ed-side-nav .tab-bar, #ed-side-nav .side-tab-bar { flex-direction:column; align-items:stretch; background:transparent !important; margin-bottom:0; padding:8px; gap:2px; border-radius:0 !important; flex:1; border:none !important; }
        #ed-side-nav .tab-btn { justify-content:flex-start; color:rgba(255,255,255,0.78); border-radius:6px; padding:10px 14px; }
        #ed-side-nav .tab-btn:hover { background:rgba(255,255,255,0.14); color:white; }
        #ed-side-nav .tab-btn.active { background:rgba(255,255,255,0.22); color:white; }
        #ed-side-nav .tab-btn img { filter:brightness(0) invert(1) !important; }
        #ed-side-nav .profile-avatar { align-self:center; margin:12px auto; }
        #ed-widget.side-menu #top-tab-bar-container { display:none !important; }
        #ed-side-nav { display:none; }
        #ed-widget.side-menu #ed-side-nav { display:flex !important; }
        .selector-container { margin-bottom:20px; }
        .trimester-selector { background:#1C1C2E; border-radius:8px; padding:6px; display:flex; gap:6px; }
        .trimester-option { flex:1; padding:12px; text-align:center; font-size:14px; font-weight:600; color:#8E8E93; background:transparent; border:none; border-radius:6px; cursor:pointer; }
        .trimester-option.active { background:#2C2C44; color:#5E5EFF; }
        .stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px; margin-bottom:24px; }
        .stat-card { background:#1C1C2E; border-radius:8px; padding:16px; text-align:center; }
        .stat-label { font-size:12px; color:#8E8E93; margin-bottom:6px; text-transform:uppercase; }
        .stat-value { font-size:40px; font-weight:700; color:#5E5EFF; }
        .stat-sub { font-size:11px; color:#8E8E93; margin-top:6px; }
        .subjects-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:12px; margin-bottom:24px; }
        .subject-card { background:#1C1C2E; border-radius:8px; padding:16px; cursor:pointer; transition:background 0.2s ease; }
        .subject-card:hover { background:#2C2C44; }
        .subject-header { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid #2C2C44; }
        .subject-name { font-size:15px; font-weight:600; color:#FFFFFF; }
        .subject-average { font-size:24px; font-weight:700; }
        .subject-stats { display:flex; justify-content:space-between; color:#8E8E93; font-size:12px; }
        .grade-indicator { width:7px; height:7px; border-radius:50%; display:inline-block; margin-right:5px; }
        .annual-card { background:#1C1C2E; border-radius:8px; padding:24px; text-align:center; border:1px solid rgba(94,94,255,0.2); margin-top:8px; }
        .annual-label { font-size:12px; color:#8E8E93; margin-bottom:10px; text-transform:uppercase; }
        .annual-value { font-size:48px; font-weight:800; color:#5E5EFF; }
        .annual-note-count { font-size:12px; color:#8E8E93; margin-top:10px; }
        .home-hero { display:flex; flex-direction:row; background:#15152B; padding:24px; border-radius:8px; margin-bottom:20px; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:16px; }
        .hero-copy { max-width:480px; }
        .eyebrow { font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#5E5EFF; margin-bottom:6px; }
        .title-container { display:flex; align-items:baseline; gap:8px; margin-bottom:10px; }
        .home-hero h1 { font-size:30px; color:#FFFFFF; margin:0; }
        .dash-animated { display:inline-block; font-size:1.8em; animation:dashGlow 3s ease-in-out infinite; }
        @keyframes dashGlow{0%{color:#FF6B9D}25%{color:#00D4FF}50%{color:#7D5FFF}75%{color:#FF9D5C}100%{color:#FF6B9D}}
        .hero-card { max-width:300px; width:300px; background:linear-gradient(180deg,rgba(31,31,57,0.95),#111123); border:1px solid rgba(94,94,255,0.2); border-radius:8px; padding:20px; display:grid; gap:14px; height:fit-content; flex-shrink:0; }
        .hero-stats { display:flex; flex-direction:column; color:#E5E5FF; gap:6px; }
        .hero-stats span { color:#8E8E93; font-size:11px; text-transform:uppercase; }
        .hero-stats strong { font-size:28px; }
        .home-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px; margin-bottom:20px; }
        .home-card { background:#1C1C2E; border-radius:8px; padding:18px; }
        .card-title { color:#8E8E93; font-size:11px; margin-bottom:12px; text-transform:uppercase; letter-spacing:0.8px; }
        .home-subject { display:flex; justify-content:space-between; margin-bottom:10px; color:#E8E8FF; font-size:14px; }
        .task-card { background:#1C1C2E; border-radius:8px; padding:14px; margin-bottom:10px; }
        .task-meta { display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:8px; }
        .task-meta span { color:#8E8E93; font-size:11px; }
        .task-content { color:#DFE0FF; font-size:13px; line-height:1.6; margin-top:8px; white-space:pre-line; }
        .task-badge { font-size:10px; text-transform:uppercase; padding:3px 7px; border-radius:4px; background:rgba(94,94,255,0.12); color:#5E5EFF; }
        .empty-state { text-align:center; padding:48px 20px; background:#1C1C2E; border-radius:8px; }
        .empty-state p { color:#8E8E93; font-size:15px; }
        .date-pill:hover { background:#2C2C44 !important; }
        .carnet2-card:hover { background:#2C2C44 !important; }
        .profile-avatar { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,#5E5EFF 0%,#FF5E5E 100%); display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:700; font-size:12px; color:white; flex-shrink:0; margin-left:8px; }
        .profile-overlay { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.55); backdrop-filter:blur(10px); z-index:100000; opacity:0; pointer-events:none; transition:opacity 0.2s ease; }
        .profile-overlay.active { opacity:1; pointer-events:auto; }
        .profile-dropdown {
          position:fixed; top:50% !important; left:50% !important;
          transform:translate(-50%, -44%) !important;
          width:300px;
          background:#1C1C2E;
          border-radius:12px;
          padding:24px;
          z-index:100001;
          opacity:0;
          pointer-events:none;
          transition:opacity 0.22s ease, transform 0.22s ease;
          border:1px solid #2C2C44;
          box-shadow:0 24px 60px rgba(0,0,0,0.6);
        }
        .task-card {
        background: var(--card-bg, #1C1C2E) !important;
        }
        .task-card strong {
        color: var(--text-primary, #FFFFFF) !important;
        }
        .task-content {
        color: var(--text-secondary, #B3B3D2) !important;
        }
        .date-pill {
        background: var(--card-bg, #1C1C2E) !important;
        }
        .date-pill span {
        color: var(--text-primary, #FFFFFF) !important;
        }
        .profile-dropdown.active { transform:translate(-50%, -50%) !important; opacity:1; pointer-events:auto; }
        .profile-pic { width:56px; height:56px; border-radius:50%; background:linear-gradient(135deg,#5E5EFF 0%,#FF5E5E 100%); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:22px; color:white; }
        .profile-signout { width:100%; padding:12px; background:#FF2D2D; border:none; border-radius:6px; color:white; font-size:14px; font-weight:600; cursor:pointer; margin-top:14px; }
        .profile-signout:hover { background:#CC0000; }
        .notes-table-ed { border-radius:8px; overflow:hidden; }
        .notes-table-ed thead tr { background:#5E5EFF; }
        .notes-table-ed tbody tr { background:#1C1C2E; border-bottom:1px solid #2C2C44; }
        .notes-table-ed tbody tr:hover { background:#2C2C44; }
        #ed-widget.top-menu.icons-pos-1 .profile-avatar { order:-1; margin-left:0; margin-right:auto; }
        #ed-widget.top-menu.icons-pos-2 .profile-avatar { order:99; margin-left:auto; margin-right:0; }
        #ed-widget.side-menu.icons-pos-1 #ed-side-nav .profile-avatar { order:-1; margin-top:0; }
        #ed-widget.side-menu.icons-pos-2 #ed-side-nav .profile-avatar { order:99; margin-top:auto; }
        @media(max-width:768px){ .m-container{padding:14px;} .subjects-grid{grid-template-columns:1fr;} .stat-value{font-size:32px;} .annual-value{font-size:40px;} .tab-btn{padding:7px 8px;font-size:12px;} #ed-widget.side-menu .m-container{margin-left:60px;} #ed-widget.side-menu .selector-container{margin-left:60px;} #ed-side-nav{width:60px;} #ed-side-nav .logo span,#ed-side-nav .tab-btn span,#ed-side-nav .tab-btn{font-size:0;padding:10px 0;justify-content:center;} #ed-side-nav .tab-btn img{display:block;width:18px;height:18px;} }
      </style>
      <div class="profile-overlay" id="profileOverlay"></div>
      <div class="profile-dropdown" id="profileDropdown">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid #2C2C44;">
          <div class="profile-pic">${pren.charAt(0)}${nom.charAt(0)}</div>
          <div><div style="color:white;font-size:18px;font-weight:700;">${pren} ${nom}</div><div style="color:#8E8E93;font-size:13px;margin-top:2px;">${clasTxt}</div></div>
        </div>
        <button class="profile-signout" id="profileSignout">Se déconnecter</button>
      </div>
      <div id="ed-side-nav">
        <div class="logo">
          <span style="color:white;font-weight:700;">EcoleDirecte -</span>
        </div>
        <div class="tab-bar side-tab-bar">
          <button class="tab-btn" data-tab="accueil"><img src="${iconeAccueil}" width="16" height="16">Accueil</button>
          <button class="tab-btn" data-tab="notes"><img src="${iconeNotes}" width="16" height="16">Notes</button>
          <button class="tab-btn" data-tab="devoirs"><img src="${iconeDevoirs}" width="16" height="16">Devoirs</button>
          <button class="tab-btn" data-tab="edt"><img src="${iconeEdt}" width="16" height="16">Emploi du temps</button>
          <button class="tab-btn" data-tab="carnet2"><img src="${iconeCarnet2}" width="16" height="16">Carnet</button>
          <button class="tab-btn" data-tab="viescolaire"><img src="${iconeVie}" width="16" height="16">Vie scolaire</button>
          <button class="tab-btn" data-tab="messagerie"><img src="${iconeMessages}" width="16" height="16">Messages</button>
          <button class="tab-btn" data-tab="settings"><img src="${iconeParam}" width="16" height="16">Paramètres</button>
          <div class="profile-avatar side-profile-avatar">${pren.charAt(0)}${nom.charAt(0)}</div>
        </div>
      </div>
      <div class="m-container">
        <div id="top-tab-bar-container">
          ${getTabBarHtml()}
        </div>
        <div id="ed-content"></div>
      </div>
    `;

    appliquerTheme(themeSauve);
    appliquerMenu();
    appliquerPlace();
    appliquerRond(rond);

    window.retour = function() { if (vuePrec === 'devoirs') devoirs(); else if (vuePrec === 'notes') notes(); else devoirs(); };

    function brancherBtns() {
      document.querySelectorAll('#ed-widget .tab-btn').forEach(function(btn) {
        btn.replaceWith(btn.cloneNode(true));
      });
      document.querySelectorAll('#ed-widget .tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() { changerOnglet(this.getAttribute('data-tab')); });
      });
      var sideAvatar = document.querySelector('.side-profile-avatar');
      if (sideAvatar) {
        sideAvatar.replaceWith(sideAvatar.cloneNode(true));
        document.querySelector('.side-profile-avatar').addEventListener('click', function(e) { e.stopPropagation(); basculerProfil(); });
      }
    }
    brancherBtns();

    function changerOnglet(tab) {
      onglet = tab;
      document.querySelectorAll('#ed-widget .tab-btn').forEach(function(btn) { btn.classList.remove('active'); });
      document.querySelectorAll('#ed-widget .tab-btn[data-tab="' + tab + '"]').forEach(function(btn) { btn.classList.add('active'); });
      var sel = document.querySelector('#ed-widget .selector-container');
      if (sel) sel.style.display = tab === "notes" ? 'block' : 'none';
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
    selTri.innerHTML = `<div class="trimester-selector"><button class="trimester-option" data-tri="A001">1er Trimestre</button><button class="trimester-option" data-tri="A002">2ème Trimestre</button><button class="trimester-option" data-tri="A003">3ème Trimestre</button></div>`;
    var contDiv = document.getElementById('ed-content');
    contDiv.parentNode.insertBefore(selTri, contDiv);
    selTri.style.display = 'none';

    afficherContenu();

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

    var avatarProfil = document.getElementById('profileAvatar');
    var profilOverlay = document.getElementById('profileOverlay');
    var profilDropdown = document.getElementById('profileDropdown');
    if (avatarProfil) avatarProfil.addEventListener('click', function(e) { e.stopPropagation(); basculerProfil(); });
    if (profilOverlay) profilOverlay.addEventListener('click', function() { profilDropdown.classList.remove('active'); profilOverlay.classList.remove('active'); });
    var profilDeconnexion = document.getElementById('profileSignout');
    if (profilDeconnexion) profilDeconnexion.addEventListener('click', function() { if (confirm('Se déconnecter ?')) { sessionStorage.removeItem('credentials'); sessionStorage.removeItem('accounts'); location.reload(); } });
    document.addEventListener('click', function(e) {
      var pd = document.getElementById('profileDropdown');
      var pa = document.getElementById('profileAvatar');
      var spa = document.querySelector('.side-profile-avatar');
      if (pd && pd.classList.contains('active') && !pd.contains(e.target) && e.target !== pa && e.target !== spa) {
        pd.classList.remove('active');
        document.getElementById('profileOverlay').classList.remove('active');
      }
    });

  }, 50);

  completion("Chargé");

} catch (erreur) {
  console.error('Erreur EcoleDirecte:', erreur);
  var loadElem = document.getElementById('ed-chargement');
  if (loadElem) loadElem.remove();
  var placeElem = document.getElementById('ed-placeholder');
  if (placeElem) placeElem.remove();
  completion("Erreur: " + (erreur.message || "Erreur inconnue"));
}
})();
