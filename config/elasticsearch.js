//elasticsearch.js
'use strict';
var elasticsearch=require("elasticsearch");
var config = require('./config');
var logger = require('../utils/logger');

var  esClient = new elasticsearch.Client({
	hosts:config.elasticsearch.hosts
});

function checkEsServer(esClient){
	esClient.ping({
		requestTimeout:1000,
		hello:"es Check"
	}).then(function(response){
		
		esClient.indices.exists({index:config.elasticsearch.index},function(err,response,status){
			if(response===true){
				logger.log('status',"Connected to Elasticsearch cluster");
				if(config.elasticsearch.deleteIndex){
					deleteIndex();
				}
			}
			else
			{
				if(config.elasticsearch.createIndex){
					createIndex();
				}
			}
		})
	},function(error){
		console.log("ES cluster down");
		process.exit(0);
	});
}

function deleteIndex(){
	
	esClient.indices.delete({index: config.elasticsearch.index}, function(err,response,status){
		if(!err){
			logger.log('info',"Index"+ config.elasticsearch.index +"deleted");
			if(config.elasticsearch.createIndex){
				createIndex();
			}		
		}
    });
	
	
}

function createIndex(){
    esClient.indices.create({index: config.elasticsearch.index}, function(err,response,status){
		logger.log('info', "Index " +config.elasticsearch.index + " created");
		esClient.indices.putMapping({
			index:config.elasticsearch.index,
			type:config.elasticsearch.type,
			body:config.elasticsearch.mapping,
			},function(err,response,status){
				logger.log('info', "Mapping created for " + config.elasticsearch.type)
				if(config.elasticsearch.loadSampleData){
					require('../controllers/sampledata');
				}
		});
  	});
     
}


checkEsServer(esClient);
exports.indexName=config.elasticsearch.index;
exports.Type=config.elasticsearch.index;
exports.elasticsearch = elasticsearch;
exports.esClient = esClient;
