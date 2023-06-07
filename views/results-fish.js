var tools = require('./tools/interfaceBuilderFunctions.js');

//renders the results-fish page (search form and results)
exports.display = async function(data){
	var content = `<div id="results-fish" class="row gx-2 mt-lg-0 m-0 fullHeight">`;
	var fields = [
		{type:"text",name:"className",label:"Class",value:data.q.className,schema:"fish"},
		{type:"text",name:"order",label:"Order",value:data.q.order,schema:"fish"},
		{type:"text",name:"family",label:"Family",value:data.q.family,schema:"fish"},
		{type:"text",name:"scientific",label:"Scientific",value:data.q.scientific,schema:"fish"},
		{type:"text",name:"common",label:"Common",value:data.q.common,schema:"fish"},
		`<div class="col-12 mb-4 center"><button class="btn btn-secondary btn-sm m-auto" type="button" onclick="clearTaxonomy()">Clear Taxonomy</button></div>`,
		{type:"select",name:"regions",label:"Regions",value:data.q.regions,other:data.codelists.region},
		{type:"select",name:"climates",label:"Climates",value:data.q.climates,other:data.codelists.climate},
		{type:"select",name:"waters",label:"Waters",value:data.q.waters,other:data.codelists.water},
		{type:"select",name:"sources",label:"Sounds",value:data.q.sources,other:data.codelists.source}
	];
	content += await tools.buildSearchForm("fish","./results-fish.js",fields,{labelSize: 3, inputSize: 8, spacing: 2},{labelSize: 2, inputSize: 9, spacing: 2});
	
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
	frame = `<form class="fishResultsPaginationForm row m-auto" action="./results-fish.js" method="post">`;	
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
		frame += await tools.buildPagination("fishResultsPaginationForm","fish",30,data.count,data.page);
		frame += `</div>`;
	
		var options = [
			{value: "scientific|1", label: "Scientific, A-Z", definition: "Fish scientific name, A-Z"},
			{value: "scientific|-1", label: "Scientific, Z-A", definition: "Fish scientific name, Z-A"},
			{value:"refCount|-1", label: "Reference Count", definition: "Number of references, most to least"},
			{value:"recCount|-1", label: "Recording Count", definition: "Number of recordings, most to least"},
			{value:"order|1", label: "Order, A-Z", definition: "Fish order name, A-Z"},
			{value:"order|-1", label: "Order, Z-A", definition: "Fish order name, Z-A"},
			{value:"family|1", label: "Family, A-Z", definition: "Fish family name, A-Z"},
			{value:"family|-1", label: "Family, Z-A", definition: "Fish family name, Z-A"},
		
		];
		frame += `<div id="resultSort" class="col-3 px-1 stretchOnShrink">`;
		frame += await tools.buildResultOrdering(options,data.sort,location);
		frame += `</div>`;
	
	frame += `</form>`;
	
	return frame;
}

function buildResultsTable(results){
	var cards = '';
	for(var i = 0; i < results.length; i++){
		cards += `<a href="./fish.js?id=` + results[i].publicId + `" class="nude">
				<div class="resultCard row mb-2 p-2">
					<div class="col-12"><p class="cardTitle">` + results[i].title + `</p></div>
					<div class="col-3 stretchOnShrink taxonomyInfo">
						<p class="cardInfo">Order ` + results[i].order + `</p>
						<p class="cardInfo">Family ` + results[i].family + `</p>
					</div>
					<div class="col-3 stretchOnShrink observationInfo">`;
						var refText = results[i].refCount == 1 ? results[i].refCount + " Reference" : results[i].refCount + " References";
						var recText = results[i].recCount == 1 ? results[i].recCount + " Recording" : results[i].recCount + " Recordings";
			
						cards += `<p class="cardInfo">` + refText + `</p>
						<p class="cardInfo">` + recText + `</p>
					</div>
					<div class="col-6 hideOnShrink environmentInfo">
						<p class="cardInfo">Climates: ` + tools.buildTextString(results[i].climates) + `</p>
						<p class="cardInfo">Waters: ` + tools.buildTextString(results[i].waters) + `</p>
					</div>
				</div>
			</a>`;
	}
	return cards;
}
