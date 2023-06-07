// temp data storage; to be converted into database once admin panel is built
	var orgs = [
		//template: {"name":"","image":"","url":"","size":""},
		{"name":"Example Organization","image":"orgLogo.png","url":"https://gitlab.meridian.cs.dal.ca/Infrastructure/fish-sounds-public","size":"col-12"},
	];

	var people = [
		//template: {"name":"","image":"","affiliation":""},		use <br/> tags to split name/affiliation over lines
		{"name":"Person 1","image":"avatar.png","affiliation":"Affiliation"},
		{"name":"Person 2","image":"avatar.png","affiliation":"Affiliation 1<br/>Affiliation 2"},
		{"name":"Person 3","image":"avatar.png","affiliation":"Affiliation"},
	];
	
	var assistants = [
		//template: "name",
	];
	
	var supporters = [	
		//template: "name",
	];
	
	var publications = [
		//template:	{"author":"","date":"","name":"","publication":"","link":""},
	];
	
	var presentations = [
		//template: {"author":"", "date": "", "name":"", "event":"", "link":""},
	];

	var definitions = [
		//template: {type:"",term:"",definition:""},
		{type:"Grouping 1",term:"Light Blue",definition:"Aliquam ut metus porta, egestas dolor a, commodo massa. Cras ullamcorper, leo ac finibus iaculis, enim ligula pharetra odio, sed luctus mauris lectus non orci. "},
		{type:"Grouping 1",term:"Dark Red",definition:"Mauris gravida odio dictum leo tempus, non hendrerit odio aliquam. Nam et turpis ut neque porttitor porttitor non sit amet magna. Vivamus suscipit orci sit amet velit ornare, nec hendrerit orci rhoncus. Nullam ligula mauris, fringilla ut commodo id, lacinia ac risus. Fusce erat elit, vehicula vel mi sit amet, luctus vestibulum risus. "},
		{type:"Grouping 2",term:"Dark Green",definition:"In congue rhoncus nunc vel dapibus."},
		{type:"Grouping 2",term:"Light Red",definition:"Praesent feugiat, urna eget maximus aliquam, libero sapien feugiat leo, a tincidunt eros eros quis nisi. Donec tincidunt in mauris id semper. Quisque at dui gravida, tempor lacus vel, eleifend augue. Curabitur erat eros, aliquam quis volutpat vitae, venenatis ut arcu. Integer ornare feugiat odio. Morbi porta egestas egestas.<br/>Curabitur consequat, orci eleifend euismod scelerisque, mauris est varius purus, quis porttitor nibh erat vitae justo. Cras lobortis ante ante, vitae consequat orci porta id. Sed porta nunc in eleifend auctor. Duis at lacinia velit."},
		{type:"Grouping 3",term:"Dark Blue",definition:"Nam scelerisque nisi sollicitudin, efficitur mi eu, commodo justo. Integer posuere, ipsum quis pretium scelerisque, risus nunc lobortis nisl, ac auctor metus eros non erat."},
		{type:"Grouping 3",term:"Light Green",definition:"Maecenas vitae ex vitae felis fringilla hendrerit. Mauris sit amet vulputate lacus, nec malesuada purus."},
	];

//renders the about page (various textual and list info)
exports.display = function(data){
	var content = `
	<div id="about" class="section col-lg-9 col-12 m-auto p-4">
		<h2>About Us</h2>
		<p class="indent">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris eget purus pharetra, blandit sem vel, lacinia tellus. Nam commodo, orci in condimentum rhoncus, ex ex posuere sapien, sed aliquet dolor urna eget ante. Proin vel neque id erat rhoncus faucibus.</p>
		<h3 id="people" class="mt-5">Who We Are</h3>
		<p class="indent">Morbi sem lectus, fermentum vitae eleifend vel, dignissim vel nisi. In nisi lorem, placerat id viverra consequat, mattis et lacus.</p>
		<div class="row">`;
		
		// side-by-side org logos, scaled with a col-size to make comparably sized
		for(var i = 0;i < orgs.length;i++){
			content += `<div class="col-2 m-auto p-0 d-table-cell orgLogo"><a href="` + orgs[i].url + `"><img class="` + orgs[i].size + `" src="./public/about-images/` + orgs[i].image + `" alt="` + orgs[i].name + `"/></a></div>`;
		}
		
		content += `
		</div>
		<h4 class="center mt-4">Our team</h4>
		`;

		// creates an off-set grid of people entries (image and labels)
		// number of columns is determined by col class (e.g. col-4 = 3 columns, col-6 = 2 columns)
		// builds as many rows as needed, incomplete row will have centered values
		content += `<div class="row col-10 m-auto">`;
		for(var i = 0; i < people.length; i++){
			content += `
			<div class="staffMember col-lg-4 col-6 p-2 mx-auto my-2">
				<p class="col-12 bold center nowrap">` + people[i].name + `</p>
				<div class="col-12"><img class="col-12 teamImage" src="./public/about-images/` + people[i].image + `" /></div>
				<p class="col-12 center nowrap">` + people[i].affiliation + `</p>
			</div>`;
		}

		content += `
		</div>
		
		<h4 class="center mt-4">Research Assistants</h4>
		<p class="indent">Suspendisse potenti. Curabitur congue quam sed lobortis porta.</p>`;
		
		// creates a grid of assistant names
		// number of columns is determined by col class (e.g. col-3 = 4 columns, col-6 = 2 columns)
		// builds as many rows as needed, incomplete row will have left aligned values
		content += `<div class="row col-10 m-auto">`;
		var gridCount = Math.ceil(assistants.length / 4) * 4;  //integer should equal desired number of columns
		for(var i = 0; i < gridCount; i++){
			if(assistants[i]){
				content += `
				<div class="col-lg-3 col-6 px-2 mx-auto my-2">
					<p class="center tight">` + assistants[i] + `</p>
				</div>`;
			}else{
				content += `<div class="col-lg-3 col-6 px-2 mx-auto my-2 spacer"></div>`;
			}
		}

		content += `
		</div>
		
		<h4 class="center mt-4">Thank you to our supporters!</h4>
		<p class="indent">Ut mauris magna, euismod gravida velit eget, faucibus condimentum justo. Cras efficitur arcu id egestas eleifend. </p>`;
	
		// creates a grid of supporter names
		// number of columns is determined by col class (e.g. col-3 = 4 columns, col-6 = 2 columns)
		// builds as many rows as needed, incomplete row will have left aligned values
		content += `<div class="row col-10 m-auto">`;
		var gridCount = Math.ceil(supporters.length / 4) * 4;  //integer should equal desired number of columns
		for(var i = 0; i < gridCount; i++){
			if(supporters[i]){
				content += `
				<div class="col-lg-3 col-6 px-2 mx-auto my-2">
					<p class="center tight">` + supporters[i] + `</p>
				</div>`;
			}else{
				content += `<div class="col-lg-3 col-6 px-2 mx-auto my-2 spacer"></div>`;
			}
		}

		content += `
		</div>
		
		<h3 id="data" class="mt-5">About Our Data</h3>
			<p class="indent">Pellentesque est risus, lobortis eu porttitor id, vehicula nec ex. Donec augue nunc, elementum eu ante nec, efficitur euismod urna. Sed pulvinar tempus odio et dictum. Praesent molestie orci ac sem elementum, sit amet pulvinar felis mattis. Curabitur ut ultricies est.</p>`;
			content += this.buildDefinitionTable();
					
		content += `<h3 id="publications" class="mt-5">Publications</h3>
		<div>`;
		if(publications.length > 0){
			// creates a list of publication references, adjusting for presence of links
			for(var i = 0; i < publications.length; i++){
				content += `<p class="indent">`+ publications[i].author + `. ` + publications[i].date + `. `;
				if(publications[i].link){ 
					content += `<a href="` + publications[i].link + `"><i>` + publications[i].name + `</i></a>. `;
				}else{
					content += `<i>` + publications[i].name + `</i>. `;
				}
				if(publications[i].publication){
					content +=  publications[i].publication + `. `;
				}
				content += `</p>`;
			}
		}else{
			content += `<p>No publications available</p>`;
		}
		content += `</div>
		
		<h3 id="presentations" class="mt-5">Presentations</h3>
		<div>`;
		
		if(presentations.length > 0){
			// creates a list of presentations references, adjusting for presence of links
			for(var i = 0; i < presentations.length; i++){
				content += `<p class="indent">`+ presentations[i].author + `. ` + presentations[i].date + `. `;
				if(presentations[i].link){ 
					content += `<a href="` + presentations[i].link + `">` + presentations[i].name + `</a>. `;
				}else{
					content += presentations[i].name + `. `;
				}
				if(presentations[i].event){
					content +=  presentations[i].event + `. `;
				}
				content += `</p>`;
			}
		}else{
			content += `<p>No presentations available</p>`;
		}
		content += `</div>
	</div>`;
	
	return content;
}

// creates a table of terms and definitions with a JS controlled search bar
exports.buildDefinitionTable = function(){
	var table = `<div id="dataDefinitions" class="mb-3">
		<h4 id="definitions" class="center">Data Definitions</h4>
		<input type="text" id="dataDefinitionSearch" class="col-12 mb-3" onkeyup="refineTable(this,'dataTerm')" placeholder="Search for term...">
		<div id="dataDefinitionsTableHolder">
			<table id="dataDefinitionsTable">
				<tr>
					<th class="col-2">Type</th>
					<th class="col-2">Term</th>
					<th class="col">Definition</th>
				</tr>`;
			for(var i = 0; i < definitions.length; i++){
				table += `<tr>
						<td class="col-3">` + definitions[i].type + `</td>
						<td class="col-3 dataTerm">` + definitions[i].term + `</td>
						<td class="col">` + definitions[i].definition + `</td>
					</tr>`;
			}
			table += `</table>
		</div>
	</div>`;
	
	return table;
}