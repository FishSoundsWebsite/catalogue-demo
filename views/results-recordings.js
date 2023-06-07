var tools = require('./tools/interfaceBuilderFunctions.js');

//renders the results-recordings page (search form and results)
exports.display = async function(data){
	var content = `<div id="results-recordings" class="row gx-2 mt-xl-0 m-0 fullHeight">`;
	var fields = [
			{type:"select",name:"noises",label:"Sound Names",value:data.q.noises,other:data.codelists.noise},
			{type:"text",name:"scientific",label:"Fish Scientific",value:data.q.scientific,schema:"recording",unknowns:true},
			{type:"text",name:"common",label:"Fish Common",value:data.q.common,schema:"recording"},
			{type:"select",name:"regions",label:"Fish Regions",value:data.q.regions,other:data.codelists.region},
			{type:"text",name:"authors",label:"Related Author",value:data.q.authors},
			{type:"switch",name:"image",label:"Must Have<br/>Spectrogram",value:data.q.image,other:["No","Yes"]},
			{type:"switch",name:"measurements",label:"Must Have<br/>Measurements",value:data.q.measurements,other:["No","Yes"]},
		];
	content += await tools.buildSearchForm("recording","./results-recordings.js",fields,{labelSize: 4, inputSize: 7, spacing: 2},{labelSize: 2, inputSize: 9, spacing: 2},"xl");
		

	content += `<div id="searchResults" class="section col mx-auto mt-xl-0 mt-2 fullHeight">`;
			if(data.results && data.results.length > 0){
				content += await buildResultFrame(data,"Top");
				content += tools.buildRecordingCards(data.results,"resultCard",true);
				content += await buildResultFrame(data,"Bottom");
			}else{
				content += `<p>No results found</p>`;
			}
		content += `</div>
	</div>`;
	
	return content;
}

async function buildResultFrame(data,location){
	frame = `<form class="recordingResultsPaginationForm row m-auto" action="./results-recordings.js" method="post">`;	
		for(item in data.q){
			if(data.q[item] && Array.isArray(data.q[item])){
				var value = data.q[item].join(";");
				frame += `<input type="hidden" name="` + item + `" value="` + value + `"/>`;
			}else if(data.q[item]){
				frame += `<input type="hidden" name="` + item + `" value="` + data.q[item] + `"/>`;
			}
		}
		
		var pageCount = Math.ceil(data.count/10);
		var pages = pageCount > 1 ? pageCount + " Pages" : pageCount + " Page";
		frame += `<div id="resultCount" class="col-3 p-1 hideOnShrink">
				<p class="center nowrap">` + data.count + ` Results Found (` + pages + `)</p>
			</div>`;
		
		frame += `<div id="pager" class="col-6 px-0">`;
		frame += await tools.buildPagination("recordingResultsPaginationForm","recordings",10,data.count,data.page);
		frame += `</div>`;
		
		var options = [
			{value:"_id|-1", label: "Last Added", definition: "Most recently added to the system"},
			{value:"_id|1", label: "First Added", definition: "Earliest added to the system"},
			{value: "noises|1", label: "Sound Name, A-Z", definition: "Sound name, A-Z"},
			{value: "noises|-1", label: "Sound Name, Z-A", definition: "Sound name, Z-A"},
			{value: "fish.scientific|1", label: "Fish, A-Z", definition: "Fish genus and species name, A-Z"},
			{value: "fish.scientific|-1", label: "Fish, Z-A", definition: "Fish genus and species name, Z-A"}
		];
		frame += `<div id="resultSort" class="col-3 px-1 stretchOnShrink">`;
		frame += await tools.buildResultOrdering(options,data.sort,location);
		frame += `</div>`;
		
	frame += `</form>`;
	
	return frame;
}


