var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;
var db = require('./../dbconn.js');

var termSchema = require('./term.js');
var fishSchema = require('./fish.js');
var referenceSchema = require('./reference.js');
var recordingSchema = require('./recording.js');

var observationSchema = new Schema({
	publicId: 		String,
	fishId: 		ObjectId,
	refId: 			ObjectId,
	detection:		Boolean,
	speciesDoubt:	Boolean,
	detectionDoubt:	Boolean,
	physiological:	Number,
	audio:			Boolean,
	visual:			Boolean,
	altName:		String,
	editorNotes:	String,
	fullDesc: 		String,
	behaviours:		[{
						behaviour:	ObjectId,
						context:	String
					}],
	behaviourNotes:	String,
	environments:	[ObjectId],
	environmentNotes: String,
	sources:		[{
						source:	ObjectId,
						doubt:	Boolean
					}],
	diagrams:		[ObjectId],
	noises:			[{
						noise:			ObjectId,
						context:		String
					}],
	noiseNotes:		String,
	status:			{type: String},
});

var rec = mongoose.model('Observation',observationSchema);

exports.record = rec;

// given an object of search parameters (e.g. {fishId: xxx}, {_id: xxx}), returns an object with human readable values
// params is used instead of _id to increase function flexibility
// called by the fish and reference routes in app.js
exports.read = async function(params = {}){
	params["status"] = {"$in":["Active"]};
	
	var query = await rec.aggregate()
						.lookup({ from: 'fish', localField: 'fishId', foreignField: '_id', as: 'fish' })
						.unwind('fish')
						.lookup({ from: 'references', localField: 'refId', foreignField: '_id', as: 'reference' })
						.unwind('reference')
						.match(params)
						.lookup({ from: 'terms', localField: 'environments', foreignField: '_id', as: 'environments' })
						.unwind({path:'$environments',preserveNullAndEmptyArrays: true})
						.lookup({ from: 'terms', localField: 'diagrams', foreignField: '_id', as: 'diagrams' })
						.unwind({path:'$diagrams',preserveNullAndEmptyArrays: true})
						.lookup({ from: 'terms', localField: 'behaviours.behaviour', foreignField: '_id', as: 'behaviourLabels' })
						.lookup({ from: 'terms', localField: 'noises.noise', foreignField: '_id', as: 'noiseLabels' })
						.lookup({ from: 'terms', localField: 'sources.source', foreignField: '_id', as: 'sourceLabels' })
						.group({
							_id:"$publicId",
							fish:{$first:"$fish"},
							reference:{$first:"$reference"},
							altName:{$first:"$altName"},
							editorNotes:{$first:"$editorNotes"},
							speciesDoubt:{$first:"$speciesDoubt"},
							detection:{$first:"$detection"},
							detectionDoubt:{$first:"$detectionDoubt"},
							physiological:{$first:"$physiological"},
							audio:{$first:"$audio"},
							visual:{$first:"$visual"},
							fullDesc:{$first:"$fullDesc"},
							environmentNotes:{$first:"$environmentNotes"},
							behaviourNotes:{$first:"$behaviourNotes"},
							noiseNotes:{$first:"$noiseNotes"},
							diagrams:{$first:"$diagrams"},
							environments:{$first:"$environments"},
							behaviours:{$first:"$behaviours"},
							noises:{$first:"$noises"},
							sources:{$first:"$sources"}
						})
						.project({
							_id:1,
							fish:{publicId:'$fish.publicId',title:'$fish.title'},
							reference:{publicId:'$reference.publicId',refLong:'$reference.refLong'},
							altName:1,
							editorNotes:1,
							speciesDoubt:1,
							detection:1,
							detectionDoubt:1,
							physiological:1,
							audio:1,
							visual:1,
							fullDesc:1,
							environmentNotes:1,
							behaviourNotes:1,
							noiseNotes:1,
							diagrams:'$diagrams.term',
							environments:'$environments.term',
							behaviours:{ "$map":{ input:"$behaviours", in:{
								"$let":{
									vars:{ m:{ "$arrayElemAt":[ { "$filter":{
											input: "$behaviourLabels",
											cond:{ "$eq":[ "$$mb._id","$$this.behaviour" ] },
											as: "mb"
										}}, 0 ]}},
									in:{ "$mergeObjects":[ { context: "$$this.context" }, { "behaviour": "$$m.term" }]}
								}
							}}},
							noises:{ "$map":{ input:"$noises", in:{
								"$let":{
									vars:{ m:{ "$arrayElemAt":[ { "$filter":{
											input: "$noiseLabels",
											cond:{ "$eq":[ "$$mb._id","$$this.noise" ] },
											as: "mb"
										}}, 0 ]}},
									in:{ "$mergeObjects":[ { context: "$$this.context" }, { "noise": "$$m.term" }]}
								}
							}}},
							sources:{ "$map":{ input:"$sources", in:{
								"$let":{
									vars:{ m:{ "$arrayElemAt":[ { "$filter":{
											input: "$sourceLabels",
											cond:{ "$eq":[ "$$mb._id","$$this.source" ] },
											as: "mb"
										}}, 0 ]}},
									in:{ "$mergeObjects":[ { doubt: "$$this.doubt" }, { "source": "$$m.term" }]}
								}
							}}}
						});

	return query;
}
