var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/location'); // connect to our database
var Schema = mongoose.Schema;

var Location = require('./models/location');

var Create = function (data, callback) {

    var location = new Location({
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
    location.loc.coordinates.push(temp);



}

var Update = function (data, callback) {


}

var Delete = function (data, callback) {


}


