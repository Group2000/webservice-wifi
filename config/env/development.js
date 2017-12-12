//dev Configuration
"use strict";
var config={};

config.logging={
	colour:true,
	timestamp:true
};

config.service={
	name:'wifimeasurements-dev',
	description: 'API for wifi related data',
    title: 'Wifi measurement webservice (development)',
};

config.server={
	useSSL:false,
	port:3002,
	address:'127.0.0.1'
};

config.ssl={
	key:'/etc/ssl/self-signed/server.key',
	certificate:'/etc/ssl/self-signed/server.crt'
};

config.zookeeper={
	servers:'zookeeper:2181'
};

config.elasticsearch={
	hosts:[
      'database:9200'
      
    ],
    index:'wifi_measurements_v1-dev',
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
					format: "dateOptionalTime||epoch_millis",
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
