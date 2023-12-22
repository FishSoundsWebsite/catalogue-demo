var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;
var db = require('./../dbconn.js');

var termSchema = new Schema({
	publicId: 	String,
	type:		String,
	term:		String,
	group:		String,
	definition:	String,
	extRef:		String,
	status:		{type: String}
});

var rec = mongoose.model('Term',termSchema);

exports.record = rec;

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

// given an array of objects (template: {type:"",join:"",lookup:""}), returns an object: {"term type": [applicable terms]}
	// group names (where present) are ignored
	// applicable terms are those that are *in use* in the provided 'join' collection (not the full set of terms in the system)
// used to populate dropdowns and suggestion lists for search forms (see also the region.js schema and the getLanguages function in the reference.js schema)
// called by getCodeLists function in app.js
exports.getInUseList = async function(list){
	var results = {};

	var query = await rec.aggregate()
						.match({status:{"$in":["Active"]},type: list.type})
						.lookup({ from: list.join, localField: '_id', foreignField:list.lookup, as: 'referencers' })
						.unwind('$referencers')
						.group({
							_id:'$group',
							group: {$first: '$group'},
							items:  {$addToSet: {code: '$code', label: '$term'} }
						})
						.project({
							_id:0,
							group:1,
							items:1
						})
						// It would be desirable to use .sort("group terms.term") but this will not work
						// The seeming solution for making mongodb sort sub-objects when grouping was laughably complicated
						// See JS .sort() solution below; it should be replaced if a better mongodb solution is created in future versions
						.sort("group");
						
	if(query.length == 1 && query[0].group == null){
		results = query[0].items.sort((a,b) => (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0));
	}else{				
		for(var j = 0; j < query.length; j++){
			results[query[j].group] = query[j].items.sort((a,b) => (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0));
		}
	}
	
	return results;
}

