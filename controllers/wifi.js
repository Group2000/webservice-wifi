'use strict'


var config = require('../config/config');
var esClient = require('../config/elasticsearch').esClient;
var esIndex=require('../config/elasticsearch').indexName;
var logger = require('../utils/logger');
var validator=require('validator');
var crypto = require('crypto');
var geohash=require('ngeohash');




var wifiController={

	getWifi: function(req,res){
		
		var datePrecision=parseInt(req.params.datePrecision) || 100;
	     var startDate,endDate;
	     var range={
	             timestamp:{
	             }
	     }
	     if (req.params.timestamp != undefined && req.params.timestamp != ""){
	             range.timestamp.lte=parseInt(req.params.timestamp)+(datePrecision*24*60*60*1000);
	             range.timestamp.gte=parseInt(req.params.timestamp)-(datePrecision*24*60*60*1000);
	             endDate=new Date(range.timestamp.lte);
	             startDate=new Date(range.timestamp.gte);
	     }
	     else{
	             var timestamp = new Date().getTime();
	             range.timestamp.gte=timestamp-(datePrecision*24*60*60*1000);
	             endDate=new Date();
	             startDate=new Date(range.timestamp.gte);

	     }
	     
	     var m = [];
	     m.push({range:range});
	     
	     for(var key in req.params){
		  	switch(key){
		  		case 'timestamp':
		  		case 'location':
		  		case '_':
		  		case 'apiKey':
		  		case 'size':
		  		case 'datePrecision':
		  			break;
		  		default:
			  		var term={term:{}};
			  		term.term[key]=req.params[key];
			  		m.push(term);

		  	}	
		}	

		  var size = req.params.size || 10;
		  
	var q={
	  	explain:false,
	  	size:0,
	    query:{
	      filtered:{
	        filter:{
	          bool:{
	            must:m
	          }
	        }
	      }
	    },
	    aggs:{
	    	distinctwifi:{
	    		terms:{
	    			field:'bssid',
	    			size:size
	    		},
	    		aggs:{
	    			top_wifi_hits:{
	    				top_hits:{
	    					sort:[
	    						{
	    							signal:{order:'desc'}
	    						}
	    					],
	    					// _source:{
	    					// 	include:[
	    					// 		"ssid",
	    					// 		"encryption",
	    					// 		"encryptiontype",
	    					// 		"authenticationtype",
	    					// 		"channel",
	    					// 		"signal",
	    					// 		"timestamp"

	    					// 	]
	    					// },
	    					size:1
	    				}
	    			}
	    		}

	    	}
	    }
	  }
		 //console.log(JSON.stringify(q));
		esClient.search({
	    	index:config.elasticsearch.index,
	    	type:config.elasticsearch.type,
		    body: q
		}).then(function(body) {
			res.send(body)
		}, function(error) {
		    logger.log('error',error.message);
		    logger.log('info',q);
		    res.send(500);
		});

	},
	

	postWifi: function(req,res){

		var validated=true;
		var errors=[];

		delete(req.params.apiKey);	
		
		//Quick validation for input, rest is handled by elasticSearch
		if(req.params.ssid === 'undefined') {
			validated=false;
			errors.push("Missing or invalid value for ssid");
		}
		if(req.params.bssid === 'undefined'  ) {
			validated=false;
			errors.push("Missing or invalid value for bssid");
		}
		if(req.params.channel === 'undefined'  || !validator.isInt(req.params.channel,{min:1,max:500})) {
			validated=false;
			errors.push("Missing or invalid value for channel");
		}


		if(req.params.location === 'undefined' || !Array.isArray(req.params.location) || req.params.location.length<2 ) {
			validated=false;
			errors.push("Missing or invalid value for Location [lat,lon]");
		}
		else{
		 if(!validator.isFloat(req.params.location[0],{min:-180,max:180}) || !validator.isFloat(req.params.location[1],{min:-90,max:90})){
		 	validated=false;
			errors.push("Invalid value for Location [(-180 - 180),(-90 - 90)]");	
		 }	
		}


		//Add timestamp if needed

		if(!req.params.timestamp) {
			req.params.timestamp=new Date().getTime();
		}else
		{
			req.params.timestamp=req.params.timestamp;
		}
		
		

		if(validated){
			//Create unique ID
			var md5sum=crypto.createHash('md5');
	    	var id=req.params.bssid.toString()+req.params.ssid.toString()+req.params.location[0].toString()+req.params.location[1].toString()+req.params.timestamp.toString();
	    	id=md5sum.update(id).digest("hex");
			
			esClient.index({
		    	index:config.elasticsearch.index,
		    	type:config.elasticsearch.type,
		    	id:id,
		    	body:req.params,
		    },function(err,response){
	          	if(err)
	            	res.send(500,{error:err});
	            else{
	            	console.log('posted wifi ok')
	               	res.send({result:'ok'});
				}
		    });
		}
		else{
			logger.log('error','Validation Error in POST request');
			logger.log('error',JSON.stringify(errors));
			logger.log('error',JSON.stringify(req.params));
		     return res.send (400, {
	            status: 'JSON failed validation',
	            errors: errors
	        });
		}
		
	},


	getBSSIDCoverage:function(req,res){

		var datePrecision=parseInt(req.params.datePrecision) || 365;
		var startDate,endDate;
		var range={
			timestamp:{
			}
		}
		if (req.params.timestamp != undefined && req.params.timestamp != ""){
			
			range.timestamp.lte=parseInt(req.params.timestamp)+(datePrecision*24*60*60*1000);
			range.timestamp.gte=parseInt(req.params.timestamp)-(datePrecision*24*60*60*1000);
			endDate=new Date(range.timestamp.lte);
			startDate=new Date(range.timestamp.gte);
		}
		else{
			var timestamp = new Date().getTime();
			range.timestamp.gte=timestamp-(datePrecision*24*60*60*1000);
			endDate=new Date();
			startDate=new Date(range.timestamp.gte);	

		}

		var m = [];
		var precision=parseInt(req.params.geohashPrecision) || 8;
		m.push({range:range});
		
		for(var key in req.params){
		  	switch(key){
		  		case 'timestamp':
		  		case 'location':
		  		case 'datePrecision':
		  		case '_':
		  		case 'apiKey':
		  		case 'size':
		  		case 'geohashPrecision':
		  			break;
		  		default:
			  		var term={term:{}};
			  		term.term[key]=req.params[key];
			  		m.push(term);

		  	}	
		}	
		
		var q={
			size:0,
		    query:{
		     	filtered:{
		        	filter:{
		          		bool:{
		            		must:m
		            		
		          		}
		          		
		          		
		        	}
		        }
		    },
			aggs:{
		       	wifigrid:{
		       		geohash_grid:{
		       			field:"location",
		       			precision:precision
		       		},
		       		aggs:{
		       			maxSignal:{
		       				max:{
		       					field:"signal"
		       				}
		       			},
		       		
		       			firstSeen:{
		       				min:{
		       					field:"timestamp"
		       				}
		       			},
		       			lastSeen:{
		       				max:{
		       					field:"timestamp"
		       				}
		       			}
		       		}
		       	}	
		    }
		  }
		// console.log(JSON.stringify(q));
		esClient.search({
	    	index:config.elasticsearch.index,
	    	type:config.elasticsearch.type,
		    body: q
		}).then(function(body) {

			
			body.geohash_precision=precision;
			body.start_date=startDate;
			body.end_date=endDate;
			body.aggregations.wifigrid.buckets.forEach(function(bucket){
				bucket.maxSignal=bucket.maxSignal.value;
				bucket.firstSeen=bucket.firstSeen.value;
				bucket.lastSeen=bucket.lastSeen.value;
			})
			res.send(body);
			
			
			
		}, function(error) {
		    logger.log('error',error.message);
		    logger.log('info',q);
		    res.send(500);
		});


	},

	getMeasurementCoverage: function(req,res){

		var tr=req.params.top_right;
		var bl=req.params.bottom_left;//.split(',');

		var errors=[];
		var validated=true;
		if(tr[0] === 'undefined' || !validator.isFloat(tr[0],{min:-90,max:90})) {
			validated=false;
			errors.push("Missing or invalid value for top_left (-90 - 90, -180 - 180)");
		}
		if(tr[1] === 'undefined' || !validator.isFloat(tr[1],{min:-180,max:180})) {
			validated=false;
			errors.push("Missing or invalid value for top_left (-90 - 90, -180 - 180)");
		}
		if(bl[0] === 'undefined' || !validator.isFloat(bl[0],{min:-90,max:90})) {
			validated=false;
			errors.push("Missing or invalid value for tbottom_right (-90 - 90, -180 - 180)");
		}
		if(bl[1] === 'undefined' || !validator.isFloat(bl[1],{min:-180,max:180})) {
			validated=false;
			errors.push("Missing or invalid value for bottom_right (-90 - 90, -180 - 180");
		}

		if(!validated){
		logger.log('error','Validation Error in GET request');
		     return res.send (400, {
	            status: 'Request failed validation',
	            errors: errors
	        });
		}

		var datePrecision=parseInt(req.params.datePrecision) || 100;
		var startDate,endDate;
		var range={
			timestamp:{
			}
		}
		if (req.params.timestamp != undefined && req.params.timestamp != ""){
			
			range.timestamp.lte=parseInt(req.params.timestamp)+(datePrecision*24*60*60*1000);
			range.timestamp.gte=parseInt(req.params.timestamp)-(datePrecision*24*60*60*1000);
			endDate=new Date(range.timestamp.lte);
			startDate=new Date(range.timestamp.gte);
		}
		else{
			var timestamp = new Date().getTime();
			range.timestamp.gte=timestamp-(datePrecision*24*60*60*1000);
			endDate=new Date();
			startDate=new Date(range.timestamp.gte);	

		}

		var m = [];
		req.params.measurement=true;
		var precision=parseInt(req.params.geohashPrecision) || 8;
		m.push({range:range});
  		m.push({
  			geo_bounding_box:{
  				location:{
						top_right:[parseFloat(tr[1]),parseFloat(tr[0])],
						bottom_left:[parseFloat(bl[1]),parseFloat(bl[0])]
					}
				}
			});		
		for(var key in req.params){
		  	switch(key){
		  		case 'timestamp':
		  		case 'location':
		  		case 'datePrecision':
		  		case '_':
		  		case 'apiKey':
		  		case 'size':
		  		case 'geohashPrecision':
		  		case 'bottom_left':
		  		case 'top_right':
		  			break;
		  		default:
			  		var term={term:{}};
			  		term.term[key]=req.params[key];
			  		m.push(term);
		  	}	
		}	
		
		var q={
			size:0,
		    query:{
		     	filtered:{
		        	filter:{
		          		bool:{
		            		must:m,
		          		}
		        	},
		        }
		    },
			aggs:{
		       	cellgrid:{
		       		geohash_grid:{
		       			field:"location",
		       			precision:precision
		       		},
		       		aggs:{
		       			maxSignal:{
		       				max:{
		       					field:"signal"
		       				}
		       			},
		       		
		       			firstSeen:{
		       				min:{
		       					field:"timestamp"
		       				}
		       			},
		       			lastSeen:{
		       				max:{
		       					field:"timestamp"
		       				}
		       			}
		       		}
		       	}	
		    }
		  }
		// console.log(JSON.stringify(q));
		esClient.search({
	    	index:config.elasticsearch.index,
	    	type:config.elasticsearch.type,
		    body: q
		}).then(function(body) {

			
			body.geohash_precision=precision;
			body.start_date=startDate;
			body.end_date=endDate;

			res.send(body);
			
			
			
		}, function(error) {
		    logger.log('error',error.message);
		    logger.log('info',q);
		    res.send(500);
		});

	},

	getMeasurementCount:function(req,res){
		var datePrecision=parseInt(req.params.datePrecision) || 10000;
		var startDate,endDate;
		var range={
			timestamp:{
			}
		}
		if (req.params.timestamp != undefined && req.params.timestamp != ""){
			range.timestamp.lte=parseInt(req.params.timestamp)+(datePrecision*24*60*60*1000);
			range.timestamp.gte=parseInt(req.params.timestamp)-(datePrecision*24*60*60*1000);
			endDate=new Date(range.timestamp.lte);
			startDate=new Date(range.timestamp.gte);
		}
		else{
			var timestamp = new Date().getTime();
			range.timestamp.gte=timestamp-(datePrecision*24*60*60*1000);
			endDate=new Date();
			startDate=new Date(range.timestamp.gte);	
		}

		var m = [];
		m.push({range:range});
		m.push({term:{measurement:true}});
		var q={
			size:0,
		    query:{
		     	filtered:{
		        	filter:{
		          		bool:{
		            		must:m,
		          		}
		        	},
		        }
		    }
		  };
		// console.log(JSON.stringify(q));
		esClient.search({
	    	index:config.elasticsearch.index,
	    	type:config.elasticsearch.type,
		    body: q
		}).then(function(body) {

			var ret={};
			ret.total=body.hits.total;
			res.send(ret);
			
			
			
		}, function(error) {
		    logger.log('error',error.message);
		    logger.log('info',q);
		    res.send(500);
		});

	},

	getMeasurementWifiCount:function(req,res){


		var datePrecision=parseInt(req.params.datePrecision) || 100;
		var startDate,endDate;
		var range={
			timestamp:{
			}
		}
		var m = [];
		if (req.params.timestamp != undefined && req.params.timestamp != ""){
			range.timestamp.lte=parseInt(req.params.timestamp)+(datePrecision*24*60*60*1000);
			range.timestamp.gte=parseInt(req.params.timestamp)-(datePrecision*24*60*60*1000);
			endDate=new Date(range.timestamp.lte);
			startDate=new Date(range.timestamp.gte);
		}
		else{
			var timestamp = new Date().getTime();
			range.timestamp.gte=timestamp-(datePrecision*24*60*60*1000);
			endDate=new Date();
			startDate=new Date(range.timestamp.gte);	
		}
		m.push({range:range});
		
		if(req.params.top_right&&req.params.bottom_left){
			var tr=req.params.top_right;
			var bl=req.params.bottom_left;//.split(',');

			var errors=[];
			var validated=true;
			if(tr[0] === 'undefined' || !validator.isFloat(tr[0],{min:-90,max:90})) {
				validated=false;
				errors.push("Missing or invalid value for top_left (-90 - 90, -180 - 180)");
			}
			if(tr[1] === 'undefined' || !validator.isFloat(tr[1],{min:-180,max:180})) {
				validated=false;
				errors.push("Missing or invalid value for top_left (-90 - 90, -180 - 180)");
			}
			if(bl[0] === 'undefined' || !validator.isFloat(bl[0],{min:-90,max:90})) {
				validated=false;
				errors.push("Missing or invalid value for tbottom_right (-90 - 90, -180 - 180)");
			}
			if(bl[1] === 'undefined' || !validator.isFloat(bl[1],{min:-180,max:180})) {
				validated=false;
				errors.push("Missing or invalid value for bottom_right (-90 - 90, -180 - 180");
			}

			if(!validated){
			logger.log('error','Validation Error in GET request');
			     return res.send (400, {
		            status: 'Request failed validation',
		            errors: errors
		        });
			}

			m.push({
  			geo_bounding_box:{
  				location:{
						top_right:[parseFloat(tr[1]),parseFloat(tr[0])],
						bottom_left:[parseFloat(bl[1]),parseFloat(bl[0])]
					}
				}
			});		
			
		}

		
		m.push({range:range});
		m.push({term:{measurement:true}});
		console.log(JSON.stringify(req.params));
		for(var key in req.params){
		  	switch(key){
		  		case 'timestamp':
		  		case 'location':
		  		case 'datePrecision':
		  		case '_':
		  		case 'apiKey':
		  		case 'size':
		  		case 'geohashPrecision':
		  		case 'bottom_left':
		  		case 'top_right':
		  			break;
		  		default:
			  		var term={term:{}};
			  		term.term[key]=req.params[key];
			  		m.push(term);
		  	}	
		}	

		var q={
			size:0,
		    query:{
		     	filtered:{
		        	filter:{
		          		bool:{
		            		must:m,
		          		}
		        	},
		        }
		    },
		    aggs:{
		       	wifis:{
		       		cardinality:{
		       			field:"bssid"
		       		}
		       	}	
		    }
		  };
		// console.log(JSON.stringify(q));
		esClient.search({
	    	index:config.elasticsearch.index,
	    	type:config.elasticsearch.type,
		    body: q
		}).then(function(body) {
			
			

			res.send(body.aggregations);
			
			
			
		}, function(error) {
		    logger.log('error',error.message);
		    logger.log('info',q);
		    res.send(500);
		});

	},

	getWifiAtLocation:function(req,res){

		var datePrecision=parseInt(req.params.datePrecision) || 100;
		var startDate,endDate;
		var range={
			timestamp:{
			}
		}
		if (req.params.timestamp != undefined && req.params.timestamp != ""){
			
			range.timestamp.lte=parseInt(req.params.timestamp)+(datePrecision*24*60*60*1000);
			range.timestamp.gte=parseInt(req.params.timestamp)-(datePrecision*24*60*60*1000);
			endDate=new Date(range.timestamp.lte);
			startDate=new Date(range.timestamp.gte);
		}
		else{
			var timestamp = new Date().getTime();
			range.timestamp.gte=timestamp-(datePrecision*24*60*60*1000);
			endDate=new Date();
			startDate=new Date(range.timestamp.gte);	

		}

		var m = [];
		m.push({range:range});
		req.params.measurement=true;
		var precision=parseInt(req.params.geohashPrecision) || 7;

		
  		m.push({
  			geohash_cell:{
  				location:{
			  			lat:parseFloat(req.params.lat),
			  			lon:parseFloat(req.params.lng)
					},
			  		precision:precision
				}
			});		

		for(var key in req.params){
		  	switch(key){
		  		case 'timestamp':
		  		case 'location':
		  		case 'datePrecision':
		  		case '_':
		  		case 'apiKey':
		  		case 'lat':
		  		case 'geohashPrecision':
		  		case 'lng':
		  			break;
		  		default:
			  		var term={term:{}};
			  		term.term[key]=req.params[key];
			  		m.push(term);

		  	}
		}
		
		 var q={
		 	size:0,
		 	query:{
			  	filtered:{
		        	filter:{
		          		bool:{
		            		must:m
		          		}
		        	},
			  	}
		  	},
			 aggs:{
		       	wifis:{
		       		terms:{
		       			field:"bssid",
		       			size:1000
		       		},
		       		aggs:{
		       			maxSignal:{
		       				max:{
		       					field:"signal"
		       				}
		       			},
		       		
		       			firstSeen:{
		       				min:{
		       					field:"timestamp"
		       				}
		       			},
		       			lastSeen:{
		       				max:{
		       					field:"timestamp"
		       				}
		       			},
		       			
		       			ssid:{
		       				terms:{
		       					field:'ssid'
		       				}
		       			},

		       		}
		       	}	
		    }
		  }
		

		
		esClient.search({
	    	index:config.elasticsearch.index,
	    	type:config.elasticsearch.type,
		    body: q
		}).then(function(body) {
			var ret={}
			ret.geohashes=[];
			ret.geohashes.push({key:geohash.encode(parseFloat(req.params.lat),parseFloat(req.params.lng),precision)});
			ret.results=body.aggregations.wifis.buckets
			ret.results.forEach(function(result){
				result.bssid=result.key
				result.maxSignal=result.maxSignal.value;
				result.timestamp=result.lastSeen.value;
				result.firstSeen=result.firstSeen.value;
				result.ssid=result.ssid.buckets[0].key;
				result.source='measurement';
				result.measurement=true;
			});


			res.send(ret);
			

		}, function(error) {
		    logger.log('error',error.message);
		    logger.log('info',q);
		    res.send(500);
		});

		
	},


	

}

module.exports=wifiController;
