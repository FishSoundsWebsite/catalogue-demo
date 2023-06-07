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
	console.log(q.pathname);
	// allows elements in the /public/ folder to be accessible to other functions/pages
	if(q.pathname.match(/^\/public\/(.*)/)){
		fs.readFile('.' + q.pathname, function (err, data) {
			if (err){
				console.log(err);
				res.end();
			}else{
				var suffix = q.pathname.split(".");
				switch(suffix[suffix.length - 1]){
					case 'js':
						res.writeHead(200, {'Content-Type': 'text/javascript'});
						break;
					case 'png':
					case 'jpg':
						res.writeHead(200, {'Content-Type': 'image/' + suffix[suffix.length - 1]});
						break;
					default:
						res.writeHead(200, {'Content-Type': 'text/' + suffix[suffix.length - 1]});
				}
				res.write(data);
				res.end();
			}
		});
	}else{
		switch(q.pathname){
			case '/':
				res.writeHead(303, {'Location': './index.js'});
				res.end();
				break;
			case '/index.js':
				var data = {stats: {}};
				
				var fishSchema = require('./schemas/fish.js');
				var obsSchema = require('./schemas/observation.js');
				var recSchema = require('./schemas/recording.js');
				var refSchema = require('./schemas/reference.js');
				
				var fishList = await recSchema.getHighlightList();
				var highlighted = await fishSchema.getHighlightedSpecies(fishList);
				data.highlighted = highlighted;
				
				var latestObsId = await obsSchema.getLatest();
				var latestObs = await fishSchema.read(latestObsId);
				var obsCount = await obsSchema.getCount();
				data.stats.latestObs = latestObs;
				data.stats.obsCount = obsCount;
				
				var refCount = await refSchema.getCount();
				data.stats.refCount = refCount;
				
				var recCount = await recSchema.getCount();
				var latestRec = await recSchema.getLatest();
				data.stats.latestRec = latestRec;
				data.stats.recCount = recCount;
				
				render('index.js',data,res);
				break;
			case '/about.js':
				var data = {};
				render('about.js',data,res);
				break;
			case '/how-to-cite.js':
				var data = {};
				render('how-to-cite.js',data,res);
				break;
			//search page for fish
			case '/results-fish.js':
				var fishSchema = require('./schemas/fish.js');
				var data = {"q": {},"codelists": {},"page": 1};
				data.codelists = await getCodeLists("fish");
				
				//if there is a get array, pull the values; store page value if present
				if(q.search){
					var params = qs.parse(q.search.substr(1));
					if(params["page"]){ data.page = params["page"]; }
				}
				
				//if a search was submitted, parse values, search for results and render
				if(req.method === 'POST'){
					collectRequestData(req, async function(searchQuery){
						var selects = ['regions','climates','waters','sources'];
						for(var i = 0; i < selects.length; i++){
							if(searchQuery[selects[i]] && !Array.isArray(searchQuery[selects[i]])){ searchQuery[selects[i]] = searchQuery[selects[i]].split(";"); }
						}
						//if multiple sort values ended up submitted (result of submitting sorts back to back), only keep the last value
						if(Array.isArray(searchQuery.sort)){ searchQuery.sort = searchQuery.sort[searchQuery.sort.length - 1]; }
						searchResults = await fishSchema.search(searchQuery,data.page);
						
						data.q = searchQuery;
						data.results = searchResults.results;
						data.count = searchResults.count;
						
						render('results-fish.js',data,res);
					});
				//else search for results using blank or get array (breadcrumb searching) parameters and render
				}else{
					for(item in params){ if(item != "page"){ data.q[item] = decodeURI(params[item]); } }
					searchResults = await fishSchema.search(params,data.page);
					
					data.results = searchResults.results;
					data.count = searchResults.count;
					
					render('results-fish.js',data,res);
				}
				
				break;
			//single result page for fish
			case '/fish.js':
				var publicId = qs.parse(q.search.substr(1)).id;
				var data = {};
				
				var fishSchema = require('./schemas/fish.js');
				var id = await fishSchema.getId(publicId);
				data.fish = await fishSchema.read(id);
				
				var obsSchema = require('./schemas/observation.js');
				var references = await obsSchema.read({fishId:id});
				data.references = references.sort(function compare(a,b){ return a.reference.year < b.reference.year ? 1 : -1; });
				
				var recSchema = require('./schemas/recording.js');
				var recordings = await recSchema.read({fish:id});
				data.recordings = recordings;
				
				render('fish.js',data,res);
				break;
			//search page for recordings
			case '/results-recordings.js':
				var recSchema = require('./schemas/recording.js');
				var data = {"q": {},"codelists": {},"page": 1,"sort":""};
				data.codelists = await getCodeLists("recSearch");
				
				//if there is a get array, pull the values; store page value if present
				if(q.search){
					var params = qs.parse(q.search.substr(1));
					if(params["page"]){ data.page = params["page"]; }
				}
				
				//if a search was submitted, parse values, search for results and render
				if(req.method === 'POST'){
					collectRequestData(req, async function(searchQuery){
						//if multiple sort values ended up submitted (result of submitting sorts back to back), only keep the last value
						if(Array.isArray(searchQuery.sort)){ searchQuery.sort = searchQuery.sort[searchQuery.sort.length - 1]; }
						if(searchQuery.sort){ data.sort = searchQuery.sort; }
						searchResults = await recSchema.search(searchQuery,data.page);
						
						data.q = searchQuery;
						data.results = searchResults.results;
						data.count = searchResults.count;
						
						render('results-recordings.js',data,res);
					});
				//else search for results using blank or get array (breadcrumb searching) parameters and render
				}else{
					for(item in params){ if(item != "page"){ data.q[item] = decodeURI(params[item]); } }
					searchResults = await recSchema.search(params,data.page);
					
					data.results = searchResults.results;
					data.count = searchResults.count;
					
					render('results-recordings.js',data,res);
				}
				break;
			//single result page for recording
			case '/recording.js':
				var recSchema = require('./schemas/recording.js');
				var publicId = qs.parse(q.search.substr(1)).id;
				var data = {publicId: publicId};
				
				var id = await recSchema.getId(publicId);
				recs = await recSchema.read({_id:id});
				data.recording = recs[0];
				
				render('recording.js',data,res);
				break;
			//search page for references
			case '/results-references.js':
				var refSchema = require('./schemas/reference.js');
				var data = {"q": {},"codelists": {},"page": 1,"sort":""};
				
				var languages = await refSchema.getLanguages();
				data.codelists.languages = {"ungrouped": languages };
				data.yearRange = await refSchema.getYearRange();
				
				//if there is a get array, pull the values; store page value if present
				if(q.search){
					var params = qs.parse(q.search.substr(1));
					if(params["page"]){ data.page = params["page"]; }
				}
				
				//if a search was submitted, parse values, search for results and render
				if(req.method === 'POST'){
					collectRequestData(req, async function(searchQuery){
						if(Array.isArray(searchQuery.sort)){ searchQuery.sort = searchQuery.sort[searchQuery.sort.length - 1]; }
						if(searchQuery.sort){ data.sort = searchQuery.sort; }
						searchResults = await refSchema.search(searchQuery,data.page);
						
						data.q = searchQuery;
						data.results = searchResults.results;
						data.count = searchResults.count;
						
						render('results-references.js',data,res);
					});
				//else search for results using blank or get array (breadcrumb searching) parameters and render
				}else{
					for(item in params){ if(item != "page"){ data.q[item] = decodeURI(params[item]); } }
					searchResults = await refSchema.search(params,data.page);
					
					data.results = searchResults.results;
					data.count = searchResults.count;
					
					render('results-references.js',data,res);
				}
				break;
			//single result page for reference
			case '/reference.js':
				var publicId = qs.parse(q.search.substr(1)).id;
				var data = {};
				
				var refSchema = require('./schemas/reference.js');
				var recSchema = require('./schemas/recording.js');
				var id = await refSchema.getId(publicId);
				data.reference = await refSchema.read(id);
				data.recordings = await recSchema.read({$or:[{citations:id},{'measurements.citation':id}]});
				
				var obsSchema = require('./schemas/observation.js');
				var fish = await obsSchema.read({refId:id});
				data.fish = fish.sort(function compare(a,b){ return a.fish.scientific < b.fish.scientific ? -1 : 1; });
				
				render('reference.js',data,res);
				break;

	/*** AJAX REQUEST ROUTES ***/
			//returns a list of possible values for a given field that match a provided search string
			//used to populate AJAX-triggered search suggestions as users type
			case '/requestList':
				if(req.method === 'POST') {
					collectRequestData(req, async function(data){
						var type = qs.parse(q.search.substr(1)).type;
						var value = qs.parse(q.search.substr(1)).value;
						var schema = require('./schemas/' + qs.parse(q.search.substr(1)).schema + '.js');
						if(schema && value){
							var list = await schema.getList(type,value,data);
							res.end(JSON.stringify(list.sort()));
						}else{
							res.end();
						}
					});
				}
				break;
			//returns the set of taxonomy fields for a given fish species that matches a provided (unique in system) value
			//used to fill higher taxonomy values in the fish search form
			case '/requestBackfill':
				if(req.method === 'POST') {
					collectRequestData(req, async function(){
						var type = qs.parse(q.search.substr(1)).type;
						var value = qs.parse(q.search.substr(1)).value;
						//note: 'scientific' (combined genus and species values) is valid for unique search; genus and species names are reused and can't be searched independently
						if(['order','family','scientific'].includes(type)){ var schema = require('./schemas/fish.js'); }
						if(schema && value){
							var obj = await schema.getBackfill(type,value);
							res.end(JSON.stringify(obj));
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
		case 'fish':
			var lists = [
				{
					type:"region",
					join:"fish",
					lookup:"regions"
				},
				{
					type:"climate",
					join:"fish",
					lookup:"climates"
				},
				{
					type:"water",
					join:"fish",
					lookup:"waters"
				},
				{
					type:"source",
					join:"observations",
					lookup:"sources.source"
				}
			];
			data = await termSchema.getInUseLists(lists);
			break;
		case 'recSearch':
			var lists = [
				{
					type:"region",
					join:"fish",
					lookup:"regions"
				},
				{
					type:"noise",
					join:"recordings",
					lookup:"noises"
				}
			];
			data = await termSchema.getInUseLists(lists);
			break;
		case 'recForm':
			var lists = ["noise"];
			data = await termSchema.getFullLists(lists);
			break;
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