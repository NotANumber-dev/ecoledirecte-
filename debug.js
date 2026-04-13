/* =================================================
   EcoleDirecte API debug panel
   👋 Salut!
   https://github.com/NotANumber-dev/ecoledirecte-
================================================= */

(async () => {
  try {
    document.documentElement.innerHTML = '';
    document.body.style.backgroundColor = '#000000';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    
    var credentials = JSON.parse(sessionStorage.getItem("credentials"));
    var token = credentials.payload.authToken;
    var accounts = JSON.parse(sessionStorage.getItem("accounts"));
    var id = accounts.payload.accounts[0].id;

    var container = document.createElement('div');
    container.style.cssText = 'display:flex;width:100%;height:100vh;font-family:monospace;';
    
    var leftSide = document.createElement('div');
    leftSide.style.cssText = 'flex:1;background:#0B0B1A;color:#E0E0E0;padding:20px;overflow:auto;border-right:2px solid #2C2C44;';
    leftSide.innerHTML = '<h2 style="color:#5E5EFF;">requetes</h2><div id="apiList"></div>';
    
    var rightSide = document.createElement('div');
    rightSide.style.cssText = 'flex:2;background:#0B0B1A;color:#E0E0E0;padding:20px;overflow:auto;';
    rightSide.innerHTML = '<h2 style="color:#5E5EFF;">Resultat</h2><div id="resultContent"></div>';
    
    container.appendChild(leftSide);
    container.appendChild(rightSide);
    document.body.appendChild(container);
    
    var apiListDiv = document.getElementById('apiList');
    var resultDiv = document.getElementById('resultContent');
    
    function addApiButton(name, url, body) {
      var btn = document.createElement('button');
      btn.textContent = name;
      btn.style.cssText = 'display:block;width:100%;margin:8px 0;padding:12px;background:#1C1C2E;border:none;border-radius:12px;color:white;cursor:pointer;text-align:left;font-size:14px;';
      btn.onclick = async function() {
        resultDiv.innerHTML = '<div style="color:#8E8E93;">Chargement...</div>';
        try {
          var res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "X-Token": token
            },
            body: "data=" + encodeURIComponent(JSON.stringify(body || {}))
          });
          var json = await res.json();
          resultDiv.innerHTML = '<pre style="background:#1C1C2E;padding:16px;border-radius:12px;overflow:auto;font-size:11px;">' + JSON.stringify(json, null, 2) + '</pre>';
        } catch(e) {
          resultDiv.innerHTML = '<div style="color:#FF5E5E;">Erreur: ' + e.message + '</div>';
        }
      };
      apiListDiv.appendChild(btn);
    }
    
    addApiButton('Notes', `https://api.ecoledirecte.com/v3/eleves/${id}/notes.awp?verbe=get&v=6.17.0`, { anneeScolaire: "" });
    addApiButton('Devoirs (Cahier de texte)', `https://api.ecoledirecte.com/v3/Eleves/${id}/cahierdetexte.awp?verbe=get&v=4.98.0`, {});
    addApiButton('Espaces de travail', `https://api.ecoledirecte.com/v3/E/${id}/espacestravail.awp?verbe=get&typeModule=espaceTravail&v=4.98.0`, {});
    addApiButton('Carnet de correspondance', `https://api.ecoledirecte.com/v3/eleves/${id}/eleveCarnetCorrespondance.awp?verbe=get&v=4.98.0`, {});
    addApiButton('Vie scolaire', `https://api.ecoledirecte.com/v3/eleves/${id}/viescolaire.awp?verbe=get&v=4.98.0`, {});
    addApiButton('Messages (Messagerie)', `https://api.ecoledirecte.com/v3/eleves/${id}/messages.awp?verbe=get&v=4.98.0`, {});
    addApiButton('Timeline', `https://api.ecoledirecte.com/v3/eleves/${id}/timeline.awp?verbe=get&v=4.98.0`. {});
    completion("Debug panel ready");
    
  } catch (error) {
    document.body.innerHTML = '<div style="background:#0B0B1A;color:white;display:flex;align-items:center;justify-content:center;height:100vh;">Erreur: ' + error.message + '</div>';
    completion("Erreur: " + error.message);
  }
})();
