var credentials = JSON.parse(sessionStorage.getItem("credentials"));
var token = credentials.payload.authToken;
var accounts = JSON.parse(sessionStorage.getItem("accounts"));
var id = accounts.payload.accounts[0].id;

completion(token);
