var interfaceTools = require('./tools/interfaceBuilderFunctions.js');
var formTools = require('./tools/formBuilderFunctions.js');

//renders a single fish record page (accordion sections of data from the fish, recordings related to the fish, and references related to the fish)
exports.display = async function(data){
	var content = `
	<div id="fish" class="row">
		<div class="col-12">
			<div class="section">
				<h2 class="center">` + data.fish.title + `</h2>
				<div id="editorNotes" class="noteBox col-lg-4 col-12 p-2 mx-3 my-0 collapse collapse-horizontal">
					<div class="row p-2">
						<div class="col ps-4"><h3 id="noteTitle" class="center"></h3></div>
						<div class="col-2 me-3 right"><button id="closeNotes" class="btn btn-sm btn-secondary p-0" data-bs-toggle="collapse" data-bs-target="#editorNotes" aria-expanded="false" aria-controls="editorNotes"><i class="fa fa-times-circle fa-2x"></i></button></div>
					</div>
					<div class="col-12 p-2" id="textHolder"></div>
				</div>
				<div class="accordion" id="fishAccordion">`;
		// first accordion tab - descriptive info
					content += `
					<div class="card">
						<div class="card-header" id="speciesDescriptionLabel">
							<a href="#speciesDescriptionContent" class="nude" data-bs-toggle="collapse" data-bs-target="#speciesDescriptionContent" aria-expanded="true" aria-controls="speciesDescriptionContent">
								<h3>Species Description<i class="fa fa-angle-down arrowIcon"></i></h3>
							</a>
						</div>

						<div id="speciesDescriptionContent" class="collapse show" aria-labelledby="speciesDescriptionLabel">`;
							if(data.fish.notes){
								content += `
								<div class="card-body row p-0 pt-2">
									<div class="col-3 m-auto center">
										<div class="d-none noteContent">` + data.fish.notes + `</div>
										<button id="button-editorNotes" class="btn btn-sm" data-bs-toggle="collapse" data-bs-target="#editorNotes" aria-expanded="false" aria-controls="editorNotes" onclick="displayNotes(this,'Editor Notes')">View Editor Notes</button>
									</div>
								</div>`;
							}
							content += `
							<div class="card-body row">
								<div class="col-lg-4 col-md-12 col-12 m-0">`;
							if(data.fish.image){
								content += `<img src="./public/images/` + data.fish.image.filename + `" id="speciesDescriptionImage" alt="image of ` + data.fish.title_latinized + `">
									<p class="citation center">` + data.fish.image.copyright + `</p>`;
							}else{
								content += `<img src="./public/missingImages/2_Fish_page_individual.png" id="speciesDescriptionImage" alt="no image available">`;
							}
					content += `</div>
								<div class="col-lg-4 col-md-6 col-12 m-0">`;
									if(data.fish.superclass){ content += interfaceTools.fieldBuilder("Superclass",data.fish.superclass,"results-fish.js","className"); }
									if(data.fish.className){ content += interfaceTools.fieldBuilder("Class",data.fish.className,"results-fish.js","className"); }
									if(data.fish.order){ content += interfaceTools.fieldBuilder("Order",data.fish.order,"results-fish.js","order"); }
									if(data.fish.suborder){ content += interfaceTools.fieldBuilder("Suborder",data.fish.suborder,"results-fish.js","order"); }
									if(data.fish.family){ content += interfaceTools.fieldBuilder("Family",data.fish.family,"results-fish.js","family"); }
									if(data.fish.subfamily){ content += interfaceTools.fieldBuilder("Subfamily",data.fish.subfamily,"results-fish.js","family"); }
									if(data.fish.genus){ content += interfaceTools.fieldBuilder("Genus",data.fish.genus,"results-fish.js","genus"); }
									if(data.fish.species){ content += interfaceTools.fieldBuilder("Species",data.fish.species); }
									if(data.fish.common){ content += interfaceTools.fieldBuilder("Common",data.fish.common); }
									content += `<br/>`;
									content += interfaceTools.fieldBuilder("Climates",data.fish.climates,"results-fish.js","climates");
									content += interfaceTools.fieldBuilder("Waters",data.fish.waters,"results-fish.js","waters");
					content += `</div>
								<div class="col-lg-4 col-md-6 col-12 m-0">`;
									content += interfaceTools.fieldBuilder("Regions",data.fish.regions,"results-fish.js","regions");
									content += `
								</div>
							</div>
						</div>
					</div>`;
				if(data.recordings && data.recordings.length > 0){	
		// second accordion tab - recording info
					var recCount = data.recordings.length == 1 ? "1 Entry" : data.recordings.length + " Entries";
					content += `<div class="card">
						<div class="card-header" id="soundRecordingsLabel">
							<a href="#soundRecordingsContent" class="nude collapsed" data-bs-toggle="collapse" data-bs-target="#soundRecordingsContent" aria-expanded="true" aria-controls="soundRecordingsContent">
								<h3>Sound Recordings (` + recCount + `) <i class="fa fa-angle-up arrowIcon"></i></h3>
							</a>
						</div>
						<div id="soundRecordingsContent" class="collapse show" aria-labelledby="soundRecordingsLabel">
							<div class="card-body col-10 mx-auto">`;
								content += await interfaceTools.buildRecordingCards(data.recordings,"recordingBlock",false);
							content += `</div>
						</div>
					</div>`;
				}
		// third accordion tab - reference info
					var refCount = data.references.length == 1 ? "1 Entry" : data.references.length + " Entries";
					content += `<div class="card">
						<div class="card-header" id="referencesLabel">
							<a href="#referencesContent" class="nude collapsed" data-bs-toggle="collapse" data-bs-target="#referencesContent" aria-expanded="true" aria-controls="referencesContent">
								<h3>References (` + refCount + `) <i class="fa fa-angle-up arrowIcon"></i></h3>
							</a>
						</div>
						<div id="referencesContent" class="collapse show" aria-labelledby="referencesLabel">
							<div class="card-body container-fluid">`;
							
								var citationLabel = data.references.length > 1 ? "Citation" : `Citation <span class="d-lg-inline d-none"> (Newest to Oldest)</span>`;
								var refs = {
									id:"references",
									style:" dark",
									data:{
										headings:[
											{ id:"citation", label:citationLabel, size:"col" },
											{ id:"detection", label:"Detection", size:"col-2" },
											{ id:"sources", label:"Sound Types Detected", size:"col-2" },
											{ id:"examinations", label:"Examination Types", size:"col-2" }
										],
										rows:[]
									}
								};
							
								var notes = false;
								for(var i = 0; i < data.references.length; i++){
									var citation = `<a href='./reference.js?id=` + data.references[i].reference.publicId + `'>
														<p class="tight d-lg-table-cell d-none justify">` + data.references[i].reference.refLong.replace(/\u00a0/g, " ").replace(/  /g, " ") + `</p>
														<p class="tight d-lg-none d-table-cell" title="` + data.references[i].reference.refLong.replace(/\u00a0/g, " ").replace(/  /g, " ") + `">` + data.references[i].reference.refShort + `</p>
													</a>`;

									var detection = interfaceTools.checklistBuilder("Species Identified",data.references[i].speciesDoubt,[{"text":"Species was identified","symbol":"fa-check-circle"},{"text":"Species was identified, but is doubted","symbol":"fa-question-circle"}]);
									var detectionCheck = !data.references[i].detection ? 0 : !data.references[i].detectionDoubt ? 1 : 2;
									detection += interfaceTools.checklistBuilder("Sound Detected",detectionCheck,[{"text":"Sound was not detected","symbol":"fa-times-circle"},{"text":"Sound was detected","symbol":"fa-check-circle"},{"text":"Sound was detected, but is doubted","symbol":"fa-question-circle"}]);

									var activeObj = false;
									var feedingObj = false;
									var otherObj = false;
									if(data.references[i].sources){ 
										var activeObj = data.references[i].sources.find(obj => { return obj.source == "Active"; });
										var feedingObj = data.references[i].sources.find(obj => { return obj.source == "Passive Feeding"; });
										var otherObj = data.references[i].sources.find(obj => { return obj.source == "Other Passive"; });
									}
									var active = !activeObj ? 0 : !activeObj.doubt ? 1 : 2;
									var feeding = !feedingObj ? 0 : !feedingObj.doubt ? 1 : 2;
									var other = !otherObj ? 0 : !otherObj.doubt ? 1 : 2;
									var sources = interfaceTools.checklistBuilder("Active",active,[{"text":"Active sound was not detected","symbol":"fa-times-circle"},{"text":"Active sound was detected","symbol":"fa-check-circle"},{"text":"Active sound was detected, but is doubted","symbol":"fa-question-circle"}]);
									sources += interfaceTools.checklistBuilder("Passive Feeding",feeding,[{"text":"Feeding passive sound was not detected","symbol":"fa-times-circle"},{"text":"Feeding passive sound was detected","symbol":"fa-check-circle"},{"text":"Feeding passive sound was detected, but is doubted","symbol":"fa-question-circle"}]);
									sources += interfaceTools.checklistBuilder("Other Passive",other,[{"text":"Other passive sound was not detected","symbol":"fa-times-circle"},{"text":"Other passive sound was detected","symbol":"fa-check-circle"},{"text":"Other passive sound was detected, but is doubted","symbol":"fa-question-circle"}]);


									var examinations = interfaceTools.checklistBuilder("Morphophysiological",data.references[i].physiological,[{"text":"Morphophysiological examination was not performed","symbol":"fa-times-circle"},{"text":"Morphophysiological examination was performed","symbol":"fa-check-circle"},{"text":"Morphophysiological examination was performed, but is doubted","symbol":"fa-question-circle"}]);
									examinations += interfaceTools.checklistBuilder("Auditory",data.references[i].audio,[{"text":"Auditory examination was not performed","symbol":"fa-times-circle"},{"text":"Auditory examination was performed","symbol":"fa-check-circle"}]);
									examinations += interfaceTools.checklistBuilder("Visual",data.references[i].visual,[{"text":"Visual examination was not performed","symbol":"fa-times-circle"},{"text":"Visual examination was performed","symbol":"fa-check-circle"}]);

									var row = [];
									row.push({id:"name",value:citation,size:"col"});
									row.push({id:"detection",value:detection,size:"col-2 p-3",align:"left"});
									row.push({id:"sources",value:sources,size:"col-2 p-3",align:"left"});
									row.push({id:"examinations",value:examinations,size:"col-2 p-3",align:"left"});
			
									if(data.references[i].editorNotes){
										noteCheck = true;
										row[0].note = data.references[i].editorNotes;
										notes = true;
									}
			
									refs.data.rows.push(row);
								}

								content += interfaceTools.buildDataList(refs,"col m-0 p-0","unset",notes = notes,search = false,edit = false);
							
							content += `			
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>`;
	return content;
}

