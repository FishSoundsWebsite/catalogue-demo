window.onload = function(){ 
	setPageHeight();
	$('.collapse').on("hidden.bs.collapse", function(){ setPageHeight(); });
	$('.collapse').on("shown.bs.collapse", function(){ setPageHeight(); });
	if($(window).width() <= 1120){ 
		$('#collapsibleSidebar').collapse('hide');
		closeSideBar(); 
	}else{
		$('#collapsibleSidebar').collapse('show');
		openSideBar(); 
	}
	
	if(window.location.hash){
		$(window.location.hash).get(0).scrollIntoView();
	}
}

window.onresize = function(){ 
	setPageHeight();
	fillSection("searchResults");
}

function setPageHeight(){
	if($(window).width() > 992){
		var h = $(window).height() - ($("#header").height() + $("#footer").height() + 25);
		$("#main").height(h);
	}else{
		$("#main").height('max-content');
	}
	
	if($(window).height() > $(document.body).height()){
		$(footer).css({position:'fixed'});
	}else{
		$(footer).css({position:'static'});
	}
}

/*** AJAX AUTOSUGGESTION CONTROLS ***/
function requestList(target,type,value,schema,unknowns){
	if(value){
		var fields = [];
		var data = {
			className: $('#classNameInput').val(),
			order: $('#orderInput').val(),
			family: $('#familyInput').val(),
		//	genus: $('#genusInput').val(),
		//	species: $('#speciesInput').val(),
			scientific: $('#scientificInput').val(),
			unknowns: unknowns
		};
		
		$.ajax({
			method:"POST",
			contentType: 'application/json',
			dataType: "json",
			url:"/requestList?type=" + encodeURIComponent(type) + "&value=" + encodeURIComponent(value) + "&schema=" + encodeURIComponent(schema),
			data: JSON.stringify(data),
			success: function(response){
				closeAllLists();
				if(response.length > 0){
					a = document.createElement("div");
					a.setAttribute("id", target.id + "autocomplete-list");
					a.setAttribute("class", "autocomplete-items");
			
					for(var i = 0; i < response.length; i++){
						b = document.createElement("div");
						b.setAttribute("class", "autocomplete-item");
						b.innerHTML = response[i];
						b.innerHTML += `<input type="hidden" value="` + response[i] + `">`;
						b.addEventListener("mousedown",function(){
							target.value = this.getElementsByTagName("input")[0].value;
							backfillForm(type,this.getElementsByTagName("input")[0].value);
							closeAllLists();
						});
				
						a.appendChild(b);
					}
					target.parentNode.appendChild(a);
					target.addEventListener("blur",function(){
						closeAllLists();
					});
				}
			}
		});
	}else{
		closeAllLists();
	}
}

function closeAllLists(){
	var x = document.getElementsByClassName("autocomplete-items");
	for(var i = 0; i < x.length; i++){
		x[i].parentNode.removeChild(x[i]);
	}
}

function backfillForm(type,value){
	$.ajax({
		method:"POST",
		contentType: 'application/json',
		dataType: "json",
		url:"/requestBackfill?type=" + encodeURIComponent(type) + "&value=" + encodeURIComponent(value),
		success: function(response){
			for(item in response){
				$('#' + item + "Input").val(response[item]);
			}
		}
	});
}

function clearTaxonomy(){
	var arr = ['className','order','family','scientific','common'];
	for(var i = 0; i < arr.length; i++){
		$('#' + arr[i] + "Input").val(null);
	}
}

/*** SEARCH SIDEBAR CONTROLS ***/
function openSideBar(){
	$("#openSideBar").hide();
	$("#closeSideBar").show(500,function(){
		fillSection("searchResults");
	});
	$("#collapsedSideBarLabel").hide();
}

function closeSideBar(){
	$("#closeSideBar").hide(500,function(){
		fillSection("searchResults");
	});
	$("#openSideBar").show();
	$("#collapsedSideBarLabel").css("display","inline");
}

function fillSection(section){
	var width = $("#" + section).width();
	if(width > 720){
		$('#' + section + " .hideOnShrink").removeClass("d-none");
		$('#' + section + " .hideOnShrink").addClass("d-block");
		$('#' + section + " .stretchOnShrink").removeClass("col-6");		
	}else{
		$('#' + section + " .stretchOnShrink").addClass("col-6");
		$('#' + section + " .hideOnShrink").addClass("d-none");
		$('#' + section + " .hideOnShrink").removeClass("d-block");
	}
}

function getNewResultsPage(form,route,page){
	var attr = $("." + form).attr("action");
	$("." + form).attr("action",attr + "?page=" + page);
	$("." + form).submit();
}

/*** REFERENCE.JS ***/

function copyToClipboard(id){
	var copyText = $("#" + id);
	copyText.select();
	document.execCommand("copy");
	
	$("#copyConfirmation").fadeIn();
	$("#copyConfirmation").fadeOut("slow");
}

function displayFish(id){
	$("#noteBox").collapse("hide");
	if(id){
		var oldFishInfo = $(".fishInfo");
		oldFishInfo.removeClass("d-block");
		oldFishInfo.addClass("d-none");
	
		var newFishInfo = $("#" + id);
		newFishInfo.removeClass("d-none");
		newFishInfo.addClass("d-block");
	
		$("#fishLink").attr("href","fish.js?id=" + id);
		$("#fishLinkButton").prop("disabled",false);
	}else{
		var oldFishInfo = $(".fishInfo");
		oldFishInfo.removeClass("d-block");
		oldFishInfo.addClass("d-none");
		$("#fishLink").attr("href","");
		$("#fishLinkButton").prop("disabled",true);
	}
}

function displayNotes(button){
	$("#noteBox #textHolder").html("");
	var text = $(button).parent().find(".noteContent")[0].innerHTML;
	$("#noteBox #textHolder").html(text);
}


/*** RECORDING.JS ***/

function activateMeasurements(el){
	$(".measurementCitation").removeClass("active");
	$(el).addClass("active");
	
	$(".measurementTable").removeClass("d-block");
	$(".measurementTable").addClass("d-none");
	
	var idParts = $(el).attr("id").split("_");
	$("#measurementTable_" + idParts[1]).removeClass("d-none");
	$("#measurementTable_" + idParts[1]).addClass("d-block");
	
}

/*** ABOUT.jS ***/

function refineTable(input,column){
	var regex = new RegExp($(input).val(),"i");
	var rows = $("." + column);
	rows.each(function(i){
		var match = rows[i].innerHTML.match(regex);
		if(match){
			$(rows[i]).parent().removeClass("d-none");
		}else{
			$(rows[i]).parent().addClass("d-none");
		}
	});
}

/*** BEGINNING OF CODE COPIED FROM https://wavesurfer-js.org/example/timeline-notches/index.html TO HANDLE SPECTROGRAM TIMELINE LABELLING ***/
/**
 * Use formatTimeCallback to style the notch labels as you wish, such
 * as with more detail as the number of pixels per second increases.
 *
 * Here we format as M:SS.frac, with M suppressed for times < 1 minute,
 * and frac having 0, 1, or 2 digits as the zoom increases.
 *
 * Note that if you override the default function, you'll almost
 * certainly want to override timeInterval, primaryLabelInterval and/or
 * secondaryLabelInterval so they all work together.
 *
 * @param: seconds
 * @param: pxPerSec
 */
function formatTimeCallback(seconds,pxPerSec){
		seconds = Number(seconds);
		var minutes = Math.floor(seconds / 60);
		seconds = seconds % 60;

		// fill up seconds with zeroes
		var secondsStr = Math.round(seconds).toString();
		if(pxPerSec >= 25 * 10){
			secondsStr = seconds.toFixed(2);
		}else if(pxPerSec >= 25 * 1){
			secondsStr = seconds.toFixed(1);
		}

		if(minutes > 0){
			if(seconds < 10){ secondsStr = '0' + secondsStr; }
			return `${minutes}:${secondsStr}`;
		}
		return secondsStr;
}

/**
 * Use timeInterval to set the period between notches, in seconds,
 * adding notches as the number of pixels per second increases.
 *
 * Note that if you override the default function, you'll almost
 * certainly want to override formatTimeCallback, primaryLabelInterval
 * and/or secondaryLabelInterval so they all work together.
 *
 * @param: pxPerSec
 */
function timeInterval(pxPerSec){
		var retval = 1;
		if(pxPerSec >= 25 * 100){
			retval = 0.01;
		}else if(pxPerSec >= 25 * 40){
			retval = 0.025;
		}else if(pxPerSec >= 25 * 10){
			retval = 0.1;
		}else if(pxPerSec >= 25 * 4){
			retval = 0.25;
		}else if(pxPerSec >= 25){
			retval = 1;
		}else if(pxPerSec * 5 >= 25){
			retval = 5;
		}else if(pxPerSec * 15 >= 25){
			retval = 15;
		}else{
			retval = Math.ceil(0.5 / pxPerSec) * 60;
		}
		return retval;
}

/**
 * Return the cadence of notches that get labels in the primary color.
 * EG, return 2 if every 2nd notch should be labeled,
 * return 10 if every 10th notch should be labeled, etc.
 *
 * Note that if you override the default function, you'll almost
 * certainly want to override formatTimeCallback, primaryLabelInterval
 * and/or secondaryLabelInterval so they all work together.
 *
 * @param pxPerSec
 */
function primaryLabelInterval(pxPerSec){
		var retval = 1;
		if(pxPerSec >= 25 * 100){
			retval = 10;
		}else if(pxPerSec >= 25 * 40){
			retval = 4;
		}else if(pxPerSec >= 25 * 10){
			retval = 10;
		}else if(pxPerSec >= 25 * 4){
			retval = 4;
		}else if(pxPerSec >= 25){
			retval = 1;
		}else if(pxPerSec * 5 >= 25){
			retval = 5;
		}else if(pxPerSec * 15 >= 25){
			retval = 15;
		}else{
			retval = Math.ceil(0.5 / pxPerSec) * 60;
		}
		return retval;
}

/**
 * Return the cadence of notches to get labels in the secondary color.
 * EG, return 2 if every 2nd notch should be labeled,
 * return 10 if every 10th notch should be labeled, etc.
 *
 * Secondary labels are drawn after primary labels, so if
 * you want to have labels every 10 seconds and another color labels
 * every 60 seconds, the 60 second labels should be the secondaries.
 *
 * Note that if you override the default function, you'll almost
 * certainly want to override formatTimeCallback, primaryLabelInterval
 * and/or secondaryLabelInterval so they all work together.
 *
 * @param pxPerSec
 */
function secondaryLabelInterval(pxPerSec){
		// draw one every 10s as an example
		return Math.floor(10 / timeInterval(pxPerSec));
}	
// END OF CODE COPIED FROM https://wavesurfer-js.org/example/timeline-notches/index.html TO HANDLE SPECTROGRAM TIMELINE LABELLING
