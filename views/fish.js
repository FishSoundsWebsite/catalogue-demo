var tools = require('./tools/interfaceBuilderFunctions.js');

//renders a single fish record page (accordion sections of data from the fish, recordings related to the fish, and references related to the fish)
exports.display = function(data){
	var content = `
	<div id="fish" class="row">
		<div class="col-12">
			<div class="section">
				<h2 class="center">` + data.fish.title + `</h2>
				<div class="accordion" id="fishAccordion">`;
					// first accordion tab - descriptive info
					var content = `
					<div class="card">
						<div class="card-header" id="speciesDescriptionLabel">
							<a href="#speciesDescriptionContent" class="nude" data-bs-toggle="collapse" data-bs-target="#speciesDescriptionContent" aria-expanded="true" aria-controls="speciesDescriptionContent">
								<h3>Species Description<i class="fa fa-angle-down arrowIcon"></i></h3>
							</a>
						</div>

						<div id="speciesDescriptionContent" class="collapse show" aria-labelledby="speciesDescriptionLabel">
							<div class="card-body row pb-0">
								<p class="col-12 center big"><a href="https://www.fishbase.se/summary/` + data.fish.extId + `"><i class="mr-2 fa fa-external-link"></i>View Entry on FishBase Website</a></p>
							</div>
							<div class="card-body row pt-0">
								<div class="col-lg-4 col-md-12 col-12 m-0">`;
							if(data.fish.image){
								content += `<img src="./public/images/` + data.fish.image.filename + `" id="speciesDescriptionImage" alt="image of ` + data.fish.scientific + `">
									<p class="citation center">` + data.fish.image.copyright + `</p>`;
							}else{
								content += `<p>No image available</p>`;
							}
					content += `</div>
								<div class="col-lg-4 col-md-6 col-12 m-0">`;
									content += tools.fieldBuilder("Class",data.fish.className,"className");
									content += tools.fieldBuilder("Order",data.fish.order,"order");
									content += tools.fieldBuilder("Family",data.fish.family,"family");
									content += tools.fieldBuilder("Genus",data.fish.genus,"genus");
									content += tools.fieldBuilder("Species",data.fish.species,"species");
									content += `<br/>`;
									content += tools.fieldBuilder("Climates",data.fish.climates,"climates");
									content += tools.fieldBuilder("Waters",data.fish.waters,"waters");
					content += `</div>
								<div class="col-lg-4 col-md-6 col-12 m-0">`;
									content += tools.fieldBuilder("Regions",data.fish.regions,"regions");
					content += `</div>
							</div>
						</div>
					</div>`;
				if(data.recordings && data.recordings.length > 0){	
					// second accordion tab - recording info
					var recCount = data.recordings.length == 1 ? "1 Entry" : data.recordings.length + " Entries";
					content += `<div class="card">
						<div class="card-header" id="soundRecordingsLabel">
							<a href="#soundRecordingsContent" class="nude collapsed" data-bs-toggle="collapse" data-bs-target="#soundRecordingsContent" aria-expanded="false" aria-controls="soundRecordingsContent">
								<h3>Sound Recordings (` + recCount + `) <i class="fa fa-angle-down arrowIcon"></i></h3>
							</a>
						</div>
						<div id="soundRecordingsContent" class="collapse" aria-labelledby="soundRecordingsLabel">
							<div class="card-body">`;
								content += tools.buildRecordingCards(data.recordings,"recordingBlock",false);
							content += `</div>
						</div>
					</div>`;
				}
					// third accordion tab - reference info
					var refCount = data.references.length == 1 ? "1 Entry" : data.references.length + " Entries";
					content += `<div class="card">
						<div class="card-header" id="referencesLabel">
							<a href="#referencesContent" class="nude collapsed" data-bs-toggle="collapse" data-bs-target="#referencesContent" aria-expanded="true" aria-controls="referencesContent">
								<h3>References (` + refCount + `) <i class="fa fa-angle-down arrowIcon"></i></h3>
							</a>
						</div>
						<div id="referencesContent" class="collapse" aria-labelledby="referencesLabel">
							<div class="card-body container-fluid">
								<table id="referenceList" class="table table-striped">
									<thead>
										<tr class="d-flex">
											<th class="col-xl-6 col-md-3 col-4">Citation`;
											if(data.references.length > 1){ content += `<span class="d-lg-inline d-none"> (Newest to Oldest)</span>`; }
											content += `</th>
											<th class="col-xl-2 col-3 d-md-table-cell d-none">Detection</th>
											<th class="col-xl-2 col-md-3 col-4">Sound Types Detected</th>
											<th class="col-xl-2 col-md-3 col-4">Examination Types</th>
										</tr>
									</thead>
									<tbody>`;
								
								// displays each reference as a row with sets of negative (0), positive (1), or doubtful (2) values displayed as X, checkmark, and ? icons respectively
								for(var i = 0; i < data.references.length; i++){
									content += `<tr class="d-flex">
													<td class="col-xl-6 col-md-3 col-4 p-3 align-middle"><a href='./reference.js?id=` + data.references[i].reference.publicId + `'><p class="tight d-xl-table-cell d-none justify">` + data.references[i].reference.refLong.replace(/\u00a0/g, " ").replace(/  /g, " ") + `</p><p class="tight d-xl-none d-table-cell" title="` + data.references[i].reference.refLong.replace(/\u00a0/g, " ").replace(/  /g, " ") + `">` + data.references[i].reference.refShort + `</p></a></td>
													<td class="col-xl-2 col-3 p-3 d-md-table-cell d-none align-middle">`;
														var detection = !data.references[i].detection ? 0 : !data.references[i].detectionDoubt ? 1 : 2;
														content += tools.checkboxBuilder("Species Identified",data.references[i].speciesDoubt,[{"text":"Species was identified","symbol":"fa-check-circle"},{"text":"Species was identified, but is doubted","symbol":"fa-question-circle"}]);
														content += tools.checkboxBuilder("Sound Detected",detection,[{"text":"Sound was not detected","symbol":"fa-times-circle"},{"text":"Sound was detected","symbol":"fa-check-circle"},{"text":"Sound was detected, but is doubted","symbol":"fa-question-circle"}]);
										content += 	`</td>
													<td class="col-xl-2 col-md-3 col-4 p-3 align-middle">`;
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
														content += tools.checkboxBuilder("Active",active,[{"text":"Active sound was not detected","symbol":"fa-times-circle"},{"text":"Active sound was detected","symbol":"fa-check-circle"},{"text":"Active sound was detected, but is doubted","symbol":"fa-question-circle"}]);
														content += tools.checkboxBuilder("Passive Feeding",feeding,[{"text":"Feeding passive sound was not detected","symbol":"fa-times-circle"},{"text":"Feeding passive sound was detected","symbol":"fa-check-circle"},{"text":"Feeding passive sound was detected, but is doubted","symbol":"fa-question-circle"}]);
														content += tools.checkboxBuilder("Other Passive",other,[{"text":"Other passive sound was not detected","symbol":"fa-times-circle"},{"text":"Other passive sound was detected","symbol":"fa-check-circle"},{"text":"Other passive sound was detected, but is doubted","symbol":"fa-question-circle"}]);
										content += `</td>
													<td class="col-xl-2 col-md-3 col-4 p-3 align-middle">`;
														content += tools.checkboxBuilder("Physiological",data.references[i].physiological,[{"text":"Physiological examination was not performed","symbol":"fa-times-circle"},{"text":"Physiological examination was performed","symbol":"fa-check-circle"},{"text":"Physiological examination was performed, but is doubted","symbol":"fa-question-circle"}]);
														content += tools.checkboxBuilder("Auditory",data.references[i].audio,[{"text":"Auditory examination was not performed","symbol":"fa-times-circle"},{"text":"Auditory examination was performed","symbol":"fa-check-circle"}]);
														content += tools.checkboxBuilder("Visual",data.references[i].visual,[{"text":"Visual examination was not performed","symbol":"fa-times-circle"},{"text":"Visual examination was performed","symbol":"fa-check-circle"}]);
										content += `</td>
												</tr>`;
								}
					
					content += `	</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>`;
	return content;
}

