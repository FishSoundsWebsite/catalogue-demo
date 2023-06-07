var tools = require('./tools/interfaceBuilderFunctions.js');

//renders the results-references page (search form and results)
exports.display = async function(data){
	var content = `<div id="results-references" class="row gx-2 mt-lg-0 m-0 fullHeight">`;
	var fields = [
			{type:"text",name:"title",label:"Title",value:data.q.title},
			{type:"text",name:"authors",label:"Author",value:data.q.authors},
			{type:"range",name:"year",label:"Year of Publication",value:{"start":data.q.startyear,"end":data.q.endyear},other:data.yearRange},
			{type:"select",name:"languages",label:"Languages",value:data.q.languages,other:data.codelists.languages},
			{type:"switch",name:"gray",label:"Gray Literature",value:data.q.gray,other:["Exclude","Include"]},
			{type:"text",name:"scientific",label:"Fish Species",value:data.q.scientific},
		];
	content += await tools.buildSearchForm("reference","./results-references.js",fields,{labelSize: 4, inputSize: 7, spacing: 2},{labelSize: 2, inputSize: 9, spacing: 2});
		
	content += `<div id="searchResults" class="section col mx-auto mt-lg-0 mt-2 fullHeight">`;
			if(data.results && data.results.length > 0){
				content += await buildResultFrame(data,"Top");
				content += buildResultsTable(data.results);
				content += await buildResultFrame(data,"Bottom");
			}else{
				content += `<p>No results found</p>`;
			}
		content += `</div>
	</div>`;
	
	return content;
}

async function buildResultFrame(data,location){
	frame = `<form class="referenceResultsPaginationForm row m-auto" action="./results-references.js" method="post">`;	
		for(item in data.q){
			if(data.q[item] && Array.isArray(data.q[item])){
				var value = data.q[item].join(";");
				frame += `<input type="hidden" name="` + item + `" value="` + value + `"/>`;
			}else if(data.q[item]){
				frame += `<input type="hidden" name="` + item + `" value="` + data.q[item] + `"/>`;
			}
		}
		
		var pageCount = Math.ceil(data.count/30);
		var pages = pageCount > 1 ? pageCount + " Pages" : pageCount + " Page";
		frame += `<div id="resultCount" class="col-3 p-1 hideOnShrink">
				<p class="center nowrap">` + data.count + ` Results Found (` + pages + `)</p>
			</div>`;
		
		frame += `<div id="pager" class="col-6 px-0">`;
		frame += await tools.buildPagination("referenceResultsPaginationForm","references",30,data.count,data.page);
		frame += `</div>`;
		
		var options = [
			{value:"_id|-1", label: "Last Added", definition: "Most recently added to the system"},
			{value:"_id|1", label: "First Added", definition: "Earliest added to the system"},
			{value: "refLong|1", label: "First Author, A-Z", definition: "First author surname, A-Z"},
			{value: "refLong|-1", label: "First Author, Z-A", definition: "First author surname, Z-A"},
			{value: "title|1", label: "Title, A-Z", definition: "Reference title, A-Z"},
			{value: "title|-1", label: "Title, Z-A", definition: "Reference title, Z-A"},
			{value:"year|-1", label: "Recent Year", definition: "Year of publication, newest first"},
			{value:"year|1", label: "Oldest Year", definition: "Year of publication, oldest first"},
			{value:"fishCount|-1", label: "Species Count", definition: "Number of fish species examined, most to least"},
			{value:"recCount|-1", label: "Recording Count", definition: "Number of associated recordings, most to least"}
		];
		frame += `<div id="resultSort" class="col-3 px-1 stretchOnShrink">`;
		frame += await tools.buildResultOrdering(options,data.sort,location);
		frame += `</div>`;
		
	frame += `</form>`;
	
	return frame;
}

function buildResultsTable(results){
	var cards = `<div class="row mb-2 p-2">
			<div class="col-7"><h4>Reference</h4></div>
			<div class="col-5"><h4>Details</h4></div>
		</div>`;
	for(var i = 0; i < results.length; i++){
		cards += `<a href="./reference.js?id=` + results[i].publicId + `" class="nude">
				<div class="resultCard row mb-2 p-2">
					<div class="col-7"><p class="d-xl-inline d-none">` + results[i].refLong + `</p><p class="cardInfo d-xl-none d-inline">` + results[i].refShort + `</p></div>
					<div class="col-5 details">
						<p class="cardInfo">` + results[i].fish.length + ` Species Examined</p>`;
						if(results[i].fish.length < 5){
							results[i].fish = results[i].fish.sort();
							for(var j = 0; j < results[i].fish.length; j++){
								cards += `<p class="cardInfo indent d-md-block d-none">` + results[i].fish[j] + `</p>`;
							}
						}
						if(results[i].recordings.length > 0){
							var recText = results[i].recordings.length > 1 ? results[i].recordings.length + " Associated Recordings" : results[i].recordings.length + " Associated Recording";
							cards += `<p class="cardInfo">` +  recText + `</p>`;
						}
						
				cards += `</div>
				</div>
			</a>`;
	}
	return cards;
}