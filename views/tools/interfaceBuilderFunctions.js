/*** Search Form Builders ***/

// builds a responsive search box (large screens: on left, left-right collapsible; small screens: on top, top-bottom collapsible
	// pageId = data type of the search page (e.g. "fish", "reference", "recording")
	// route = URL route for search page (e.g. "./results-recordings.js")
	// fields = array of object representing the form inputs to be built; object parameters differ by input type (see buildInput function below)
	// largeMeasures = object declaring various sizes for large screens: {labelSize: x, inputSize: y, spacing: z}
	// smallMeasures = object declaring various sizes for small screens: {labelSize: x, inputSize: y, spacing: z}
	// cutoffSize = the bootstrap screen size at which the division between large and small screen layout should be made; defaults to lg if unspecified; lg and xl sizes have been tested
// called by the results-fish.js, results-references.js, and results-recordings.js views
exports.buildSearchForm = async function(pageId,route,fields,largeMeasures,smallMeasures,cutoffSize = "lg"){		
	form = `<div id="largeScreen" class="col-auto d-` + cutoffSize + `-flex d-none">
			<div id="` + pageId + `SearchFormPanel" class="sidebar row ps-5 mx-2 my-0">
				<div id="collapsibleSidebar" class="collapse collapse-horizontal show col-11 m-0 p-0">
					<h3 id="expandedSideBarLabel" class="center">Filter Results</h3>
					<form action="` + route + `" method="post" class="col-12 p-0 m-auto" autocomplete="off">`;
					for(var i = 0; i < fields.length; i++){
						if(typeof(fields[i]) == "object"){
							form += await this.buildInput(fields[i],largeMeasures);
						}else{
							form += fields[i];
						}
					}
						
					form += `<div class="row mt-4 mb-0">
							<div class="col-6 m-0 center"><a href="` + route + `"><input type="button" class="btn btn-md" value="View All"></a></div>
							<div class="col-6 m-0 center"><input type="submit" class="btn btn-md" value="Search"></div>
						</div>
					</form>
				</div>
				<div id="` + pageId + `SearchFormToggler" class="sidebar-toggler col-1 m-0 p-0">
					<div id="iconHolder" class="row fullHeight">
						<h3 id="collapsedSideBarLabel" class="col-12 algin-self-top p-0 rotate">Filter Results</h3>
						<div id="openSideBar" class="col-12 align-self-center m-0 p-0" data-bs-toggle="collapse" data-bs-target="#collapsibleSidebar" aria-controls="collapsibleSidebar" aria-expanded="true" aria-label="Toggle search bar" onclick="openSideBar()"><i class="fa fa-caret-right fa-2x"></i></div>
						<div id="closeSideBar" class="col-12 align-self-center m-0 p-0" data-bs-toggle="collapse" data-bs-target="#collapsibleSidebar" aria-controls="collapsibleSidebar" aria-expanded="true" aria-label="Toggle search bar" onclick="closeSideBar()"><i class="fa fa-caret-left fa-2x"></i></div>
					</div>
				</div>
			</div>
		</div>
		<div id="smallScreen" class="row fullWidth d-` + cutoffSize + `-none d-flex m-0">
			<div id="` + pageId + `SearchFormPanelSmall" class="sidebar col-12 me-1 p-0">
				<button class="navbar-toggler fullWidth secondary" type="button" data-bs-toggle="collapse" data-bs-target="#sidebarContent" aria-controls="sidebarContent" aria-expanded="false" aria-label="Toggle search menu">
					<h3 class="center tight">Filter Results <i class="fa fa-filter"></i></h3>
				</button>
				<div class="collapse navbar-collapse" id="sidebarContent">
					<form action="` + route + `" method="post" class="col-12 p-0 m-auto" autocomplete="off">`;
					for(var i = 0; i < fields.length; i++){
						form += await this.buildInput(fields[i],smallMeasures);
					}
						form += `<div class="row mt-4 mb-3">
							<div class="col-6 m-0 center"><a href="` + route + `"><input type="button" class="btn btn-md" value="View All"></a></div>
							<div class="col-6 m-0 center"><input type="submit" class="btn btn-md" value="Search"></div>
						</div>
					</form>
				</div>
			</div>
		</div>`;
		
		form += await this.activateSelects("col-" + cutoffSize + "-" + largeMeasures.inputSize + " col-" + smallMeasures.inputSize);
		
	return form;
}

exports.buildSubmissionForm = async function(pageId,route,title,fields,largeMeasures){		
	form = `<div id="` + pageId + `SearchFormPanel" class="row m-2">
				<div class="col-12 p-1 m-1"><h3 id="formTitle" class="center">` + title + `</h3></div>
				<div class="col-12 p-0 mx-auto">
					<form action="` + route + `" method="post" autocomplete="off">`;
					for(var i = 0; i < fields.length; i++){
						if(typeof(fields[i]) == "object"){
							form += await this.buildInput(fields[i],largeMeasures);
						}else{
							form += fields[i];
						}
					}
				
					form += `<div class="row mt-4 mb-0">
							<div class="col-6 m-0 center"><input type="submit" class="btn btn-md" value="Search"></div>
						</div>
					</form>
				</div>
			</div>`;
		
		form += await this.activateSelects("col-" + largeMeasures.inputSize);
		
	return form;
}

// builds the appropriate type of form input
// called by the buildForm function above
exports.buildInput = async function(field,measures){
	var input = `<div class="row col-12 p-0 mx-auto mb-`+ measures.spacing + `">`;
	switch(field.type){
		// field template: {type:"text",name:"",label:"",value:variableName (string)}
		case "text":
			input += `
				<label class="col-` + measures.labelSize + ` p-0 m-0 me-3 right nowrap rtl" for="` + field.name + `Input">` + field.label + `</label>
				<div class="inputBlock col-` + measures.inputSize + ` p-0 m-0">
					<input id="` + field.name + `Input" class="searchTextInput fullWidth" name="` + field.name + `" type="text" value="` + (field.value ? field.value : "") + `" placeholder="Enter Value" onkeyup="requestList(this,'` + field.name + `',this.value,'` + field.schema + `',` + field.unknowns + `)" onfocus="closeAllLists()">
				</div>`;
			break;
		// field template: {type:"select",name:"",label:"",value:["",""],other:["group name":[{label: "", value: ""},{label: "", value: ""}]]}
		case "select":
			input += `
				<label class="col-` + measures.labelSize + ` p-0 m-0 me-3 right nowrap rtl" for="` + field.name + `Input">` + field.label + `</label>
				<select id="` + field.name + `Input" class="searchSelectInput col-` + measures.inputSize + ` m-0 px-1 py-0" name="` + field.name + `" multiple="multiple">`;
					input += await this.buildSelect(field.value,field.other);
				input += `</select>`;
			break;
		// field template: {type:"select",name:"",label:"",value:"selected value",other:["group name":[{label: "", value: ""},{label: "", value: ""}]]}
		case "singleSelect":
			input += `
				<label class="col-` + measures.labelSize + ` p-0 m-0 me-3 right nowrap rtl" for="` + field.name + `Input">` + field.label + `</label>
				<select id="` + field.name + `Input" class="searchSelectInput col-` + measures.inputSize + ` m-0 px-1 py-0" name="` + field.name + `">`;
					input += await this.buildSingleSelect(field.value,field.other);
				input += `</select>`;
			break;
		// field template: {type:"range",name:"",label:"",value:{"start":variableName,"end":variableName},other:[minPossibleInteger, maxPossibleInteger]}
		case "range":
			input += `
				<label class="col-` + measures.labelSize + ` p-0 m-0 me-3 right nowrap rtl" for="start`+ field.name + `Input">` + field.label + `</label>
				<div class="col-` + measures.inputSize + ` px-1 m-0">`;
					input += await this.buildRange(field.name,field.value,field.other);	
				input += `</div>`;
			break;
		// field template: {type:"switch",name:"",label:"",value:variableName,other:[value1,value2]}
		case "switch":
			input += `
				<label class="col-` + measures.labelSize + ` p-0 m-0 me-3 right nowrap rtl" for="` + field.name + `Input">` + field.label + `</label>
				<div class="row checkboxBlock col-` + measures.inputSize + ` px-1 m-0">
					<span class="col me-2 ms-auto p-0 right">` + field.other[0] + `</span>
					<label class="col-auto switch"><input id="` + field.name + `Input" name="` + field.name + `" type="checkbox" ` + (field.value ? "checked" : "") + `><span class="slider round"></span></label>
					<span class="col ms-2 me-auto p-0">` + field.other[1] + `</span>
				</div>`;
			break;
		// field template: {type:"file",name:"",label:""}
		case "file":
			input += `
				<label class="col-` + measures.labelSize + ` p-0 m-0 me-3 right nowrap rtl" for="` + field.name + `Input">` + field.label + `</label>
				<div class="inputBlock col-` + measures.inputSize + ` px-1 m-0">
					<input id="` + field.name + `Input" class="fullWidth" name="` + field.name + `" type="file">
				</div>`;
			break;
	}
	input += `
	</div>`;
	
	return input;
}

//builds the option list for a multiple select input
	//accounts for: single or multiple selected values; values may be grouped
//called by the buildInput function above
exports.buildSelect = async function(value,array){
	if(!Array.isArray(value)){ value = [value]; }
	var options = '';
	
	if(array["ungrouped"]){
		for(var i = 0; i < array["ungrouped"].length; i++){
			if(value && value.includes(array["ungrouped"][i])){
				options += `<option selected value="` + array["ungrouped"][i] + `">` + array["ungrouped"][i] + `</option>`;
			}else{
				options += `<option value="` + array["ungrouped"][i] + `">` + array["ungrouped"][i] + `</option>`;
			}
		}
	}else{
		for(item in array){
			options += `<optgroup label="` + item + `">`;
			for(var i = 0; i < array[item].length; i++){
				if(value && value.includes(array[item][i])){
					options += `<option selected value="` + array[item][i] + `">` + array[item][i] + `</option>`;
				}else{
					options += `<option value="` + array[item][i] + `">` + array[item][i] + `</option>`;
				}
			}
			options += `</optgroup>`;
		}
	}
	
	return options;
}

//triggers the Chosen library to convert select inputs on page load
//called by the buildForm function above
	//(previously called by forms not using this builder function, so made independently callable)
exports.activateSelects = async function(inputSize){
	code = `<script type="text/javascript"> 
		$(".searchSelectInput").chosen({search_contains:true, disable_search_threshold: 10, width:"default", inherit_select_classes:true});
	 </script>`;
	
	return code;
}

//builds the option list for a single select input
//called by the wave.js view
exports.buildSingleSelect = async function(value,array){
	if(!Array.isArray(value)){ value = [value]; }
	var options = '';
	
	for(var i = 0; i < array.length; i++){
		if(value && value == array[i].value){
			options += `<option selected value="` + array[i].value + `">` + array[i].label + `</option>`;
		}else{
			options += `<option value="` + array[i].value + `">` + array[i].label + `</option>`;
		}
	}
	
	return options;
}

//builds the content of a range input using JQuery library
//called by the buildInputs function above
exports.buildRange = async function(name,value,array){
	var start = value.start ? value.start : array[0];
	var end = value.end ? value.end : array[1];
	var range = `<div class="row p-0 m-0">
		<input type="text" name="start`+ name + `" id="start`+ name + `Input" class="startInput col-lg-5 col-3 m-0" value="` + start + `">
		<div class="col-lg-2 col-6 m-0 p-0 spacer"></div>
		<input type="text" name="end`+ name + `" id="end`+ name + `Input" class="endInput col-lg-5 col-3 m-0" value="` + end + `">
	</div>
	<div class="slider-range m-2"></div>
	<script>
		$(document).ready(function(){
			$(".slider-range").slider({
				range: true,
				min: ` + array[0] + `,
				max: ` + array[1] + `,
				values: [ ` + start + `,` + end + ` ],
				slide: function(event, ui){
					$(this).parent().find("#start`+ name + `Input").val(ui.values[0]);
					$(this).parent().find("#end`+ name + `Input").val(ui.values[1]);
				}
			});
			
			$(".startInput").change(function(){
				var end = $(this).parent().find(".endInput");
				$(this).parent().parent().find(".slider-range").slider( "option", "values", [ this.value, end[0].value ] );
			});
			
			$(".endInput").change(function(){
				var start = $(this).parent().find(".startInput");
				$(this).parent().parent().find(".slider-range").slider( "option", "values", [ start[0].value, this.value ] );
			});
			
		});
	</script>`;
	
	return range;
}

/*** Search Results Section Builders ***/

// builds a sort options select input and submission button
// called by the results-fish.js, results-references.js, and results-recordings.js views
	// called from within a form that contains hidden inputs with search parameter values that are resubmitted when sorting
exports.buildResultOrdering = async function(options,sort,location){			
	order = `<div id='sortHolder' class="row g-1 p-0">
				<select id="sortOrder` + location + `" class="selectInput col-8 m-1 p-0" name="sort">`;
	for(var i = 0; i < options.length; i++){
		if(options[i].value == sort){
			order += `<option value="` + options[i].value + `" title="` + options[i].definition + `" selected>` + options[i].label + `</option>`;
		}else{
			order += `<option value="` + options[i].value + `" title="` + options[i].definition + `">` + options[i].label + `</option>`;
		}
	}	
	order += `</select>
			<input id="sortOrderSubmit" class="col-3 btn btn-sm" type="submit" value="Sort"/>
		</div>
		<script type="text/javascript">
			$("#sortOrder` + location + `").chosen({disable_search:true, width:"default", inherit_select_classes:true});
		 </script>
		`;
	
	return order;
}

// builds a pagination widget that displays:
	// jump to first button (disabled if on first page)
	// previous page button (disabled if on first page)
	// up to six page buttons; if more than six pages five are displayed (first 5, last 5, or current +/- 2)
	// next page button (disabled if on last page)
	// jump to last button (disabled if on last page)
// called by the results-fish.js, results-references.js, and results-recordings.js views
exports.buildPagination = async function(form,route,max,count,page){
	var total = Math.ceil(count/max);
	var previous = parseInt(page) - 1;
	var next = parseInt(page) + 1;
	
	var backDisabled = " disabled";
	if(Number(page) - 1 > 0){ var backDisabled = ""; }
	
	var forwardDisabled = " disabled";
	if(Number(page) + 1 < total){ var forwardDisabled = ""; }
	
	var start = page - 2;
	if(start < 1){ start = 1; }
	
	var end = total;
	if(end > 6){
		end = start + 4; 
	}
	
	if(end > total){
		end = total;
		start = total - 4;
	}
	
	pager = `<div id='paginationHolder' class="m-auto">
				<button id="paginationFirstButton" class="pageButton" value='` + 1 + `' title="First Page" onclick='getNewResultsPage("` + form + `","` + route + `",this.value)'` + backDisabled + `><i class="fa fa-fast-backward" aria-hidden="true"></i></button>
				<button id="paginationPreviousButton" class="pageButton" value='` + previous + `' title="Previous Page" onclick='getNewResultsPage("` + form + `","` + route + `",this.value)'` + backDisabled + `><i class="fa fa-step-backward" aria-hidden="true"></i></button>`;
	
	for(var i = start; i <= end; i++){
		var current = i == Number(page) ? 'currentPage' : 'otherPage';
		pager += `<button class="pageButton ` + current + `" type='button' name='page' value='` + i + `' onclick='getNewResultsPage("` + form + `","` + route + `",this.value)'>` + i + `</button>`;
	}
	
	pager += `<button id="paginationNextButton" class="pageButton" value='` + next + `' title="Next Page" onclick='getNewResultsPage("` + form + `","` + route + `",this.value)'` + forwardDisabled + `><i class="fa fa-step-forward" aria-hidden="true"></i></button>
				<button id="paginationLastButton" class="pageButton" value='` + total + `' title="Last Page" onclick='getNewResultsPage("` + form + `","` + route + `",this.value)'` + forwardDisabled + `><i class="fa fa-fast-forward" aria-hidden="true"></i></button>
			</div>`;
	
	return pager;
}

// given an array of string values, returns a single semicolon delimited string
// called by the results-fish.js, references.js, recording.js, index.js views
exports.buildTextString = function(arr){
	var str = '';
	for(var i = 0; i < arr.length; i++){
		str += arr[i];
		if(i + 1 != arr.length){ str += "; "; }
	}
	return str;
}


/*** Single-Result Section Builders ***/

exports.fieldBuilder = function(label,value,search){
	var field = `<div class="row">
		<div class="col-4 px-2"><p class="right tight">` + label + `:</p></div>
		<div class="col-8 px-2">`;
			if(Array.isArray(value) && value.length > 0){
				for(var i = 0; i < value.length; i++){
					field += `<a href='results-fish.js?` + search + `=` + encodeURI(value[i]) + `'><p class="tight">` + value[i] + `</a></p>`;
				}
			}else{
				if(value == undefined || value.length == 0){ value = "Unknown"; }
				field += `<p class="tight">` + value + `</p>`;
			} 
		field += `</div>
	</div>`;
	return field;
}

exports.checkboxBuilder = function(label,value,options,indented){
	if(value === true){ value = 1; }
	if(value === false || value === undefined){ value = 0; }

	checkbox = `<p class="tight nowrap ` + indented + `"><i class="referenceTableSymbol fa ` + options[value].symbol + ` fa-lg" title="` + options[value].text + `" aria-label="` + options[value].text + `"></i>` + label + `</p>`;										
	return checkbox;
}

exports.listBuilder = function(list,key,indented){
	var entry = ``;
	for(var i = 0; i < list.length; i++){
		var item = key ? list[i][key] : list[i];
		entry += `<p class="tight nowrap ` + indented + `">` + item + `</p>`;
	}
	return entry;
}


/*** Recording Image and Player ***/

exports.buildRecordingCards = function(results,className,includeFish){
	var cards = ``;
	for(var i = 0; i < results.length; i++){
		if(i == results.length - 1){ className += " last"; }
		cards += `<div class="` + className + ` row justify-content-center my-2 p-2">
					<div class="col-auto">
						<div class="recordingImage">`;
							if(results[i].imageFile){
								cards += `<img class="spectrogramCropped" src="./public/recordings/images/` + results[i].imageFile.toString() + `" alt="spectrogram of ` + results[i].fish[0].scientific + ` making the sound ` + this.buildTextString(results[i].noises.sort()) + `">`;
							}else{
								cards += `<img class="spectrogramCropped" src="./public/missingImages/3_Boat_search.jpg">`;
							}
							cards += `
						</div>
					</div>
					<div class="col-lg-3 col-12 me-1 row recordingMetadata">
						<div class="row col-12 m-0 recording">`;
							if(results[i].audioFile){
								cards += `<div class="col-6 my-1 center" title="Audio player">
									<div class="my-1 mx-auto audioPlayer">
										<source src="./public/recordings/audios/` + results[i].audioFile + `" type="audio/mpeg">
									</div>
								</div>`;
							}else if(results[i].link){
								cards += `<div class="col-6 my-1 pt-2 center" title="External audio link"><a href="` + results[i].link + `" target="_blank"><i class="ml-2 fas fa-3x fa-external-link-alt" aria-hidden="true"></i></a></div>`;
							}else{
								cards += `<div class="col-6 my-1 pt-1 center" title="No audio available"><i class="ml-2 fa fa-3x fa-times-circle secondary" aria-hidden="true"></i></div>`;
							}
						
							cards += `<div class="col-6 my-2 center"><a href="./recording.js?id=` + results[i].publicId + `"><button class="btn btn-sm">View Details</button></a></div>
						</div>
						<div class="col-lg-12 col-6 m-0 cardSection fishInfo">
							<p class="center bold tighter nowrap">Description</p>`;
							if(includeFish){ 
								cards += `<p class="center tighter"><a href="./fish.js?id=` + results[i].fish[0].publicId + `"><i>` + results[i].fish[0].scientific + `</i>`;
								if(results[i].fish[0].common){ cards += `<br/>(` + results[i].fish[0].common + `)`; }
								cards += `</a></p>`; 
							}
							var soundNameLabel = results[i].noises.length > 1 ? "Sound Names" : "Sound Name";
							cards += `<p class="center tighter">` + soundNameLabel + `: ` + this.buildTextString(results[i].noises.sort()) + `</p>
						</div>
						
						<div class="col-lg-12 col-6 m-0 cardSection refInfo">
							<p class="center bold tighter nowrap">Citable References</p>`;
							for(var j = 0; j < results[i].citations.length; j++){
								cards += `<p class="center tighter"><a href="./reference.js?id=` + results[i].citations[j].publicId + `">` + results[i].citations[j].refShort + `</a></p>`;
							}
							cards += `
						</div>
					</div>
				</div>`;
	}
	cards += `<script>
				$('.audioPlayer').each(function(i){
					var src = $(this).find("source");
					$(this).CirclePlayer(src.attr("src"));
				});
			</script>`;
	return cards;
}