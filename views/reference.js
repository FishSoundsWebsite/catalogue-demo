var tools = require('./tools/interfaceBuilderFunctions.js');

//renders a single reference record page (citation information, related recordings, observation data fish-by-fish)
exports.display = function(data){
	var content = `<div id="reference" class="row g-2 p-3">
		<div class="col-12"><h2 class="center">` + data.reference.title + `</h2></div>
		<div id="noteBox" class="col-4 p-2 mx-3 my-0 collapse collapse-horizontal">
			<div class="row p-2">
				<div class="col ps-4"><h3 id="noteTitle" class="center">Descriptive Quotes</h3></div>
				<div class="col-2 mr-3"><button id="closeNotes" class="btn btn-sm btn-secondary p-0" data-bs-toggle="collapse" data-bs-target="#noteBox" aria-expanded="false" aria-controls="noteBox"><i class="fa fa-times-circle fa-2x"></i></button></div>
			</div>
			<div class="col-12 p-2" id="textHolder"></div>
		</div>
		<div class="sidebar col-lg-4 col-12 m-2">
			<div id="referenceCopyHolder" class="row">
				<input id="referenceText" type="text" value="` + data.reference.refLong + `"/>
				<p id="copyConfirmation" class="col-12 center">Copied!</p>
				<button class="btn btn-secondary col-5 mx-auto mb-2 nowrap" id="copy" onclick="copyToClipboard('referenceText')">Copy Reference</button>
			</div>`;
			content += referenceInfoBuilder(data.reference);
			if(data.recordings.length > 0){
				content += `<div class="row justify-content-center">
					<h4 class="col-12 center mt-4">Associated Recordings</h4>
					<form action="./recording.js" method="get" >
						<select id="recordingInput" class="col-12 p-0 mb-2" name="id">
							<option></option>`;
						for(var i = 0; i < data.recordings.length; i++){
							content += `<option value='` + data.recordings[i].publicId + `'>` + data.recordings[i].fish[0].title + ` - ` + tools.buildTextString(data.recordings[i].noises) + `</option>`;
						}
						content += `</select>
						<input type="submit" class="btn btn-md col-12" value="View">
					</form>
				</div>`;
	
				content += `<script type="text/javascript">
					$("#recordingInput").chosen({disable_search:true, width:"default", inherit_select_classes:true});
				</script>`;
					
			}
		content += `</div>
		
		<div class="section col-lg col-12 m-2">`;
			var display = "d-block";
			if(data.fish.length > 0){
				if(data.fish.length > 1){
					display = "d-none";
					content += fishSelectorBuilder(data.fish);
				}
				for(var i = 0; i < data.fish.length; i++){
					content += fishInfoBuilder(data.fish[i],display)
				}
			}else{
				content += `<p class="center mx-auto mt-5">No Details Available</p>`;
			}
		content += `</div>
	</div>`;
	return content;
}

//builds content for the reference box based on what info exists
function referenceInfoBuilder(data){
	var obj = {};
	
	if(data.authors){ obj["Authors"] = data.authors; }
	if(data.publication){ obj["Publication"] = data.publication; }
	if(data.other){ obj["Additional Info"] = data.other; }
	if(data.year){ obj["Year"] = data.year; }
	if(data.volume){ obj["Volume"] = data.volume; }
	if(data.issue){ obj["Issue"] = data.issue; }
	
	if(data.start && data.end){
		obj["Pages"] = data.start + "–" + data.end;
	}else if(data.start){
		obj["Electronic Location ID"] = data.start;
	}else if(data.end){
		obj["No. of Pages"] = data.end;
	}
	
	if(data.doi){ obj["DOI"] = data.doi; }
	if(data.issn){ obj["ISSN"] = data.issn; }
	if(data.language){ obj["Language"] = data.language; }
	
	var info = ``;
	
	for(item in obj){
		info += `<div class="row">
			<div class="col-lg-3 col-6 m-0 pr-2 right">` + item + `:</div>
			<div class="col-lg-9 col-6 m-0">`;
		if(Array.isArray(obj[item])){
			for(var i = 0; i < obj[item].length; i++){
				info += `<p class="tight">` + obj[item][i].last + `,`;
				for(var j = 0; j < obj[item][i].first.length; j++){
					info += ` ` + obj[item][i].first[j];
				}
				for(var j = 0; j < obj[item][i].middle.length; j++){
					info += ` ` + obj[item][i].middle[j];
				}
				info += `</p>`;
			}
		}else{
			info += `<p class="tight">` + obj[item] + `</p>`;
		}
		info += `</div>
			</div>`;	
	}

	return info;
}

//builds the select bar that controls which fish info is visible
function fishSelectorBuilder(fish){
	var select = `<div class="row mb-3">
		<div class="col-3 px-2"><p class="right tight">Select Fish:</p></div>
		<div class="col-6 px-2">
			<select class="select fullWidth" id="fishSpeciesSelector" onchange="displayFish(this.value)">
				<option></option>`;
				for(var i = 0; i < fish.length; i++){
					select += `<option value="` + fish[i].fish.publicId + `">` + fish[i].fish.title + `</option>`;
				}
			select += `</select>
		</div>
		<script type="text/javascript">
			$("#fishSpeciesSelector").chosen({disable_search_threshold:5});
		</script>
	</div>`;
	
	return select;
}

//builds a series of fish info cards for each species, but hides them all until called
function fishInfoBuilder(fish,display){
	var detection = !fish.detection ? 0 : !fish.detectionDoubt ? 1 : 2;
	
	var activeObj = false;
	var feedingObj = false;
	var otherObj = false;
	if(fish.sources){ 
		var activeObj = fish.sources.find(obj => { return obj.source == "Active"; });
		var feedingObj = fish.sources.find(obj => { return obj.source == "Passive Feeding"; });
		var otherObj = fish.sources.find(obj => { return obj.source == "Other Passive"; });
	}
	var active = !activeObj ? 0 : !activeObj.doubt ? 1 : 2;
	var feeding = !feedingObj ? 0 : !feedingObj.doubt ? 1 : 2;
	var other = !otherObj ? 0 : !otherObj.doubt ? 1 : 2;
	
	if(fish.behaviours){
		for(var i = 0; i < fish.behaviours.length; i++){
			fish.behaviours[i].label = fish.behaviours[i].behaviour;
			if(fish.behaviours[i].context){ fish.behaviours[i].label += " (" + fish.behaviours[i].context + ")"; }
		}
	}
	
	if(fish.noises){
		for(var i = 0; i < fish.noises.length; i++){
			fish.noises[i].label = fish.noises[i].noise;
			if(fish.noises[i].context){ fish.noises[i].label += " (" + fish.noises[i].context + ")"; }
		}
	}
	
	var descriptionSections = [
		{title: "Detection",fields:[
			{label:"Species Identified",detection:fish.speciesDoubt,values:[{"text":"Species was identified","symbol":"fa-check-circle"},{"text":"Species was identified, but is doubted","symbol":"fa-question-circle"}]},
			{label:"Sound Detected",detection:detection,values:[{"text":"Sound was not detected","symbol":"fa-times-circle"},{"text":"Sound was detected","symbol":"fa-check-circle"},{"text":"Sound was detected, but is doubted","symbol":"fa-question-circle"}]}
		]},
		{title: "Examination Types",fields:[
			{label:"Physiological",detection:fish.physiological,values:[{"text":"Physiological examination was not performed","symbol":"fa-times-circle"},{"text":"Physiological examination was performed","symbol":"fa-check-circle"},{"text":"Physiological examination was performed, but is doubted","symbol":"fa-question-circle"}]},
			{label:"Auditory",detection:fish.audio,values:[{"text":"Auditory examination was not performed","symbol":"fa-times-circle"},{"text":"Auditory examination was performed","symbol":"fa-check-circle"}]},
			{label:"Visual",detection:fish.visual,values:[{"text":"Visual examination was not performed","symbol":"fa-times-circle"},{"text":"Visual examination was performed","symbol":"fa-check-circle"}]}
		]},
		{title: "Sound Types Detected",fields:[
			{label:"Active",detection:active,values:[{"text":"Active sound was not detected","symbol":"fa-times-circle"},{"text":"Active sound was detected","symbol":"fa-check-circle"},{"text":"Active sound was detected, but is doubted","symbol":"fa-question-circle"}]},
			{label:"Passive Feeding",detection:feeding,values:[{"text":"Passive feeding sound was not detected","symbol":"fa-times-circle"},{"text":"Feeding passive sound was detected","symbol":"fa-check-circle"},{"text":"Feeding passive sound was detected, but is doubted","symbol":"fa-question-circle"}]},
			{label:"Other Passive",detection:other,values:[{"text":"Other passive sound was not detected","symbol":"fa-times-circle"},{"text":"Other passive sound was detected","symbol":"fa-check-circle"},{"text":"Other passive sound was detected, but is doubted","symbol":"fa-question-circle"}]}
		]},
	];
	
	var additionalSections = [
		{title: "Observation Environments",list: fish.environments,key: null},
		{title: "Behaviour Descriptions",list: fish.behaviours,key: "label"},
		{title: "Sound Names",list: fish.noises,key: "label"},
		{title: "Included Diagrams",list: fish.diagrams,key: null},
	];
	
	var info = `<div id="` + fish.fish.publicId + `" class="fishInfo ` + display + `">
		<div class="row">
			<div id="fishTitle" class="col-12"><a href="/fish.js?id=` + fish.fish.publicId + `"><h3 class="center">` + fish.fish.title + `</h3></a></div>
			<div id="requiredInfo" class="col row justify-content-center align-content-start">
				<h3 class="center">Description</h3>
				<div class="col-auto">`;
					for(var i = 0; i < descriptionSections.length; i++){
						info += `<div class="row my-2">
							<div class="col-auto referenceInfo">
								<p class="bold tight nowrap">` + descriptionSections[i].title + `</p>`;
								for(var j = 0; j < descriptionSections[i].fields.length; j++){
									info += tools.checkboxBuilder(descriptionSections[i].fields[j].label,descriptionSections[i].fields[j].detection,descriptionSections[i].fields[j].values,"indent");
								}
							info += `</div>
						</div>`;
					}
				info += `</div>
			</div>
			<div id="optionalInfo" class="col row justify-content-center align-content-start">
				<h3 class="center">Additional Details</h3>
				<div class="col-auto">`;
					if((!fish.behaviours || fish.behaviours.length == 0) && (!fish.environments || fish.environments.length == 0) && (!fish.noises || fish.noises.length == 0) && (!fish.diagrams || fish.diagrams.length == 0) && !fish.fullDesc){ info += `<p class="secondary center">No information available</p>`; }
				
					//Notes button
					if(fish.fullDesc || fish.environmentNotes || fish.behaviourNotes || fish.noiseNotes){
						var quotes = ``;
						var noteArray = {"Full Description":fish.fullDesc,"Observation Environment Quotes":fish.environmentNotes,"Behaviour Description Quotes":fish.behaviourNotes,"Sound Name Quotes":fish.noiseNotes};
						for(item in noteArray){
							if(noteArray[item]){
								quotes += `<div class="noteSection">`;
								quotes += `<p class="bold">` + item + `</p>` + "\n";
								quotes += noteCleaner(noteArray[item]);
								quotes += "\n" + `</div>`;
							}
						}

						info += `<div class="row my-2 center">
							<div class="col-auto">
								<div class="d-none noteContent">` + quotes + `</div>
								<button class="btn btn-sm" data-bs-toggle="collapse" data-bs-target="#noteBox" aria-expanded="false" aria-controls="noteBox" onclick="displayNotes(this)">View Descriptive Quotes</button>
							</div>
						</div>`;
					}
				
					for(var i = 0; i < additionalSections.length; i++){
						if(additionalSections[i].list && additionalSections[i].list.length > 0){
							info += `<div class="row justify-content-center my-2">
								<div class="referenceInfo">
									<p class="bold tight nowrap">` + additionalSections[i].title + `</p>`;
									info += tools.listBuilder(additionalSections[i].list,additionalSections[i].key,"indent");
								info += `</div>
							</div>`;
						}
					}
				info += `</div>
			</div>
		</div>
	</div>`;
	return info;
}

function noteCleaner(notes){
	var cleanNotes = notes.replace(/'<br\/>'/g,'"<br/>"').replace(/^'/,'"').replace(/'$/,'"').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0').replace(/\\"/g, '"').replace(/\\'/g, "'");
	var lines = cleanNotes.split("<br/>");
	var quoteBlock = ``;
	for(var i = 0; i < lines.length; i++){
		if(lines[i] && lines[i] != '"'){
			if(lines[i][0] != '"'){ lines[i] = '"' + lines[i]; }
			quoteBlock += `<p class="note">` + lines[i] + `</p>` + "\n";
		}
	}
	
	return quoteBlock;
}