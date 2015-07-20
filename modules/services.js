var mongoose = require('mongoose');
var request = require('request');
var async = require('async');
var linq = require('./linq');
var Location = require('../models/location');
var ENUM = require('./enum');

module.exports = {

    TripStart: function (data, callback)
    {

        var db = new Location({
            time_start: "",
            time_end: "",
            tripid: data.tripid,
            deviceid: data.device,
            distance: 0,
            start_addr: "",
            end_addr: "",
            speed: [data.speed]
        });

        var temp = new Array();
        temp.push(parseFloat(data.longitude), parseFloat(data.lattitude));
        db.loc.coordinates.push(temp);

        //result = updated db with start/end address
        ResolveAddress(data, db, function (err, result)
        {
            if (err == ENUM.RESULT.SUCCESS)
            {
                result.save(function (err)
                {
                    if (err)
                        callback(err, result);
                    console.log('saved trip');
                });
            }
        });
    },

    TripUpdate: function (data, finalcallback)
    {
        async.parallel({
            //add to db
            dbupdate: function (callback)
            {
                Location.findOne({ tripid: data.tripid }, function (err, db)
                {
                    if (err || !db)
                    {
                        error = err;
                        callback("Trip not found", null);
                    }

                    db.loc.coordinates.push([parseFloat(data.longitude), parseFloat(data.lattitude)]);
                    db.speed.push(data.speed);

                    if (db.start_addr == "")
                    {
                        data.type = 3;
                        data.retry = 1;
                        var startLocation = { lattitude: db.loc.coordinates[2][1], longitude: db.loc.coordinates[2][0] };
                        ResolveAddress(startLocation, db, function (err, result)
                        {
                            if (err == ENUM.RESULT.SUCCESS)
                            {
                                err = null;
                                result.save(function (err)
                                {
                                    if (err)
                                        callback(err, result);
                                    console.log('saved trip');
                                });
                            }
                            callback(err, db);
                        });
                    }
                    else
                    {
                        db.save(function (err)
                        {
                            if (err)
                                error = err;

                            //location = db;
                            callback(err, db);
                        });
                    }
                });
            },
            // predict destination if destination is asked for
            destination: function (callback)
            {
                if (data.destination)
                {
                    PredictDestination(data, function (destination)
                    {
                        //desitnation = desitnation;
                        callback(null, destination);
                    });
                }
                else
                    callback(null, null);
            },
            //calculate traffic if hastarget is passed
            traffic: function (callback)
            {
                if (data.hastarget)
                {
                    GetTraffic(data, function (err, result)
                    {
                        if (err == ENUM.RESULT.SUCCESS)
                        {
                            callback(null, result);
                        }
                        else
                        {
                            callback(err, null);
                        }
                    });
                }
                else
                    callback(null, null);
            }
        },
        // call back from all methods
        function (err, results)
        {
            finalcallback(err, results);
        });
    },

    TripStop: function (data, callback)
    {
        Location.findOne({ tripid: data.tripid }, function (err, db)
        {
            if (err)
                error = err;

            db.loc.coordinates.push([parseFloat(data.longitude), parseFloat(data.lattitude)]);
            db.speed.push(data.speed);

            ResolveAddress(data, db, function (err, result)
            {
                if (err == ENUM.RESULT.SUCCESS)
                {
                    result.save(function (err)
                    {
                        if (err)
                            callback(err, result);
                        console.log('saved trip');
                    });
                }
            });
        });
    },

    TripGetAll: function (callback)
    {
        Location.find(function (err, result)
        {
            callback(err, result);
        });
    }
}

var ResolveAddress = function (data, db, callback)
{
    var url = 'http://dev.virtualearth.net/REST/v1/Locations/' + data.lattitude + ',' + data.longitude + '?key=AmGOyaGuKOLmdGdr9s10JRrwvs3ULYDMRWVqb-lwrttqb1FJB5ulKLwp0hTuxeMf';
    request(url, function (error, response, html)
    {
        if (!error)
        {
            var responseObject = JSON.parse(response.body);
            switch (parseInt(data.type))
            {
                case ENUM.LOCATION_TYPE.START:
                    if (data.retry != 1)
                        db.time_start = new Date(Date.now());
                    if (responseObject.resourceSets.length > 0 && responseObject.resourceSets[0].resources[0] != undefined)
                        db.start_addr = responseObject.resourceSets[0].resources[0].address.formattedAddress
                    break;
                case ENUM.LOCATION_TYPE.STOP:
                    db.time_end = new Date(Date.now());
                    if (responseObject.resourceSets.length > 0 && responseObject.resourceSets[0].resources[0] != undefined)
                        db.end_addr = responseObject.resourceSets[0].resources[0].address.formattedAddress
                    break;
                case ENUM.LOCATION_TYPE.MOVING:
                    break;
            }
            error = ENUM.RESULT.SUCCESS;
        }
        callback(error, db);
    });
}

var GetTraffic = function (data, callback)
{
    var url = 'http://dev.virtualearth.net/REST/V1/Routes/Driving?wp.0='
        + data.lattitude + ',' + data.longitude
        + '&wp.1=' + data.lattitude1 + ',' + data.longitude1 +
        '&key=AmGOyaGuKOLmdGdr9s10JRrwvs3ULYDMRWVqb-lwrttqb1FJB5ulKLwp0hTuxeMf';

    request(url, function (error, response, html)
    {
        var result;
        if (!error)
        {
            error = ENUM.RESULT.SUCCESS;
            var result = JSON.parse(response.body);
            if (JSON.parse(response.body).statusCode === 200)
            {
                var warnings = linq.From(result.resourceSets[0].resources[0].routeLegs[0].itineraryItems)
                               .Where(function (itineryItem) { return itineryItem.warnings != undefined })
                               .Select(function (itinaryItem) { return itinaryItem.warnings })
                               .ToArray();

                var combineWarnings = new Array();
                for (i = 0; i < warnings.length; i++)
                {
                    for (j = 0; j < warnings[i].length; j++)
                    {
                        if (warnings[i][j].warningType == "TrafficFlow")
                        {
                            combineWarnings.push(warnings[i][j]);
                        }
                    }
                }
                var filteredWarning = linq.From(combineWarnings)
                                          .Where(function (warning) { return warning.warningType == "TrafficFlow" })
                                          .Select(function (result)
                                          {
                                              return {
                                                  severity: result.severity,
                                                  text: result.text,
                                                  origin: result.origin,
                                                  to: result.to,
                                                  distance: result.distance,
                                                  time: result.time
                                              }
                                          })
                                          .ToArray();

                CalulateDistanceToIncident(data, filteredWarning, function (error, r)
                {
                    error = ENUM.RESULT.SUCCESS;
                    result = filteredWarning;
                    callback(error, result);
                });
            }
            else
            {
                error = "Traffic Error: " + result.statusCode + " Reason: " + result.statusDescription;
                callback(error, filteredWarning);
            }
        }
        //callback(error, result);
    });

}

var PredictDestination = function (data, callback)
{
    Location.aggregate([
                         {
                             "$geoNear": {
                                 "near": {
                                     "type": "LineString",
                                     "coordinates": [parseFloat(data.longitude), parseFloat(data.lattitude)] //[-74.02648, 40.728507]
                                 },
                                 "maxDistance": 100,
                                 "distanceField": "dist",
                                 "includeLocs": "locs",
                                 "spherical": true
                             }
                         }, {
                             "$match": { "end_addr": { "$ne": "" } }
                         }
    ], function (err, result)
    {
        var destination;
        if (result)
        {
            destination = {
                loc: result[0].loc.coordinates[result[0].loc.coordinates.length - 1],
                addr: result[0].end_addr
            }
        }
        callback(destination);
    });
}

var GetDistanceToWarnings = function (data, callback)
{
    var url = 'http://dev.virtualearth.net/REST/V1/Routes/Driving?wp.0='
        + data.lattitude + ',' + data.longitude
        + '&wp.1=' + data.lattitude1 + ',' + data.longitude1 +
        '&key=AmGOyaGuKOLmdGdr9s10JRrwvs3ULYDMRWVqb-lwrttqb1FJB5ulKLwp0hTuxeMf&ra=excludeItinerary&du=mi';
    var result;

    request(url, function (error, response, html)
    {
        if (!error)
        {
            error = ENUM.RESULT.SUCCESS;
            result = JSON.parse(response.body);
            if (JSON.parse(response.body).statusCode === 200)
            {
                result = { error: "", distance: result.resourceSets[0].resources[0].travelDistance, time: result.resourceSets[0].resources[0].travelDurationTraffic };
            }
            else
            {
                result = { error: result.statusCode + " Reason:" + result.statusDescription };
            }
        }
        callback(error, result);
    });
}

var CalulateDistanceToIncident = function (data, warnings, onCompletion)
{
    var bag = [];
    var box = [];
    var count = warnings.length;

    async.forEach(warnings, function (item, callback)
    {
        data.lattitude1 = parseFloat(item.origin.split(',')[0]);
        data.longitude1 = parseFloat(item.origin.split(',')[1]);
        GetDistanceToWarnings(data, function (error, obj)
        {
            if (error == ENUM.RESULT.SUCCESS)
            {
                item.distance = obj;
                count--;
                if (count == 0)
                {
                    onCompletion(null, warnings);
                }
            }
        });
        callback();
    });
}