/* ========================================================
   EcoleDirecte -
   👋 Salut
   https://github.com/NotANumber-dev/ecoledirecte-
   Apache 2.0 License - (c) NotANumber-dev, noodlelover1
   🔗 💎.pages.dev/ed-/manuel  |  nan-dev.pages.dev
======================================================== */

(function() {
    try {
        var sc = document.createElement('script');
        sc.src = 'https://cdn.jsdelivr.net/gh/NotANumber-dev/ecoledirecte@main/ecoledirecte.js?t=' + Date.now();
        
        sc.onload = function() {
            completion("chargé");
        };

        sc.onerror = function() {
            completion("Erreur: Impossible de charger le script principal");
        };

        document.head.appendChild(sc);
    } catch(e) {
        completion("Erreur injection: " + e.message);
    }
})();