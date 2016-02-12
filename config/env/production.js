//production Configuration
"use strict";
var config={};

config.logging={
	colour:false,
	timestamp:false
};

config.service={
	name:'wifimeasurements',
	description: 'API for wifi related data',
    title: 'Wifi measurement webservice ',
};

config.server={
	useSSL : true,
	port : process.env.PORT,
	address : process.env.SERVER
};

config.ssl={
	key:'/etc/ssl/self-signed/server.key',
	certificate:'/etc/ssl/self-signed/server.crt'
};

config.zookeeper={
	servers:'localhost:2181'
};

config.elasticsearch={
	hosts:[
      'localhost:9200'
      
    ],
    index:'wifi_measurements_v1',
    type:'measurement',
	mapping:{
		measurement:{
			properties:{
				bssid:{
					type:"string",
					index: "not_analyzed"
				},
				ssid:{
					type:"string",
					index: "not_analyzed"
				},
				frequency:{type:"long"},
				channel:{type:"integer"},
				mode:{
					type:"string",
					index: "not_analyzed"
				},
				encryption:{type:"boolean"},
				encryptiontype:{
					type:"string",
					index: "not_analyzed"
				},
				authenticationtype:{
					type:"string",
					index: "not_analyzed"
				},
				quality:{
					type:"string",
					index: "not_analyzed"
				},
				hdop:{type:"float"},
				sattellites:{type:"integer"},
				altitude:{type:"integer"},
				source:{
					type:"string",
					index: "not_analyzed"
				},
				measurement:{type:"boolean"},
				timestamp:{
					format: "dateOptionalTime",
					type:"date",
				},
				location:{
					type:"geo_point",
					geohash:true,
					geohash_prefix:true
				}
			}
		}
    },
    createIndex:true,
    deleteIndex:false,
    loadSampleData:false
};

module.exports=config;