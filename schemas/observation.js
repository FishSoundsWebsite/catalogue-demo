var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;
var db = require('./../dbconn.js');

var termSchema = require('./term.js');
var fishSchema = require('./fish.js');
var referenceSchema = require('./reference.js');
var recordingSchema = require('./recording.js');

var observationSchema = new Schema({
	fishId: 		ObjectId,
	refId: 			ObjectId,
	detection:		Boolean,
	speciesDoubt:	Boolean,
	detectionDoubt:	Boolean,
	physiological:	Number,
	audio:			Boolean,
	visual:			Boolean,
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
	noiseNotes:		String
});

var rec = mongoose.model('Observation',observationSchema);

exports.record = rec;

// given an object of search parameters (e.g. {fishId: xxx}, {_id: xxx}), returns an object with human readable values
// params is used instead of _id to increase function flexibility
// called by the fish and reference routes in app.js
exports.read = async function(params){
	var query = await rec.find(params).exec();
	var results = [];
	for(var i = 0; i < query.length; i++){
		var info = {};
	
		if(query[i].detection){ info.detection = query[i].detection; }
		if(query[i].detectionDoubt){ info.detectionDoubt = query[i].detectionDoubt; }
		if(query[i].speciesDoubt){ info.speciesDoubt = query[i].speciesDoubt; }
		if(query[i].physiological){ info.physiological = query[i].physiological; }
		if(query[i].visual){ info.visual = query[i].visual; }
		if(query[i].audio){ info.audio = query[i].audio; }
		if(query[i].fullDesc){ info.fullDesc = query[i].fullDesc; }
		if(query[i].behaviourNotes){ info.behaviourNotes = query[i].behaviourNotes; }
		if(query[i].environmentNotes){ info.environmentNotes = query[i].environmentNotes; }
		if(query[i].noiseNotes){ info.noiseNotes = query[i].noiseNotes; }
	
		if(query[i].behaviours && query[i].behaviours.length > 0){
			var behaviours = [];
			for(var j = 0; j < query[i].behaviours.length; j++){
				var o = {};
				o.behaviour = await termSchema.read(query[i].behaviours[j].behaviour);
				o.context = query[i].behaviours[j].context;
				behaviours.push(o);
			}
			info.behaviours = behaviours;
		}
	
		if(query[i].sources && query[i].sources.length > 0){
			var sources = [];
			for(var j = 0; j < query[i].sources.length; j++){
				var o = {};
				o.source = await termSchema.read(query[i].sources[j].source);
				o.doubt = query[i].sources[j].doubt;
				sources.push(o);
			}
			info.sources = sources;
		}
	
		if(query[i].noises){
			var noises = [];
			for(var j = 0; j < query[i].noises.length; j++){
				var o = {};

				o.noise = await termSchema.read(query[i].noises[j].noise);
				if(query[i].noises[j].context){ o.context = query[i].noises[j].context; }

				noises.push(o);
			}
			info.noises = noises;
		}

		if(query[i].environments){ info.environments = await termSchema.read(query[i].environments); }
		if(query[i].diagrams){ info.diagrams = await termSchema.read(query[i].diagrams); }
	
		if(query[i].fishId){ info.fish = await fishSchema.read(query[i].fishId); }
		if(query[i].refId){ info.reference = await referenceSchema.read(query[i].refId); }
		
		results.push(info);
	}
	
	return results;
}

//returns the system ID of the fish referenced in the last entered observation record
//used to populate site statistics
//called by the index route in app.js
exports.getLatest = async function(){
	var query = await rec.find({}, null, {limit: 1, sort: {'epoch': -1}}).exec();
	return query[0].fishId;
}

//returns an integer counting the number of observed fish species in the database
//used to populate site statistics
//called by the index route in app.js
exports.getCount = async function(){
	var query = await rec.distinct('fishId').exec();
	return query.length;
}
