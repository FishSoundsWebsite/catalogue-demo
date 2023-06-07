(function ( $ ) {
	
	var audios = [];
	
	$.fn.CirclePlayer = function(url) {
		
		var audio = null;
		
		var isPlaying = false;
		
		var playbtn = $('<i class="fa fa-play"></i>');
		var container = $('<div class="cp-container"></div>');
		var background = $('<div class="cp-background"></div>');
		var loadingbordercontainer = $('<div class="cp-loading-border-container"></div>');
		var loadingborder = $('<div class="cp-loading-border"></div>');
		var loadingmorethanhalf = $('<div class="cp-loading-more-than-half"></div>');
		var bordercontainer = $('<div class="cp-border-container"></div>');
		var border = $('<div class="cp-border"></div>');
		var morethanhalf = $('<div class="cp-more-than-half"></div>');
		var fill = $('<div class="cp-fill"></div>');
		container
			.append(background)
			.append(loadingbordercontainer.append(loadingborder))
			.append(loadingmorethanhalf)
			.append(bordercontainer.append(border))
			.append(morethanhalf)
			.append(fill)
			.append(playbtn);
		$(this).append(container);
		
		
		fill.on('click',function(e) {
			if(!audio) {
				init();
			}
			if(isPlaying){
				audio.pause();
			} else {
				audio.play();
			}
		});
		
		function init() {
			
			audio = document.createElement('audio');
			audio.src = url;
			audios.push(audio);
			
			var step = setInterval(function() {
				var ldeg = (audio.buffered.end(0)/audio.duration)*360;
				loadingborder.css('transform','rotate('+ldeg+'deg)');
				if(ldeg == 360) {
					loadingmorethanhalf.hide();
					loadingbordercontainer.hide();
				} else if(ldeg > 180) {
					loadingmorethanhalf.show();
					loadingbordercontainer.css('clip','auto');
				} else {
					loadingmorethanhalf.hide();
					loadingbordercontainer.css('clip','rect(0px, 50px, 50px, 25px)');
				}
				var deg = (audio.currentTime/audio.duration)*360;
				border.css('transform','rotate('+deg+'deg)');
				if(deg > 180) {
					morethanhalf.show();
					bordercontainer.css('clip','auto');
				} else {
					morethanhalf.hide();
					bordercontainer.css('clip','rect(0px, 50px, 50px, 25px)');
				}
			}, 100);
			
			
			function borderClick(e) {
				if(e.offsetX > 25) {
					audio.currentTime = Math.atan2(e.offsetX-25,25-e.offsetY)/(2*Math.PI)*audio.duration;
				} else {
					audio.currentTime = (Math.atan2(e.offsetX-25,25-e.offsetY)/(2*Math.PI)+1)*audio.duration;
				}
			}
			background.on('click',borderClick);
			
			
			function onPlay() {
				for(var i in audios){
					if(audios[i] != audio){
						audios[i].pause();
					}
				}
				isPlaying = true;
				playbtn
					.removeClass('fa-play')
					.addClass('fa-pause')
					.removeClass('fa-spinner')
					.removeClass('fa-pulse');
			}
			audio.addEventListener('play', onPlay, false);
			audio.addEventListener('playing', onPlay, false);
			audio.addEventListener('pause', function() {
				isPlaying = false;
				playbtn
					.addClass('fa-play')
					.removeClass('fa-pause')
					.removeClass('fa-spinner')
					.removeClass('fa-pulse');
			}, false);
			audio.addEventListener('waiting', function() {
				isPlaying = false;
				playbtn
					.removeClass('fa-play')
					.removeClass('fa-pause')
					.addClass('fa-spinner')
					.addClass('fa-pulse');
			}, false);
			
		}
	};

}( jQuery ));
