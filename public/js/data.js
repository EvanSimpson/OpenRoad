(function() {
  var App, BMWClient, buildMap, config, bmw_client;

  BMWClient = this.BMWClient;

  config = {
    application: '29667c32-c8a3-43e2-a190-a8d9d8077c2e',
    redirect_uri: 'http://localhost:3000/',
    hostname: 'data.api.hackthedrive.com',
    version: 'v1',
    port: '80',
    scheme: 'http'
  };

  bmw_client = new BMWClient(config);

  App = bmw_client.model('App');

  $(function() {
    if (config.application !== '29667c32-c8a3-43e2-a190-a8d9d8077c2e') {
      return;
    }
    if (config.redirect_uri !== 'http://localhost:3000/') {
      return;
    }
    bmw_client.token(function(error, result) {
      if (error) {
        console.log("redirecting to login.");
        return bmw_client.authorize(config.redirect_uri);
      } else {

        
        bmw_client.get(bmw_client.model("Vehicle"), {
          limit: 10,
          offset: 0
        }, function(error, result){
          console.log(error, result);
        });

        bmw_client.get(bmw_client.model("User"), {
          id: result.UserId
        }, function(error, result) {
          var message;
          message = 'Viewing the location of ';
          if (result.FirstName) {
            message += result.FirstName;
          } else if (result.UserName) {
            message += result.UserName;
          } else if (result.LastName) {
            message += result.LastName;
          } else if (result.Email) {
            message += result.Email;
          } else {
            message += "Unknown";
          }
          message += '';
          console.log(message);
          return 1;
        });
        return bmw_client.get(bmw_client.model("Vehicle"), {}, function(error, result) {
          var i, lat, lng;
          lat = [];
          lng = [];
          i = 0;
          $.each(result.Data, function(key, value) {
            if ((value.LastLocation != null) && (value.LastLocation.Lat != null) && (value.LastLocation.Lng != null)) {
              lat[i] = value.LastLocation.Lat;
              lng[i] = value.LastLocation.Lng;
              return i++;
            }
          });
          if (lat.length > 0) {
            console.log('The vehicle is at: ' + lat[0] + ", " + lng[0]);
            return 1;
          } else {
            return console.log("No vehicle detected!");
          }
        });
      }
    });
    return $(".logout").click(function() {
      return bmw_client.unauthorize(config.redirect_uri);
    });
  });


}).call(this);
