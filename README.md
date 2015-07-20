# locationbee
Data Collection Logic:

Static:
	Log Location: true
	Create Trip ID: true
	Call Traffic : false
	Log Location: false
	Add POI for User: true - add current location as POI for the user.
	Prompted User for target: false

Moving:
	Log Location: true - by the api on CP
	Create Trip ID: false
	Prompted User for target && Target == true:
		True:
			Do nothing
		False:
			Prompt User Target Input from POI: (check setting true/false)
				Success:
					Target: True
				Fail:
					Do nothing
			Prompted User for target: true
	Target: true
		Call Traffic: true on every CP detected
	Target false:
		Call Trafic: false
		Try Get Target: true - anaylyse previous trips on server
			Send current location, previous location
			Success:
				Target: true
			Fail:
				Target: false


Server:

Create/Update Location:
	

Log Stop:
	Log Location()
	Resolve Location Address - google/bing
	Add Location to POI
		Address
		Lat
		Long
		TimeStamp
		Trip ID
	Add Trip Details
		Trip ID
		Avg Speed
		Distance
		Time taken

Try Get Target:
	Current trip matching another trip:
		True:
			Find StopLog by trip ID, return Address, Lat, Long
		False:
			Do nothing/ return error

Matching Algo:



{
    "time_start" : "7/10/2015 9.00AM",
    "time_end" : "",
    "avg_speed" : "",
    "distance" : "",
    "start_addr" : "407 Abbi",
    "end_addr" : "1 Penn plz",
    "loc" : {
        "type" : "LineString",
        "coordinates" : [ 
            [ 
                -74.2211539999999990, 
                40.5733719999999990
            ], 
            [ 
                -74.2216590000000020, 
                40.5730209999999970
            ], 
            [ 
                -74.2220229999999930, 
                40.5726950000000030
            ], 
            [ 
                -74.2212940000000000, 
                40.5722710000000010
            ], 
            [ 
                -74.2204030000000050, 
                40.5718310000000030
            ], 
            [ 
                -74.2195669999999980, 
                40.5718639999999980
            ], 
            [ 
                -74.2189759999999980, 
                40.5726060000000000
            ], 
            [ 
                -74.2181609999999950, 
                40.5730459999999980
            ]
        ]
    }
}



db.getCollection('locations').aggregate([
    { "$geoNear": {
        "near": {
            "type": "LineString",
            "coordinates": [-74.02648,40.728507]
        },
        "maxDistance" : 100,
        "distanceField": "dist",
        "includeLocs": "locs",
        "spherical": true
    }}
])

http://geojsonlint.com/

http://stackoverflow.com/questions/30913080/mongodb-how-to-query-subdocuments-close-to-specific-location


http://tugdualgrall.blogspot.com/2014/08/introduction-to-mongodb-geospatial.html

Resolve Address
http://dev.virtualearth.net/REST/v1/Locations/40.572329,-74.220312?key=AmGOyaGuKOLmdGdr9s10JRrwvs3ULYDMRWVqb-lwrttqb1FJB5ulKLwp0hTuxeMf

Trip Start:
	tripid
	device
	speed
	longitude
	lattitude
	type=3

Trip Update:
	tripid
	lattitude
	longitude
	speed
	destination - if predict destination is required
	hastarget -  if destination is already know and traffic needs to be calculated

	return error {destination, loggedpoint}

	****************************************************************************************************************************************************************************
	****************************************************************************************************************************************************************************
	***  Sample data extract																																				 ***
	***  https://google-developers.appspot.com/maps/documentation/javascript/examples/full/directions-simple																 ***
	***  var x=''; for(i=0;i<response.routes[0].overview_path.length;i++){ x+='['+response.routes[0].overview_path[i].F+','+response.routes[0].overview_path[i].A+'],'; }	 ***
	****************************************************************************************************************************************************************************
	****************************************************************************************************************************************************************************
