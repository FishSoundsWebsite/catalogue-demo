exports.display = async function(filename,data){
	var page = require('./' + filename);
  // renders the header and footer content
  // includes font, css and script files, including runtime libraries, downloaded libraries, and custom files
	var content = `<!DOCTYPE HTML>
	<html>
		<head>
			<meta charset="utf-8"></meta>
		<!-- fonts and icons -->
			<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css" rel="stylesheet">
			<link href='https://fonts.googleapis.com/css?family=Sansita' rel='stylesheet'>
			<link href='https://fonts.googleapis.com/css?family=Magra' rel='stylesheet'>
			<link href='https://fonts.googleapis.com/css?family=Lato' rel='stylesheet'>
		
		<!-- jquery -->
			<script src="https://code.jquery.com/jquery-3.4.1.js" integrity="sha256-WpOohJOqMqqyKL9FccASB9O0KwACQJpFTUBLTYOVvVU=" crossorigin="anonymous"></script>
		
		<!-- jquery UI -->	
			<link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
			<script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>
		
		<!-- bootstrap -->
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-KyZXEAg3QhqLMpG8r+8fhAXLRk2vvoC2f3B09zVXn8CA5QIVfZOJ3BCsw2P0p/We" crossorigin="anonymous">
			<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-U1DAWAznBHeqEIlVSCgzq+c9gqGAJn5c/t99JyeKa9xxaYpSvHU5awsuZVVFIhvj" crossorigin="anonymous"></script>
							
		<!-- chosen (select input library) -->
			<link rel="stylesheet" href="public/libraries/chosen/chosen.min.css" type="text/css">
			<script type="text/javascript" src="public/libraries/chosen/chosen.jquery.min.js"></script>
		
		<!-- circle player -->
			<link rel="stylesheet" href="public/libraries/circle-player/circle-player.css" type="text/css">
			<script type="text/javascript" src="public/libraries/circle-player/circle-player.js"></script>

		<!-- custom -->	
			<link href="./public/general.css" rel="stylesheet" type="text/css">
			<script src="./public/general.js"></script>
		
			<title>Title</title>
		</head>
		<body>
			<header id="header" class="container-fluid py-0" role="banner">
			  <nav class="navbar navbar-expand-lg row justify-content-between px-3 py-0">
				<div class="col-lg-4 col-11 m-0 p-0">
					<a class="navbar-brand logoImgAnchor nude" href="./index.js">
						<div id="logoImgHolder" class="col-4 m-0 p-0 pe-2 d-xl-table-cell d-lg-none d-table-cell"><img alt="logo - links to index" id="logoImg" class="col-12 pt-1 p-0 m-auto d-xl-block d-lg-none d-block" src="./public/siteLogo.png" role="link"></div>
						<h1 id='siteTitle' class="col-8 m-0 d-table-cell">Title</h1>
					</a>
				</div>
				<button class="navbar-toggler col-1" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
					<i class="fa fa-bars d-md-none d-inline-block"></i>
					<i class="fa fa-bars fa-2x d-md-inline-block d-none"></i>
				</button>
				<div class="col-lg-6 col-12 m-0 p-0">
					<div class="collapse navbar-collapse" id="navbarContent">
						<ul class="navbar-nav row justify-content-end col pe-2">
							<li class="dropdown col-lg-auto col-12 mb-md-1 mb-2 mx-0 px-1">
								<button id="aboutDropdown" class="dropdown-toggle btn nav-item" role="button" data-bs-toggle="dropdown" aria-expanded="false">Learn More</button>
								<ul class="dropdown-menu" aria-labelledby="aboutDropdown">
									<li><a class="dropdown-item" href="./about.js">About Us</a></li>
									<li><a class="dropdown-item" href="./how-to-cite.js">How to Cite</a></li>
								</ul>
							</li>
							<li class="dropdown col-lg-auto col-12 mb-md-1 mb-2 mx-0 px-1">
								<button id="aboutDropdown" class="dropdown-toggle btn nav-item" role="button" data-bs-toggle="dropdown" aria-expanded="false">Search</button>
								<ul class="dropdown-menu" aria-labelledby="aboutDropdown">
									<li><a class="dropdown-item" href="./results-fish.js">Fish Species</a></li>
									<li><a class="dropdown-item" href="./results-references.js">Research Summaries</a></li>
									<li><a class="dropdown-item" href="./results-recordings.js">Sound Recordings</a></li>
								</ul>
							</li>
							<li class="dropdown col-lg-auto col-12 mb-md-1 mb-2 mx-0 px-1">
								<button id="aboutDropdown" class="dropdown-toggle btn nav-item inactive" role="button" data-bs-toggle="dropdown" aria-expanded="false" title="Coming soon!">Profile</button>
								<ul class="dropdown-menu dropdown-menu-end" aria-labelledby="aboutDropdown">
									<li><a class="dropdown-item disabled" href="./login.js" aria-disabled="true">Create Account/Login</a></li>
									<li><a class="dropdown-item disabled" href="./form-reference.js" aria-disabled="true">Submit Reference</a></li>
									<li><a class="dropdown-item disabled" href="./form-recording.js" aria-disabled="true">Submit Recording</a></li>
								</ul>
							</li>
						</ul>
					</div>
				</div>
			  </nav>
			</header>`;

	content += `<main id="main" role="main" class="container-fluid">`;
	content += await page.display(data);	
	content += `</main>`;

	content += `<footer id="footer" class="container-fluid" role="banner">
			<div class="row align-items-center">
			  <div class="col-md-4">
				<img alt="funder logo" class="funderImg mx-auto d-block" src="./public/funderLogo.png">
			  </div>
			  <div class="col-md-4"><p class="fullWidth center"><a href="./how-to-cite.js">How to Cite</a></p></div>
			  <div class="col-md-4 text-center">
				<p class="citation"><a rel="license" href="http://creativecommons.org/licenses/by-nc/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nc/4.0/88x31.png"/></a><br/>This work is licensed under a<br/><a rel="license" href="http://creativecommons.org/licenses/by-nc/4.0/">Creative Commons Attribution-NonCommercial 4.0 International License</a></p>
			  </div>
			</div>
		</footer>`;
	
	content += `</body>
	</html>`;

	return content;
}