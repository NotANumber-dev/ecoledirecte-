(async () => {
  try {
    var credentials = JSON.parse(sessionStorage.getItem("credentials"));
    var token = credentials.payload.authToken;
    var accounts = JSON.parse(sessionStorage.getItem("accounts"));
    var id = accounts.payload.accounts[0].id;

    document.documentElement.innerHTML = '';
    
    var resNotes = await fetch(`https://api.ecoledirecte.com/v3/eleves/${id}/notes.awp?verbe=get&v=6.17.0`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Token": token
      },
      body: "data=" + encodeURIComponent(JSON.stringify({ anneeScolaire: "" }))
    });

    var jsonNotes = await resNotes.json();
    var data = jsonNotes.data;
    
    var resDevoirs = await fetch(`https://api.ecoledirecte.com/v3/Eleves/${id}/cahierdetexte.awp?verbe=get&v=4.98.0`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Token": token
      },
      body: "data=" + encodeURIComponent(JSON.stringify({}))
    });

    var jsonDevoirs = await resDevoirs.json();
    var cahierData = jsonDevoirs.data || {};
    
    var resEspaceTravail = await fetch(`https://api.ecoledirecte.com/v3/E/${id}/espacestravail.awp?verbe=get&typeModule=espaceTravail&v=4.98.0`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Token": token
      },
      body: "data=" + encodeURIComponent(JSON.stringify({}))
    });

    var jsonEspaceTravail = await resEspaceTravail.json();
    var espaceData = jsonEspaceTravail.data || [];
    
    var trimesters = {
      "A001": { name: "1er Trimestre", subjects: {} },
      "A002": { name: "2eme Trimestre", subjects: {} },
      "A003": { name: "3eme Trimestre", subjects: {} }
    };
    
    if (data.notes && Array.isArray(data.notes)) {
      for (var i = 0; i < data.notes.length; i++) {
        var note = data.notes[i];
        var valeur = note.valeur;
        var codePeriode = note.codePeriode;
        
        if (valeur && valeur !== "" && valeur !== "NE" && valeur !== "Abs" && trimesters[codePeriode]) {
          var numericValue = parseFloat(valeur.replace(',', '.'));
          
          if (!isNaN(numericValue)) {
            var noteSur = parseFloat(note.noteSur) || 20;
            var valueOn20 = (numericValue / noteSur) * 20;
            var subject = note.libelleMatiere;
            var coefficient = parseFloat(note.coef) || 1;
            
            if (!trimesters[codePeriode].subjects[subject]) {
              trimesters[codePeriode].subjects[subject] = { sum: 0, coefSum: 0, count: 0 };
            }
            trimesters[codePeriode].subjects[subject].sum += valueOn20 * coefficient;
            trimesters[codePeriode].subjects[subject].coefSum += coefficient;
            trimesters[codePeriode].subjects[subject].count++;
          }
        }
      }
    }
    
    for (var tri in trimesters) {
      var subjects = trimesters[tri].subjects;
      for (var subject in subjects) {
        var subj = subjects[subject];
        subj.average = subj.sum / subj.coefSum;
      }
    }
    
    var defaultTrimester = "A001";
    if (Object.keys(trimesters.A003.subjects).length > 0) {
      defaultTrimester = "A003";
    } else if (Object.keys(trimesters.A002.subjects).length > 0) {
      defaultTrimester = "A002";
    }
    
    var currentTab = "acceuil";
    var currentTrimester = defaultTrimester;
    
    function getGradeColor(avg) {
      if (avg >= 12) return '#5E5EFF';
      if (avg >= 10) return '#FFB340';
      return '#FF5E5E';
    }
    
    function formatDate(dateStr) {
      var date = new Date(dateStr);
      var days = ["DIMANCHE", "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
      var months = ["JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE"];
      var dayName = days[date.getDay()];
      var dayNum = date.getDate();
      var month = months[date.getMonth()];
      return { dayName: dayName, date: dayNum + " " + month, fullDate: dateStr };
    }
    
    function decodeUtf8(str) {
      if (!str) return "";
      try {
        var bytes = [];
        for (var i = 0; i < str.length; i++) {
          bytes.push(str.charCodeAt(i) & 0xFF);
        }
        var decoder = new TextDecoder('utf-8');
        var decoded = decoder.decode(new Uint8Array(bytes));
        var txt = document.createElement('textarea');
        txt.innerHTML = decoded;
        decoded = txt.value;
        decoded = decoded.replace(/\s+/g, ' ').trim();
        return decoded;
      } catch(e) {
        return str;
      }
    }
    
    function decodeContent(str) {
      if (!str) return "";
      try {
        var base64Decoded = atob(str);
        var bytes = [];
        for (var i = 0; i < base64Decoded.length; i++) {
          bytes.push(base64Decoded.charCodeAt(i) & 0xFF);
        }
        var decoder = new TextDecoder('utf-8');
        var decoded = decoder.decode(new Uint8Array(bytes));
        var txt = document.createElement('textarea');
        txt.innerHTML = decoded;
        decoded = txt.value;
        decoded = decoded.replace(/\s+/g, ' ').trim();
        return decoded;
      } catch(e) {
        return decodeUtf8(str);
      }
    }
    
    function renderAcceuil() {
      var contentDiv = document.getElementById('main-content');
      if (!contentDiv) return;
      
      var html = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;">';
      html += '<div style="background:#1C1C2E;border-radius:24px;padding:48px;max-width:500px;">';
      html += '<div style="font-size:64px;margin-bottom:20px;">E-</div>';
      html += '<h2 style="color:#5E5EFF;margin-bottom:12px;">EcoleDirecte -</h2>';
      html += '<p style="color:#8E8E93;margin-bottom:20px;">La page est vide pour le moment</p>';
      html += '<div style="background:#2C2C44;border-radius:12px;padding:16px;margin-top:20px;">';
      html += '<p style="color:#E0E0E0;font-size:14px;">--------</p>';
      html += '</div></div></div>';
      contentDiv.innerHTML = html;
    }
    
    function renderMoyennes() {
      var triData = trimesters[currentTrimester];
      var subjectsList = [];
      var totalWeighted = 0;
      var totalCoef = 0;
      var totalGrades = 0;
      
      for (var subject in triData.subjects) {
        var subj = triData.subjects[subject];
        subjectsList.push({
          name: subject,
          average: subj.average,
          count: subj.count,
          coefSum: subj.coefSum
        });
        totalWeighted += subj.sum;
        totalCoef += subj.coefSum;
        totalGrades += subj.count;
      }
      
      subjectsList.sort(function(a, b) { return b.average - a.average; });
      var trimesterAverage = totalCoef > 0 ? (totalWeighted / totalCoef) : null;
      
      var allTotalWeighted = 0;
      var allTotalCoef = 0;
      var allTotalGrades = 0;
      for (var tri in trimesters) {
        for (var sub in trimesters[tri].subjects) {
          var s = trimesters[tri].subjects[sub];
          allTotalWeighted += s.sum;
          allTotalCoef += s.coefSum;
          allTotalGrades += s.count;
        }
      }
      var annualAverage = allTotalCoef > 0 ? (allTotalWeighted / allTotalCoef) : null;
      
      var contentDiv = document.getElementById('main-content');
      if (!contentDiv) return;
      
      var html = '';
      
      if (subjectsList.length === 0) {
        html += '<div class="empty-state"><p>Aucune note pour ce trimestre</p></div>';
      } else {
        html += '<div class="stats-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;margin-bottom:32px;">';
        html += '<div class="stat-card" style="background:#1C1C2E;border-radius:20px;padding:20px;text-align:center;"><div class="stat-label" style="font-size:14px;color:#8E8E93;margin-bottom:8px;">MOYENNE GENERALE</div><div class="stat-value" style="font-size:44px;font-weight:700;color:#5E5EFF;">' + trimesterAverage.toFixed(2) + '</div><div class="stat-sub" style="font-size:12px;color:#8E8E93;margin-top:8px;">Coefficientee</div></div>';
        html += '<div class="stat-card" style="background:#1C1C2E;border-radius:20px;padding:20px;text-align:center;"><div class="stat-label" style="font-size:14px;color:#8E8E93;margin-bottom:8px;">NOMBRE DE NOTES</div><div class="stat-value" style="font-size:44px;font-weight:700;color:#5E5EFF;">' + totalGrades + '</div><div class="stat-sub" style="font-size:12px;color:#8E8E93;margin-top:8px;">Ce trimestre</div></div>';
        html += '</div>';
        
        html += '<div class="subjects-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;margin-bottom:32px;">';
        for (var i = 0; i < subjectsList.length; i++) {
          var sub = subjectsList[i];
          var gradeColor = getGradeColor(sub.average);
          html += '<div class="subject-card" style="background:#1C1C2E;border-radius:20px;padding:20px;transition:transform 0.2s ease;cursor:pointer;">';
          html += '<div class="subject-header" style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #2C2C44;">';
          html += '<span class="subject-name" style="font-size:17px;font-weight:600;color:#FFFFFF;">' + sub.name + '</span>';
          html += '<span class="subject-average" style="font-size:28px;font-weight:700;color:' + gradeColor + ';">' + sub.average.toFixed(2) + '</span>';
          html += '</div>';
          html += '<div class="subject-stats" style="display:flex;justify-content:space-between;color:#8E8E93;font-size:13px;">';
          html += '<span><span class="grade-indicator" style="width:8px;height:8px;border-radius:4px;background:' + gradeColor + ';display:inline-block;margin-right:6px;"></span>' + sub.count + ' note(s)</span>';
          html += '<span>Coeff. ' + sub.coefSum.toFixed(1) + '</span>';
          html += '</div>';
          html += '</div>';
        }
        html += '</div>';
      }
      
      if (annualAverage !== null) {
        html += '<div class="annual-card" style="background:linear-gradient(135deg,#2C2C44 0%,#1C1C2E 100%);border-radius:24px;padding:28px;text-align:center;border:1px solid rgba(94,94,255,0.3);">';
        html += '<div class="annual-label" style="font-size:15px;color:#8E8E93;margin-bottom:12px;letter-spacing:0.5px;">MOYENNE ANNUELLE</div>';
        html += '<div class="annual-value" style="font-size:56px;font-weight:800;background:linear-gradient(135deg,#FFFFFF 0%,#5E5EFF 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">' + annualAverage.toFixed(2) + '</div>';
        html += '<div class="annual-note-count" style="font-size:13px;color:#8E8E93;margin-top:12px;">' + allTotalGrades + ' notes sur toute l annee</div>';
        html += '</div>';
      }
      
      contentDiv.innerHTML = html;
    }
    
    function showDayDetails(dateKey) {
      var contentDiv = document.getElementById('main-content');
      if (!contentDiv) return;
      
      contentDiv.innerHTML = '<div class="empty-state"><p>Chargement...</p></div>';
      
      fetch(`https://api.ecoledirecte.com/v3/Eleves/${id}/cahierdetexte/${dateKey}.awp?verbe=get&v=4.98.0`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Token": token
        },
        body: "data=" + encodeURIComponent(JSON.stringify({}))
      })
      .then(function(res) { return res.json(); })
      .then(function(json) {
        var matieres = json.data.matieres || [];
        var tasks = [];
        
        for (var i = 0; i < matieres.length; i++) {
          if (matieres[i].aFaire) {
            var task = matieres[i].aFaire;
            task.matiere = matieres[i].matiere;
            task.codeMatiere = matieres[i].codeMatiere;
            task.interrogation = matieres[i].interrogation || false;
            tasks.push(task);
          }
        }
        
        renderDayDetailsView(tasks);
      })
      .catch(function(e) {
        contentDiv.innerHTML = '<div class="empty-state"><p>Erreur: ' + e.message + '</p><button id="errorBackBtn" style="background:#2C2C44;border:none;color:white;padding:10px 20px;border-radius:12px;cursor:pointer;margin-top:20px;">← Retour</button></div>';
        document.getElementById('errorBackBtn').addEventListener('click', function() {
          renderDevoirs();
        });
      });
    }
    
    function renderDayDetailsView(tasks) {
      var contentDiv = document.getElementById('main-content');
      if (!contentDiv) return;
      
      var html = '<div style="margin-bottom:20px;">';
      html += '<button id="returnToDevoirsBtn" style="background:#2C2C44;border:none;color:white;padding:10px 20px;border-radius:12px;cursor:pointer;margin-bottom:20px;">← Retour</button>';
      
      for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        var isDone = (task.effectue === true);
        var taskType = task.interrogation ? "Interrogation" : "Devoir";
        var hasDocs = (task.documents && task.documents.length > 0);
        
        var cleanContent = decodeContent(task.contenu || "");
        
        html += '<div style="background:#1C1C2E;border-radius:16px;padding:20px;margin-bottom:16px;border-left:4px solid ' + (isDone ? '#5E5EFF' : '#FFB340') + ';">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;">';
        html += '<div><span style="font-weight:700;color:white;font-size:18px;">' + task.matiere + '</span> <span style="color:#8E8E93;font-size:13px;margin-left:8px;">' + taskType + '</span></div>';
        html += '<div><span style="color:' + (isDone ? '#5E5EFF' : '#FFB340') + ';font-size:13px;font-weight:500;">' + (isDone ? 'FAIT' : 'A FAIRE') + '</span></div>';
        html += '</div>';
        
        if (cleanContent) {
          html += '<div style="color:#E0E0E0;font-size:14px;line-height:1.5;margin-bottom:12px;padding:12px;border-radius:12px;">' + cleanContent + '</div>';
        }
        
        if (task.donneLe) {
          var givenDate = new Date(task.donneLe);
          html += '<div style="color:#8E8E93;font-size:12px;margin-bottom:8px;">Donne le: ' + givenDate.toLocaleDateString('fr-FR') + '</div>';
        }
        
        if (hasDocs) {
          html += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid #2C2C44;">';
          html += '<span style="color:#8E8E93;font-size:12px;">Pieces jointes:</span>';
          for (var d = 0; d < task.documents.length; d++) {
            var doc = task.documents[d];
            html += '<div style="margin-top:8px;"><button class="attachment-btn" data-filename="' + doc.libelle + '" style="background:#2C2C44;border:none;color:#5E5EFF;padding:8px 16px;border-radius:10px;cursor:pointer;font-size:13px;width:100%;text-align:left;">📄 ' + doc.libelle + '</button></div>';
          }
          html += '</div>';
        }
        
        html += '</div>';
      }
      
      html += '</div>';
      contentDiv.innerHTML = html;
      
      var returnBtn = document.getElementById('returnToDevoirsBtn');
      if (returnBtn) {
        returnBtn.addEventListener('click', function() {
          renderDevoirs();
          var btns = document.querySelectorAll('.tab-btn');
          for (var i = 0; i < btns.length; i++) {
            btns[i].classList.remove('active');
            if (btns[i].getAttribute('data-tab') === 'devoirs') {
              btns[i].classList.add('active');
            }
          }
          currentTab = "devoirs";
          var trimesterSelector = document.querySelector('.selector-container');
          if (trimesterSelector) trimesterSelector.style.display = 'none';
        });
      }
      
      var attachBtns = document.querySelectorAll('.attachment-btn');
      for (var i = 0; i < attachBtns.length; i++) {
        attachBtns[i].addEventListener('click', function(e) {
          e.stopPropagation();
          alert("Pièce jointe non disponible. Veuillez utiliser l'application École Directe ou le site web pour accéder aux fichiers.");
        });
      }
    }
    
    function renderDevoirs() {
      var contentDiv = document.getElementById('main-content');
      if (!contentDiv) return;
      
      var dates = Object.keys(cahierData).sort();
      var hasTasks = false;
      var html = '<div class="devoirs-container">';
      
      for (var d = 0; d < dates.length; d++) {
        var dateKey = dates[d];
        var devoirs = cahierData[dateKey];
        var formatted = formatDate(dateKey);
        
        var notDoneTasks = [];
        var doneTasks = [];
        
        for (var i = 0; i < devoirs.length; i++) {
          if (devoirs[i].effectue === false) {
            notDoneTasks.push(devoirs[i]);
          } else {
            doneTasks.push(devoirs[i]);
          }
        }
        
        var allTasks = notDoneTasks.concat(doneTasks);
        if (allTasks.length > 0) {
          hasTasks = true;
          
          html += '<div style="margin-bottom:20px;">';
          html += '<div class="date-pill" data-date="' + dateKey + '" style="background:#1C1C2E;border-radius:20px;padding:14px 20px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">';
          html += '<div><span style="font-weight:700;color:#5E5EFF;font-size:18px;">' + formatted.dayName + '</span><span style="color:#8E8E93;margin-left:12px;font-size:14px;">' + formatted.date + '</span></div>';
          html += '<div style="background:#2C2C44;padding:4px 10px;border-radius:20px;font-size:12px;color:#8E8E93;">' + allTasks.length + ' devoir(s)</div>';
          html += '</div>';
          
          html += '<div class="tasks-list" data-date="' + dateKey + '" style="margin-left:12px;margin-bottom:12px;">';
          for (var i = 0; i < allTasks.length; i++) {
            var task = allTasks[i];
            var isDone = (task.effectue === true);
            var taskType = task.interrogation ? "Interrogation" : "Devoir";
            var hasDocs = (task.documentsAFaire === true);
            
            html += '<div style="background:#1C1C2E;border-radius:16px;padding:16px;margin-bottom:10px;border-left:3px solid ' + (isDone ? '#5E5EFF' : '#FFB340') + ';">';
            html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
            html += '<div><span style="font-weight:700;color:white;font-size:16px;">' + task.matiere + '</span> <span style="color:#8E8E93;font-size:12px;margin-left:8px;">' + taskType + '</span></div>';
            html += '<div><span style="color:' + (isDone ? '#5E5EFF' : '#FFB340') + ';font-size:13px;font-weight:500;">' + (isDone ? 'FAIT' : 'A FAIRE') + '</span></div>';
            html += '</div>';
            
            if (hasDocs) {
              html += '<div style="color:#5E5EFF;font-size:12px;margin-top:6px;">📎 Piece jointe disponible</div>';
            }
            
            html += '</div>';
          }
          html += '</div>';
          html += '</div>';
        }
      }
      
      if (!hasTasks) {
        html += '<div class="empty-state" style="text-align:center;padding:60px 20px;background:#1C1C2E;border-radius:24px;"><p style="color:#8E8E93;font-size:17px;">Aucun devoir a venir</p></div>';
      }
      
      html += '</div>';
      contentDiv.innerHTML = html;
      
      var datePills = document.querySelectorAll('.date-pill');
      for (var i = 0; i < datePills.length; i++) {
        datePills[i].addEventListener('click', function(e) {
          e.stopPropagation();
          var dateKey = this.getAttribute('data-date');
          showDayDetails(dateKey);
        });
      }
    }
    
    function renderEspaceTravail() {
  var contentDiv = document.getElementById('main-content');
  if (!contentDiv) return;
  
  if (!espaceData || espaceData.length === 0) {
    contentDiv.innerHTML = '<div class="empty-state"><p>Aucun espace de travail disponible</p></div>';
    return;
  }
  
  var mySpaces = [];
  var otherSpaces = [];
  
  for (var i = 0; i < espaceData.length; i++) {
    var space = espaceData[i];
    if (space.estMembre === true) {
      mySpaces.push(space);
    } else {
      otherSpaces.push(space);
    }
  }
  
  var html = '';
  
  if (mySpaces.length > 0) {
    html += '<h2 style="color:#5E5EFF;margin-bottom:16px;font-size:20px;">Mes espaces</h2>';
    html += '<div class="espaces-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;margin-bottom:32px;">';
    for (var i = 0; i < mySpaces.length; i++) {
      var space = mySpaces[i];
      var resumeText = decodeContent(space.resume || "");
      html += '<div class="espace-card" data-space-id="' + space.id + '" data-space-title="' + space.titre.replace(/'/g, "\\'") + '" style="background:#1C1C2E;border-radius:16px;padding:16px;border-left:4px solid #5E5EFF;cursor:pointer;">';
      html += '<h3 style="color:white;font-size:16px;margin-bottom:8px;">' + space.titre + '</h3>';
      if (resumeText) {
        html += '<p style="color:#8E8E93;font-size:13px;margin-bottom:12px;">' + resumeText + '</p>';
      }
      html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">';
      if (space.cloud) html += '<span style="background:#2C2C44;padding:4px 8px;border-radius:8px;font-size:11px;color:#5E5EFF;">Cloud</span>';
      if (space.discussion) html += '<span style="background:#2C2C44;padding:4px 8px;border-radius:8px;font-size:11px;color:#5E5EFF;">Discussion</span>';
      if (space.agenda) html += '<span style="background:#2C2C44;padding:4px 8px;border-radius:8px;font-size:11px;color:#5E5EFF;">Agenda</span>';
      html += '</div>';
      html += '<div style="margin-top:12px;"><span style="color:#8E8E93;font-size:11px;">Cree par: ' + (space.creePar || "Inconnu") + '</span></div>';
      html += '</div>';
    }
    html += '</div>';
  }
  
  if (otherSpaces.length > 0) {
    html += '<h2 style="color:#8E8E93;margin-bottom:16px;font-size:18px;">Autres espaces disponibles</h2>';
    html += '<div class="espaces-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">';
    for (var i = 0; i < otherSpaces.length; i++) {
      var space = otherSpaces[i];
      var resumeText = decodeContent(space.resume || "");
      html += '<div class="espace-card" style="background:#1C1C2E;border-radius:16px;padding:16px;border-left:4px solid #2C2C44;opacity:0.8;">';
      html += '<h3 style="color:white;font-size:16px;margin-bottom:8px;">' + space.titre + '</h3>';
      if (resumeText) {
        html += '<p style="color:#8E8E93;font-size:13px;margin-bottom:12px;">' + resumeText + '</p>';
      }
      html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">';
      if (space.cloud) html += '<span style="background:#2C2C44;padding:4px 8px;border-radius:8px;font-size:11px;color:#8E8E93;">Cloud</span>';
      if (space.discussion) html += '<span style="background:#2C2C44;padding:4px 8px;border-radius:8px;font-size:11px;color:#8E8E93;">Discussion</span>';
      if (space.agenda) html += '<span style="background:#2C2C44;padding:4px 8px;border-radius:8px;font-size:11px;color:#8E8E93;">Agenda</span>';
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';
  }
  
  contentDiv.innerHTML = html;
  
  var spaceCards = document.querySelectorAll('.espace-card[data-space-id]');
  for (var i = 0; i < spaceCards.length; i++) {
    spaceCards[i].addEventListener('click', function(e) {
      var spaceId = this.getAttribute('data-space-id');
      var spaceTitle = this.getAttribute('data-space-title');
      showCloudExplorer(spaceId, spaceTitle);
    });
  }
}

    var currentSpaceId = null;

function showCloudExplorer(spaceId, spaceTitle) {
  currentSpaceId = spaceId;
  fetchCloudContent(spaceId);
}

function fetchCloudContent(spaceId) {
  var contentDiv = document.getElementById('main-content');
  if (!contentDiv) return;
  
  contentDiv.innerHTML = '<div class="empty-state"><p>Chargement...</p></div>';
  
  fetch(`https://api.ecoledirecte.com/v3/cloud/W/${spaceId}.awp?verbe=get&v=4.98.0`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Token": token
    },
    body: "data=" + encodeURIComponent(JSON.stringify({}))
  })
  .then(function(res) { return res.json(); })
  .then(function(json) {
    renderCloudExplorer(json.data, spaceId);
  })
  .catch(function(e) {
    contentDiv.innerHTML = '<div class="empty-state"><p>Erreur: ' + e.message + '</p><button id="cloudBackBtn" style="background:#2C2C44;border:none;color:white;padding:10px 20px;border-radius:12px;cursor:pointer;margin-top:20px;">← Retour</button></div>';
    document.getElementById('cloudBackBtn').addEventListener('click', function() {
      renderEspaceTravail();
    });
  });
}

function renderCloudExplorer(data, spaceId) {
  var contentDiv = document.getElementById('main-content');
  if (!contentDiv) return;
  
  var html = '<div style="margin-bottom:20px;">';
  html += '<button id="cloudBackToSpacesBtn" style="background:#2C2C44;border:none;color:white;padding:10px 20px;border-radius:12px;cursor:pointer;margin-bottom:20px;">← Retour aux espaces</button>';
  html += '</div>';
  
  if (data && data.length > 0) {
    html += '<div style="background:#1C1C2E;border-radius:16px;overflow:hidden;">';
    
    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      var isFolder = item.type === 'folder';
      var icon = isFolder ? '📁' : '📄';
      
      html += '<div style="padding:12px 16px;border-bottom:1px solid #2C2C44;display:flex;align-items:center;justify-content:space-between;' + (isFolder ? 'cursor:pointer;' : '') + '"';
      
      if (isFolder) {
        html += ' onclick="window.navigateToFolder(\'' + encodeURIComponent(item.id) + '\', \'' + encodeURIComponent(spaceId) + '\')"';
      }
      
      html += '>';
      html += '<div style="display:flex;align-items:center;gap:12px;">';
      html += '<span style="font-size:18px;">' + icon + '</span>';
      html += '<span style="color:#E0E0E0;">' + item.libelle + '</span>';
      html += '</div>';
      
      if (!isFolder) {
        html += '<span style="color:#8E8E93;font-size:12px;">' + formatFileSize(item.taille) + '</span>';
      } else {
        html += '<span style="color:#5E5EFF;font-size:12px;">Dossier</span>';
      }
      
      html += '</div>';
    }
    
    html += '</div>';
  } else {
    html += '<div class="empty-state"><p>Dossier vide</p></div>';
  }
  
  contentDiv.innerHTML = html;
  
  document.getElementById('cloudBackToSpacesBtn').addEventListener('click', function() {
    renderEspaceTravail();
  });
}

window.navigateToFolder = function(folderId, spaceId) {
  var contentDiv = document.getElementById('main-content');
  if (!contentDiv) return;
  
  contentDiv.innerHTML = '<div class="empty-state"><p>Chargement...</p></div>';
  
  fetch(`https://api.ecoledirecte.com/v3/cloud/W/${spaceId}.awp?verbe=get&v=4.98.0`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Token": token
    },
    body: "data=" + encodeURIComponent(JSON.stringify({}))
  })
  .then(function(res) { return res.json(); })
  .then(function(json) {
    function findFolder(items, targetId) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === targetId) {
          return items[i];
        }
        if (items[i].children && items[i].children.length > 0) {
          var found = findFolder(items[i].children, targetId);
          if (found) return found;
        }
      }
      return null;
    }
    
    var folder = findFolder(json.data, folderId);
    if (folder && folder.children) {
      renderFolderContents(folder, spaceId);
    } else {
      renderCloudExplorer(json.data, spaceId);
    }
  })
  .catch(function(e) {
    contentDiv.innerHTML = '<div class="empty-state"><p>Erreur: ' + e.message + '</p><button id="folderBackBtn" style="background:#2C2C44;border:none;color:white;padding:10px 20px;border-radius:12px;cursor:pointer;margin-top:20px;">← Retour</button></div>';
    document.getElementById('folderBackBtn').addEventListener('click', function() {
      fetchCloudContent(spaceId);
    });
  });
};

function renderFolderContents(folder, spaceId) {
  var contentDiv = document.getElementById('main-content');
  if (!contentDiv) return;
  
  var html = '<div style="margin-bottom:20px;">';
  html += '<button id="folderBackBtn" style="background:#2C2C44;border:none;color:white;padding:10px 20px;border-radius:12px;cursor:pointer;margin-bottom:20px;">← Retour</button>';
  html += '</div>';
  html += '<div style="background:#1C1C2E;border-radius:16px;padding:16px;margin-bottom:16px;">';
  html += '<h3 style="color:#5E5EFF;">📁 ' + folder.libelle + '</h3>';
  html += '</div>';
  
  if (folder.children && folder.children.length > 0) {
    html += '<div style="background:#1C1C2E;border-radius:16px;overflow:hidden;">';
    
    for (var i = 0; i < folder.children.length; i++) {
      var item = folder.children[i];
      var isFolder = item.type === 'folder';
      var icon = isFolder ? '📁' : '📄';
      
      html += '<div style="padding:12px 16px;border-bottom:1px solid #2C2C44;display:flex;align-items:center;justify-content:space-between;' + (isFolder ? 'cursor:pointer;' : '') + '"';
      
      if (isFolder) {
        html += ' onclick="window.navigateToFolder(\'' + encodeURIComponent(item.id) + '\', \'' + encodeURIComponent(spaceId) + '\')"';
      }
      
      html += '>';
      html += '<div style="display:flex;align-items:center;gap:12px;">';
      html += '<span style="font-size:18px;">' + icon + '</span>';
      html += '<span style="color:#E0E0E0;">' + item.libelle + '</span>';
      html += '</div>';
      
      if (!isFolder) {
        html += '<span style="color:#8E8E93;font-size:12px;">' + formatFileSize(item.taille) + '</span>';
      } else {
        html += '<span style="color:#5E5EFF;font-size:12px;">Dossier</span>';
      }
      
      html += '</div>';
    }
    
    html += '</div>';
  } else {
    html += '<div class="empty-state"><p>Dossier vide</p></div>';
  }
  
  contentDiv.innerHTML = html;
  
  document.getElementById('folderBackBtn').addEventListener('click', function() {
    fetchCloudContent(spaceId);
  });
}
window.navigateToFolder = function(folderId, spaceId) {
  var contentDiv = document.getElementById('main-content');
  if (!contentDiv) return;
  
  contentDiv.innerHTML = '<div class="empty-state"><p>Chargement...</p></div>';
  
  fetch(`https://api.ecoledirecte.com/v3/cloud/W/${spaceId}.awp?verbe=get&v=4.98.0`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Token": token
    },
    body: "data=" + encodeURIComponent(JSON.stringify({}))
  })
  .then(function(res) { return res.json(); })
  .then(function(json) {
    function findFolder(items, targetId) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === targetId) {
          return items[i];
        }
        if (items[i].children && items[i].children.length > 0) {
          var found = findFolder(items[i].children, targetId);
          if (found) return found;
        }
      }
      return null;
    }
    
    var folder = findFolder(json.data, folderId);
    if (folder && folder.children) {
      renderFolderContents(folder, spaceId);
    } else {
      renderCloudExplorer(json.data, spaceId);
    }
  })
  .catch(function(e) {
    contentDiv.innerHTML = '<div class="empty-state"><p>Erreur: ' + e.message + '</p><button id="folderBackBtn" style="background:#2C2C44;border:none;color:white;padding:10px 20px;border-radius:12px;cursor:pointer;margin-top:20px;">← Retour</button></div>';
    document.getElementById('folderBackBtn').addEventListener('click', function() {
      fetchCloudContent(spaceId);
    });
  });
};

function renderFolderContents(folder, spaceId) {
  var contentDiv = document.getElementById('main-content');
  if (!contentDiv) return;
  
  var html = '<div style="margin-bottom:20px;">';
  html += '<button id="folderBackBtn" style="background:#2C2C44;border:none;color:white;padding:10px 20px;border-radius:12px;cursor:pointer;margin-bottom:20px;">← Retour</button>';
  html += '</div>';
  html += '<div style="background:#1C1C2E;border-radius:16px;padding:16px;margin-bottom:16px;">';
  html += '<h3 style="color:#5E5EFF;">📁 ' + folder.libelle + '</h3>';
  html += '</div>';
  
  if (folder.children && folder.children.length > 0) {
    html += '<div style="background:#1C1C2E;border-radius:16px;overflow:hidden;">';
    
    for (var i = 0; i < folder.children.length; i++) {
      var item = folder.children[i];
      var isFolder = item.type === 'folder';
      var icon = isFolder ? '📁' : '📄';
      
      html += '<div style="padding:12px 16px;border-bottom:1px solid #2C2C44;display:flex;align-items:center;justify-content:space-between;' + (isFolder ? 'cursor:pointer;' : '') + '"';
      
      if (isFolder) {
        html += ' onclick="window.navigateToFolder(\'' + encodeURIComponent(item.id) + '\', \'' + encodeURIComponent(spaceId) + '\')"';
      }
      
      html += '>';
      html += '<div style="display:flex;align-items:center;gap:12px;">';
      html += '<span style="font-size:18px;">' + icon + '</span>';
      html += '<span style="color:#E0E0E0;">' + item.libelle + '</span>';
      html += '</div>';
      
      if (!isFolder) {
        html += '<span style="color:#8E8E93;font-size:12px;">' + formatFileSize(item.taille) + '</span>';
      } else {
        html += '<span style="color:#5E5EFF;font-size:12px;">Dossier</span>';
      }
      
      html += '</div>';
    }
    
    html += '</div>';
  } else {
    html += '<div class="empty-state"><p>Dossier vide</p></div>';
  }
  
  contentDiv.innerHTML = html;
  
  document.getElementById('folderBackBtn').addEventListener('click', function() {
    fetchCloudContent(spaceId);
  });
}

window.navigateToFolder = function(folderId) {
  var contentDiv = document.getElementById('main-content');
  if (!contentDiv) return;
  
  contentDiv.innerHTML = '<div class="empty-state"><p>Chargement...</p></div>';
  
  var decodedId = decodeURIComponent(folderId);
  
  fetch(`https://api.ecoledirecte.com/v3/cloud/W/${currentSpaceId}.awp?verbe=get&v=4.98.0`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Token": token
    },
    body: "data=" + encodeURIComponent(JSON.stringify({}))
  })
  .then(function(res) { return res.json(); })
  .then(function(json) {
    function findFolder(items, targetId) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === targetId) {
          return items[i];
        }
        if (items[i].children && items[i].children.length > 0) {
          var found = findFolder(items[i].children, targetId);
          if (found) return found;
        }
      }
      return null;
    }
    
    var folder = findFolder(json.data, decodedId);
    if (folder && folder.children) {
      renderSingleFolder(folder, decodedId);
    } else {
      renderCloudExplorer(json.data, currentSpaceId);
    }
  })
  .catch(function(e) {
    contentDiv.innerHTML = '<div class="empty-state"><p>Erreur: ' + e.message + '</p><button id="cloudBackBtn" style="background:#2C2C44;border:none;color:white;padding:10px 20px;border-radius:12px;cursor:pointer;margin-top:20px;">← Retour</button></div>';
    document.getElementById('cloudBackBtn').addEventListener('click', function() {
      fetchCloudContent(currentSpaceId);
    });
  });
};

function renderSingleFolder(folder, folderId) {
  var contentDiv = document.getElementById('main-content');
  if (!contentDiv) return;
  
  var html = '<div style="margin-bottom:20px;">';
  html += '<button id="folderBackBtn" style="background:#2C2C44;border:none;color:white;padding:10px 20px;border-radius:12px;cursor:pointer;margin-bottom:20px;">← Retour</button>';
  html += '</div>';
  html += '<div style="background:#1C1C2E;border-radius:16px;padding:16px;margin-bottom:16px;">';
  html += '<h3 style="color:#5E5EFF;">📁 ' + folder.libelle + '</h3>';
  html += '</div>';
  
  function renderChildren(items, level) {
    var result = '';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var marginLeft = level * 20;
      var isFolder = item.type === 'folder';
      var icon = isFolder ? '📁' : '📄';
      
      result += '<div style="margin-left:' + marginLeft + 'px;padding:8px 12px;border-bottom:1px solid #2C2C44;display:flex;align-items:center;justify-content:space-between;' + (isFolder ? 'cursor:pointer;' : '') + '"';
      
      if (isFolder) {
        result += ' onclick="window.navigateToFolder(\'' + encodeURIComponent(item.id) + '\')"';
      }
      
      result += '>';
      result += '<div style="display:flex;align-items:center;gap:8px;">';
      result += '<span style="font-size:18px;">' + icon + '</span>';
      result += '<span style="color:#E0E0E0;">' + item.libelle + '</span>';
      result += '</div>';
      
      if (!isFolder) {
        result += '<span style="color:#8E8E93;font-size:11px;">' + formatFileSize(item.taille) + '</span>';
      } else {
        result += '<span style="color:#5E5EFF;font-size:11px;">Dossier</span>';
      }
      
      result += '</div>';
      
      if (isFolder && item.children && item.children.length > 0) {
        result += renderChildren(item.children, level + 1);
      }
    }
    return result;
  }
  
  if (folder.children && folder.children.length > 0) {
    html += '<div style="background:#1C1C2E;border-radius:16px;overflow:hidden;">';
    html += renderChildren(folder.children, 0);
    html += '</div>';
  } else {
    html += '<div class="empty-state"><p>Dossier vide</p></div>';
  }
  
  contentDiv.innerHTML = html;
  
  document.getElementById('folderBackBtn').addEventListener('click', function() {
    fetchCloudContent(currentSpaceId);
  });
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' Ko';
  return (bytes / 1048576).toFixed(1) + ' Mo';
}
    
    var newDoc = document.createElement('html');
    var head = document.createElement('head');
    var bodyElem = document.createElement('body');
    
    head.innerHTML = `
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
      <title>Moyennes</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background-color: #0B0B1A; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #FFFFFF; padding: 24px; min-height: 100vh; }
        .container { max-width: 1200px; margin: 0 auto; }
        .tab-bar { display: flex; gap: 12px; margin-bottom: 24px; background: #1C1C2E; padding: 8px; border-radius: 16px; }
        .tab-btn { flex: 1; padding: 14px; text-align: center; font-size: 16px; font-weight: 600; color: #8E8E93; background: transparent; border: none; border-radius: 12px; cursor: pointer; transition: all 0.3s ease; }
        .tab-btn.active { background: #2C2C44; color: #5E5EFF; box-shadow: 0 2px 8px rgba(94, 94, 255, 0.2); }
        .selector-container { margin-bottom: 32px; }
        .trimester-selector { background: #1C1C2E; border-radius: 16px; padding: 8px; display: flex; gap: 8px; }
        .trimester-option { flex: 1; padding: 16px; text-align: center; font-size: 17px; font-weight: 600; color: #8E8E93; background: transparent; border: none; border-radius: 12px; cursor: pointer; transition: all 0.3s ease; }
        .trimester-option.active { background: #2C2C44; color: #5E5EFF; box-shadow: 0 2px 8px rgba(94, 94, 255, 0.2); }
        .empty-state { text-align: center; padding: 60px 20px; background: #1C1C2E; border-radius: 24px; }
        .empty-state p { color: #8E8E93; font-size: 17px; }
        .date-pill:hover { background: #2C2C44 !important; cursor: pointer; }
        .attachment-btn:hover { background: #3C3C54 !important; }
        .espace-card:hover { transform: translateY(-2px); transition: transform 0.2s; }
      </style>
    `;
    
    bodyElem.innerHTML = `
      <div class="container">
        <div class="tab-bar">
          <button class="tab-btn" data-tab="acceuil">Acceuil</button>
          <button class="tab-btn" data-tab="moyennes">Moyennes</button>
          <button class="tab-btn" data-tab="devoirs">Devoirs</button>
          <button class="tab-btn" data-tab="espacetravail">Espace travail</button>
        </div>
        <div class="selector-container" style="display: none;">
          <div class="trimester-selector">
            <button class="trimester-option" data-tri="A001">1er Trimestre</button>
            <button class="trimester-option" data-tri="A002">2eme Trimestre</button>
            <button class="trimester-option" data-tri="A003">3eme Trimestre</button>
          </div>
        </div>
        <div id="main-content"></div>
      </div>
    `;
    
    newDoc.appendChild(head);
    newDoc.appendChild(bodyElem);
    document.replaceChild(newDoc, document.documentElement);
    
    var tabBtns = document.querySelectorAll('.tab-btn');
    for (var i = 0; i < tabBtns.length; i++) {
      tabBtns[i].addEventListener('click', function(e) {
        var tab = this.getAttribute('data-tab');
        currentTab = tab;
        for (var j = 0; j < tabBtns.length; j++) {
          tabBtns[j].classList.remove('active');
        }
        this.classList.add('active');
        
        var trimesterSelector = document.querySelector('.selector-container');
        if (tab === "moyennes") {
          trimesterSelector.style.display = 'block';
          renderMoyennes();
        } else if (tab === "devoirs") {
          trimesterSelector.style.display = 'none';
          renderDevoirs();
        } else if (tab === "espacetravail") {
          trimesterSelector.style.display = 'none';
          renderEspaceTravail();
        } else {
          trimesterSelector.style.display = 'none';
          renderAcceuil();
        }
      });
    }
    
    var triButtons = document.querySelectorAll('.trimester-option');
    for (var i = 0; i < triButtons.length; i++) {
      triButtons[i].addEventListener('click', function(e) {
        var tri = this.getAttribute('data-tri');
        currentTrimester = tri;
        for (var j = 0; j < triButtons.length; j++) {
          triButtons[j].classList.remove('active');
        }
        this.classList.add('active');
        renderMoyennes();
      });
    }
    
    var defaultTabBtn = document.querySelector('.tab-btn[data-tab="acceuil"]');
    if (defaultTabBtn) defaultTabBtn.classList.add('active');
    
    var activeTriBtn = document.querySelector('.trimester-option[data-tri="' + defaultTrimester + '"]');
    if (activeTriBtn) activeTriBtn.classList.add('active');
    
    renderAcceuil();
    
    completion("MoyennesED charge");
    
  } catch (error) {
    document.body.innerHTML = '<div style="background:#0B0B1A;color:white;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;padding:20px;"><div><h2>Erreur</h2><p>' + error.message + '</p></div></div>';
    completion("Erreur: " + error.message);
  }
})();
