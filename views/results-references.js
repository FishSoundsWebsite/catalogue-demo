var interfaceTools = require('./tools/interfaceBuilderFunctions.js');
var formTools = require('./tools/formBuilderFunctions.js');

//renders the results-references page (search form and results)
exports.display = async function(data){
	var content = `
		<div id="results-references" class="row gx-2 mt-lg-0 m-0 fullHeight">
			`;

	var fields = [
		{type:"hidden",name:"page",value:1,default:1},
		{type:"hidden",name:"sort",value:data.q.sort,default:"_id|-1"},
		{type:"text",name:"title",label:"Title Keyword",value:data.q.title,placeholder:"e.g. sound production",functions:[{trigger:"change",event:`matchForms(this.id,this.value)`},{trigger:"keyup",event:`parseFormKeyUp($(this),event,requestList(this,this.name,this.value,"reference"))`},{trigger:"focus",event:`closeAllLists()`}]},
		{type:"text",name:"authors",label:"Author Surname",value:data.q.authors,placeholder:"e.g. Mowbray",functions:[{trigger:"change",event:`matchForms(this.id,this.value)`},{trigger:"keyup",event:`parseFormKeyUp($(this),event,requestList(this,this.name,this.value,"reference"))`},{trigger:"focus",event:`closeAllLists()`}]},
		{type:"range",name:"year",label:"Publication Year",value:{"start":data.q.startyear,"end":data.q.endyear},functions:[{trigger:"change",event:`matchForms(this.id,this.value,"range")`}],other:[data.yearRange[0],data.yearRange[1],`function(event, ui){ matchForms("large-year-startInput",ui.values[0],"range"); matchForms("large-year-endInput",ui.values[1],"range"); }`]},
		{type:"select",name:"languages",label:"Reference Languages",value:data.q.languages,functions:[{trigger:"change",event:`matchForms(this.id,$(this).chosen().val(),"select")`}],other:{options:data.codelists.languages}},
		{type:"switch",name:"gray",label:"Gray Literature",value:data.q.gray,functions:[{trigger:"change",event:`matchForms(this.id,this.checked,"switch")`}],other:["Exclude","Include"]},
		"<div class='formBreak'></div>",
		{type:"text",name:"common",label:"Fish Common Name",value:data.q.common,placeholder:"e.g. Atlantic salmon",functions:[{trigger:"change",event:`matchForms(this.id,this.value)`},{trigger:"keyup",event:`parseFormKeyUp($(this),event,requestList(this,this.name,this.value,"fish"))`},{trigger:"focus",event:`closeAllLists()`}]},
		{type:"text",name:"genus__species",label:"Fish Scientific Name",value:data.q.genus__species,placeholder:"e.g. Salmo salar",functions:[{trigger:"change",event:`matchForms(this.id,this.value)`},{trigger:"keyup",event:`parseFormKeyUp($(this),event,requestList(this,this.name,this.value,"fish",0))`},{trigger:"focus",event:`closeAllLists()`}]},
		{type:"text",name:"family__subfamily",label:"Fish Family",value:data.q.family__subfamily,placeholder:"e.g. Salmonidae",functions:[{trigger:"change",event:`matchForms(this.id,this.value)`},{trigger:"keyup",event:`parseFormKeyUp($(this),event,requestList(this,this.name,this.value,"fish"))`},{trigger:"focus",event:`closeAllLists()`}]},
		{type:"text",name:"order__suborder",label:"Fish Order",value:data.q.order__suborder,placeholder:"e.g. Salmoniformes",functions:[{trigger:"change",event:`matchForms(this.id,this.value)`},{trigger:"keyup",event:`parseFormKeyUp($(this),event,requestList(this,this.name,this.value,"fish"))`},{trigger:"focus",event:`closeAllLists()`}]},
		{type:"text",name:"superclass__className",label:"Fish Class",value:data.q.superclass__className,placeholder:"e.g. Teleostei",functions:[{trigger:"change",event:`matchForms(this.id,this.value)`},{trigger:"keyup",event:`parseFormKeyUp($(this),event,requestList(this,this.name,this.value,"fish"))`},{trigger:"focus",event:`closeAllLists()`}]}
	];
	var largeForm = await formTools.buildSearchForm("large","./results-references.js",fields,{labelSize: 5, inputSize: 7, spacing: 2});
	var smallForm = await formTools.buildSearchForm("small","./results-references.js",fields,{labelSize: 3, inputSize: 8, spacing: 2});
	
	content += await interfaceTools.buildSideBar("reference",largeForm,smallForm);

	content += `<div id="searchResults" class="section col mx-auto mt-lg-0 mt-2 fullHeight">`;
			if(data.results && data.results.length > 0){
				var options = [
					{code: "_id|-1", label: "Last Added", definition: "Latest added to the system"},
					{code: "_id|1", label: "First Added", definition: "Earliest added to the system"},
					{code: "refLong|1", label: "First Author, A-Z", definition: "First author surname, A-Z"},
					{code: "refLong|-1", label: "First Author, Z-A", definition: "First author surname, Z-A"},
					{code: "title|1", label: "Title, A-Z", definition: "Reference title, A-Z"},
					{code: "title|-1", label: "Title, Z-A", definition: "Reference title, Z-A"},
					{code: "year|-1~refLong|1", label: "Recent Year", definition: "Year of publication, newest first"},
					{code: "year|1~refLong|1", label: "Oldest Year", definition: "Year of publication, oldest first"},
					{code: "fishCount|-1~refLong|1", label: "Species Count", definition: "Number of fish species examined, most to least"},
					{code: "recCount|-1~refLong|1", label: "Recording Count", definition: "Number of associated recordings, most to least"}
				];
				content += await interfaceTools.buildResultFrame("references",30,data,options,"Top");
				content += buildResultsTable(data.results);
				content += await interfaceTools.buildResultFrame("references",30,data,options,"Bottom");
			}else{
				content += `<img id="noResults" src="./public/missingImages/6_Search_not_found.png" alt="No results found">`;
			}
		content += `</div>
	</div>`;
	
	return content;
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