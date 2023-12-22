var interfaceTools = require('./tools/interfaceBuilderFunctions.js');
var formTools = require('./tools/formBuilderFunctions.js');

//renders the results-recordings page (search form and results)
exports.display = async function(data){
	var content = `
		<div id="results-recordings" class="row gx-2 mt-xl-0 m-0 fullHeight">
			`;
		
		var fields = [
			{type:"hidden",name:"page",value:1,default:1},
			{type:"hidden",name:"sort",value:data.q.sort,default:"fish.genus|1~fish.species|1~fish.unknown|1"},
			{type:"select",name:"noises",label:"Sound Names",value:data.q.noises,functions:[{trigger:"change",event:`matchForms(this.id,$(this).chosen().val(),"select")`}],other:{options:data.codelists.noise}},
			{type:"switch",name:"image",label:"Require Spectrogram",value:data.q.image,functions:[{trigger:"change",event:`matchForms(this.id,this.checked,"switch")`}],other:["No","Yes"]},
			{type:"switch",name:"measurements",label:"Require Measurements",value:data.q.measurements,functions:[{trigger:"change",event:`matchForms(this.id,this.checked,"switch")`}],other:["No","Yes"]},
			"<div class='formBreak'></div>",
			{type:"text",name:"authors",label:"Related Author",value:data.q.authors,placeholder:"e.g. Mowbray",functions:[{trigger:"change",event:`matchForms(this.id,this.value)`},{trigger:"keyup",event:`parseFormKeyUp($(this),event,requestList(this,this.name,this.value,"reference"))`},{trigger:"focus",event:`closeAllLists()`}]},
			"<div class='formBreak'></div>",
			{type:"text",name:"common",label:"Fish Common Name",value:data.q.common,placeholder:"e.g. Atlantic salmon",functions:[{trigger:"change",event:`matchForms(this.id,this.value)`},{trigger:"keyup",event:`parseFormKeyUp($(this),event,requestList(this,"common",this.value,"fish"))`},{trigger:"focus",event:`closeAllLists()`}]},
			{type:"text",name:"genus__species",label:"Fish Scientific Name",value:data.q.genus__species,placeholder:"e.g. Salmo salar",functions:[{trigger:"change",event:`matchForms(this.id,this.value)`},{trigger:"keyup",event:`parseFormKeyUp($(this),event,requestList(this,this.name,this.value,"fish",0))`},{trigger:"focus",event:`closeAllLists()`}]},
			{type:"text",name:"family__subfamily",label:"Fish Family",value:data.q.family__subfamily,placeholder:"e.g. Salmonidae",functions:[{trigger:"change",event:`matchForms(this.id,this.value)`},{trigger:"keyup",event:`parseFormKeyUp($(this),event,,requestList(this,this.name,this.value,"fish"))`},{trigger:"focus",event:`closeAllLists()`}]},
			{type:"text",name:"order__suborder",label:"Fish Order",value:data.q.order__suborder,placeholder:"e.g. Salmoniformes",functions:[{trigger:"change",event:`matchForms(this.id,this.value)`},{trigger:"keyup",event:`parseFormKeyUp($(this),event,,requestList(this,this.name,this.value,"fish"))`},{trigger:"focus",event:`closeAllLists()`}]},
			{type:"text",name:"superclass__className",label:"Fish Class",value:data.q.superclass__className,placeholder:"e.g. Teleostei",functions:[{trigger:"change",event:`matchForms(this.id,this.value)`},{trigger:"keyup",event:`parseFormKeyUp($(this),event,,requestList(this,this.name,this.value,"fish"))`},{trigger:"focus",event:`closeAllLists()`}]},
			{type:"select",name:"regions",label:"Fish Regions",value:data.q.regions,functions:[{trigger:"change",event:`matchForms(this.id,$(this).chosen().val(),"select")`}],other:{options:data.codelists.region,dropUp:true}},
		];
		var largeForm = await formTools.buildSearchForm("large","./results-recordings.js",fields,{labelSize: 5, inputSize: 7, spacing: 2});
		var smallForm = await formTools.buildSearchForm("small","./results-recordings.js",fields,{labelSize: 4, inputSize: 7, spacing: 2});
		
		content += await interfaceTools.buildSideBar("recording",largeForm,smallForm,"lg");		
			
		content += `
		<div id="searchResults" class="section col mx-2 mt-xl-0 mt-2 fullHeight">`;
			var options = [
				{code: "fish.genus|1~fish.species|1~fish.unknown|1", label: "Fish, A-Z", definition: "Fish genus and species name, A-Z"},
				{code: "fish.genus|-1~fish.species|-1~fish.unknown|-1", label: "Fish, Z-A", definition: "Fish genus and species name, Z-A"},
				{code: "noises|1", label: "Sound Name, A-Z", definition: "Sound name, A-Z"},
				{code: "noises|-1", label: "Sound Name, Z-A", definition: "Sound name, Z-A"},
				{code:"_id|-1", label: "Last Added", definition: "Latest added to the system"},
				{code:"_id|1", label: "First Added", definition: "Earliest added to the system"}
			];
			if(data.results && data.results.length > 0){
				content += await interfaceTools.buildResultFrame("recordings",10,data,options,"Top");
				content += await interfaceTools.buildRecordingCards(data.results,"resultCard",true);
				content += await interfaceTools.buildResultFrame("recordings",10,data,options,"Bottom");
			}else{
				content += `<img id="noResults" src="./public/missingImages/6_Search_not_found.png" alt="No results found">`;
			}
		content += `</div>
	</div>`;
	
	return content;
}


