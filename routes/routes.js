'use strict'
var restify = require('restify');
var config = require('../config/config');
var measurementController=require('../controllers/wifi.js');
var logger = require('../utils/logger');


function Routes(server) {
	
	var Models={
		Coverage : {
			id:"Coverage",
			properties:{

				aggregations:{
					type:'string',
					description:'Elasticsearch Buckets'
				}

			}
		},
		Wifi : {
			id:"Wifi",
			properties :{
				bssid : {
					type:'string',
					description:'Basestation Identifier BSSID'
	 			},
	 			ssid : {
					type:'string',
					description:'Basestation Name'
	 			},
	 			channel:{
			    	type:"integer",
			    	description:'Channel for Wifi'
				},
				frequency:{
			    	type:"integer",
			    	description:'Frequency for channel'
				},
				encryption:{
			    	type:'boolean',
			    	description:'Defines if wifi is encrypted'
			    },
			    encryptiontype : {
					type:'string',
					description:'type of encryption used (optional)'
	 			},
	 			authenticationtype : {
					type:'string',
					description:'Authentication type for encryption (optional)'
	 			},
				signal: {
					type:'integer',
					description:'Signal strength of cell at location'
			    },
			    measurement:{
			    	type:'boolean',
			    	description:'Defines if it\'s a cell location (FALSE) or a measurement(true)'
			    },
			    quality:{
			    	type:'string',
			    	description:'Quality of measurement'
			    },
	 			hdop:{
					type:"float",
					description:'Horizontal Dillution of Precision'
				},
				sattellites:{
					type:"integer",
					description:'Number of GNSS Sattellites in view for measurement'	
				},
				altitude:{
					type:"integer",
					description:'Altitude of measurement'	
				},
				 timestamp:{
			    	type:'date',
					description:'Date/time for measurement or source data'	
			    },
			    location: { 
			    	type:'array',
			    	description:'Location of the cell or measurement'
			    },
			    source: {
			    	type:'string', 
			    	description:'Type definition for source (i.e.Celllogger)'
			    },
	 		},
	
	 	}
	}
	

	
	server.get(
		//curl -k -X GET https://localhost:3000/v1/cellmeasurements-dev?mcc=203?size=0
		{
			url: '/v1/' + config.service.name,
			models:Models,
			swagger: {
				summary: 'Find Wifi AP',
				notes: 'GET route for wifi',
            	docPath: 'v1/' + config.service.name,

            	responseMessages:[
            		{
            			code:200,
            			message:'Wifi Measurement data',
            			responseModel:'Wifi'
            		}
            	]
			},
			validation: {
				queries:{
					ssid:{isRequired:false},
					bssid:{isRequired:false},
					// channel:{isRequired:false,isInt:true},
					// frequency:{isRequired:false,isInt:true},
					encryption:{isRequired:false,isBoolean:true},
					encryptiontype:{isRequired:false},
					authenticationtype:{isRequired:false},
					timestamp:{isRequired:false},
					source:{isRequired:false},
					measurement:{isRequired:false,isBoolean:true},
					size:{isRequired:false,isInt:true,description:'Max number of hits to return'},
					datePrecision:{isRequired:false,isInt:true,description:'OPTIONAL: Number of days around timestamp in which measurement is taken. Default value=100 (between 100 days before and 100 days after timestamp)'}
				}
			}
		},
		measurementController.getWifi
	);


	
	server.post(
		{
			url: '/v1/' + config.service.name ,
			swagger: {
	            summary: 'Add wifi ap or measurement to Wifi Database',
	            docPath: 'v1/' + config.service.name
		    },
		    models:Models,
		    validation: {
		    	content:{
			    	Wifi:{ swaggerType:'Wifi'},
		    	}
		    }
		},
		measurementController.postWifi
	);


	server.get(
		//curl -k -X GET https://localhost:3000/v1/cellmeasurements-dev?mcc=203?size=0
		{
			url: '/v1/' + config.service.name +'/bssidcoverage',
			models:Models,
			swagger: {
				summary: 'Find Wifi coverage for bssid based on measurements',
				notes: 'GET route for wifi coverage',
            	docPath: 'v1/' + config.service.name,

            	responseMessages:[
            		{
            			code:200,
            			message:'Wifi Coverage',
            			responseModel:'Coverage'
            		}
            	]
			},
			validation: {
				queries:{
					bssid:{isRequired:true},
					timestamp:{isRequired:false},
					geohashPrecision:{isRequired:false,isInt:true,description:'OPTIONAL: Geohash precision value: between 1 (~ 5000 x 5000 km) and 12 (~ 4 x 2 cm). Default value=8 (~ 40 x 20 m)'},
					datePrecision:{isRequired:false,isInt:true,description:'OPTIONAL: Number of days around timestamp in which measurement is taken. Default value=100 (between 100 days before and 100 days after timestamp)'}
				}
			}
		},
		measurementController.getBSSIDCoverage
	);



	server.get(

		{
			url: '/v1/' + config.service.name +'/coverage',
			models:Models,
			swagger: {
				summary: 'Find coverage of wifi-measurements in area',
				notes: 'GET route for wifi-measurement coverage',
            	docPath: 'v1/' + config.service.name,

            	responseMessages:[
            		{
            			code:200,
            			message:'Wifi Coverage',
            			responseModel:'Coverage'
            		}
            	]
			},
			validation: {
				queries:{
					top_right:{isRequired:true,description:'Lat,Lon of top right corner of bbox'},
					bottom_left:{isRequired:true,description:'Lat,Lon of bottom left corner of bbox'},
					timestamp:{isRequired:false},
					geohashPrecision:{isRequired:false,isInt:true,description:'OPTIONAL: Geohash precision value: between 1 (~ 5000 x 5000 km) and 12 (~ 4 x 2 cm). Default value=8 (~ 40 x 20 m)'},
					datePrecision:{isRequired:false,isInt:true,description:'OPTIONAL: Number of days around timestamp in which measurement is taken. Default value=100 (between 100 days before and 100 days after timestamp)'}
				}
			}
		},
		measurementController.getMeasurementCoverage
	);

	server.get(

		{
			url: '/v1/' + config.service.name +'/measurementcount',
			models:Models,
			swagger: {
				summary: 'Find number of wifi measurements in database',
				notes: 'GET route for wifi measurement count',
            	docPath: 'v1/' + config.service.name,

            	responseMessages:[
            		{
            			code:200,
            			message:'Wifi Coverage',
            			responseModel:'Count'
            		}
            	]
			},
			validation: {
				queries:{
					timestamp:{isRequired:false},
					datePrecision:{isRequired:false,isInt:true,description:'OPTIONAL: Number of days around timestamp in which measurement is taken. Default value=100 (between 100 days before and 100 days after timestamp)'}
				}
			}
		},
		measurementController.getMeasurementCount
	);

	server.get(

		{
			url: '/v1/' + config.service.name +'/measurementwificount',
			models:Models,
			swagger: {
				summary: 'Find number of unique SSIDs in measurements',
				notes: 'GET route for unqiue SSID count',
            	docPath: 'v1/' + config.service.name,

            	responseMessages:[
            		{
            			code:200,
            			message:'Wifi Coverage',
            			responseModel:'Count'
            		}
            	]
			},
			validation: {
				queries:{
					timestamp:{isRequired:false},
					datePrecision:{isRequired:false,isInt:true,description:'OPTIONAL: Number of days around timestamp in which measurement is taken. Default value=100 (between 100 days before and 100 days after timestamp)'}
				}
			}
		},
		measurementController.getMeasurementWifiCount
	);


	server.get(

		{
			url: '/v1/' + config.service.name +'/wifis',
			models:Models,
			swagger: {
				summary: 'Find wifi coverage for location',
				notes: 'GET route for wifi location coverage',
            	docPath: 'v1/' + config.service.name,

            	responseMessages:[
            		{
            			code:200,
            			message:'Wifi Coverage',
            			responseModel:'Wifi'
            		}
            	]
			},
			validation: {
				queries:{
					lat:{isRequired:true,description:'Lat of location'},
					lng:{isRequired:true,description:'Lng of location'},
					timestamp:{isRequired:false},
					geohashPrecision:{isRequired:false,isInt:true,description:'OPTIONAL: Geohash precision value: between 1 (~ 5000 x 5000 km) and 12 (~ 4 x 2 cm). Default value=8 (~ 40 x 20 m)'},
					datePrecision:{isRequired:false,isInt:true,description:'OPTIONAL: Number of days around timestamp in which measurement is taken. Default value=100 (between 100 days before and 100 days after timestamp)'}
				}
			}
		},
		measurementController.getWifiAtLocation
	);



}

module.exports.routes=Routes;