var OAuth = require('oauth').OAuth2;
var querystring = require('querystring');

var apiBase = 'https://data.api.hackthedrive.com/v1/';

var authURL = "https://data.api.hackthedrive.com/OAuth2/authorize";

function redirect(req, res){
  var query = {
    response_type: 'token',
    client_id: process.env.BMW_ID,
    redirect_uri: 'http://localhost:3000/'
  }
  var path = authURL + '?' + querystring.stringify(query);
  
  return res.redirect(path);
}

module.exports.redirect = redirect;
