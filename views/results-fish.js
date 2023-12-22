var interfaceTools = require('./tools/interfaceBuilderFunctions.js');
var formTools = require('./tools/formBuilderFunctions.js');

//renders the results-fish page (search form and results)
exports.display = async function(data){
	var content = `
		<div id="results-fish" class="row gx-2 mt-lg-0 m-0 fullHeight">
			`;
	
	var fields = [
		{type:"hidden",name:"page",value:1,default:1},
		{type:"hidden",name:"sort",value:data.q.sort,default:"genus__species|1"},
		{type:"text",name:"common",label:"Common Name",value:data.q.common,placeholder:"e.g. Atlantic salmon",functions:[{trigger:"change",event:`matchForms(this.id,this.value)`},{trigger:"keyup",event:`parseFormKeyUp($(this),event,requestList(this,this.name,this.value,"fish"))`},{trigger:"focus",event:`closeAllLists()`}]},
		{type:"text",name:"genus__species",label:"Scientific Name",value:data.q["genus__species"],placeholder:"e.g. Salmo salar",functions:[{trigger:"change",event:`matchForms(this.id,this.value)`},{trigger:"keyup",event:`parseFormKeyUp($(this),event,requestList(this,this.name,this.value,"fish",0))`},{trigger:"focus",event:`closeAllLists()`}]},
		{type:"text",name:"family__subfamily",label:"Fish Family",value:data.q["family__subfamily"],placeholder:"e.g. Salmonidae",functions:[{trigger:"change",event:`matchForms(this.id,this.value)`},{trigger:"keyup",event:`parseFormKeyUp($(this),event,requestList(this,this.name,this.value,"fish"))`},{trigger:"focus",event:`closeAllLists()`}]},
		{type:"text",name:"order__suborder",label:"Fish Order",value:data.q["order__suborder"],placeholder:"e.g. Salmoniformes",functions:[{trigger:"change",event:`matchForms(this.id,this.value)`},{trigger:"keyup",event:`parseFormKeyUp($(this),event,requestList(this,this.name,this.value,"fish"))`},{trigger:"focus",event:`closeAllLists()`}]},
		{type:"text",name:"superclass__className",label:"Fish Class",value:data.q["superclass__className"],placeholder:"e.g. Teleostei",functions:[{trigger:"change",event:`matchForms(this.id,this.value)`},{trigger:"keyup",event:`parseFormKeyUp($(this),event,requestList(this,this.name,this.value,"fish"))`},{trigger:"focus",event:`closeAllLists()`}]},
		"<div class='formBreak'></div>",
		{type:"select",name:"sources",label:"Sound Types Made",value:data.q.sources,functions:[{trigger:"change",event:`matchForms(this.id,$(this).chosen().val(),"select")`}],other:{options:data.codelists.source}},
		{type:"switch",name:"recordings",label:"Require Recordings",value:data.q.recordings,functions:[{trigger:"change",event:`matchForms(this.id,this.checked,"switch")`}],other:["No","Yes"]},
		{type:"select",name:"regions",label:"Regions Found",value:data.q.regions,functions:[{trigger:"change",event:`matchForms(this.id,$(this).chosen().val(),"select")`}],other:{options:data.codelists.region}},
		{type:"select",name:"climates",label:"Climates Found",value:data.q.climates,functions:[{trigger:"change",event:`matchForms(this.id,$(this).chosen().val(),"select")`}],other:{options:data.codelists.climate,dropUp:true}},
		{type:"select",name:"waters",label:"Water Types",value:data.q.waters,functions:[{trigger:"change",event:`matchForms(this.id,$(this).chosen().val(),"select")`}],other:{options:data.codelists.water,dropUp:true}},
	];
	var largeForm = await formTools.buildSearchForm("large","./results-fish.js",fields,{labelSize: 4, inputSize: 8, spacing: 2});
	var smallForm = await formTools.buildSearchForm("small","./results-fish.js",fields,{labelSize: 3, inputSize: 8, spacing: 2});
	
	content += await interfaceTools.buildSideBar("fish",largeForm,smallForm);
	
	content += `<div id="searchResults" class="section col mx-2 mt-lg-0 mt-2 fullHeight">`;
			if(data.results && data.results.length > 0){
				var options = [
					{code: "genus__species|1", label: "Scientific, A-Z", definition: "Fish scientific name, A-Z"},
					{code: "genus__species|-1", label: "Scientific, Z-A", definition: "Fish scientific name, Z-A"},
					{code: "refCount|-1", label: "Reference Count", definition: "Number of references, most to least"},
					{code: "recCount|-1", label: "Recording Count", definition: "Number of recordings, most to least"},
					{code: "order|1", label: "Order, A-Z", definition: "Fish order name, A-Z"},
					{code: "order|-1", label: "Order, Z-A", definition: "Fish order name, Z-A"},
					{code: "family|1", label: "Family, A-Z", definition: "Fish family name, A-Z"},
					{code: "family|-1", label: "Family, Z-A", definition: "Fish family name, Z-A"},
		
				];
				content += await interfaceTools.buildResultFrame("fish",30,data,options,"Top");
				content += buildResultsTable(data.results);
				content += await interfaceTools.buildResultFrame("fish",30,data,options,"Bottom");
			}else{
				content += `<img id="noResults" src="./public/missingImages/6_Search_not_found.png" alt="No results found">`;
			}
		content += `</div>
	</div>`;
	
	return content;
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
						<p class="cardInfo">Climates: ` + interfaceTools.buildTextString(results[i].climates.sort()) + `</p>
						<p class="cardInfo">Waters: ` + interfaceTools.buildTextString(results[i].waters.sort()) + `</p>
					</div>
				</div>
			</a>`;
	}
	return cards;
}
