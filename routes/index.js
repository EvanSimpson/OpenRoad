var express = require('express')
  , request = require('request')
  , Promise = require('promise')
  , soap = require('soap')
  , xml2json = require('xml2json')
  , sprintf = require('sprintf-js').sprintf
  , mongojs = require('mongojs')
  , _ = require('underscore');

var db = mongojs(process.env.MONGOLAB_URI || 'open_road', ['users']);

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
  var user;
  if (req.session.user){
    user = req.session.user;
  } else if (req.session.cookie.user){
    user = req.session.cookie.user;
  }
  console.log(user);
  res.render('index', { title: 'Open Road', user: user });
});

router.get('/auth', function(req, res){
  return BMW.redirect(req, res);
});

router.post('/login', function(req, res){
  console.log(req.body);
  var user = {
    bmw_id: req.body["user"],
    access_token: req.body["token"]
  };
  req.session.user = user;
  req.session.cookie.user = user;
  res.redirect('/');
  db.users.findOne({bmw_id: user.bmw_id}, function(err, doc){
    if (!!doc){
      console.log('existing user', doc);
      if (user.access_token != doc.access_token){
        doc.access_token = user.access_token;
        db.users.save(doc);
      }
    } else {
      console.log('new user');
      db.users.insert({
        bmw_id: user.bmw_id,
        access_token: user.access_token,
        vin: 'WBY1Z4C55EV273078'
      });
    }
  });
});

router.get('/callback', function(req, res){
  console.log('called back');
  res.render('redirect');
});

router.post('/go', function(req, res){
  var user = req.session.user;
  var options = {
    time: req.body.time,
    adventure: req.body.adventure,
    user: user.bmw_id
  };
  console.log('bmw id', user);
  db.users.findOne({bmw_id: user.bmw_id}, function(err, doc){
    if (!!doc){
      roll(options, doc.vin, function(best, all){
        var bestStation = best[Object.keys(best)[0]]['station'];
        var bestPoi = 
        console.log('best station', bestStation);
        
        res.end('success');
      });
    } else {
    }
  });
  
});

function roll(options, vin, next){
  var location, battery;
  console.log(vin);
  var locPromise = new Promise(function(resolve, reject){
    request('http://api.hackthedrive.com/vehicles/'+vin+'/location/', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log('location returned')
        location = JSON.parse(body);
        resolve();
      } else {
        console.log(error, response.statusCode);
      }
    });
  });
  var batPromise = new Promise(function(resolve, reject){
    request('http://api.hackthedrive.com/vehicles/'+vin+'/battery/', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log('battery returned')
        battery = JSON.parse(body);
        resolve(locPromise);
      } else {
        console.log(error, response.statusCode);
      }
    });
  });
  batPromise.then(function onFullfill(){
    console.log('getting charging stations');
    chargeStationsFromLatLongRange(options, location.lat, location.lon, battery.remainingRangeMi, next);
  },function onReject(){});
  
  
}

function chargeStationsFromLatLongRange(options, Lat, Long, range, next){
  var xml = sprintf(xmlInput, Math.round(range), Lat, Long);
  var headers = {
    "Content-Length": xml.length,
    "Content-Type": "text/xml; charset=utf-8",
    "SOAPAction": "urn:provider/interface/chargepointservices/getPublicStations"
  };
  request.post({
    url:  "https://webservices.chargepoint.com/webservices/chargepoint/services/4.1", 
    headers: headers,
    body: xml}, function(error, response, body){
      var json = xml2json.toJson(body);
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
      console.log('viable stations found');
      // return herePoiFromStations(options, viable, next);
      next && next(
        _.map(viable, function(value, key, list){
          var ret = {};
          ret[value.stationID] = {station: value, poi:{}};
        return ret;
        }), {});
    });
}

function herePoiFromStations(options, stations, next){
  var poi = {
    best: {},
    all: {}
  };
  var finished = _.after(stations.length, function(){
    next && next(poi.best, poi.all);
  });

  for(var i=0; i<stations.length; i++){
    var station = stations[i]
    if (station.Port.length){
      station.Port = station.Port[0];
    }
    var params = {
      at: station.Port.Geo.Lat.toString() + ',' + station.Port.Geo.Long.toString(),
      cat: "natural-geographical",
      accept: "application/json",
      app_id: hereId,
      app_code: hereSecret
    };
    request.get({
      url: "http://places.demo.api.here.com/places/v1/discover/explore",
      qs: params
    }, function(k, err, response, body){
      console.log(body);
      var allResults = JSON.parse(body).results.items || {};
      var results = _.filter(allResults, function(place){
        if (place.averageRating < 4.5){
          return false;
        } else {
          return place.distance < 2000;
        }
      });
      if (results.length) {
        poi.best[stations[k].stationID] = {
          station: stations[k],
          poi: results
        };
      };
      poi.all[stations[k].stationID] = {
        station: stations[k],
        poi: allResults
      };
      results.length && console.log(results);
      finished();
    }.bind(this, i));
  };
}






module.exports = router;

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
