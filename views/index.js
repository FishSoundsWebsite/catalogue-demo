var interfaceTools = require('./tools/interfaceBuilderFunctions.js');

//renders the about page (various textual and list info)
exports.display = function(data){
	if(data.tables){
		for(var i = 0; i < data.tables.length; i++){
			var widget = interfaceTools.buildDataList(data.tables[i].table,"section col my-3 mx-5",data.tables[i].size,notes = data.tables[i].notes,search = data.tables[i].search,edit = data.tables[i].edit);
			var regex = new RegExp(`{{WIDGET: "datalist", TYPE: "` + data.tables[i].type + `"}}`.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'));
			data.content = data.content.replace(regex,widget);
		}
	}
	
	var content = `
	<div id="index" class="section col-lg-9 col-12 m-auto p-4">`;
		content += data.content;
	content += `
	</div>`;
	
	return content;
}