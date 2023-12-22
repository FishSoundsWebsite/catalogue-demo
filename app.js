// loading various libraries and files used to create the server or route requests
var connect = require('connect');				//external library used to define the app; offers clearer routing functions than basic node.js
const http = require('http');					//standard node.js library used to create the server
var url = require('url');						//standard node.js library used to parse incoming requests
const fs = require('fs');						//standard node.js library used to access and process files on the server
var qs = require('querystring');				//external library used to work with get array in url
var keys = require('./keys.json');				//data file that imports passwords, etc.; ignored by public ignore.git so these values are not shared
const hostname = keys.hostname;
const port = keys.port;

var app = connect();
var post = {};
global.window = { screen: {} }
global.document = {
	documentElement: { style: {} },
	getElementsByTagName: () => { return [] },
	createElement: () => { return {} }
}
global.navigator = { userAgent: 'nodejs', platform: 'nodejs' }

//parses submitted url, directs/processes data accordingly and returns the page content
app.use(async function(req,res){
	var q = url.parse(req.url, true);
	
	// allows elements in the /public/ folder to be accessible to other functions/pages
	if(q.pathname.match(/^\/public\/(.*)/)){
		fs.readFile('.' + q.pathname, function (err, data) {
			if (err){
				console.log(err);
				res.writeHead(200, {'Content-Type': 'text/html'});
				res.write("Image Missing");
				res.end();
			}else{
				if(!q.pathname.match(/nocache/)){
					res.setHeader('Cache-Control', 'max-age=100800');
				}
				var suffix = q.pathname.split(".");
				switch(suffix[suffix.length - 1]){
					case 'js':
						res.setHeader('Content-Type', 'text/javascript');
						res.writeHead(200, {'Content-Type': 'text/javascript'});
						break;
					case 'png':
					case 'jpg':
						res.setHeader('Content-Type', 'image/' + suffix[suffix.length - 1]);
						res.writeHead(200, {'Content-Type': 'image/' + suffix[suffix.length - 1]});
						break;
					case 'mp4':
						res.setHeader('Content-Type', 'video/mp4');
						res.writeHead(200, {'Content-Type': 'video/mp4'});
						break;
					default:
						res.setHeader('Content-Type', 'text/' + suffix[suffix.length - 1]);
						res.writeHead(200, {'Content-Type': 'text/' + suffix[suffix.length - 1]});
				}
				res.write(data);
				res.end();
			}
		});
	}else{
		console.log(q.pathname);
		switch(q.pathname){
			case '/':
				res.writeHead(303, {'Location': './index.js'});
				res.end();
				break;
			case '/index.js':
				var data = {stats: {}};
				
				var contentSchema = require('./schemas/content.js');
				data.content = await contentSchema.read("Homepage");
				
				render('index.js',data,res);
				break;

			case '/about.js':
				var data = {};
				
				var contentSchema = require('./schemas/content.js');
				var versionSchema = require('./schemas/version.js');
				
				data.content = await contentSchema.read("About");
				
				var versions = await versionSchema.list();
				var versionTable = {
					id: "versions",
					title: "Data and Website Version History",
					data:{
						headings:[
							{id:"date",label:"Date",size:"col-2"},
							{id:"number",label:"Version",size:"col-2"},
							{id:"description",label:"Description",size:"col"}
						],
						rows:[]
					}
				};
	
				for(var i = 0; i < versions.length; i++){
					var row = [];
					row.push({id:"date",value:versions[i].date.toISOString().split('T')[0],size:"col-2"});
					row.push({id:"number",value:versions[i].number,size:"col-2"});
					row.push({id:"description",value:versions[i].description,size:"col",limit:125});
					versionTable.data.rows.push(row);
				}
				
				data.tables = [
					{
						type:"versions",
						table:versionTable,
						size:"auto",
						search:false
					}
				];
				
				render('about.js',data,res);
				break;
			//search page for fish
			case '/results-fish.js':
				var fishSchema = require('./schemas/fish.js');
				var data = {"q": {},"codelists": {}};
				data.codelists = await getCodeLists("results-fish");

				//if there is a GET array, pull expected values
				if(q.search){
					var params = {};
					var urlparams = qs.parse(q.search.substr(1));
					for(item in urlparams){
						params[item] = String(urlparams[item]);
					}
				}
			
				
				//if a search was submitted, parse values, search for results and render
				if(req.method === 'POST'){
					collectRequestData(req, async function(searchQuery){
						var selects = ['regions','climates','waters','sources'];
						for(var i = 0; i < selects.length; i++){
							if(searchQuery[selects[i]] && !Array.isArray(searchQuery[selects[i]])){ searchQuery[selects[i]] = searchQuery[selects[i]].split(";"); }
						}
						searchResults = await fishSchema.search(searchQuery);
						
						data.q = searchQuery;
						data.results = searchResults.results;
						data.count = searchResults.count;
						data.page = searchResults.page;
						
						render('results-fish.js',data,res);
					});
				//else search for results using blank or get array (breadcrumb searching) parameters and render
				}else{
					for(item in params){ data.q[item] = String(decodeURI(params[item])); }
					searchResults = await fishSchema.search(params);
					
					data.results = searchResults.results;
					data.count = searchResults.count;
					data.page = searchResults.page;
					
					render('results-fish.js',data,res);
				}
				break;
			//single result page for fish
			case '/fish.js':
				var publicId = String(qs.parse(q.search.substr(1)).id);
				var data = {};
				
				var fishSchema = require('./schemas/fish.js');
				data.fish = await fishSchema.read(publicId);
				data.regions = await fishSchema.getRegions(publicId);
				
				var regionSchema = require('./schemas/region.js');
				data.files = await regionSchema.list({type:"fao"});
				
				var obsSchema = require('./schemas/observation.js');
				var references = await obsSchema.read({'fish.publicId':publicId});
				data.references = references.sort(function compare(a,b){ return a.reference.year < b.reference.year ? 1 : -1; });
				
				var recSchema = require('./schemas/recording.js');
				data.recordings = await recSchema.read({'fish.publicId':publicId});
				
				render('fish.js',data,res);
				break;
			
			//search page for recordings
			case '/results-recordings.js':
				var recSchema = require('./schemas/recording.js');
				var refSchema = require('./schemas/reference.js');
				var data = {"q": {},"codelists": {}};
				data.codelists = await getCodeLists("results-recordings");
				
				//if there is a GET array, pull expected values
				if(q.search){
					var params = {};
					var urlparams = qs.parse(q.search.substr(1));
					for(item in urlparams){
						switch(item){
						// add cases here to allow GET-based searches
							// case "item-name":
 							//	params["item-name"] = String(urlparams[item]);
 							//	break;
						}
					}
				}
				
				//if a search was submitted, parse values, search for results and render
				if(req.method === 'POST'){
					collectRequestData(req, async function(searchQuery){						
						searchResults = await recSchema.search(searchQuery,data.page);
						
						data.q = searchQuery;
						data.results = searchResults.results;
						data.count = searchResults.count;
						data.page = searchResults.page;
						
						render('results-recordings.js',data,res);
					});
				//else search for results using blank or get array (breadcrumb searching) parameters and render
				}else{
					for(item in params){ if(item != "page"){ data.q[item] = decodeURI(params[item]); } }
					searchResults = await recSchema.search(params,data.page);
					
					data.results = searchResults.results;
					data.count = searchResults.count;
					data.page = searchResults.page;
					
					render('results-recordings.js',data,res);
				}
				break;
			//single result page for recording
			case '/recording.js':
				var recSchema = require('./schemas/recording.js');
				var publicId = String(qs.parse(q.search.substr(1)).id);
				var data = {publicId: publicId};
				
				recs = await recSchema.read({publicId:publicId});
				data.recording = recs[0];
				
				render('recording.js',data,res);
				break;
			//search page for references
			case '/results-references.js':
				var refSchema = require('./schemas/reference.js');
				var data = {"q": {"gray": "on"},"codelists": {}};
				data.codelists = await getCodeLists("results-references");
				data.yearRange = await refSchema.getYearRange();
				
				//if there is a GET array, pull expected values
				if(q.search){
					var params = {};
					var urlparams = qs.parse(q.search.substr(1));
					for(item in urlparams){
						switch(item){
						// add cases here to allow GET-based searches
							// case "item-name":
 							//	params["item-name"] = String(urlparams[item]);
 							//	break;
						}
					}
				}
					
				//if a search was submitted, parse values, search for results and render
				if(req.method === 'POST'){
					collectRequestData(req, async function(searchQuery){
						searchResults = await refSchema.search(searchQuery);
						
						data.q = searchQuery;
						data.results = searchResults.results;
						data.count = searchResults.count;
						data.page = searchResults.page;
						
						render('results-references.js',data,res);
					});
				//else search for results using blank or get array (breadcrumb searching) parameters and render
				}else{
					for(item in params){ data.q[item] = decodeURI(params[item]); }
					searchResults = await refSchema.search(data.q);
					
					data.results = searchResults.results;
					data.count = searchResults.count;
					data.page = searchResults.page;
					
					render('results-references.js',data,res);
				}
				break;
			//single result page for reference
			case '/reference.js':
				var publicId = String(qs.parse(q.search.substr(1)).id);
				var data = {};
				
				var refSchema = require('./schemas/reference.js');
				var recSchema = require('./schemas/recording.js');

				data.reference = await refSchema.read(publicId);
				data.recordings = await recSchema.read({$or:[{'citations.publicId':data.reference.publicId},{'measurements.citation.publicId':data.reference.publicId}]});
				
				var obsSchema = require('./schemas/observation.js');
				var fish = await obsSchema.read({'reference.publicId':publicId});
				data.fish = fish.sort(function compare(a,b){ return a.fish.title < b.fish.title ? -1 : 1; });
				
				render('reference.js',data,res);
				break;

	/*** AJAX REQUEST ROUTES ***/
			//returns a list of possible values for a given field that match a provided search string
			//used to populate AJAX-triggered search suggestions as users type
			case '/requestList':
				if(req.method === 'POST') {
					collectRequestData(req, async function(data){
						var type = String(qs.parse(q.search.substr(1)).type);
						var value = String(qs.parse(q.search.substr(1)).value);
						var split = Number(qs.parse(q.search.substr(1)).split) == 1 ? true : false;
						var schema = require('./schemas/' + String(qs.parse(q.search.substr(1)).schema) + '.js');
						if(schema && value){
					//		if(data){
					//			var list = await schema.getTaxonomyList(type,value,data);
					//		}else{
								var list = await schema.getSelectList(type,value,split);
					//		}
							res.writeHead(200, {'Content-Type': 'text/javascript'});
							res.end(JSON.stringify(list.sort()));
						}else{
							res.end();
						}
					});
				}
				break;
			default:
				res.writeHead(404);
				var data = {};
				render('404.js',data,res);
				break;
		}
	}
});

const server = http.createServer(app).listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
});

// Helper function to pull sets of codelists for search and submission forms
	//Note use of two functions (getFullLists() and getInUseLists()) depending on desired results
//called by app.js routes above
async function getCodeLists(type){
	var data = {};
	var termSchema = require('./schemas/term.js');

	switch(type){
		case 'results-fish':
			var lists = [
				{
					schema:"region",
					request:"search",
					type:"fao",
					join:"fish",
					lookup:"regions",
					name:"region"
				},
				{
					schema:"term",
					request:"search",
					type:"climate",
					join:"fish",
					lookup:"climates",
					name:"climate"
				},
				{
					schema:"term",
					request:"search",
					type:"water",
					join:"fish",
					lookup:"waters",
					name:"water"
				},
				{
					schema:"term",
					request:"search",
					type:"source",
					join:"observations",
					lookup:"sources.source",
					name:"source"
				}
			];
			break;
		case 'results-references':
			var lists = [
				{
					schema:"reference",
					request:"form",
					type:"language",
					name:"languages"
				}
			];
			break;
		case 'results-recordings':
			var lists = [
				{
					schema:"region",
					request:"search",
					type:"fao",
					join:"fish",
					lookup:"regions",
					name:"region"
				},
				{
					schema:"term",
					request:"search",
					type:"noise",
					join:"recordings",
					lookup:"noises",
					name:"noise"
				}
			];
			break;
	}
	
	if(lists){
		for(var i = 0; i < lists.length; i++){
			var schema = require('./schemas/' + lists[i].schema + '.js');
			if(lists[i].request == "form"){
				data[lists[i].name] = await schema.getFullList(lists[i]);
			}else{
				data[lists[i].name] = await schema.getInUseList(lists[i]);
			}
		}
	}
	return data;

}

// Helper function to collect and parse data from form submissions (search forms)
async function collectRequestData(request, callback) {
	const FORM_URLENCODED = 'application/x-www-form-urlencoded';
	if(request.headers['content-type'] === FORM_URLENCODED) {
		let body = '';
		request.on('data', function(chunk){
			body += chunk.toString();					 
		});
		request.on('end', function(){
			callback(qs.parse(body));
		});
	}
	else if (request.headers['content-type'] == 'application/json') {
		let body = '';
		request.on('data', function(chunk){
			body += chunk.toString();					 
		});
		request.on('end', function(){
			if(body){ callback(JSON.parse(body)); }else{ callback(); }
		});
	}
	else {
		callback(null);
	}
	
	return;
}

// Helper function that displays the header framework and the applicable page content
async function render(filename, data, res) {
	var header = require('./views/header.js');
	var page = await header.display(filename,data);
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end(page);
}