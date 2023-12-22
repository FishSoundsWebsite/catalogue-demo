var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;
var db = require('./../dbconn.js');

var cleanerTools = require('./tools/dataCleaningFunctions.js');

var fishSchema = new Schema({
	publicId: 							String,
	extId:								String,
	superclass:							String,
	superclass_latinized:				String,
	className:							String,
	className_latinized:				String,
	order:								String,
	order_latinized:					String,
	suborder:							String,
	suborder_latinized:					String,
	family:								String,
	family_latinized:					String,
	subfamily:							String,
	subfamily_latinized:				String,
	genus:								String,
	genus_latinized:					String,
	species:							String,
	species_latinized:					String,
	common:								String,
	common_latinized:					String,
	title:								String,
	title_latinized:					String,
	combo_genus__species:				String,
	combo_genus__species_latinized:		String,
	combo_superclass__className:		String,
	combo_superclass__className_latinized:String,
	combo_order__suborder:				String,
	combo_order__suborder_latinized:	String,
	combo_family__subfamily:			String,
	combo_family__subfamily_latinized:	String,
	image:								{type: {
											filename:		String,
											copyrightHolder:String,
											license:		ObjectId,
											sourceName:		String,
											sourceLink:		String
										}, default: undefined},
	climates:							[ObjectId],
	regions:							[ObjectId],
	waters:								[ObjectId],
	notes: 								String,
	observed:							{type: Boolean, default: false},
	unknown:							{type: Boolean, default: false},
	status:								{type: String, default: "Active"}
});

var rec = mongoose.model('Fish',fishSchema);

exports.record = rec;

// given a system ID, returns an object with human readable values
// called by the index and fish routes in app.js
exports.read = async function(publicId){
	var query = await rec.aggregate()
							.match({status:"Active",publicId:publicId})
							.lookup({ from: 'terms', localField: 'climates', foreignField: '_id', as: 'climates' })
							.lookup({ from: 'terms', localField: 'waters', foreignField: '_id', as: 'waters' })
							.lookup({ from: 'terms', localField: 'image.license', foreignField: '_id', as: 'license' })
							.unwind({path:'$license',preserveNullAndEmptyArrays: true})
							.lookup({ from: 'regions', localField: 'regions', foreignField: '_id', as: 'regions' })
							.project({
								_id:0,
								publicId:1,
								superclass:1,
								className:1,
								order:1,
								suborder:1,
								family:1,
								subfamily:1,
								genus:1,
								species:1,
								combo_genus__species:1,
								common:1,
								title:1,
								title_latinized:1,
								extId:1,
								'image.filename':1,
								'image.copyright': {$cond:[{$not: ['$image.sourceLink']},{$concat:['$image.copyrightHolder',', license: ','$license.term',', source: ','$image.sourceName']}, {$concat:['$image.copyrightHolder',', license: ','$license.term',', source: ','<a href="','$image.sourceLink','">','$image.sourceName','</a>']} ]},
								climates:'$climates.term',
								regions:'$regions.label',
								waters:'$waters.term',
								notes:1
							});		

	return query[0];
}

// given a search query object and search batch value (integer or null), returns an array of matching records in human-readable form
// called by the results-fish route in app.js
exports.search = async function(q){
	var data = {};
	var sort = {};
	var page = 1;
	
	//first pass cleaning: convert submitted search parameters into values system can use
	for(item in q){
		if(q[item]){
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
				
				// stop list to exclude worrisome injected search parameters
				case "_id":
				case "extId":
				case "status":
				case "image":
					break;
				
				// turn semi-colon delimited strings into arrays of human-readable values
				case "regions":
					data[item + ".mrgid"] = Array.isArray(q[item]) ? q[item] : q[item].split(";");
					break;
				case "climates":
				case "waters":
				case "sources":
					data[item + ".term"] = Array.isArray(q[item]) ? q[item] : q[item].split(";");
					break;
				
				// 
				case "recordings":
					data[item] = {"$exists":1};
					break;
				
				// redirect fields with search-specific substitutes
				case "superclass__className":
				case "order__suborder":
				case "family__subfamily":
				case "genus__species":
					data["combo_" + item + "_latinized"] = cleanerTools.cleanSearchString(q[item]);
					break;
					
				// straightforward key-value pair
				default:
					data[item + "_latinized"] = cleanerTools.cleanSearchString(q[item]);
			}
		}
	}
	
	//adds defaults sorting so unsorted lists have consistent paging
	if(Object.keys(sort).length === 0){ 
		sort["genus__species"] = 1;
	}

	//second pass cleaning: put cleaned search values into MongoDB query formatting
	var params = {};
	for(item in data){
		//search fields from other models need keys with dot notation that matches junction names used in search query (see below)
		//search fields from this model (fish) need correct array or string formatting as applicable

		if(data[item]){
			if(Array.isArray(data[item])){
				params[item] = {"$in": data[item]};
			}else if(typeof data[item] == "object"){
				params[item] = data[item];
			}else{
				params[item] = new RegExp(data[item],'i');
			}
		}
	}

	//actual search query
	//junctions fish to observations and recordings
	var query = await rec.aggregate()
							.match({observed:true,unknown:false,status:{"$in":["Active"]}})	//fish info was bulk copied from FishBase; many records are not referenced elsewhere in the system; observed filters these out
							.lookup({ from: 'recordings', localField: '_id', foreignField: 'fish', as: 'recordings' })
							.unwind({path:'$recordings',preserveNullAndEmptyArrays: true})		//left join (retain fish that do not have recordings)
							.lookup({ from: 'observations', localField: '_id', foreignField: 'fishId', as: 'observations' })
							.unwind({path:'$observations',preserveNullAndEmptyArrays: true})											//inner join (discard unobserved fish -- should be redundant with observed:true in match clause)
							.lookup({ from: 'terms', localField: 'observations.sources.source', foreignField: '_id', as: 'sources' })
							.lookup({ from: 'terms', localField: 'climates', foreignField: '_id', as: 'climates' })
							.lookup({ from: 'terms', localField: 'waters', foreignField: '_id', as: 'waters' })
							.lookup({ from: 'regions', localField: 'regions', foreignField: '_id', as: 'regions' })
							.match(params)
							.unwind({path:'$sources',preserveNullAndEmptyArrays: true})
							.unwind({path:'$climates',preserveNullAndEmptyArrays: true})
							.unwind({path:'$waters',preserveNullAndEmptyArrays: true})
							.unwind({path:'$regions',preserveNullAndEmptyArrays: true})
							//one-to-one = $first; one-to-many = $addToSet
							.group({_id:'$_id',
								publicId: {$first: '$publicId' },
								order: {$first: '$order' },
								family: {$first: '$family' },
								genus__species: {$first: '$combo_genus__species' },
								title: {$first: '$title' },
								climates: {$addToSet: '$climates.term' },
								waters: {$addToSet: '$waters.term' },
								references:{$addToSet:'$observations.refId'},	//system IDs in pipeline, but only count passed out
								recordings:{$addToSet:'$recordings.publicId'}
							})
							//project values the should appear in end object; 1 for values, $size for array lengths
							.project({
								_id:0,
								publicId:1,
								order:1,
								family:1,
								genus__species:1,
								title:1,
								climates:1,
								waters:1,
								refCount: {$size: '$references'},	//counting set of system IDs! Do not pass out values! (see above)
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
	return {count: count, results: query[0].results, page: page, sort: sort};
}

// returns a randomly selected fish record that: 
//		is of known species
//		has one or more associated recordings
// called by the index route in app.js
exports.getHighlightedSpecies = async function(){
	var query = await rec.aggregate()
							.match({status:{"$in":["Active"]},unknown:false,observed:true})
							.lookup({ from: 'recordings', localField: '_id', foreignField: 'fish', as: 'recordings' })
							.unwind('$recordings')			// inner join removes any fish without recordings
							.sample(1)						// randomly select 1 fish record
							.project({
								_id:0,
								publicId:1
							});

	var fish = await this.read(query[0].publicId);

	return fish;
}

//given the public ID of a fish, returns a human readable list of regions for that fish
//used by the map interface library to highlight relevant regions
//called by the fish route in app.js
exports.getRegions = async function(publicId){
	var query = await rec.aggregate()
					.match({status:{"$in":["Active"]},publicId: publicId})
					.unwind("$regions")
					.lookup({ from: 'regions', localField: 'regions', foreignField: '_id', as: 'region' })
					.unwind("$region")
					.project({
						_id:0,
						region:"$region.mrgid"
					});
		
	var regionCodes = [];
	for(var i = 0; i < query.length; i++){
		regionCodes.push(query[i].region);
	}

	return regionCodes;
}

/*** AJAX RESPONSE FUNCTIONS ***/

//given a record field (e.g. family, genus) and a search value for that field, returns an array of records matching those values
//used to populate select lists in search forms
//called by the requestList route in app.js
exports.getSelectList = async function(type,value,split){
	//null values and empty strings (length = 0) were tested for and rejected upstream
	if(value.length > 3){	//long strings (4+ characters) can be anywhere in the field
		var regex = new RegExp(cleanerTools.cleanSearchString(value),'i');
	}else if(!split){
		var regex = new RegExp('^' + cleanerTools.cleanSearchString(value),'i');
	}else{					//short strings have to be at the beginning of the field
		var regex = new RegExp('\\b' + cleanerTools.cleanSearchString(value),'i');
	}
	
	var list = [];
	
	if(type.includes("__")){
		var query = await rec.find({status:{"$in":["Active"]},observed:true,unknown:false,['combo_' + `${type}` + '_latinized']:regex}).exec();

		var types = type.split("__");
		for(var i = 0; i < query.length; i++){
			if(split){
				for(var j = 0; j < types.length; j++){
					if(query[i][types[j] + "_latinized"].match(regex)){ list.push(query[i][types[j]]); }
				}
				list = [...new Set(list)];
			}else{
				list.push(query[i]['combo_' + type]);
			}
		}
		
		list.sort();
	}else{
		list = await rec.find({status:{"$in":["Active"]},observed:true,unknown:false,[`${type}` + '_latinized']:regex}).distinct(type).exec();
	}

	return list;
}
