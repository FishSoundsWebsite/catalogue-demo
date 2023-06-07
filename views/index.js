var tools = require('./tools/interfaceBuilderFunctions.js');

//renders the index page
exports.display = function(data){
	var content = `
	<div id="index" class="row g-3 p-1">
		<div class="col-xl-8 col-12">
			<div id="welcome" class="section">
				<h2>Welcome!</h2>
				<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris eget purus pharetra, blandit sem vel, lacinia tellus. Nam commodo, orci in condimentum rhoncus, ex ex posuere sapien, sed aliquet dolor urna eget ante. Proin vel neque id erat rhoncus faucibus. Morbi sem lectus, fermentum vitae eleifend vel, dignissim vel nisi. In nisi lorem, placerat id viverra consequat, mattis et lacus. Suspendisse potenti. Curabitur congue quam sed lobortis porta.</p>
			</div>
		</div>
		<div id="indexBoxes" class="row gx-3 col-xl-4 col-12 p-3">
			<div class="col-xl-12 col-md-6 col-12">
				<div id="highlighted" class="section">
					<h3 class="center">Highlighted Species</h3>
					<a href='./fish.js?id=` + data.highlighted.publicId + `'>
						<p class="tight nowrap center"><i>` +  data.highlighted.scientific + `</i></p>`;
						if(data.highlighted.common){ content += `<p class="tight nowrap center">(` +  data.highlighted.common + `)</p>`; }
						if(data.highlighted.image){ 
							content += `<img src="./public/images/` + data.highlighted.image.filename + `" id="highlightedSpeciesImage" alt="image of ` + data.highlighted.scientific + `">
							<p class="citation center">` + data.highlighted.image.copyright + `</p>`; 
						}else{
							content += `<p>No image available</p>`;
						}
					content += `</a>
				</div>
			</div>
			<div class="col-xl-12 col-md-6 col-12">
				<div id="statistics" class="section">
					<h3 class="center">Website Statistics</h3>
					<div class="row"><div class="col-8 px-2"><p class="right tight nowrap">Number of Species Observed:</p></div><div class="col-4 px-2"><p class="tight nowrap">` + data.stats.obsCount + `</p></div></div>
					<div class="row"><div class="col-8 px-2"><p class="right tight nowrap">Number of Sound Recordings:</p></div><div class="col-4 px-2"><p class="tight nowrap">` + data.stats.recCount + `</p></div></div>
					<div class="row"><div class="col-8 px-2"><p class="right tight nowrap">Number of References:</p></div><div class="col-4 px-2"><p class="tight nowrap">` + data.stats.refCount + `</p></div></div>
					<br/>
					<div class="row"><div class="col-6 px-2"><p class="right tight nowrap">Last Data Update:</p></div><div class="col-6 px-2"><p class="tight nowrap">2021/09/30</p></div></div>
					<div class="row"><div class="col-6 px-2"><p class="right tight nowrap">Latest Fish Observed:</p></div><div class="col-6 px-2"><a href="./fish.js?id=` + data.stats.latestObs.publicId + `"><p class="tight nowrap"><i>` + data.stats.latestObs.scientific + `</i></p></a></div></div>
					<div class="row"><div class="col-6 px-2"><p class="right tight nowrap">Latest Recording:</p></div><div class="col-6 px-2"><a href="./recording.js?id=` + data.stats.latestRec[0].publicId + `"><p class="tight"><i>` + data.stats.latestRec[0].fish[0].scientific + `</i> - ` + tools.buildTextString(data.stats.latestRec[0].noises) + `</p></a></div></div>
				</div>
			</div>
		</div>
	</div>`;
	return content;
}