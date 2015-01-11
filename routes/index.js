var express = require('express')
  , request = require('request')
  , Promise = require('Promise')
  , soap = require('soap')
  , xml = require('xml2json')
  , sprint = require('sprintf-js').sprintf
  , _ = require('underscore');

var soapUrl = 'https://developer.chargepoint.com/UI/downloads/cp_api_4.1.wsdl '
  , soapUser = 'b207195d0b1684270db5aeae7970408c5179ce9f5a4dc1366937247'
  , soapPass = '167fb3e18980d8622f6a19fbbda3e01d';
  
var hereId = "6Swd65znKjCshDsVsfFz";
var hereSecret = process.env.HERE_SECRET;
  
var xmlInput =
"  <soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:web=\"http://litwinconsulting.com/webservices/\">\n" +
"	<soap:Header>\n" +
"		<wsse:Security xmlns:wsse='http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd' soap:mustUnderstand='1'>\n" +
"			<wsse:UsernameToken xmlns:wsu='http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd' wsu:Id='UsernameToken-261'>\n" +
"				<wsse:Username>" + soapUser + "</wsse:Username>\n" +
"				<wsse:Password Type='http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText'>" + soapPass + "</wsse:Password>\n" +
"			</wsse:UsernameToken>\n" +
"		</wsse:Security>\n" +
"   </soap:Header>\n" +
"   <soap:Body>\n" +
"		<ns2:getPublicStations xmlns:ns2='http://www.example.org/coulombservices/'>\n" +
"			<searchQuery>\n" +
"				<Proximity>%d</Proximity>\n" +
"				<proximityUnit>M</proximityUnit>\n" +
"				<Geo>\n" +
"					<Lat>%f</Lat>\n" +
"					<Long>%f</Long>\n" +
"				</Geo>\n" +
"			</searchQuery>\n" +
"		</ns2:getPublicStations>\n" +
"   </soap:Body>\n" +
"  </soap:Envelope>\n";

var BMW = require('../bmw.js');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  var user = req.session.user;

  res.render('index', { title: 'Express', user: user });
});

router.get('/auth', function(req, res){
  return BMW.redirect(req, res);
});

router.post('/login', function(req, res){
  console.log(req.body);
  var user = {
    id: req.body["hash"].split('=')[1]
  };
  req.session.user = user;
  res.redirect('/');
});

router.get('/callback', function(req, res){
  console.log('called back');
  res.render('redirect');
});

router.post('/go', function(req, res){
  var vehicle = JSON.parse(req.body.Vehicle);
  var vin = "WBY1Z4C55EV273078";
  roll(vin);
  res.render('enroute');
});

function roll(vin, next){
  var location, battery;
  var locPromise = new Promise(function(resolve, reject){
    request('http://api.hackthedrive.com/vehicles/'+vin+'/location/', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log('location returned')
        location = JSON.parse(body);
        resolve();
      }
    });
  });
  var batPromise = new Promise(function(resolve, reject){
    request('http://api.hackthedrive.com/vehicles/'+vin+'/battery/', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log('battery returned')
        battery = JSON.parse(body);
        resolve(locPromise);
      }
    });
  });
  batPromise.then(function onFullfill(){
    soapItUp(location.lat, location.lon, battery.remainingRangeMi);
  },function onReject(){});
  
  
}

function soapItUp(Lat, Long, range){
  var xml = sprintf(xmlInput, range, Lat, Long);
  var headers = {
    "Content-Length": xml.length,
    "Content-Type": "text/xml; charset=utf-8",
    "SOAPAction": "urn:provider/interface/chargepointservices/getPublicStations"
  };
  request.post({
    url:  "https://webservices.chargepoint.com/webservices/chargepoint/services/4.1", 
    headers: headers,
    body: xmlInput}, function(error, response, body){
      var json = xml.toJson(body);
      var stations = JSON.parse(json)["soapenv:Envelope"]["soapenv:Body"]["ns1:getPublicStationsResponse"]["stationData"];
      var viable = _.filter(stations, function(station){
        if (station.Port.length){
          var lat = station.Port[0].Geo.Lat;
          var lon = station.Port[0].Geo.Long;
          var distance = getDistanceFromLatLonInKm(lat, lon, Lat, Long);
          return distance > 16;
        } else {
          var lat = station.Port.Geo.Lat;
          var lon = station.Port.Geo.Long;
          var distance = getDistanceFromLatLonInKm(lat, lon, Lat, Long);
          return distance > 16;
        }
      });
      getPOI(viable);
    });
}

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
  Math.sin(dLat/2) * Math.sin(dLat/2) +
  Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
  Math.sin(dLon/2) * Math.sin(dLon/2)
  ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

function getPOI(stations){
  var POI = [];
  for(var i=0; i<stations.length; i++){
    if (stations[i].Port.length){
      stations[i].Port = stations[i].Port[0];
    }
    var params = {
      at: stations[i].Port.Geo.Lat.toString() + ',' + stations[i].Port.Geo.Long.toString(),
      cat: "natural-geographical",
      accept: "application/json",
      app_id: hereId,
      app_code: hereSecret
    };
    request.get({
      url: "http://places.demo.api.here.com/places/v1/discover/explore",
      qs: params
    }, function(err, response, body){
      var results = _.filter(JSON.parse(body).results.items, function(place){
        if (place.averageRating < 4.5){
          return false;
        } else {
          return place.distance < 2000;
        }
      });
      POI.push(results);
      results.length && console.log(results);
    });
  };
}

module.exports = router;
