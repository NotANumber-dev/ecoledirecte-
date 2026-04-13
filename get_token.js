/* ================================================
   Script pour obtenir un token API ED
   Executer avec Raccourcis
   https://github.com/NotANumber-dev/ecoledirecte-/
================================================ */

var credentials = JSON.parse(sessionStorage.getItem("credentials"));
var token = credentials.payload.authToken;
var accounts = JSON.parse(sessionStorage.getItem("accounts"));
var id = accounts.payload.accounts[0].id;

completion(token);
