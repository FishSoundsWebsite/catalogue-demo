//renders the how to cite page
exports.display = function(data){
	const monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"];
	var today = new Date();
	var day = String(today.getDate());
	var month = monthNames[today.getMonth()];
	var year = today.getFullYear();
	var date = month + ' ' + day + ', ' + year;
	var content = `<div id="how-to-cite" class="section col-lg-9 col-12 m-auto p-4">
		<h2>Citing Website Data</h2>
		<p class="citation indent">Last updated: 2020-12-31</p>
		<p class="indent">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris eget purus pharetra, blandit sem vel, lacinia tellus. Nam commodo, orci in condimentum rhoncus, ex ex posuere sapien, sed aliquet dolor urna eget ante. Proin vel neque id erat rhoncus faucibus. Morbi sem lectus, fermentum vitae eleifend vel, dignissim vel nisi. In nisi lorem, placerat id viverra consequat, mattis et lacus. Suspendisse potenti. Curabitur congue quam sed lobortis porta. Ut mauris magna, euismod gravida velit eget, faucibus condimentum justo. Cras efficitur arcu id egestas eleifend. Pellentesque est risus, lobortis eu porttitor id, vehicula nec ex. Donec augue nunc, elementum eu ante nec, efficitur euismod urna. Sed pulvinar tempus odio et dictum. Praesent molestie orci ac sem elementum, sit amet pulvinar felis mattis. Curabitur ut ultricies est. </p>
	</div>`;
	
	return content;
}