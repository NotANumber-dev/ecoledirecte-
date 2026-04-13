function fetchWithTimeout(url, options, timeout = 5000) {
      return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
    }

    var notesPromise = fetchWithTimeout(`https://api.ecoledirecte.com/v3/eleves/${id}/notes.awp?verbe=get&v=6.17.0`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Token": token
      },
      body: "data=" + encodeURIComponent(JSON.stringify({ anneeScolaire: "" }))
    }, 5000).then(function(res) {
      return res.ok ? res.json() : { data: { notes: [] } };
    }).catch(function() {
      return { data: { notes: [] } };
    });

completion(notesPromise);
