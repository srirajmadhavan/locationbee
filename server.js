// BASE SETUP
// =============================================================================

// call the packages we need
var express = require('express');// call express
var app = express(); // define our app using express
var bodyParser = require('body-parser');
var ENUM = require('./modules/enum');
var service = require('./modules/services');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//var port = process.env.PORT || 8080; // set our port

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080; // set our port
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'

var mongoose = require('mongoose');
mongoose.connect('mongodb://keerthi:test123@ds063150.mongolab.com:63150/ami');
//mongoose.connect('mongodb://localhost:27017/location'); // connect to our database
var Location = require('./models/location');

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router(); // get an instance of the express Router

// allow cross domain
var allowCrossDomain = function (req, res, next)
{
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
}

// middleware to use for all requests
router.use(function (req, res, next) {
    // do logging
    console.log('base route works');
    next(); // make sure we go to the next routes and don't stop here
});

router.route('/location')
    .post(function (req, res) {
        req.body.type = 3;
        service.TripStart(req.body, function () { });
        console.log('response sent');
        res.json({ message: 'trip started' });

    })// create a location (accessed at POST /api/location)
    .get(function (req, res) {
        service.TripGetAll(function (err, result) {
            if (err)
                res.send(err);

            res.json(result);
        });
    });// get all the location (accessed at GET /api/location)

router.route('/location/:id')
    .get(function (req, res) {
        Location.findOne({ tripid: req.params.id }, function (err, location) {
            if (err)
                res.send(err);
            res.json(location);
        });
    })// get the location with that id (accessed at GET /api/location/:id)
    .put(function (req, res) {
        if (req.body.type == "1") {
            service.TripStop(req.body, function (err, result) {
                if (err)
                    res.send(err);
            });
            res.json({ message: 'Trip Ended!' });
        }
        else {
            service.TripUpdate(req.body, function (err, result) {
                if (err)
                    res.send(err);

                res.json({ message: 'Location updated!', result: { destination: result.destination, location: result.dbupdate, traffic: result.traffic } });
            });
        }
    })// update the location with this id (accessed at PUT /api/location/:id)
    .delete(function (req, res) {
        Location.remove({
            _id: req.params.id
        }, function (err, location) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
    });// delete the location with this id (accessed at DELETE /api/location/:id)

// REGISTER ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use(allowCrossDomain);
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(server_port, server_ip_address, function ()
{
    console.log("Listening on " + server_ip_address + ", server_port " + server_port)
});
console.log('Magic happens on port ' + server_port);

