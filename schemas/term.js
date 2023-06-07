var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;
var db = require('./../dbconn.js');

var termSchema = new Schema({
	type:	String,
	code:	String,
	term:	String,
	group:	String
	
});

var rec = mongoose.model('Term',termSchema);

exports.record = rec;

// given a single term object or an array of objects and a term type value (e.g. "noise"), attempts to find a matching term record for each, and returns the system ID if successful
// called by the create and search functions of the fish.js, observations.js, and recording.js schemas
exports.find = async function(data,type){
	if(Array.isArray(data)){
		var ids = [];
		for(var i = 0; i < data.length; i++){
			var query = await rec.findOne({type:type, term: data[i]}).select('_id').exec();
			if(query){ ids.push(query._id) };
		}
		return ids;
	}else{
		var query = await rec.findOne({type:type, term:data}).select('_id').exec();
		return query._id;
	}	
}

// given a single term ID or an array of IDs, returns an object with human readable values
// called by the read functions of the fish.js, observations.js, and recording.js schemas, as well as the search function of the fish.js schema
exports.read = async function(data){
	if(Array.isArray(data)){
		var info = [];
		for(var i = 0; i < data.length; i++){
			var query = await rec.findOne({_id:data[i]}).select('-_id term').exec();
			if(query){ info.push(query.term); }
		}
		return info;
	}else{
		var query = await rec.findOne({_id:data}).select('-_id term').exec();
		if(query){ return query.term; }else{ return {}; }
	}	
}

// given an array of term types, returns a compound object: {"term type": {"group name": [terms]}
	// if codelist has a group structure in the database, this will be retained in the return array; otherwise 'ungrouped' is used as a group name
// used to populate dropdowns and suggestion lists for submission forms
// called by getCodeLists function in app.js
exports.getFullLists = async function(array){
	var lists = {};
	for(var i = 0; i < array.length; i++){
		lists[array[i]] = {};
		var query = await rec.aggregate()
							.match({type: array[i]})
							.group({
								_id:'$term',
								group: {$first: '$group' },
							})
							.project({
								_id:1,
								group:1
							})
							.sort('_id');
		for(var j = 0; j < query.length; j++){
			if(query[j].group){
				if(!lists[array[i][query[j].group]]){ lists[array[i]][query[j].group] = []; }
				lists[array[i]][query[j].group].push(query[j]._id);
			}else{
				if(!lists[array[i]]["ungrouped"]){ lists[array[i]]["ungrouped"] = []; }
				lists[array[i]]["ungrouped"].push(query[j]._id);
			}
		}
	}
	return lists;
}

// given an array of objects (template: {type:"",join:"",lookup:""}), returns a compound object: {"term type": {"group name": [applicable terms]}
	// if codelist has a group structure in the database, this will be retained in the return array; otherwise 'ungrouped' is used as a group name
	// applicable terms are those that are *in use* in the provided 'join' collection (not the full set of terms in the system)
// used to populate dropdowns and suggestion lists for search forms (see also the getLanguages function in the reference.js schema)
// called by getCodeLists function in app.js
exports.getInUseLists = async function(array){
	var lists = {};
	for(var i = 0; i < array.length; i++){
		lists[array[i].type] = {};
		var query = await rec.aggregate()
							.match({type: array[i].type})
							.lookup({ from: array[i].join, localField: '_id', foreignField:array[i].lookup, as: 'referencers' })
							.unwind('$referencers')
							.group({
								_id:'$term',
								group: {$first: '$group' },
							})
							.project({
								_id:1,
								group:1
							})
							.sort('_id');
		for(var j = 0; j < query.length; j++){
			if(query[j].group){
				if(!lists[array[i].type][query[j].group]){ lists[array[i].type][query[j].group] = []; }
				lists[array[i].type][query[j].group].push(query[j]._id);
			}else{
				if(!lists[array[i].type]["ungrouped"]){ lists[array[i].type]["ungrouped"] = []; }
				lists[array[i].type]["ungrouped"].push(query[j]._id);
			}
		}
	}
	return lists;
}

