var express = require('express');
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

router.get('/callback', function(req, res){
  console.log('called back');
  
  res.send('Logged In');
});

module.exports = router;
