var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LocationSchema = new Schema({
    time_start: { type: Date },
    time_end: { type: Date },
    tripid: String,
    deviceid: String,
    distance: Number,
    start_addr: String,
    end_addr: String,
    loc:
        {
            type: { type: String, default: "LineString" },
            coordinates: { type: [], default: [[0, 0], [0, 0]] }
        },
    speed: []
});

LocationSchema.index({ loc: '2dsphere' });

LocationSchema.pre('save', function (next)
{
    var self = this;
    // Pre save clean up
    next();
});


module.exports = mongoose.model('Location', LocationSchema);