var enumFactory = require("simple-enum");
//var location_type = enumFactory([" ", "STOP", "MOVING", "START"]);

//var result = enumFactory([" ", "SUCCESS", "ERROR"]);


module.exports = {
    LOCATION_TYPE: enumFactory([" ", "STOP", "MOVING", "START"]),
    RESULT: enumFactory([" ", "SUCCESS", "ERROR"])
}

//module.exports = location_type;
//module.exports = result;

//moods.all === [1, 2, 3] //True 
//moods.all.indexOf(moods.HAPPY) > -1 //True 
//moods.HAPPY === 1 //True 
//moods.SAD === 2 //True 
