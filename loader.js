(function() {
    try {
        document.documentElement.innerHTML = '';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.backgroundColor = '#000000';
        document.body.style.fontFamily = '-apple-system,BlinkMacSystemFont,sans-serif';

        var l = document.createElement('div');
        l.id = 'ed-injector-loader';
        l.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000000;z-index:999999;display:flex;flex-direction:column;justify-content:center;align-items:center;';

        var t = document.createElement('div');
        t.style.cssText = 'width:200px;height:4px;background:#333333;border-radius:2px;overflow:hidden;';

        var b = document.createElement('div');
        b.style.cssText = 'width:30%;height:100%;background:#ffffff;border-radius:2px;animation:fakeLoad 1.5s infinite ease-in-out;';

        var txt = document.createElement('div');
        txt.style.cssText = 'margin-top:16px;font-size:13px;color:#888888;font-weight:400;letter-spacing:0.3px;';

        var phrases = [
            "Connexion...",
            "Calcul des moyennes...",
            "...",
            "ping!",
            "sa charge",
            "PRO TIP: révise pour avoir des bonnes notes",
            "chargement",
            " "
        ];
        txt.textContent = phrases[Math.floor(Math.random() * phrases.length)];

        var st = document.createElement('style');
        st.textContent = '@keyframes fakeLoad{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}';

        t.appendChild(b);
        l.appendChild(t);
        l.appendChild(txt);
        l.appendChild(st);
        document.body.appendChild(l);
        var sc = document.createElement('script');
        sc.src = 'https://cdn.jsdelivr.net/gh/NotANumber-dev/ecoledirecte-@main/ed.js';

        sc.onload = function() {
            setTimeout(function() {
                if (typeof completion === 'function') {
                    completion("Timeout: le chargement est trop long");
                }
            }, 30000);
        };

        sc.onerror = function() {
            txt.textContent = 'Erreur, verifie ta co (peut également etre serveur)';
            txt.style.color = '#FF6B6B';
            b.style.animation = 'none';
            b.style.background = '#FF6B6B';
            b.style.width = '100%';
            completion("Erreur");
        };

        document.head.appendChild(sc);

    } catch(e) {
        completion("Erreur");
    }
})();