var formTools = require('./formBuilderFunctions.js');

//builds an expandable/collapsible section, left-to-right on large screens and top-to-bottom on small screens
// called by the results-fish.js, results-references.js, and results-recordings.js views
exports.buildSideBar = async function(pageId,largeForm,smallForm,cutoffSize = "lg"){		
	form = `<div id="largeScreen" class="col-4 d-` + cutoffSize + `-flex d-none">
			<div id="` + pageId + `SearchFormPanel" class="sidebar col-12 row ps-5 pb-1 mx-2 my-0">
				<div id="collapsibleSidebar" class="collapse collapse-horizontal show col-11 m-0 p-0">
					<h3 id="expandedSideBarLabel" class="center">Filter Results</h3>`;
				form += largeForm;	
				form += `</div>
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
			<div id="` + pageId + `SearchFormPanelSmall" class="sidebar col-10 mx-auto p-0">
				<button class="navbar-toggler searchForm-toggler fullWidth btn" type="button" data-bs-toggle="collapse" data-bs-target="#sidebarContent" aria-controls="sidebarContent" aria-expanded="false" aria-label="Toggle search menu">
					<h3 class="center tight">Filter Results <i class="fa fa-filter"></i></h3>
				</button>
				<div class="collapse navbar-collapse" id="sidebarContent">`;
				form += smallForm;
				form += `</div>
			</div>
		</div>`;
		
	return form;
}

/*** Search Results Section Builders ***/

// builds a frame of result counts, result pagination, and result ordering for search pages
// called by the results-fish.js, results-references.js, and results-recordings.js views
exports.buildResultFrame = async function(route,limit,data,options,location){
	frame = `<form class="` + route + `ResultPaginationForm row m-auto" action="./results-` + route + `.js" method="post">`;	
	
		var pageCount = Math.ceil(data.count/limit);
		var pages = pageCount > 1 ? pageCount + " Pages" : pageCount + " Page";
		frame += `<div id="resultCount" class="col-lg-3 col-12 p-1">
				<p class="center nowrap">` + data.count + ` Results Found (` + pages + `)</p>
			</div>`;
		
		frame += `<div id="pager" class="col-lg-6 col-12 px-0 mb-3">`;
		frame += await this.buildPagination(route + "ResultPaginationForm",route,limit,data.count,data.page);
		frame += `</div>`;

		frame += `<div id="resultSort" class="col px-1">`;
		frame += await this.buildResultOrdering(options,data.q.sort,location);
		frame += `</div>`;
		
	frame += `</form>`;
	
	return frame;
}

// builds a sort options select input and submission button
// called by the results-fish.js, results-references.js, and results-recordings.js views
	// called from within a form that contains hidden inputs with search parameter values that are resubmitted when sorting
exports.buildResultOrdering = async function(options,sort,location){
	var order = `<div id='sortHolder' class="row g-1 p-0 align-items-center">`;
	order += await formTools.buildInput({type:"singleSelect",name:"sort" + location,label:"Sort",value:sort,functions:[{trigger:"change",event:"setSortOrder(this.value)"}],other:{options:options}},{labelSize: 2, inputSize: 8, spacing: 2});
	order += `
		</div>

		`;
	
	return order;
}

// builds a pagination widget that displays:
	// jump to first button (disabled if on first page)
	// previous page button (disabled if on first page)
	// up to six numbered page buttons; if there are more than six pages, five are displayed (first 5, last 5, or current +/- 2)
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
				<button id="paginationFirstButton" class="pageButton" type='button' value='` + 1 + `' title="First Page" onclick='getSearchResults(this.value)'` + backDisabled + `><i class="fa fa-fast-backward" aria-hidden="true"></i></button>
				<button id="paginationPreviousButton" class="pageButton" type='button' value='` + previous + `' title="Previous Page" onclick='getSearchResults(this.value)'` + backDisabled + `><i class="fa fa-step-backward" aria-hidden="true"></i></button>`;
	
	for(var i = start; i <= end; i++){
		var current = i == Number(page) ? 'currentPage' : 'otherPage';
		pager += `<button class="pageButton ` + current + `" type='button' name='page' value=` + i + ` onclick='getSearchResults(this.value)'>` + i + `</button>`;
	}
	
	pager += `<button id="paginationNextButton" class="pageButton" type='button' value='` + next + `' title="Next Page" onclick='getSearchResults(this.value)'` + forwardDisabled + `><i class="fa fa-step-forward" aria-hidden="true"></i></button>
				<button id="paginationLastButton" class="pageButton" type='button' value='` + total + `' title="Last Page" onclick='getSearchResults(this.value)'` + forwardDisabled + `><i class="fa fa-fast-forward" aria-hidden="true"></i></button>
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

exports.fieldBuilder = function(label,value,page,search){
	var field = `<div class="row">
		<div class="col-4 px-2"><p class="right tight">` + label + `:</p></div>
		<div class="col-8 px-2">`;
			if(Array.isArray(value) && value.length > 0){
				for(var i = 0; i < value.length; i++){
					if(page){
						field += `<a href='` + page + `?` + search + `=` + (value[i].code ? encodeURI(value[i].code) : encodeURI(value[i])) + `'><p class="tight">` + (value[i].label ? value[i].label : value[i]) + `</a></p>`;
					}else{
						field += `<p class="tight">` + (value[i].label ? value[i].label : value[i]) + `</p>`;
					}
				}
			}else{
				if(value == undefined || value.length == 0){ value = "Unknown"; }
				if(search){
					field += `<a href='` + page + `?` + search + `=` + (value.code ? encodeURI(value.code) : encodeURI(value)) + `'><p class="tight">` + (value.label ? value.label : value) + `</a></p>`;
				}else{
					field += `<p class="tight">` + (value.label ? value.label : value) + `</p>`;
				}
			} 
		field += `</div>
	</div>`;
	return field;
}

exports.checklistBuilder = function(label,value,options,indented){
	if(value === true){ value = 1; }
	if(value === false || value === undefined){ value = 0; }

	checkbox = `<p class="tight nowrap ` + indented + `"><i class="referenceTableSymbol fa ` + options[value].symbol + `" title="` + options[value].text + `" aria-label="` + options[value].text + `"></i>` + label + `</p>`;										
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

//builds a table from a structured data object:
	/*{
		id:"",
		title:"",							//optional; can contain DOM elements (e.g. conditional span); stylized <p>, not <h#>
		description:"",						//optional; can contain DOM elements (e.g. conditional span)
		dark: true,							//optional to set thead color, default is false (white)
		data:{
		  headings:[{
			id:"",							//match with below
			label:"",
			size:"col-xl-2 col-3"
		  }],
		  rows:[
			//rows is an array of arrays; each item represents one row, within which each item represents one column matched by id to the headings above
			//item[0] in each row may contain note and noteAlign properties to declare the content of a note popup for that row; note properties on items[1+] will be ignored
			[{
				id:"",						//match with above
				value:"",
				size:"col-xl-2 col-3",
				align:"left",				//optional, default is center
				note:""						//only on [0] entry!!!
			}]
		  ]
		}
	}*/
//width value: "col m-xl-4 m-auto","col-3 mb-2", etc.
	//width can also add style classes (e.g. "section col-3")
//height value: "300px", "unset", etc.
	//height directly defines the *table portion*, not the entire element
	//unset height will have (defacto) inline thead; limited height will have sticky scroll thead (including search boxes, if present)
//notes option: include note column spacing and info icons
	// takes up col-1 spacing for heading math
//search option: include searchable inputs for each column
//edit option: include CRUD buttons and column spacing
	// takes up col-2 spacing for heading math
//called by the about.js, recording.js, and data-list.js views
exports.buildDataList = function(list,width,height,notes = false,search = true,edit = false,border = false){
	content = `
	<div class="` + width + `">`;
		if(list.title){ content += `<div class="col-12"><p class="center bigger falseHeading">` + list.title + `</p></div>`; }
		if(list.description){ content += `<div class="col-12 mb-3 center" id="datalist-` + list.id + `-description"><p class="mb-0">` + list.description + `</p></div>`; }
		if(edit && list.add){ content += `<div class="col-12 m-2 center"><a href="` + list.add + `"><button class="col-4 m-auto primary btn">Add New</button></a></div>`; }
	
	var borderClass = border ? " section" : "";
	content += `
		<div class="datalist-holder` + borderClass + `">
			<div id="loader-` + list.id + `" class="loader px-5 mx-auto ">
				<img src="./public/Loading.gif" class="loadingGif">
			</div>`;
	content += `
			<table id="datalist-` + list.id + `" class="datalist table table-striped d-none m-auto` + list.style + `" style="max-height:` + height + `;" onscroll="toggleScrollIndicators(this,'` + list.id + `','vertical')">
				<thead>
					<tr>`;
						if(notes){ content += `<th class="col-1 noteColumn"></th>`; }
						for(var i = 0; i < list.data.headings.length; i++){
							content += `<th id="` + list.data.headings[i].id + `Column" class="` + list.data.headings[i].size + `" colspan="` + (list.data.headings[i].colspan ? list.data.headings[i].colspan : "") + `">` + list.data.headings[i].label + `</th>`;
						}
						if(edit){ content += `<th class="col-2"></th>`; }
				content += `
					</tr>`;
				if(search){
					content += `
					<tr>`;
						if(notes){ content += `<th class="col-1 noteColumn"></th>`; }
						for(var i = 0; i < list.data.headings.length; i++){
							if(!list.data.headings[i].noSearch){
								content += `<th class="` + list.data.headings[i].size + `"><input type="text" id="` + list.id + `-` + list.data.headings[i].id + `-search" class="` + list.id + `-search fullWidth" onkeyup="refineTable('` + list.id + `')" placeholder="Search.."></th>`;
							}else{
								content += `<th class="` + list.data.headings[i].size + `"></th>`;
							}
						}
						if(edit){ content += `<th class="col-2"></th>`; }
					content += `
					</tr>`;
				}
				content += `
				</thead>
				<tbody>`;
	
			if(list.data.rows.length > 0){
				for(var i = 0; i < list.data.rows.length; i++){
					content += `
						<tr>`;
			
					for(var j = 0; j < list.data.rows[i].length; j++){
						// on first row, if column not flagged for merge, or if column is the first of a merged set (value does not match previous row)
						if(i == 0 || list.data.rows[i][j].merge != true || list.data.rows[i][j].value != list.data.rows[i - 1][j].value){
							if(j == 0 && list.data.rows[i][j].note){
								content += `
								<td class="col-1 noteColumn">
									<div class="infoPopup notePopup section py-1 px-2">` + list.data.rows[i][j].note + `</div>
									<i id="note-` + i + `" class="infoIcon fas fa-info-circle fa-2x text-info align-self-center" aria-label="` + list.data.rows[i][j].note + `" onclick="infoPopup(this)"></i>
								</td>`;
							}else if(j == 0 && notes){ content += `<td class="col-1 noteColumn"> </td>`; }
				
							var classes = list.data.rows[i][j].size + ` ` + list.id + `-` + list.data.rows[i][j].id;
							if(list.data.rows[i][j].align){ classes += ` ` + list.data.rows[i][j].align; }
							if(Array.isArray(list.data.rows[i][j].value)){
								content += `
								<td class="` + classes + `">`;
								var length = list.data.rows[i][j].value.length > 5 ? 3 : list.data.rows[i][j].value.length;
								for(var k = 0; k < length; k++){
									content += list.data.rows[i][j].value[k];
									if(k != length - 1){
										content += "<br/>";
									}
								}
								if(list.data.rows[i][j].value.length > 5){ content += "<br/>..."; }
								content += `</td>`;
							}else{
								var value = list.data.rows[i][j].value !== undefined && list.data.rows[i][j].value !== null ? list.data.rows[i][j].value : "---";
								content += `
								<td class="` + classes + `">` + value + `</td>`;
							}
						}else{
							content += `
								<td class="` + classes + `"></td>`;
						}
					}
					if(edit){ content += `
							<td class="col-2">
								<div class="d-md-none d-block row m-0 p-0 right nowrap">`;
									if(list.data.links[i].view){ content += `<span class="col-4 p-0"><a href="` + list.data.links[i].view + `" target="_blank"><i class="fas fa-eye primary" title="view"></i></a></span>`; }
									if(list.data.links[i].edit){ content += `<span class="col-4 p-0"><a href="` + list.data.links[i].edit + `"><i class="fas fa-edit primary" title="edit"></i></a></span>`; }
									if(list.data.links[i].delete){ content += `<span class="col-4 p-0"><a href="` + list.data.links[i].delete + `"><i class="fas fa-trash primary" title="delete"></i></a></span>`; }
							content += `	
								</div>
								<div class="d-xl-none d-md-block d-none row m-0 p-0 right nowrap">`;
									if(list.data.links[i].view){ content += `<span class="col-4 p-1"><a href="` + list.data.links[i].view + `" target="_blank"><i class="fas fa-eye primary" title="view"></i></a></span>`; }
									if(list.data.links[i].edit){ content += `<span class="col-4 p-1"><a href="` + list.data.links[i].edit + `"><i class="fas fa-edit primary" title="edit"></i></a></span>`; }
									if(list.data.links[i].delete){ content += `<span class="col-4 p-1"><a href="` + list.data.links[i].delete + `"><i class="fas fa-trash primary" title="delete"></i></a></span>`; }
							content += `
								</div>
								<div class="d-xl-block d-none row m-0 p-0 right nowrap">`;
									if(list.data.links[i].view){ content += `<span class="col-4 p-1"><a href="` + list.data.links[i].view + `" target="_blank"><i class="fas fa-eye fa-lg primary" title="view"></i></a></span>`; }
									if(list.data.links[i].edit){ content += `<span class="col-4 p-1"><a href="` + list.data.links[i].edit + `"><i class="fas fa-edit fa-lg primary" title="edit"></i></a></span>`; }
									if(list.data.links[i].delete){ content += `<span class="col-4 p-1"><a href="` + list.data.links[i].delete + `"><i class="fas fa-trash fa-lg primary" title="delete"></i></a></span>`; }
							content += `
								</div>
							</td>`; }
					content += `
						</tr>`;
				}
			}else{
				var colspan = list.data.headings.length;
				if(notes) colspan += 1;
				if(edit) colspan += 1;
				content += `<tr class="col-12"><td colspan="` + colspan + `">No ` + list.title + ` Found</td></tr>`;
			}

			content += `
				</tbody>
			</table>
			<div id="scrollIndicator-` + list.id + `" class="col-12 row py-1 g-2">
				<div class="col-6 right"><i id="scrollDown" class="fas fa-arrow-alt-circle-down hidden"></i></div>
				<div class="col-6 left"><i id="scrollUp" class="fas fa-arrow-alt-circle-up hidden"></i></div>
			</div>
		</div>
	</div>
	<script>
		$("#datalist-` + list.id + `").on("load",showTable("#datalist-` + list.id + `"));
	</script>`;

	return content;
}

/*** Recording Image and Player ***/

exports.buildRecordingCards = async function(results,className,includeFish){
	var cards = ``;
	for(var i = 0; i < results.length; i++){
		if(i == results.length - 1){ className += " last"; }
		cards += `
		<div class="` + className + ` row justify-content-center flex-nowrap my-2 p-2">
			<div class="col-lg-1 col-12 p-0 d-flex align-items-center justify-content-center">`;
				if(results[i].audioFile){
					cards += `
					<div class="col m-0 p-0 d-flex align-items-center justify-content-center" title="Audio player">
						<div class="my-1 mx-auto audioPlayer">`;
							var af = results[i].audioFile.split(".");
							cards += `<source src="./public/recordings/audios/` + af[0] + `.mp3" type="audio/mpeg">
							<source src="./public/recordings/audios/` + af[0] + `.wav" type="audio/wav">
							
						</div>
					</div>
					`;
				}else if(results[i].link){
					cards += `<div class="col m-0 p-0 d-flex align-items-center justify-content-center" title="External audio link"><a href="` + results[i].link + `" target="_blank"><i class="ml-2 fas fa-4x fa-external-link-alt" aria-hidden="true"></i></a></div>`;
				}else{
					cards += `<div class="col m-0 p-0 d-flex align-items-center justify-content-center" title="No audio available"><i class="ml-2 fa fa-4x fa-times-circle secondary" aria-hidden="true"></i></div>`;
				}
		cards += `
			</div>
			<div class="recordingImageHolder col-lg-8 col-12 p-0 d-flex align-items-center justify-content-center">`;
				if(results[i].imageFile){ cards += `<div id="recordingImage-` + i + `" class="recordingImage"><img class="recordingImageCropped" src="./public/recordings/images/` + results[i].imageFile.toString() + `" alt="spectrogram of ` + results[i].fish.title + ` making the sound ` + this.buildTextString(results[i].noises.sort()) + `"></div>`; }
				if(!results[i].imageFile){ cards += `<img class="missingSearchImage" src="./public/missingImages/4_Boat_individual.png" alt="No image available">`; }
				cards += `
			</div>
			<div class="col-lg col-12 p-0 me-1 row recordingMetadata">
				<div class="row col-12 m-0 recording flex-nowrap justify-content-center">`;
					
					cards += `
					<div class="col my-2 p-1 d-flex align-items-center justify-content-center"><a href="./recording.js?id=` + results[i].publicId + `"><button class="btn">View Details</button></a></div>
				</div>
				<div class="col-lg-12 col-6 m-0 cardSection fishInfo">
					<p class="center bold tighter nowrap">Description</p>`;
					if(includeFish){ 
						cards += `
						<p class="center tighter"><a href="./fish.js?id=` + results[i].fish[0].publicId + `"><i>` + results[i].fish[0]['combo_genus__species'] + `</i>`;
						if(results[i].fish[0].common){ cards += `<br/>(` + results[i].fish[0].common + `)`; }
						cards += `</a></p>`; 
					}
					var soundNameLabel = results[i].noises.length > 1 ? "Sound Names" : "Sound Name";
					cards += `
					<p class="center tighter">` + soundNameLabel + `: ` + this.buildTextString(results[i].noises.sort()) + `</p>
				</div>
				
				<div class="col-lg-12 col-6 m-0 cardSection refInfo">
					<p class="center bold tighter nowrap">Citable References</p>`;
					for(var j = 0; j < results[i].citations.length; j++){
						cards += `
						<p class="center tighter"><a href="./reference.js?id=` + results[i].citations[j].publicId + `">` + results[i].citations[j].refShort + `</a></p>`;
					}
					cards += `
				</div>
			</div>
		</div>`;
		
	}
	cards += `
		<script>
			$('.audioPlayer').each(function(i){
				var src = $(this).find("source");
				$(this).CirclePlayer(src.attr("src"));
			});
		</script>`;
	return cards;
}

exports.popupBuilder = function(id,className,note,size = ""){
	var popup = `
		<div class="infoPopup ` + className + ` p-0"><p class="m-0 p-2 center">` + note + `</p></div>
		<i id="note-` + id + `" class="infoIcon fas fa-info-circle ` + size + ` text-info align-self-center" aria-label="` + note + `" onclick="infoPopup(this)"></i>`;
	
	return popup;
}