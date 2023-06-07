//renders a 404 page
exports.display = function(data){
	var content = `
	<div id="404" class="row">
		<p id="pageNotFound">Page Not Found</p>
	</div>`;
	return content;
}