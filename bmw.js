var OAuth = require('oauth').OAuth2;
var querystring = require('querystring');
var request = require('request');

var apiBase = 'https://data.api.hackthedrive.com/v1/';
var appId = "29667c32-c8a3-43e2-a190-a8d9d8077c2e";
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

function getVehicles(app_token){
  var params = {
    
  };
  request.get({
    url: apiBase,
    qs: ''
  });
}

module.exports.redirect = redirect;
module.exports.getVehicles = getVehicles;
