(function() {
  (async () => {
    try {
      var credentials = JSON.parse(sessionStorage.getItem("credentials"));
      var token = credentials.payload.authToken;
      var accounts = JSON.parse(sessionStorage.getItem("accounts"));
      var id = accounts.payload.accounts[0].id;

      var res = await fetch(`https://api.ecoledirecte.com/v3/eleves/${id}/notes.awp?verbe=get&v=6.17.0`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Token": token
        },
        body: `data=${encodeURIComponent(JSON.stringify({ anneeScolaire: "" }))}`
      });

      var json = await res.json();
      var data = json.data;
      
      var trimesters = {
        "A001": { name: "1er Trimestre", subjects: {} },
        "A002": { name: "2ème Trimestre", subjects: {} },
        "A003": { name: "3ème Trimestre", subjects: {} }
      };
      
      if (data.notes && Array.isArray(data.notes)) {
        for (var i = 0; i < data.notes.length; i++) {
          var note = data.notes[i];
          var valeur = note.valeur;
          var codePeriode = note.codePeriode;
          
          if (valeur && valeur !== "" && valeur !== "NE" && valeur !== "Abs" && valeur !== "NE " && trimesters[codePeriode]) {
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
      
      document.documentElement.innerHTML = '';
      
      var newDoc = document.createElement('html');
      var head = document.createElement('head');
      var body = document.createElement('body');
      
      head.innerHTML = `
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
        <title>Moyennes</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background-color: #0B0B1A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #FFFFFF; padding: 24px; min-height: 100vh; }
          .container { max-width: 1200px; margin: 0 auto; }
          .header { margin-bottom: 32px; text-align: center; }
          .header h1 { font-size: 34px; font-weight: 700; background: linear-gradient(135deg, #FFFFFF 0%, #8B8BFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 8px; }
          .header p { color: #8E8E93; font-size: 15px; }
          .selector-container { margin-bottom: 32px; }
          .trimester-selector { background: #1C1C2E; border-radius: 16px; padding: 8px; display: flex; gap: 8px; }
          .trimester-option { flex: 1; padding: 16px; text-align: center; font-size: 17px; font-weight: 600; color: #8E8E93; background: transparent; border: none; border-radius: 12px; cursor: pointer; transition: all 0.3s ease; }
          .trimester-option.active { background: #2C2C44; color: #5E5EFF; box-shadow: 0 2px 8px rgba(94, 94, 255, 0.2); }
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 32px; }
          .stat-card { background: #1C1C2E; border-radius: 20px; padding: 20px; text-align: center; }
          .stat-label { font-size: 14px; color: #8E8E93; margin-bottom: 8px; }
          .stat-value { font-size: 44px; font-weight: 700; color: #5E5EFF; }
          .stat-sub { font-size: 12px; color: #8E8E93; margin-top: 8px; }
          .subjects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; margin-bottom: 32px; }
          .subject-card { background: #1C1C2E; border-radius: 20px; padding: 20px; transition: transform 0.2s ease; }
          .subject-card:hover { transform: scale(1.02); }
          .subject-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #2C2C44; }
          .subject-name { font-size: 17px; font-weight: 600; color: #FFFFFF; }
          .subject-average { font-size: 28px; font-weight: 700; }
          .subject-stats { display: flex; justify-content: space-between; color: #8E8E93; font-size: 13px; }
          .grade-indicator { width: 8px; height: 8px; border-radius: 4px; display: inline-block; margin-right: 6px; }
          .annual-card { background: linear-gradient(135deg, #2C2C44 0%, #1C1C2E 100%); border-radius: 24px; padding: 28px; text-align: center; border: 1px solid rgba(94, 94, 255, 0.3); }
          .annual-label { font-size: 15px; color: #8E8E93; margin-bottom: 12px; letter-spacing: 0.5px; }
          .annual-value { font-size: 56px; font-weight: 800; background: linear-gradient(135deg, #FFFFFF 0%, #5E5EFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
          .annual-note-count { font-size: 13px; color: #8E8E93; margin-top: 12px; }
          .empty-state { text-align: center; padding: 60px 20px; background: #1C1C2E; border-radius: 24px; }
          .empty-state p { color: #8E8E93; font-size: 17px; }
          @media (max-width: 768px) { body { padding: 16px; } .subjects-grid { grid-template-columns: 1fr; } .stat-value { font-size: 36px; } .annual-value { font-size: 44px; } }
        </style>
      `;
      
      var currentTrimester = "A001";
      
      function renderGrades() {
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
        
        var contentDiv = document.getElementById('dynamicContent');
        if (!contentDiv) return;
        
        var html = '';
        
        if (subjectsList.length === 0) {
          html += '<div class="empty-state"><p>Aucune note pour ce trimestre</p></div>';
        } else {
          html += '<div class="stats-grid">';
          html += '<div class="stat-card"><div class="stat-label">MOYENNE GÉNÉRALE</div><div class="stat-value">' + trimesterAverage.toFixed(2) + '</div><div class="stat-sub">Coefficientée</div></div>';
          html += '<div class="stat-card"><div class="stat-label">NOMBRE DE NOTES</div><div class="stat-value">' + totalGrades + '</div><div class="stat-sub">Ce trimestre</div></div>';
          html += '</div>';
          
          html += '<div class="subjects-grid">';
          for (var i = 0; i < subjectsList.length; i++) {
            var sub = subjectsList[i];
            var gradeColor = sub.average >= 12 ? '#5E5EFF' : (sub.average >= 10 ? '#FFB340' : '#FF5E5E');
            html += '<div class="subject-card">';
            html += '<div class="subject-header">';
            html += '<span class="subject-name">' + sub.name + '</span>';
            html += '<span class="subject-average" style="color:' + gradeColor + ';">' + sub.average.toFixed(2) + '</span>';
            html += '</div>';
            html += '<div class="subject-stats">';
            html += '<span><span class="grade-indicator" style="background:' + gradeColor + ';"></span>' + sub.count + ' note(s)</span>';
            html += '<span>Coeff. ' + sub.coefSum.toFixed(1) + '</span>';
            html += '</div>';
            html += '</div>';
          }
          html += '</div>';
        }
        
        if (annualAverage !== null) {
          html += '<div class="annual-card">';
          html += '<div class="annual-label">MOYENNE ANNUELLE PONDÉRÉE</div>';
          html += '<div class="annual-value">' + annualAverage.toFixed(2) + '</div>';
          html += '<div class="annual-note-count">' + allTotalGrades + ' notes sur toute l\'année</div>';
          html += '</div>';
        }
        
        contentDiv.innerHTML = html;
      }
      
      body.innerHTML = `
        <div class="container">
          <div class="header">
            <h1>Moyennes</h1>
            <p>Notes et moyennes par matière</p>
          </div>
          <div class="selector-container">
            <div class="trimester-selector">
              <button class="trimester-option" data-tri="A001">1er Trimestre</button>
              <button class="trimester-option" data-tri="A002">2ème Trimestre</button>
              <button class="trimester-option" data-tri="A003">3ème Trimestre</button>
            </div>
          </div>
          <div id="dynamicContent"></div>
        </div>
      `;
      
      newDoc.appendChild(head);
      newDoc.appendChild(body);
      document.replaceChild(newDoc, document.documentElement);
      
      var activeBtn = document.querySelector('.trimester-option[data-tri="A001"]');
      if (activeBtn) activeBtn.classList.add('active');
      
      renderGrades();
      
      var buttons = document.querySelectorAll('.trimester-option');
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function(e) {
          var tri = this.getAttribute('data-tri');
          currentTrimester = tri;
          for (var j = 0; j < buttons.length; j++) {
            buttons[j].classList.remove('active');
          }
          this.classList.add('active');
          renderGrades();
        });
      }
      
    } catch (error) {
      document.documentElement.innerHTML = '<body style="background:#0B0B1A;color:white;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><div style="text-align:center;"><h2>Erreur</h2><p>' + error.message + '</p></div></body>';
    }
  })();
})();
