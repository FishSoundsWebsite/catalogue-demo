var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;
var db = require('./../dbconn.js');

var termSchema = require('./term.js');
var fishSchema = require('./fish.js');
var referenceSchema = require('./reference.js');
var obsSchema = require('./observation.js');

var recordingSchema = new Schema({
	publicId:		String,
	type:			String,
	fish:			[ObjectId],
	citations:		[ObjectId],
	additionalRefs:	[ObjectId],
	noises:			[ObjectId],
	link:			String,
	imageFile:		String,
	audioFile:		String,
	notes:			String,
	measurements:	[{
						citation:		ObjectId,
						measurements:	[{
											name:		String,
											min:		Number,
											max:		Number,
											mean:		Number,
											errorType:	String,
											errorValue:	Number,
											n:			Number,
											notes:		String
										}]
					}]
});

var rec = mongoose.model('Recording',recordingSchema);

exports.record = rec;

// given an object of search parameters (e.g. {fish: xxx}, {_id: xxx}), returns an object with human readable values
// params is used instead of _id to increase function flexibility
// called by the fish, recording and reference routes in app.js
exports.read = async function(params){
	var query = await rec.find(params).exec();
	var results = [];
	for(var i = 0; i < query.length; i++){
		var info = {};
	
		info.publicId = query[i].publicId;
		info.type = query[i].type;
		if(query[i].link){ info.link = query[i].link; }
		if(query[i].imageFile){ info.imageFile = query[i].imageFile; }
		if(query[i].audioFile){ info.audioFile = query[i].audioFile; }
		if(query[i].notes){ info.notes = query[i].notes; }
	
		info.citations = [];
		for(var j = 0; j < query[i].citations.length; j++){
			var c = await referenceSchema.read(query[i].citations[j]);
			info.citations.push(c);
		}
		
		info.additionalRefs = [];
		for(var j = 0; j < query[i].additionalRefs.length; j++){
			var a = await referenceSchema.read(query[i].additionalRefs[j]);
			info.additionalRefs.push(a);
		}
	
		info.fish = [];
		for(var j = 0; j < query[i].fish.length; j++){
			var fish = await fishSchema.read(query[i].fish[j]);
			info.fish.push(fish);
		}
		
		info.noises = [];
		for(var j = 0; j < query[i].noises.length; j++){
			var noise = await termSchema.read(query[i].noises[j]);
			
			info.noises.push(noise);
		}
	
		if(query[i].measurements && query[i].measurements.length){
			info.measurements = [];
			for(var j = 0; j < query[i].measurements.length; j++){
				var m = {};
				m.citation = await referenceSchema.read(query[i].measurements[j].citation);
				m.measurements = query[i].measurements[j].measurements;
				info.measurements.push(m);
			}
		}
	
		results.push(info);
	}
	
	return results;
}

// given a search query object and search batch value (integer or null), returns an array of matching records in human-readable form
// called by the results-recording route in app.js
exports.search = async function(q,page){
	var data = {};
	var sort = {};
	
	for(item in q){
		if(q[item]){
			//data cleaning: convert submitted search parameters into values system can use
			switch(item){
				// sort values submitted as a string: field-to-be-sorted-on|{1 or -1}
				case "sort":
					var sortParts = q[item].split("|");
					sort[sortParts[0]] = Number(sortParts[1]);
					break;
				// turn semi-colon delimited strings into arrays, consistently return array (even for single value)
				case "noises":
					var arr = [];
					if(!Array.isArray(q[item])){ q[item] = q[item].split(";"); }
					if(Array.isArray(q[item])){
						for(var i = 0; i < q[item].length; i++){
							arr.push(q[item][i]);
						}
					}else{
						arr.push(q[item]);
					}
					data['noises.term'] = {"$in": arr};
					break;
				// turn semi-colon delimited strings into arrays, convert human-readable terms to system IDs, consistently return array (even for single value)
				case "regions":
					var arr = [];
					if(!Array.isArray(q[item])){ q[item] = q[item].split(";"); }
					if(Array.isArray(q[item])){
						for(var i = 0; i < q[item].length; i++){
							var region = await termSchema.find(q[item][i],'region');
							arr.push(region);
						}
					}else{
						var region = await termSchema.find(q[item],'region');
						arr.push(region);
					}
					data['fish.regions'] = {"$in": arr};
					break;
				// turn string into regular expression
				case "scientific":
					data['fish.scientific'] = new RegExp(q[item].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'),"i");
					break;
				case "common":
					data['fish.common'] = new RegExp(q[item].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'),"i");
					break;
				// wrap a group of fields that need to be searched against the same value in an array with an $or clause
				// can only be done once; a second group search (e.g. searching valueX against title OR publication) would overwrite the first
				case "authors":
					data["$or"] = [{"citations.authors.last": new RegExp(q[item],"i")},{"citations.authors.first": new RegExp(q[item],"i")},{"additionalRefs.authors.last": new RegExp(q[item],"i")},{"additionalRefs.authors.first": new RegExp(q[item],"i")},{"measurementCitation.authors.last": new RegExp(q[item],"i")},{"measurementCitation.authors.first": new RegExp(q[item],"i")}];
					break;
				// turn pseudo-boolean "on" values (from toggle switches on interface) into $exists clauses
				// approach needs to match context from interface; these are "must include" toggles without exclusion values (i.e. "off" does not result in {$exists: 0} clauses)
				case "image":
					if(q[item] == "on"){ data['imageFile'] = {'$exists': 1}; }
					break;
				case "measurements":
					if(q[item] == "on"){ data['measurements.0'] = {'$exists': 1}; }
					break;
				//straightforward key-value pair
				default:
					data[item] = q[item];
			}
		}
	}

	//adds defaults sorting so unsorted lists have consistent paging	
	if(!sort["_id"]){ sort["_id"] = -1; }

	//actual search query
	//junctions recordings to references twice (once for each citation set), fish, and terms
	var query = await rec.aggregate()
 						 	.lookup({ from: 'references', localField: 'citations', foreignField: '_id', as: 'citations' })
 						 	.lookup({ from: 'references', localField: 'additionalRefs', foreignField: '_id', as: 'additionalRefs' })
  							.lookup({ from: 'references', localField: 'measurements.citation', foreignField: '_id', as: 'measurementCitation' })
  							.unwind({path:'$measurementCitation',preserveNullAndEmptyArrays: true})		//left join (retain recordings that do not have measurements -- measurementCitation should always exist if there is a measurement)
  							.lookup({ from: 'fish', localField: 'fish', foreignField: '_id', as: 'fish' })
  							.unwind('$fish')															//inner join (one or more fish should always exist)
  							.lookup({ from: 'terms', localField: 'noises', foreignField: '_id', as: 'noises' })
  							.unwind('$noises')															//inner join (one or more noise should always exist)
  							.match(data)
  							//one-to-one = $first; one-to-many = $addToSet
							.group({_id:'$_id',
								publicId: {$first: '$publicId' },
								type: {$first: '$type' },
								imageFile: {$first: '$imageFile' },
								audioFile: {$first: '$audioFile' },
								link: {$first: '$link' },
								fish: {$addToSet:  '$fish' },
								noises: {$addToSet:  '$noises.term' },
								citations: {$first: '$citations' },
								additionalRefs: {$first: '$additionalRefs' }
							})
							//project values the should appear in end object
							.project({
								publicId:1,
								type:1,
								imageFile:1,
								audioFile:1,
								link:1,
								fish:1,
								noises:1,
								citations:1,
								additionalRefs:1
							})
							//sort result list (value must match a projected key)
							.sort(sort)
							//limit number of returned results and return correct 'page' of them (10 is arbitrary and could be changed or made into a variable)
							// see also paginator code in results-recording if adjusting number of results returned per page
							.facet({
   								results: [{ $skip: (10 * page) - 10 }, { $limit: 10 }],
    							total: [{$count: 'count'}]
  							});
		
	var count = query[0].total.length > 0 ? query[0].total[0].count : 0;
	return {count: count, results: query[0].results};

}

//returns an integer counting the number of recordings in the database
//used to populate site statistics
//called by the index route in app.js
exports.getCount = async function(){
	var query = await rec.countDocuments({}).exec();
	return query;
}

//returns a human-readable object of the last entered recording
//used to populate site statistics
//called by the index route in app.js
exports.getLatest = async function(){
	var query = await rec.findOne({}, null, {limit: 1, sort: {'epoch': -1}}).exec();
	var recording = await this.read({_id:query._id});
	return recording;
}

//given the public ID of a recording (used to create links, etc. in the user interface), returns the system ID for it
//called by the recording route in app.js
exports.getId = async function(publicId){
	var query = await rec.findOne({publicId:publicId}).select('_id').exec();
	return query;
}


//returns a list of fishIds attached to internal recordings
//used to determine the highlighted fish on the homepage
//called by the index route in app.js
exports.getHighlightList = async function(){
	var query = await rec.find({type:"internal"});
	
	var fish = [];
	for(var i = 0; i < query.length; i++){
		if(query[i].fish){
			var bucket = fish.find(x => x === query[i].fish[0]);
			if(bucket === undefined){
				fish.push(query[i].fish[0]);
			}
		}
	}
	
	return fish;
}

/*** AJAX RESPONSE FUNCTIONS ***/

//given a record field (e.g. family, genus), a search value for that field, and an array of related field-value pairs from further up the taxonomy (e.g. {className: "Actinopterygii"}), returns an array of records matching those values
//used to populate select lists in the results-fish.js search form
//called by the requestList route in app.js
exports.getList = async function(type,value,data){
	//null values and empty strings (length = 0) were tested for and rejected upstream
	if(value.length > 2){	//long strings (3+) can be anywhere in the field
		var regex = new RegExp(value,'i');
	}else{					//short strings have to be at the beginning of the field
		var regex = new RegExp('^' + value,'i');
	}
	
	var params = {[`fish.${type}`]: regex};
	
	var query = await rec.aggregate()
							.lookup({ from: 'fish', localField: 'fish', foreignField: '_id', as: 'fish' })
  							.unwind('$fish')	//inner join (one or more fish should always exist)
  							.match(params)
  							.group({_id:'$fish._id'});
  							
  	
  	var fishList = [];
  	for(var i = 0; i < query.length; i++){
  		var fish = await fishSchema.read(query[i]._id);
  		fishList.push(fish[type]);
  	}
	
	return fishList;
}

