var Helpers = {
	maxVisibleWorkDescriptionLength : 20,
	minWorkDescriptionLength : 5,
	maxWorkTime : 600,
	validateWorkEntry: function(description,minutes) {
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

	formatWorkDescription: function(description) {
		if (description.length > Helpers.maxVisibleWorkDescriptionLength) {
			description = `${description.substr(0,Helpers.maxVisibleWorkDescriptionLength)}...`;
		}
		return description;
	},

	formatTime: function(time) {
		var hours = Math.floor(time / 60);
		var minutes = time % 60;
		if (hours == 0 && minutes == 0) return "";
		if (minutes < 10) minutes = `0${minutes}`;
		return `${hours}:${minutes}`;
	}
};


var projects = [];



var UI = setupUI();
var App = setupApp(UI);

UI.init();

// hard coding some initial data
App.addProject("client features");
App.addProject("overhead");
App.addProject("backlog");


// **************************





function findProjectEntry(projectId) {
	for (let i = 0; i < projects.length; i++) {
		if (projects[i].id === projectId) {
			return projects[i];
		}
	}
}

function setupWorkDescription(workdesc,$workDescription) {
	$workDescription.text(Helpers.formatWorkDescription(workdesc));

	if (workdesc.length > Helpers.maxVisibleWorkDescriptionLength) {
		$workDescription
			.addClass("shortened")
			.on("click",function onClick(){
				$workDescription
					.removeClass("shortened")
					.off("click",onClick)
					.text(workdesc);
			});
	}
}


function setupUI(){

	const projectTemplate = "<div class='project-entry'><h3 class='project-description' rel='js-project-description'></h3><ul class='work-entries' rel='js-work-entries'></ul><span class='work-time' rel='js-work-time'></span></div>";
	const workEntryTemplate = "<li class='work-entry'><span class='work-time' rel='js-work-time'></span><span class='work-description' rel='js-work-description'></span></li>";
	var $workEntryForm;
	var $workEntrySelectProject;
	var $workEntryDescription;
	var $workEntryTime;
	var $workEntrySubmit;
	var $totalTime;
	var $projectList;

	var projectsUI = [];

	var UIapi = {
		init: initUI,
		addProjectToList: addProjectToList,
		addProjectSelection: addProjectSelection,
		addWorkEntryToList: addWorkEntryToList,
		updateProjectTotalTime: updateProjectTotalTime,
		updateWorkLogTotalTime: updateWorkLogTotalTime,

	};

	return UIapi;

	function findProjUI(projId){
		var $projectEntry;
		for (const p in projectsUI) {
			var proj = projectsUI[parseInt(p)];
			if (proj.id == projId) {
				$projectEntry = proj;
				break;
			}
		}
		return $projectEntry;
	}
	

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
		var projName = $workEntrySelectProject.val();
		var description = $workEntryDescription.val();
		var minutes = $workEntryTime.val();
	
		if (!Helpers.validateWorkEntry(description,minutes)) {
			alert("Oops, bad entry. Try again.");
			$workEntryDescription[0].focus();
			return;
		}
	
		$workEntryDescription.val("");
		$workEntryTime.val("");
		App.addWorkToProject(projName,description,Number(minutes));
		$workEntryDescription[0].focus();
	}

	// to do
	function addProjectToList(projectid, projName) {
		var $project = $(projectTemplate);
		var projectEntryUI = { id: projectid, project: $project, work: [] };
		projectsUI.push(projectEntryUI);
		$project.find("[rel*=js-project-description]").text(projName);
		$projectList.append($project);

	}

	function addProjectSelection(projName) {
		var $option = $("<option></option>");
		$option.text(projName);
		$workEntrySelectProject.append($option);
	}

	function addWorkEntryToList(workid, workdesc, worktime, projId) {
		// UI container of project
		var $projectEntry;
		for (const p in projectsUI) {
			var proj = projectsUI[parseInt(p)];
			if (proj.id == projId) {
				$projectEntry = proj;
				break;
			}
		}
		var $workEntry = $(workEntryTemplate);
		console.log($projectEntry);
		var $projectWorkEntries = $projectEntry.project.find("[rel*=js-work-entries]");
	
		// create a new DOM element for the work entry
		var wid = workid;
		$workEntry.find("[rel*=js-work-time]").text(Helpers.formatTime(worktime));
		// the ... parts
		setupWorkDescription(workdesc,$workEntry.find("[rel*=js-work-description]"));
		// to do need to find the right place
		var index = App.getWorkEntryLocation(proj.id, wid);
		$projectEntry.work.splice(index,0,{id: wid, work: $workEntry});
		var workCount = App.getWorkEntryCount(proj.id);
		// multiple work entries now?
		// to do
		if (workCount > 1) {
			// insert the entry into the correct location in DOM
			if (index < (workCount - 1)) {
				$projectEntry.work[index + 1].work.before($workEntry);
			}
			else {
				$projectEntry.work[index - 1].work.after($workEntry);
			}
			
		}
		// otherwise, just the first entry
		else {
			$projectEntry.project.addClass("visible");
			$projectWorkEntries.append($workEntry);
		}
	}

	function updateProjectTotalTime(projId, projtime) {
		var $projectEntry = findProjUI(projId).project;
		$projectEntry.find("> [rel*=js-work-time]").text(Helpers.formatTime(projtime)).show();
	}

	function updateWorkLogTotalTime() {
		if (projects.time > 0) {
			$totalTime.text(Helpers.formatTime(projects.time)).show();
		}
		else {
			$totalTime.text("").hide();
		}
	}
}

function setupApp(UI){

	var APPapi = {
		addProject: addProject,
		addWorkToProject: addWorkToProject,
		getWorkEntryCount: getWorkEntryCount,
		getWorkEntryLocation: getWorkEntryLocation,
	};

	return APPapi;

	function getWorkEntryLocation(projectId, workId){
		let entryIdx;
		let k = getWorkEntryCount(projectId);
		// find where the entry sits in the new sorted list
		for (let i = 0; i < k; i++) {
			console.log(this);
			var x = findProjectEntry(projectId);
			console.log(x);
			if (x.work[i].id === workId) {
				entryIdx = i;
				break;
			}
		}
		return entryIdx;
	};

	function getWorkEntryCount(projectId){
		var projectEntryData = findProjectEntry(projectId);
		return projectEntryData.work.length;
	}

	function addProject(description) {
		var projectEntryData;
	
		{ let projectId;
			projectId = Math.round(Math.random()*1E4);
			projectEntryData = { id: projectId, description: description, work: [], time: 0 };
		}
		projects.push(projectEntryData);
		UI.addProjectToList(projectEntryData.id, projectEntryData.description);
		UI.addProjectSelection(projectEntryData.description);
	}

	function addWorkToProject(projName,description,minutes) {
		var projectId = findProj(projName).id;
		projects.time = (projects.time || 0) + minutes;
	
		// fetch rel project
		var projectEntryData = findProjectEntry(projectId);
		projectEntryData.time = (projectEntryData.time || 0) + minutes;
	
		// create a new work entry for the list
		// create object to represent the work & push it
		var workEntryData = { id: projectEntryData.work.length + 1, description: description, time: minutes };
		
		projectEntryData.work.push(workEntryData);
	
		// multiple work entries now?
		// for sorting reasons
		if (projectEntryData.work.length > 1) {
			// sort work entries in descending order of time spent
			projectEntryData.work = projectEntryData.work.slice().sort(function sortTimeDescending(a,b){
				return b.time - a.time;
			});
		}
	
		// add work to project square
		UI.addWorkEntryToList(workEntryData.id, workEntryData.description, workEntryData.time, projectEntryData.id);
		// update the total project time
		UI.updateProjectTotalTime(projectEntryData.id, projectEntryData.time);
		// update the total time
		UI.updateWorkLogTotalTime();
	}

}


function findProj(projName){
	var $projectEntry;
	for (const p in projects) {
		var proj = projects[parseInt(p)];
		if (proj.description == projName) {
			$projectEntry = proj;
			break;
		}
	}
	return $projectEntry;
}
