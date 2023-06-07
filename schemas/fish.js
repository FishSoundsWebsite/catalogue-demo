var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;
var db = require('./../dbconn.js');

var termSchema = require('./term.js');
var obsSchema = require('./observation.js');

var fishSchema = new Schema({
	publicId: 	String,
	extId:		{type: String, unique: true},
	className:	String,
	order:		String,
	family:		String,
	genus:		String,
	species:	String,
	scientific:	String,
	common:		String,
	title:		String,
	image:		{type: {
					filename:	String,
					copyright:	String
				}, default: undefined},
	climates:	[ObjectId],
	regions:	[ObjectId],
	waters:		[ObjectId],
	observed:	{type: Boolean, default: false},
	unknown:	{type: Boolean, default: false}
});

var rec = mongoose.model('Fish',fishSchema);

exports.record = rec;

// given a system ID, returns an object with human readable values
// called by the index and fish routes in app.js and the read function in the recording schema
exports.read = async function(id){
	var query = await rec.findOne({_id:id}).select('-_id -__v').exec();
	var info = {};
	if(query){
		Object.assign(info,query._doc);
		info.climates =  await termSchema.read(info.climates);
		info.regions = await termSchema.read(info.regions);
		info.waters = await termSchema.read(info.waters);
	}
	return info;
}

// given a search query object and search batch value (integer or null), returns an array of matching records in human-readable form
// called by the results-fish route in app.js
exports.search = async function(q,page){
	var data = {};
	var sort = {};
	
	//first pass cleaning: convert submitted search parameters into values system can use
	for(item in q){
		if(q[item]){
			switch(item){
				// sort values submitted as a string: field-to-be-sorted-on|{1 or -1}
				case "sort":
					var sortParts = q[item].split("|");
					sort[sortParts[0]] = Number(sortParts[1]);
					break;
				// turn semi-colon delimited strings into arrays, convert human-readable terms to system IDs, consistently return array (even for single value)
				case "regions":
				case "climates":
				case "waters":
				case "sources":
					var list = Array.isArray(q[item]) ? q[item] : q[item].split(";");
					data[item] = await termSchema.find(list,item.slice(0,-1));		//removing trailing 's'; term type values are singular, everywhere else is plural (should be converted to all plural)
					if(!Array.isArray(data[item])){ data[item] = [data[item]]; }
					break;
				//straightforward key-value pair
				default:
					data[item] = q[item];
			}
		}
	}
	
	//adds defaults sorting so unsorted lists have consistent paging
	if(!sort["scientific"]){ sort["scientific"] = 1; }
	sort["_id"] = 1;
	
	var params = {observed:true,unknown:false};	//fish info was bulk copied from FishBase; many records are not referenced elsewhere in the system; observed filters these out
	//second pass cleaning: put cleaned search values into MongoDB query formatting
	for(item in data){
		//search fields from other models need keys with dot notation that matches junction names used in search query (see below)
		//search fields from this model (fish) need correct array or string formatting as applicable
		if(data[item] && item != "sources"){
			if(Array.isArray(data[item])){
				params[item] = {$in: data[item]};
			}else{
				params[item] = new RegExp(data[item]);
			}
		}else if(data[item] && item == "sources"){
			if(!Array.isArray(data.sources)){ data.sources = [data.sources]; }
			params['observations.sources.source'] = {"$in": data.sources};
		}
	}

	//actual search query
	//junctions fish to observations and recordings
	var query = await rec.aggregate()
							.lookup({ from: 'observations', localField: '_id', foreignField: 'fishId', as: 'observations' })
							.unwind('$observations')											//inner join (discard unobserved fish)
							.lookup({ from: 'recordings', localField: '_id', foreignField: 'fish', as: 'recordings' })
							.unwind({path:'$recordings',preserveNullAndEmptyArrays: true})		//left join (retain fish that do not have recordings)
							.match(params)
							//one-to-one = $first; one-to-many = $addToSet
							.group({_id:'$_id',
								publicId: {$first: '$publicId' },
								order: {$first: '$order' },
								family: {$first: '$family' },
								scientific: {$first: '$scientific' },
								title: {$first: '$title' },
								climates: {$first: '$climates' },
								waters: {$first: '$waters' },
								references:{$addToSet:'$observations.refId'},
								recordings:{$addToSet:'$recordings.publicId'}
							})
							//project values the should appear in end object; 1 for values, $size for array lengths
							.project({
								publicId:1,
								order:1,
								family:1,
								scientific:1,
								title:1,
								climates:1,
								waters:1,
								refCount: {$size: '$references'},
								recCount: {$size: '$recordings'}
							})
							//sort result list (value must match a projected key)
							.sort(sort)
							//limit number of returned results and return correct 'page' of them (30 is arbitrary and could be changed or made into a variable)
							.facet({
   								results: [{ $skip: (30 * page) - 30 }, { $limit: 30 }],
    							total: [{$count: 'count'}]
  							});
	
	//convert any system IDs into human-readable values
  	var arr = [];
	for(var i = 0; i < query[0].results.length; i++){
		var obj = query[0].results[i];

		obj.climates = await termSchema.read(obj.climates);
		obj.waters = await termSchema.read(obj.waters);
		
		arr.push(obj);
	}
	
	var count = query[0].total.length > 0 ? query[0].total[0].count : 0;
	return {count: count, results: arr};
}

//given the public ID of a fish (used to create links, etc. in the user interface), returns the system ID for it
//called by the fish route in app.js
exports.getId = async function(publicId){
	var query = await rec.findOne({publicId:publicId}).select('_id').exec();
	return query;
}

//given the scientific name of a fish, returns the system ID for it
//called by the create functions in the reference.js and observation.js schemas
exports.getIdByName = async function(scientific){
	var query = await rec.findOne({scientific:scientific}).select('_id').exec();
	return query;
}

// returns a randomly selected record that has an image file
// called by the index route in app.js
exports.getHighlightedSpecies = async function(list){
	var fish = {unknown:true};
	while(fish.unknown){
		var random = list[Math.floor(Math.random() * list.length)];
		var fish = await this.read(random);
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

	var params = {observed: true,[`${type}`]: regex};
	if(!data.unknowns){ params["unknown"] = false; }
	for(item in data){
		if(item != "unknowns" && item != type && data[item]){ params[item] = data[item]; }
	}

	var query = await rec.find(params).distinct(type).exec();
	
	return query;
}

//given a record field (e.g. family, scientific) and a value for that field, returns an object containing the items above it in the taxonomy
//used to fill higher items in the results-fish.js search form to avoid non-existent combinations (e.g. searching for a fish family within a class that doesn't contain it)
//genus and species (i.e. scientific name) are unique in combination, but not independently, so "scientific" is used collectively instead of genus and species separately
//called by requestBackfill route in app.js
exports.getBackfill = async function(type,value){
	var taxonomy = ["className","order","family","scientific"];
	var obj = {};
	
	var query = await rec.findOne({[`${type}`]: value}).exec();
	
	//loop through the taxonomy and assign values for each level, but only until the level of the type parameter
	//(e.g. if 'order' is the type, only pull className; if 'family', pull className and order)
	var i = 0;
	var matched = false;
	while(!matched){
		if(taxonomy[i] == type){
			matched = true;
			break;
		}
		
		obj[taxonomy[i]] = query[taxonomy[i]];
		i += 1;
	}
	
	return obj;	
}
