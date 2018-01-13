var totalTime;
/*
var p1 = Project("client-features");
var p2 = Project("overhead");
var p3 = Project("backlog");
*/

function Project(description){
	var id = projectId = Math.round(Math.random()*1E4);
	var time;
	var work = [];

	return PublicAPI = {
		getId,
		getDescription,
		getTime,
		addWork,
		getWorkEntryCount,
		getWorkEntryLocation,
	};
	return publicAPI;

	function getId(){
		return id;
	}

	function getDescription(){
		return description;
	}

	function getTime(){
		return time;
	}

	function addWork(workEntryData){
		//var projectEntryData = findProjectEntry(projectId);
		time = (time || 0) + workEntryData.time;
	
		// create a new work entry for the list
		//var workEntryData = { id: work.length + 1, description: description, time: minutes };
		work.push(workEntryData);
	
		// multiple work entries now?
		if (work.length > 1) {
			// sort work entries in descending order of time spent
			work = work.slice().sort(function sortTimeDescending(a,b){
					return b.time - a.time;
				});
		}
			
	}

	function getWorkEntryCount(){
		return work.length;
	}

	function getWorkEntryLocation(workId){
		var index;
		for(let i = 0; i < work.length; i++){
			if(work[i].id == workId){
				index = i; 
				break;
			}		
		}

		if(index < work.length - 1){
			return [ work[index+1].id , /*insertBefore=*/ true]
		}
		else{
			return [ work[index-1].id , /*insertBefore=*/ false]
		}
	}

}


var Helpers = {
	maxVisibleWorkDescriptionLength: 20,
	minWorkDescriptionLength: 5,
	maxWorkTime: 600,

	validateWorkEntry(description,minutes) {
		if (description.length < Helpers.minWorkDescriptionLength) return false;
		if (
			/^\s*$/.test(minutes) ||
			Number.isNaN(Number(minutes)) ||
			minutes < 0 ||
			minutes > Helpers.maxWorkTime
		) {
			return false;
		}

		return true;
	},
	formatWorkDescription(description) {
		if (description.length > Helpers.maxVisibleWorkDescriptionLength) {
			description = `${description.substr(0,Helpers.maxVisibleWorkDescriptionLength)}...`;
		}
		return description;
	},
	formatTime(time) {
		var hours = Math.floor(time / 60);
		var minutes = time % 60;
		if (hours == 0 && minutes == 0) return "";
		if (minutes < 10) minutes = `0${minutes}`;
		return `${hours}:${minutes}`;
	}
};

var UI = setupUI();
UI.init();

var App = setupApp(UI);

// hard coding some initial data
/*
var clientFeatures = Project("client features");
var overhead = Project("overhead");
var backlog = Project("backlog");
*/

App.addProject("client features");
App.addProject("overhead");
App.addProject("backlog");




// **************************

function setupUI() {

	const projectTemplate = "<div class='project-entry'><h3 class='project-description' rel='js-project-description'></h3><ul class='work-entries' rel='js-work-entries'></ul><span class='work-time' rel='js-work-time'></span></div>";
	const workEntryTemplate = "<li class='work-entry'><span class='work-time' rel='js-work-time'></span><span class='work-description' rel='js-work-description'></span></li>";

	var $workEntryForm;
	var $workEntrySelectProject;
	var $workEntryDescription;
	var $workEntryTime;
	var $workEntrySubmit;
	var $totalTime;
	var $projectList;

	var projectElements = {};
	var workElements = {};

	var publicAPI = {
		init: initUI,
		addProjectToList: addProjectToList,
		addProjectSelection: addProjectSelection,
		addWorkEntryToList: addWorkEntryToList,
		updateProjectTotalTime: updateProjectTotalTime,
		updateWorkLogTotalTime: updateWorkLogTotalTime
	};

	return publicAPI;

	// **************************

	function initUI() {
		$workEntryForm = $("[rel*=js-work-entry-form");
		$workEntrySelectProject = $workEntryForm.find("[rel*=js-select-project]");
		$workEntryDescription = $workEntryForm.find("[rel*=js-work-description]");
		$workEntryTime = $workEntryForm.find("[rel*=js-work-time]");
		$workEntrySubmit = $workEntryForm.find("[rel*=js-submit-work-entry]");
		$totalTime = $("[rel*=js-total-work-time]");
		$projectList = $("[rel*=js-project-list]");

		$workEntrySubmit.on("click",submitNewWorkEntry);
	}

	function submitNewWorkEntry() {
		var projectId = $workEntrySelectProject.val();
		var description = $workEntryDescription.val();
		var minutes = $workEntryTime.val();

		if (!Helpers.validateWorkEntry(description,minutes)) {
			alert("Oops, bad entry. Try again.");
			$workEntryDescription[0].focus();
			return;
		}

		$workEntryDescription.val("");
		$workEntryTime.val("");
		App.addWorkToProject(Number(projectId),description,Number(minutes));
		$workEntryDescription[0].focus();
	}

	function addProjectToList(project) {
		var $project = $(projectTemplate);
		$project.attr("data-project-id",project.getId());
		$project.find("[rel*=js-project-description]").text(project.getDescription());
		$projectList.append($project);
		projectElements[project.getId()] = $project;
	}

	function addProjectSelection(project) {
		var $option = $("<option></option>");
		$option.attr("value",project.getId());
		$option.text(project.getDescription());
		$workEntrySelectProject.append($option);
	}

	function addWorkEntryToList(project,workEntryData) {
		debugger;
		var $projectEntry = projectElements[project.getId()];
		var $projectWorkEntries = $projectEntry.find("[rel*=js-work-entries]");

		// create a new DOM element for the work entry
		var $workEntry = $(workEntryTemplate);
		$workEntry.attr("data-work-entry-id",workEntryData.id);
		$workEntry.find("[rel*=js-work-time]").text(Helpers.formatTime(workEntryData.time));
		setupWorkDescription(workEntryData,$workEntry.find("[rel*=js-work-description]"));

		workElements[workEntryData.id] = $workEntry;

		// multiple work entries now?
		if (project.getWorkEntryCount() > 1) {
			{ let adjacentWorkEntryId, insertBefore;
				[ adjacentWorkEntryId, insertBefore ] = project.getWorkEntryLocation(workEntryData.id);

				if (insertBefore) {
					workElements[adjacentWorkEntryId].before($workEntry);
				}
				else {
					workElements[adjacentWorkEntryId].after($workEntry);
				}
			}
		}
		// otherwise, just the first entry
		else {
			$projectEntry.addClass("visible");
			$projectWorkEntries.append($workEntry);
		}
	}

	function setupWorkDescription(workEntryData,$workDescription) {
		$workDescription.text(Helpers.formatWorkDescription(workEntryData.description));

		if (workEntryData.description.length > Helpers.maxVisibleWorkDescriptionLength) {
			$workDescription
				.addClass("shortened")
				.on("click",function onClick(){
					$workDescription
						.removeClass("shortened")
						.off("click",onClick)
						.text(workEntryData.description);
				});
		}
	}

	function updateProjectTotalTime(project) {
		var $projectEntry = projectElements[project.getId()];
		$projectEntry.find("> [rel*=js-work-time]").text(Helpers.formatTime(project.getTime())).show();
	}

	function updateWorkLogTotalTime(time) {
		if (time > 0) {
			$totalTime.text(Helpers.formatTime(time)).show();
		}
		else {
			$totalTime.text("").hide();
		}
	}
}


// ****************************************************************
// ****************************************************************


function setupApp(UI) {
	var projects = [];
	var totalTime = 0;

	var publicAPI = {
		addProject: addProject,
		addWorkToProject: addWorkToProject,
	};

	return publicAPI;

	// **************************

	function addProject(decription) {

		var project = Project(decription);
		projects.push(project)

		UI.addProjectToList(project);
		UI.addProjectSelection(project);
	}

	function findProjectEntry(projectId) {
		for (let i = 0; i < projects.length; i++) {
			if (projects[i].getId() === projectId) {
				return projects[i];
			}
		}
	}

	function addWorkToProject(projectId, description, minutes){
		totalTime = (totalTime || 0) + minutes;
		var project = findProjectEntry(projectId);
		var workEntryData = { id: project.getWorkEntryCount() + 1, description: description, time: minutes };
		project.addWork(workEntryData);
		UI.addWorkEntryToList(project,workEntryData);
		UI.updateProjectTotalTime(project);
		UI.updateWorkLogTotalTime(totalTime);

	}
}
