var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;
var db = require('./../dbconn.js');

var cleanerTools = require('./tools/dataCleaningFunctions.js');

var options = { discriminatorKey: 'kind' };	//mongoose concept for having extendable schemas; subsets of reference will have 'kind' parameters that determine which type they are

/*** BASE SCHEMA ***/

var baseReferenceSchema = new Schema({
	publicId: 									String,
	extId:										String,
	title:										String,
	title_latinized:							String,
	authors:									[{
													first:			Array,
													middle:			Array,
													last:			String,
													last_latinized:	String
												}],
	year:										Number,
	language:									String,
	other:										String,
	combo_title__authors_last__doi: 			String,
	combo_title__authors_last__doi_latinized: 	String,
	refLong:									String,
	refShort:									String,
	type:										{type: String, default: "Unset"},
	gray:										Boolean,
	status:										{type: String}
});

var rec = mongoose.model('Reference',baseReferenceSchema);

/*** ARTICLE SCHEMA ***/

var articleSchema = new Schema(
	{
		publication:String,
		volume:		String,
		issue:		String,
		start:		String,
		end:		String,
		doi:		String,
		issn:		String,
		type:		{type: String, default: "Article"},
		gray:		{type: Boolean, default: false}
	},
	options
);

var Article = rec.discriminator('article',articleSchema);

/*** PROCEEDING SCHEMA ***/

var proceedingSchema = new Schema(
	{
		publication:String,
		volume:		String,
		issue:		String,
		start:		String,
		end:		String,
		doi:		String,
		issn:		String,
		type:		{type: String, default: "Proceeding"},
		gray:		{type: Boolean, default: true}
	},
	options
);

var Proceeding = rec.discriminator('proceeding',proceedingSchema);

/*** BOOK SCHEMA ***/

var bookSchema = new Schema(
	{
		location:	String,
		publisher:	String,
		editors:	[String],
		translators:[String],
		pages:		String,
		isbn:		String,
		type:		{type: String, default: "Book"},
		gray:		{type: Boolean, default: false}
	},
	options
);

var Book = rec.discriminator('book',bookSchema);

/*** CHAPTER SCHEMA ***/

var chapterSchema = new Schema(
	{
		publication:String,
		location:	String,
		publisher:	String,
		editors:	[String],
		translators:[String],
		start:		String,
		end:		String,
		isbn:		String,
		type:		{type: String, default: "Chapter"},
		gray:		{type: Boolean, default: false}
	},
	options
);

var Chapter = rec.discriminator('chapter',chapterSchema);

/*** THESIS SCHEMA ***/

var thesisSchema = new Schema(
	{
		level:		String,
		location:	String,
		institution:String,
		pages:		String,
		issn:		String,
		type:		{type: String, default: "Thesis"},
		gray:		{type: Boolean, default: true}
	},
	options
);

var Thesis = rec.discriminator('thesis',thesisSchema);

/*** REPORT SCHEMA ***/

var reportSchema = new Schema(
	{
		publisher:	String,
		number:		String,
		type:		{type: String, default: "Report"},
		gray:		{type: Boolean, default: true}
	},
	options
);

var Report = rec.discriminator('report',reportSchema);

/*** WEBSITE SCHEMA ***/

var websiteSchema = new Schema(
	{
		url:		String,
		website:	String,
		editors:	[String],
		type:		{type: String, default: "Website"},
		gray:		{type: Boolean, default: true}
		
	},
	options
);

var Website = rec.discriminator('website',websiteSchema);

/*** OTHER SCHEMA ***/

var otherSchema = new Schema(
	{
		publication:String,
		location:	String,
		publisher:	String,
		editors:	[String],
		translators:[String],
		start:		String,
		end:		String,
		identifier:	String,
		link:		String,
		type:		{type: String, default: "Other"},
		gray:		{type: Boolean, default: true}
	},
	options
);

var Other = rec.discriminator('other',otherSchema);



// given a public ID, returns an object with human readable values
// called by the reference route in app.js
exports.read = async function(publicId){
	var query = await rec.aggregate()
						.match({status:"Active",publicId:publicId})
						.project({
							_id:0,
							status:0
						});
	
	return query[0];
}

// given a search query object and search batch value (integer or null), returns an array of matching records in human-readable form
// called by the results-reference route in app.js
exports.search = async function(q){
	var data = {gray:false};
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
				case "extId":
				case "status":
				case "internal":
					break;
				
				// turn string into regular expression
				case "title":
					data[item + '_latinized'] = new RegExp(cleanerTools.cleanSearchString(q[item]),"i");
					break;
				// target subfields on the fish junction object
				case "common":
					data['fish.' + item + '_latinized'] = new RegExp(cleanerTools.cleanSearchString(q[item]),"i");
					break;
				case "genus__species":
				case "superclass__className":
				case "order__suborder":
				case "family__subfamily":
					data['fish.combo_' + item + '_latinized'] = new RegExp(cleanerTools.cleanSearchString(q[item]),"i");
					break;
				// target 'last' field in the authors array
				case "authors":
					data["authors.last_latinized"] = new RegExp(cleanerTools.cleanSearchString(q[item]),"i");
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
				// if switch is "on", property is present; remove exclusion clause from base object
				// all/partial filtering, not either/or
				case "gray":
					delete data.gray;
					break;

				//straightforward key-value pair
				default:
					data[item] = q[item];
			}
		}
	}
	
	//adds defaults sorting so unsorted lists have consistent paging
	if(Object.keys(sort).length === 0){ 
		sort["_id"] = -1; 
	}

	//actual search query
	//junctions references to fish via observations and recordings
	var query = await rec.aggregate()
							.match({status:{"$in":["Active"]}})
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
	return {count: count, results: query[0].results, page: page, sort: sort};
}

// given an array of term types, returns an object: {"term type": [{"term":term,"code":code}]} OR {"term type": {"group name": [{"term":term,"code":code}]}
	// if codelist has a group structure in the database, this will be retained in the return array; otherwise only an array of term objects
// used to populate dropdowns and suggestion lists for submission forms
// called by getCodeLists function in app.js
exports.getFullList = async function(list){
	var results = [];
	switch(list.type){
		case "language":
			var query = await rec.aggregate()
								.match({status:"Active"})
								.group({
									_id:'$language',
									count:{$sum:1}
								})
								.project({
									_id:1,
									count:1
								})
								.sort({"count":-1});
			for(var i = 0; i < query.length; i++){
				results.push(query[i]._id + " (" + query[i].count + ")");
			}
			break;
		case "types":
			var results = ["Article","Proceeding","Book","Chapter","Thesis","Report","Website","Other"];
			break;
		case "level":
			var results = ["Undergraduate","Master's","PhD"];
			break;
	}

	return results;
}

//returns an array containing the earliest and latest year values from records
//used to set the min/max range of the year input in the reference.js search form
//called by the results-references route in app.js
exports.getYearRange = async function(){
	var query = await rec.aggregate().match({status:{"$in":["Active"]},year:{$gt:0}}).group({_id:null,min:{$min:"$year"},max:{$max:"$year"}});
	return [query[0].min,query[0].max];
}

/*** AJAX RESPONSE FUNCTIONS ***/

//given a record field (e.g. authors) and a search value for that field, returns an array of records matching those values
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
	
	if(type == "authors"){
		var query = await rec.find({status:{"$in":["Active"]},"authors.last_latinized": regex}).select({"authors.last":1,"authors.last_latinized":1}).exec();
		
		var arr = [];
		for(var i = 0; i < query.length; i++){
			for(var j = 0; j < query[i].authors.length; j++){
				if(query[i].authors[j].last_latinized.match(regex)){ arr.push(query[i].authors[j].last); }
			}
		}
		arr = arr.filter((value, index, array) => array.indexOf(value) === index);
		return arr;
	}else{
		var query = await rec.find({status:{"$in":["Active"]},[`${type}` + "_latinized"]: regex}).distinct(type).exec();
		return query;
	}
}

