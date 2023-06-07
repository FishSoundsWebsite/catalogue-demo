var tools = require('./tools/interfaceBuilderFunctions.js');

//renders a single recording record page (spectrogram/waveform image + metadata and measurements table)
exports.display = function(data){
	var content = `<div id="recording" class="row g-0">
		<div class="col-lg-6 col-12 m-0">`;
			if(data.recording.imageFile){
				content += `<img id="spectrogram" src="./public/recordings/images/` + data.recording.imageFile.toString() + `" alt="spectrogram of ` + data.recording.fish[0].scientific + ` making the sound ` + tools.buildTextString(data.recording.noises.sort()) + `">`;
			}else{
				content += `<img id="spectrogram" src="./public/missingImages/4_Boat_individual.jpg">`;
			}
			content += `<div class="row col-12 m-0 recording">`;
				if(data.recording.audioFile){
					var title = "Audio player";
					var recording = `<div class="my-1 mx-auto audioPlayer"><source src="./public/recordings/audios/` + data.recording.audioFile + `" type="audio/mpeg"></div>
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
				<div class="col-lg-4 col-6 my-1 center" title="` + title + `">
					<p class="center bold tight nowrap">Recording</p>` + recording + 	
				`</div>
				<div class="col-lg-8 col-6 my-1 fishInfo">
					<p class="center bold tight nowrap">Description</p>
					<p class="center tighter"><a href="./fish.js?id=` + data.recording.fish[0].publicId + `">` + data.recording.fish[0].title + `</a></p>
					<p class="center tighter">` + soundNameLabel + `: ` + tools.buildTextString(data.recording.noises.sort()) + `</p>`;
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

					content += `<div id="referenceCopyHolder" class="row">
						<input id="referenceText" type="text" value="` + combinedReferences + `"/>
						<button class="btn btn-secondary btn-sm col-xl-6 col-9 mx-auto mb-2 nowrap" id="copy" onclick="copyToClipboard('referenceText')">Copy Recording Citations</button>
						<p id="copyConfirmation" class="col-12 center recordingReferenceCopy">Copied!</p>
					</div>
				</div>
				<div class="col-6">
					<p class="center bold tight nowrap">Additional References</p>`;
					if(data.recording.additionalRefs && data.recording.additionalRefs.length > 0){
						for(var j = 0; j < data.recording.additionalRefs.length; j++){
							content += `<p class="center tighter"><a href="./reference.js?id=` + data.recording.additionalRefs[j].publicId + `">` + data.recording.additionalRefs[j].refShort + `</a></p>`;
						}
					}else{
						content += `<p class="center tighter secondary">None Available</p>`;
					}
				content += `</div>
			</div>	
			<div id="measurementHolder" class="col-12 mx-0 mt-lg-2 mt-5">
				<h4 class="center">Related Measurements</h4>
				<p class="center small blockPara d-xl-flex d-lg-none d-flex">These are sets of aggregate measurements which included either this specific recording or very similar recordings as part of the sample. Click between tabs (if present) to view measurements from different publications. Hover over underlined measurements to see additional notes or clarifications.</p>`;
				if(data.recording.measurements){
					content += `<div id="measurementCitationHolder" class="col-12">
						<div class="row g-0">`;
						var firstMeasurement = true;
						for(var i = 0; i < data.recording.measurements.length; i++){
							var active = firstMeasurement ? " active" : "";
							var size = data.recording.measurements.length > 3 ? " small" : "";
							var spacing = 8 * i;
							var zindex = 10 - i;
							content += `<div id="measurementCitation_` + i + `" class="col measurementCitation p-1 pt-2` + active + size + `" onclick="activateMeasurements(this)" style="right:` + spacing + `px; z-index:` + zindex +`">
								<p class="center m-auto">` + data.recording.measurements[i].citation.refShort + `</p>
							</div>`;
							firstMeasurement = false;
						}
						content += `</div>
					</div>
					<div id="measurementTableHolder" class="col-12 section">`;
						var firstMeasurement = true;
						for(var i = 0; i < data.recording.measurements.length; i++){
							var visible = firstMeasurement ? "d-block" : "d-none";
							content += `<div id="measurementTable_` + i + `" class="col m-auto center `+ visible +` measurementTable">
								<a href="./reference.js?id=` + data.recording.measurements[i].citation.publicId + `">Cite Measurements</a>
								<div class="col-12">
									<table class="m-auto">
										<tr>
											<th class="col p-2 nowrap">Measurement</th>
											<th class="col p-2 nowrap">Min.</th>
											<th class="col p-2 nowrap">Mean</th>
											<th class="col p-2 nowrap">Max.</th>
											<th class="col p-2 nowrap">Error</th>
											<th class="col p-2 nowrap">Error Type</th>
											<th class="col p-2 nowrap">n</th>
										</tr>`;
										for(var j = 0; j < data.recording.measurements[i].measurements.length; j++){
											content += `<tr>`;
											var fields = ["name","min","mean","max","errorValue","errorType","n"];
											for(item in fields){
												if(data.recording.measurements[i].measurements[j][fields[item]]){
													if(fields[item] == "name" && data.recording.measurements[i].measurements[j]["notes"]){
														content += `<td class="col p-2 wavy" title="` + data.recording.measurements[i].measurements[j]["notes"] + `">` + data.recording.measurements[i].measurements[j][fields[item]] + `</td>`;
													}else{
														content += `<td class="col p-2">` + data.recording.measurements[i].measurements[j][fields[item]] + `</td>`;
													}
												}else{
													content += `<td class="col p-2">---</td>`;
												}
											}
											content += `</tr>`;
										}
									content += `</table>
								</div>
							</div>`;
							firstMeasurement = false;
						}
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