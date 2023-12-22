var interfaceTools = require('./tools/interfaceBuilderFunctions.js');
var formTools = require('./tools/formBuilderFunctions.js');
var colormap = require('colormap');
var noteCheck = false;

//renders a single recording record page (spectrogram/waveform image + metadata and measurements table)
exports.display = async function(data){
	var content = `<div id="recording" class="row g-2">
		<div class="col-lg-6 col-12 m-0">`;
			if(data.recording.imageFile){ content += `<div class="d-flex justify-content-center"><img id="staticImage" class="mt-2 mb-4" src="./public/recordings/images/` + data.recording.imageFile.toString() + `" alt="spectrogram of ` + data.recording.fish.genus + ` ` + data.recording.fish.species + ` making the sound ` + interfaceTools.buildTextString(data.recording.noises.sort()) + `"></div>`; }
			if(!data.recording.imageFile){ content += `<div class="d-flex justify-content-center"><img class="missingRecordingImage" src="./public/missingImages/4_Boat_individual.png" alt="No image available"></div>`; }
			content += `<div class="row col-12 m-0 recording">`;
				if(data.recording.audioFile){
					var title = "Audio player";
					var af = data.recording.audioFile.split(".");
					var recording = `<div class="my-1 mx-auto audioPlayer">
							<source src="./public/recordings/audios/` + af[0] + `.mp3" type="audio/mpeg">
							<source src="./public/recordings/audios/` + af[0] + `.wav" type="audio/wav">
						</div>
						<a href="./public/recordings/audios/` + data.recording.audioFile + `" download>Download File</a>`;
				}else if(data.recording.link){
					var title = "External audio link";
					var recording = `<a href="` + data.recording.link + `" target="_blank"><i class="ml-2 fas fa-3x fa-external-link-alt" aria-hidden="true"></i></a>`;
				}else{
					var title = "No audio available";
					var recording = `<i class="ml-2 fa fa-3x fa-times-circle-o secondary" aria-hidden="true"></i>`;
				}
				var soundNameLabel = data.recording.noises.length > 1 ? "Sound Names" : "Sound Name";
				content += `
				<div class="col-lg-5 col-6 my-1 center" title="` + title + `">
					<p class="center bold tight nowrap">Recording</p>` + recording + 	
				`</div>
				<div class="col-lg-7 col-6 my-1 fishInfo">
					<p class="center bold tight nowrap">Description</p>
					<p class="center tighter"><a href="./fish.js?id=` + data.recording.fish.publicId + `">` + data.recording.fish.title + `</a></p>
					<p class="center tighter">` + soundNameLabel + `: ` + interfaceTools.buildTextString(data.recording.noises.sort()) + `</p>`;
					if(data.recording.notes){ content += `<p class="center tighter small">Notes: ` + data.recording.notes + `</p>`; }
				content += `</div>
			</div>
		</div>
		<div class="col-lg col-12 mx-0 my-lg-0 my-3">
			<div class="row my-2 refInfo">
				<div class="col-6">
					<p class="center bold tight nowrap">Citable References</p>`;
					var combinedReferences = '';
					for(var j = 0; j < data.recording.citations.length; j++){
						content += `<p class="center tighter"><a href="./reference.js?id=` + data.recording.citations[j].publicId + `">` + data.recording.citations[j].refShort + `</a></p>`;
						combinedReferences += data.recording.citations[j].refLong.slice(0,-1)
						combinedReferences += j == data.recording.citations.length - 1 ? "." : "; ";
					}

					content += `<div id="referenceCopyHolder" class="row g-0">
						<input id="referenceText" type="text" value="` + combinedReferences + `"/>
						<button class="btn btn-secondary btn-sm col-auto mx-auto mb-2 nowrap" id="copy" onclick="copyToClipboard('referenceText')">Copy Recording Citations</button>
						<p id="copyConfirmation" class="col-12 center recordingReferenceCopy">Copied!</p>
					</div>
				</div>
				<div class="col-6">
					<p class="center bold tight nowrap">Additional References</p>`;
					if(data.recording.additionalRefs && data.recording.additionalRefs.length > 4){
						for(var j = 0; j < 3; j++){
							content += `<p class="center tighter"><a href="./reference.js?id=` + data.recording.additionalRefs[j].publicId + `">` + data.recording.additionalRefs[j].refShort + `</a></p>`;
						}
						for(var j = 4; j < data.recording.additionalRefs.length; j++){
							content += `<p class="center tighter hiddenListItem"><a href="./reference.js?id=` + data.recording.additionalRefs[j].publicId + `">` + data.recording.additionalRefs[j].refShort + `</a></p>`;
						}
						content += `<p class="center tighter" onclick="$('.hiddenListItem').toggle()"><i id="ellipsis" class="fas fa-ellipsis-h" title="Click to expand/collapse list"></i></p>`;
					}else if(data.recording.additionalRefs && data.recording.additionalRefs.length > 0){
						for(var j = 0; j < data.recording.additionalRefs.length; j++){
							content += `<p class="center tighter"><a href="./reference.js?id=` + data.recording.additionalRefs[j].publicId + `">` + data.recording.additionalRefs[j].refShort + `</a></p>`;
						}
					}else{
						content += `<p class="center tighter secondary">None Available</p>`;
					}
				content += `</div>
			</div>	
			<div id="measurementHolder" class="col-12 mx-0 mt-lg-2 mt-5">
				<h4 class="center">Related Measurements</h4>`;
				if(data.recording.measurements && data.recording.measurements.length > 0 && Object.keys(data.recording.measurements[0]).length > 0){
					var table = buildMeasurementTable(data);
					
					content += `<p class="center small tight d-xl-block d-lg-none d-block px-2">These are aggregate measurements which included either this specific recording or very similar recordings as part of the sample.</p>`;
					if(data.recording.measurements.length > 1){ content += `<p class="center small tight blockPara d-xl-block d-lg-none d-block px-2">Click between tabs to view measurements from different publications.</p>`; }
					if(noteCheck){ content += `<p class="center small tight blockPara d-xl-block d-lg-none d-block px-2">Click the information icons next to some measurements to see additional notes or clarifications.</p>`; }
					content += `<div id="measurementCitationHolder" class="col-12">
						<div class="row g-0">`;
						var firstMeasurement = true;
						for(var i = 0; i < data.recording.measurements.length; i++){
							var active = firstMeasurement ? " active" : "";
							var size = data.recording.measurements.length > 3 ? " small" : "";
							var spacing = 8 * i;
							var zindex = 10 - i;
							content += `<div id="measurementCitation-` + i + `" class="col measurementCitation p-1 pt-2` + active + size + `" onclick="displayMeasurements(this)" style="right:` + spacing + `px; z-index:` + zindex +`">
								<p class="center m-auto">` + data.recording.measurements[i].citation.refShort + `</p>
							</div>`;
							firstMeasurement = false;
						}
						content += `</div>
					</div>
					<div id="measurementTableHolder" class="col-12 section py-1">
						<div id="loader" class="loader hidden mt-2 mx-auto"><img src="./public/Loading.gif" class="loadingGif"></div>`;
					content += table;	
					content += `</div>`;
				}else{
					content += `<p class="center mx-auto mt-5">No Measurements Available</p>`;
				}
			content += `</div>
		</div>
	</div>
	<script>
		$('.audioPlayer').each(function(i){
			var src = $(this).find("source");
			$(this).CirclePlayer(src.attr("src"));
		});
	</script>`;
	return content;
}

function buildMeasurementTable(data){
	content = ``;
	for(var i = 0; i < data.recording.measurements.length; i++){
		var visible = i == 0 ? "visible" : "hidden";
		content += `<div id="measurementData-` + i + `" class="measurementDataToggler col m-auto center `+ visible +`">
			<a href="./reference.js?id=` + data.recording.measurements[i].citation.publicId + `" class="d-block">Cite Measurements</a>`;
		
			var table = {
				id:"measurements-" + i,
				style:" unsetHeightOnShrink",
				data:{
					headings:[
						{id:"name",label:"Measurement",size:"col"},
						{id:"min",label:"Min.",size:"col-1"},
						{id:"mean",label:"Mean",size:"col-1"},
						{id:"max",label:"Max.",size:"col-1"},
						{id:"error",label:"Error",size:"col-1"},
						{id:"errortype",label:"Error Type",size:"col-1 nowrap"},
						{id:"n",label:"n",size:"col-1"}
					],
					rows:[]
				}
			}
		
			var notes = false;

			for(var j = 0; j < data.recording.measurements[i].measurements.length; j++){
				var name = data.recording.measurements[i].measurements[j].name ? data.recording.measurements[i].measurements[j].name : "---";
				var min = data.recording.measurements[i].measurements[j].min ? data.recording.measurements[i].measurements[j].min : "---";
				var mean = data.recording.measurements[i].measurements[j].mean ? data.recording.measurements[i].measurements[j].mean : "---";
				var max = data.recording.measurements[i].measurements[j].max ? data.recording.measurements[i].measurements[j].max : "---";
				var errorValue = data.recording.measurements[i].measurements[j].errorValue ? data.recording.measurements[i].measurements[j].errorValue : "---";
				var errorType = data.recording.measurements[i].measurements[j].errorType ? data.recording.measurements[i].measurements[j].errorType : "---";
				var n = data.recording.measurements[i].measurements[j].n ? data.recording.measurements[i].measurements[j].n : "---";
			
				var row = [];
				row.push({id:"name",value:name,size:"col"});
				row.push({id:"min",value:min,size:"col-1"});
				row.push({id:"mean",value:mean,size:"col-1"});
				row.push({id:"max",value:max,size:"col-1"});
				row.push({id:"errorValue",value:errorValue,size:"col-1"});
				row.push({id:"errorType",value:errorType,size:"col-1"});
				row.push({id:"n",value:n,size:"col-1"});
			
				if(data.recording.measurements[i].measurements[j].notes){
					noteCheck = true;
					row[0].note = data.recording.measurements[i].measurements[j].notes;
					notes = true;
				}
			
				table.data.rows.push(row);
			}

			content += interfaceTools.buildDataList(table,"col m-0 p-0","175px",notes = notes,search = false,edit = false);

		content += `</div>`;
	}
	return content;
}