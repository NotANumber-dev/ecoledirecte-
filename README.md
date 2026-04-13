<div align="center">
<img src="icon/icon.png" height="100px"/>
<h1 align="center">EcoleDirecte -</h1>
<p align="center">EcoleDirecte 500x mieux | Raccourci iPhone/iPad/iMac/Mac/MacMini</p>
</div>

## Info
 Ne fonctione UNIQUEMENT sur un compte ecoledirecte éleve
 
> [!warning]
> Ce projet n'est PAS affilié avec Aplim ou/et EcoleDirecte


> [!warning]
> si il y a une fork de ce repo, VERIFIER le contenu de celui-ci avant de l'executer.
## Fonctionnalités

- Notes + moyenne (par matière + moyenne gé)
- Devoirs
- Espaces de travail
- Carnet de correspondance
- Vie scolaire (absences, retards, colle ...)

## Utilisation
Executer le raccourci dans la feuille de partage du site ecoledirecte dans safari.

1) ouvrir ecoledirecte.com sur safari
2) cliquer sur partager
3) selectioner "plus"
4) choisir ecoledirecte -

> [!warning]
> Assurez-vous d'accorder toutes les autorisation que le raccourci demandera et d'autoriser l'éxécution de JavaScript dans Reglages > Apps > Raccourcis > Avancé > Autoriser l'éxécution de scripts

### Raccourcis
Prod: https://www.icloud.com/shortcuts/86a80da0d32943a0b261cb3cf2e86eb0 (jsdelivr cdn, 24h update)
<br>
Beta/dev: https://www.icloud.com/shortcuts/d3de9061a50a4327a6395e16ce5bd3ac (raw github API, rate limits)
<br>
Debug panel: https://www.icloud.com/shortcuts/b51d6ab0ad4048588a5ddc57356e919f (raw github API, rate limits)
## Changelog
### V1.3 (current)
 - Messages
 - Timeline
### V1.2
 - Carnet de correspondance
 - Vie scolaire
 - Mode debug
### V1.1
 - espaces de travail (fichiers uniquement)
 - devoirs affichées correctement
### V1.0
 - moyennes générale par matière/trimestre/année (calcule avec les coefitients, comparé a l'application mobile parent)
 - devoirs (les caractères speciaux comme é è ´ sonts affichées corectement. & ne s'affiche pas correctement)

## securité
• Votre token d'authentification ne quitte JAMAIS votre navigateur

• Aucune donnée n'est envoyée à un serveur externe

• Tous les appels API vont directement à api.ecoledirecte.com

• Vos informations d'identification ne sont stockées que dans sessionStorage

• Cette superposition fonctionne 100 % localement dans votre navigateur


toujours pas sur? verifie le code (Main.js)
## Requetes web
[raccourci]
https://raw.githubusercontent.com/NotANumber-dev/ecoledirecte-/refs/heads/main/main.js


OU

https://cdn.jsdelivr.net/gh/NotANumber-dev/ecoledirecte-@main/main.js

[code]

POST https://api.ecoledirecte.com/v3/eleves/${id}/notes.awp?verbe=get&v=6.17.0

POST https://api.ecoledirecte.com/v3/Eleves/${id}/cahierdetexte.awp?verbe=get&v=4.98.0

POST https://api.ecoledirecte.com/v3/E/${id}/espacestravail.awp?verbe=get&typeModule=espaceTravail&v=4.98.0

POST https://api.ecoledirecte.com/v3/eleves/${id}/eleveCarnetCorrespondance.awp?verbe=get&v=4.98.0

POST https://api.ecoledirecte.com/v3/eleves/${id}/viescolaire.awp?verbe=get&v=4.98.0

POST https://api.ecoledirecte.com/v3/eleves/${id}/messages.awp?verbe=get&v=4.98.0

POST https://api.ecoledirecte.com/v3/eleves/${id}/timeline.awp?verbe=get&v=4.98.0

POST https://api.ecoledirecte.com/v3/Eleves/${id}/cahierdetexte.awp?verbe=put&v=4.98.0

POST https://api.ecoledirecte.com/v3/Eleves/${id}/cahierdetexte/${dateKey}.awp?verbe=get&v=4.98.0

POST https://api.ecoledirecte.com/v3/eleves/${id}/messages/${messageId}.awp?verbe=get&mode=destinataire&v=4.98.0

## License
Apache 2.0
