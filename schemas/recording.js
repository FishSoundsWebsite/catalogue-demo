var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;
var db = require('./../dbconn.js');

var cleanerTools = require('./tools/dataCleaningFunctions.js');

var termSchema = require('./term.js');
var fishSchema = require('./fish.js');
var referenceSchema = require('./reference.js');
var obsSchema = require('./observation.js');
var regionSchema = require('./region.js');

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
						publicId:		String,
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
										}],
						status:			{type: String, default: "Active"},
						modified:		{type: Date, default: Date(Date.toISOString)},
						modifier:		ObjectId
					}],
	status:			{type: String, default: "Active"},
});

var rec = mongoose.model('Recording',recordingSchema);

exports.record = rec;

// given an object of search parameters (e.g. {fish: xxx}, {_id: xxx}), returns an object with human readable values
// params is used instead of _id to increase function flexibility
// called by the fish, recording and reference routes in app.js
exports.read = async function(params){
	params["status"] = {"$in":["Active"]};
	var query = await rec.aggregate()
					.lookup({ from: 'fish', localField: 'fish', foreignField: '_id', as: 'fish' })
					.unwind('fish')
					.lookup({ from: 'terms', localField: 'noises', foreignField: '_id', as: 'noises' })
					.unwind('noises')
					.lookup({ from: 'references', localField: 'citations', foreignField: '_id', as: 'citations' })
					.unwind('citations')
					.lookup({ from: 'references', localField: 'additionalRefs', foreignField: '_id', as: 'additionalRefs' })
					.unwind({path:'$additionalRefs',preserveNullAndEmptyArrays: true})
					.unwind({path:'$measurements',preserveNullAndEmptyArrays: true})
					.lookup({ from: 'references', localField: 'measurements.citation', foreignField: '_id', as: 'measurements.citation' })
					.unwind({path:'$measurements.citation',preserveNullAndEmptyArrays: true})
					.match(params)
					.group({
						_id:"$publicId",
						fish:{$first: "$fish"},
						noises:{$addToSet: "$noises"},
						link:{$first: "$link"},
						imageFile:{$first: "$imageFile"},
						audioFile:{$first: "$audioFile"},
						notes:{$first: "$notes"},
						citations:{$addToSet: "$citations"},
						additionalRefs:{$addToSet: "$additionalRefs"},
						measurements:{$addToSet: "$measurements"}
					})
					.project({
						_id:0,
						publicId:'$_id',
						fish:{publicId:'$fish.publicId',title:'$fish.title'},
						noises:'$noises.term',
						link:1,
						imageFile:1,
						audioFile:1,
						notes:1,
						citations: {
							'$map': { 
								'input': '$citations', 
								'as': 'reference', 
								'in': { 
									publicId: '$$reference.publicId',
									refShort: '$$reference.refShort', 
									refLong: '$$reference.refLong'
								}
							}
						}, 
						additionalRefs:{
							'$map': { 
								'input': '$additionalRefs', 
								'as': 'reference', 
								'in': { 
									publicId: '$$reference.publicId', 
									refShort: '$$reference.refShort',
									refLong: '$$reference.refLong'
								}
							}
						},
						measurements:1
					});

	return query;
}

// given a search query object and search batch value (integer or null), returns an array of matching records in human-readable form
// called by the results-recording route in app.js
exports.search = async function(q,page){
	var data = {};
	var sort = {};
	var page = 1;
	
	for(item in q){
		if(q[item]){
			//data cleaning: convert submitted search parameters into values system can use
			switch(item){
				case "page":
					page = q[item];
					break;
				// sort values submitted as a string: field-to-be-sorted-on|{1 or -1}
				case "sort":
					var sortSections = q[item].split("~");
					for(sortItem in sortSections){
						var sortParts = sortSections[sortItem].split("|");
						sort[sortParts[0]] = Number(sortParts[1]);
					}
					break;
					
				//stop list to exclude worrisome injected search parameters
				case "_id":
				case "status":
				case "imageFile":
				case "audioFile":
				case "link":
					break;
				
				// turn semi-colon delimited strings into arrays, consistently return array (even for single value)
				case "noises":
					data[item + ".term"] = Array.isArray(q[item]) ? q[item] : q[item].split(";");
				/*
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
				*/
					break;
				// turn semi-colon delimited region strings into array, convert human-readable terms to system IDs, consistently return array (even for single value)
				case "regions":
					data[item + ".mrgid"] = Array.isArray(q[item]) ? q[item] : q[item].split(";");
					break;
				// target subfields on the fish junction object
				case "common":
					data['fish.' + item + '_latinized'] = new RegExp(cleanerTools.cleanSearchString(q[item]),"i");
					break;
				case "genus__species":
				case "family__subfamily":
				case "order__suborder":
				case "superclass__className":
					data['fish.combo_' + item + '_latinized'] = new RegExp(cleanerTools.cleanSearchString(q[item]),"i");
					break;
				// wrap a group of fields that need to be searched against the same value in an array with an $or clause
				// can only be done once; a second group search (e.g. searching valueX against title OR publication) would overwrite the first
				case "authors":
					// measurementCitation is created field in aggregation pipeline
					data["$or"] = [{"citations.authors.last": new RegExp(q[item],"i")},{"additionalRefs.authors.last": new RegExp(q[item],"i")},{"measurementCitation.authors.last": new RegExp(q[item],"i")}];
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
	if(Object.keys(sort).length === 0){ 
		sort["fish.genus"] = 1;
		sort["fish.species"] = 1;
		sort["fish.unknown"] = 1;
	}
	
	//second pass cleaning: put cleaned search values into MongoDB query formatting
	var params = {};
	for(item in data){
		//search fields from other models need keys with dot notation that matches junction names used in search query (see below)
		//search fields from this model (fish) need correct array or string formatting as applicable
		var param = item;
	//	if(item == "sources.term"){ param = 'observations.sources.source.term'; }
		if(data[item]){
			if(item == "$or"){
				params[item] = data[item];
			}else if(Array.isArray(data[item])){
				params[item] = {"$in": data[item]};
			}else if(typeof data[item] == "object"){
				params[item] = data[item];
			}else{
				params[item] = new RegExp(data[item],'i');
			}
		}
	}

	//actual search query
	//junctions recordings to references twice (once for each citation set), fish, and terms
	var query = await rec.aggregate()
							.match({status:"Active"})
 						 	.lookup({ from: 'references', localField: 'citations', foreignField: '_id', as: 'citations' })
 						 	.lookup({ from: 'references', localField: 'additionalRefs', foreignField: '_id', as: 'additionalRefs' })
  							.lookup({ from: 'references', localField: 'measurements.citation', foreignField: '_id', as: 'measurementCitation' })
  							.unwind({path:'$measurementCitation',preserveNullAndEmptyArrays: true})		//left join (retain recordings that do not have measurements -- measurementCitation should always exist if there is a measurement)
  							.lookup({ from: 'terms', localField: 'noises', foreignField: '_id', as: 'noises' })
  							.unwind('$noises')															//inner join (one or more noise should always exist)
  							.lookup({ from: 'fish', localField: 'fish', foreignField: '_id', as: 'fish' })
  							.unwind('$fish')															//inner join (one or more fish should always exist)
  							.lookup({ from: 'regions', localField: 'fish.regions', foreignField: '_id', as: 'regions' })
							.unwind({path:'$regions',preserveNullAndEmptyArrays: true})
  							.match(params)
  							//one-to-one = $first; one-to-many = $addToSet
							.group({_id:'$_id',
								publicId: {$first: '$publicId' },
								type: {$first: '$type' },
								imageFile: {$first: '$imageFile' },
								audioFile: {$first: '$audioFile' },
								link: {$first: '$link' },
								fish: {$addToSet: '$fish' },
								noises: {$addToSet: '$noises.term' },
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
	return {count: count, results: query[0].results, page: page, sort: sort};

}

/*** AJAX RESPONSE FUNCTIONS ***/


