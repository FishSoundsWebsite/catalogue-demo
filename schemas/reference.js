var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;
var db = require('./../dbconn.js');

var referenceSchema = new Schema({
	publicId: 	String,
	extId:		String,
	title:		String,
	authors:	[{
					first:	Array,
					middle:	Array,
					last:	String
				}],
	publication:String,
	publisher:	String,
	degree:		String,
	institution:String,
	year:		Number,
	volume:		String,
	issue:		String,
	start:		String,
	end:		String,
	pages:		String,
	doi:		String,
	issn:		String,
	language:	String,
	gray:		Boolean,
	other:		String,
	refLong:	String,
	refShort:	String
});

var rec = mongoose.model('Reference',referenceSchema);

exports.record = rec;

// given a system ID, returns an object with human readable values
// called by the reference route in app.js
exports.read = async function(id){
	var query = await rec.findOne({_id:id}).select('-_id -__v -extId').exec();
	var info = {};
	if(query){
		Object.assign(info,query._doc);	
	}
	return info;
}

// given a search query object and search batch value (integer or null), returns an array of matching records in human-readable form
// called by the results-reference route in app.js
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
				// turn string into regular expression
				case "title":
					data[item] = new RegExp(q[item],"i");
					break;
				case "scientific":
					data['fish.scientific'] = new RegExp(q[item],"i");
					break;
				// wrap a group of fields that need to be searched against the same value in an array with an $or clause
				// can only be done once; a second group search (e.g. searching valueX against title OR publication) would overwrite the first
				case "authors":
					data["$or"] = [{"authors.last": new RegExp(q[item],"i")},{"authors.first": new RegExp(q[item],"i")}];
					break;
				// turn integer values into $gt or $lt clauses
				case "startyear":
				case "endyear":
					data["year"] = {};
					if(q["startyear"]){ data["year"]["$gte"] = Number(q["startyear"]); }
					if(q["endyear"]){ data["year"]["$lte"] = Number(q["endyear"]); }
					break;
				// turn semi-colon delimited strings into arrays, remove trailing '(#)' values from each value, consistently return array (even for single value)
				case "languages":
					var arr = [];
					if(!Array.isArray(q[item])){ q[item] = q[item].split(";"); }
					if(Array.isArray(q[item])){
						for(var i = 0; i < q[item].length; i++){
							var lang = q[item][i].split("(");
							arr.push(lang[0].trim());
						}
					}else{
						var lang = q[item].split("(");
						arr.push(lang[0].trim());
					}
					data["language"] = {"$in": arr};
					break;
				// turn pseudo-boolean "on" values (from toggle switches on interface) into boolean
				// approach needs to match context from interface; this is an "include" toggle without an exclusion value (i.e. "off" does not result in a FASLE value)
				case "gray":
					if(q[item] != "on"){ data[item] = true; }
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
	//junctions references to fish via observations and recordings
	var query = await rec.aggregate()
							.lookup({ from: 'observations', localField: '_id', foreignField: 'refId', as: 'observations' })
							.unwind('$observations')													//inner join (one or more observations should always exist)
							.lookup({ from: 'fish', localField: 'observations.fishId', foreignField: '_id', as: 'fish' })
							.unwind('$fish')															//inner join (one or more fish should always exist)
							.lookup({ from: 'recordings', localField: '_id', foreignField: 'citations', as: 'recordings' })
							.unwind({path:'$recordings',preserveNullAndEmptyArrays: true})				//left join (retain references that do not have recordings)
							.match(data)
							//one-to-one = $first; one-to-many = $addToSet
							.group({_id:'$_id',
								publicId: {$first: '$publicId' },
								title: {$first: '$title' },
								authors: {$first: '$authors'},
								year: {$first: '$year'},
								refLong: {$first: '$refLong' },
								refShort: {$first: '$refShort' },
								fish: {$addToSet:'$fish.title'},
								recordings: {$addToSet:'$recordings'}
							})
							//project values the should appear in end object
							.project({
								publicId:1,
								title:1,
								authors:1,
								year:1,
								refLong:1,
								refShort:1,
								fish:1,
								fishCount: {$size: '$fish'},
								recordings:1,
								recCount: {$size: '$recordings'}
							})
							//sort result list (value must match a projected key)
							.sort(sort)
							//limit number of returned results and return correct 'page' of them (30 is arbitrary and could be changed or made into a variable)
							.facet({
   								results: [{ $skip: (30 * page) - 30 }, { $limit: 30 }],
    							total: [{$count: 'count'}]
  							}); 							

	var count = query[0].total.length > 0 ? query[0].total[0].count : 0;
	return {count: count, results: query[0].results};
}

//given the public ID of a reference (used to create links, etc. in the user interface), returns the system ID for it
//called by the reference route in app.js
exports.getId = async function(publicId){
	var query = await rec.findOne({publicId:publicId}).select('_id').exec();
	return query;
}

//given an object with the title and publication name of a reference, returns the public ID for it
//called by {carry over code; not yet in use}
exports.getPublicId = async function(data){
	var query = await rec.findOne({title: data.title, publication: data.publication}).select('publicId').exec();
	return query.publicId;
}

//returns an integer counting the number of observed fish species in the database
//used to populate site statistics
//called by the index route in app.js
exports.getCount = async function(){
	var query = await rec.countDocuments({}).exec();
	return query;
}

//returns an array containing concatenated strings of language values from records and the number of times that value has been used (e.g. "English (274)")
//used to populate the language select list in the reference.js search form
//called by the results-references route in app.js
exports.getLanguages = async function(){
	var query = await rec.aggregate().group({_id:"$language",count:{$sum:1}}).sort({"count":-1});
	var arr = [];
	for(var i = 0; i < query.length; i++){
		arr.push(query[i]._id + " (" + query[i].count + ")");
	}
	return arr;
}

//returns an array containing the earliest and latest year values from records
//used to set the min/max range of the year input in the reference.js search form
//called by the results-references route in app.js
exports.getYearRange = async function(){
	var query = await rec.aggregate().group({_id:null,min:{$min:"$year"},max:{$max:"$year"}});
	return [query[0].min,query[0].max];
}

