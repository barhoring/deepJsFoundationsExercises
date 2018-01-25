var Helpers = {
	maxVisibleWorkDescriptionLength: 20,
	minWorkDescriptionLength: 5,
	maxWorkTime: 600,

	validateWorkEntry() {
		description = this.description;
		minutes = this.minutes;
		if (description.length < this.minWorkDescriptionLength) return false;
		if (
			/^\s*$/.test(minutes) ||
			Number.isNaN(Number(minutes)) ||
			minutes < 0 ||
			minutes > this.maxWorkTime
		) {
			return false;
		}

		return true;
	},
	formatWorkDescription(description) {
		if (description.length > this.maxVisibleWorkDescriptionLength) {
			description = `${description.substr(0, this.maxVisibleWorkDescriptionLength)}...`;
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

//var UI = setupUI();
//UI.init();
/*
var App = setupApp(UI);
App.init();
*/

var UI = Object.assign(Object.create(Helpers), {
	projectTemplate: "<div class='project-entry'><h3 class='project-description' rel='js-project-description'></h3><ul class='work-entries' rel='js-work-entries'></ul><span class='work-time' rel='js-work-time'></span></div>",
	workEntryTemplate: "<li class='work-entry'><span class='work-time' rel='js-work-time'></span><span class='work-description' rel='js-work-description'></span></li>",
	
	initUI() {
		this.projectElements =  {},
		this.workElements =  {},
		this.$workEntryForm = $("[rel*=js-work-entry-form");
		this.$workEntrySelectProject = this.$workEntryForm.find("[rel*=js-select-project]");
		this.$workEntryDescription = this.$workEntryForm.find("[rel*=js-work-description]");
		this.$workEntryTime = this.$workEntryForm.find("[rel*=js-work-time]");
		this.$workEntrySubmit = this.$workEntryForm.find("[rel*=js-submit-work-entry]");
		this.$totalTime = $("[rel*=js-total-work-time]");
		this.$projectList = $("[rel*=js-project-list]");
		
		console.log(this);
		this.$workEntrySubmit.on("click", this.submitNewWorkEntry.bind(App));
	},
	submitNewWorkEntry: function() {
		
		console.log(this);
		console.log(projectId);
		var projectId = Number(this.$workEntrySelectProject.val());
		console.log(projectId);
		this.project = this.findProjectEntry(projectId)
		this.description = this.$workEntryDescription.val();
		this.minutes = Number(this.$workEntryTime.val());		
		
		if (!this.validateWorkEntry()) {
			alert("Oops, bad entry. Try again.");
			this.$workEntryDescription[0].focus();
			return;
		}

		this.$workEntryDescription.val("");
		this.$workEntryTime.val("");
		this.addWorkToProject();
		this.$workEntryDescription[0].focus();
	},
	addProjectToList: function() {
		
		var projectId = this.project.getId();
		var projectDescription = this.project.getDescription();
		
		$project = $(this.projectTemplate);
		$project.attr("data-project-id", projectId);
		$project.find("[rel*=js-project-description]").text(projectDescription);
		this.$projectList.append($project);
		this.projectElements[projectId] = $project;
		this.workElements[projectId] = {}

	},
	addProjectSelection: function () {
		var projectId = this.project.getId();
		var projectDescription = this.project.getDescription();

		var $option = $("<option></option>");
		$option.attr("value", projectId);
		$option.text(projectDescription);
		this.$workEntrySelectProject.append($option);
	},
	addWorkEntryToList: function() {
		//var projectId = this.project.getId;
		
		var projectId = this.project.getId();
		var $projectEntry = this.projectElements[projectId];
		var $projectWorkEntries = $projectEntry.find("[rel*=js-work-entries]");

		// create a new DOM element for the work entry
		
		var $workEntry = $(this.workEntryTemplate);
		$workEntry.attr("data-work-entry-id", this.workEntryData.id);
		$workEntry.find("[rel*=js-work-time]").text(this.formatTime(this.workEntryData.time));
		
		this.setupWorkDescription($workEntry.find("[rel*=js-work-description]"));
		debugger;
		this.workElements[projectId][this.workEntryData.id] = $workEntry;

		// multiple work entries now?
		if (this.project.getWorkEntryCount() > 1) {
			{
				let adjacentWorkEntryId, insertBefore;
				[adjacentWorkEntryId, insertBefore] = this.project.getWorkEntryLocation(this.workEntryData.id);

				if (insertBefore) {
					this.workElements[projectId][adjacentWorkEntryId].before($workEntry);
				}
				else {
					this.workElements[projectId][adjacentWorkEntryId].after($workEntry);
				}
			}
		}
		// otherwise, just the first entry
		else {
			$projectEntry.addClass("visible");
			$projectWorkEntries.append($workEntry);
		}
	},
	setupWorkDescription: function($workDescription) {
		debugger;
		$workDescription.text(this.formatWorkDescription(this.workEntryData.description));
		this.$workEntrySubmit.on("click", this.submitNewWorkEntry.bind(App));
		var f = (function iife() {
			debugger;
			var desc = App.workEntryData.description;
			return function() {
			$workDescription
				.removeClass("shortened")
				.off("click",iife)
				.text(desc);
			}
		})()
		if (this.workEntryData.description.length > this.maxVisibleWorkDescriptionLength) {
			$workDescription
				.addClass("shortened")
				.on("click", f);
				/*.on("click", (function onClick(){
					$workDescription
						.removeClass("shortened")
						.off("click",onClick)
						.text(this.workEntryData.description);
				}).bind(App));*/
				
				
		}
	},
	updateProjectTotalTime: function() {
		var projectId = this.project.getId();
		var projectTime = this.project.getTime();

		var $projectEntry = this.projectElements[projectId];
		$projectEntry.find("> [rel*=js-work-time]").text(this.formatTime(projectTime)).show();
	},
	updateWorkLogTotalTime: function() {
		this.totalTime = (this.totalTime || 0 ) + this.minutes;
		time = this.totalTime;
		if (time > 0) {
			this.$totalTime.text(this.formatTime(time)).show();
		}
		else {
			this.$totalTime.text("").hide();
		}
	}
})


var Application = Object.assign(Object.create(UI),{
	addProject: function(description) {
		
		this.project = new Project(description);
		this.projects.push(this.project);
		
		this.addProjectToList();
		this.addProjectSelection();
	},
	findProjectEntry: function(projectId) {
		for (let i = 0; i < this.projects.length; i++) {
			if (this.projects[i].getId() === projectId) {
				return this.projects[i];
			}
		}
	},
	addWorkToProject: function() {
		
		//this.totalTime = (this.totalTime || 0) + this.minutes;
		this.project.time = (this.project.time || 0) + this.minutes;;
		//this.project = this.findProjectEntry(this.projectId);

		// create a new work entry for the list
		this.workEntryData = { description: this.description, time: this.minutes };

		this.project.addWork(this.workEntryData);

		App.addWorkEntryToList();
		App.updateProjectTotalTime();
		App.updateWorkLogTotalTime();
	},
		

} )



function setupApp() {
	
	obj = Object.create(Application);
	obj.projects = [];
	obj.totalTime = 0;

	return obj;
}

function Project(description) {
	
	this.projectId = Math.round(Math.random() * 1E4);
	this.description = description;
	this.work = [];
	this.time = 0;
}

Project.prototype.getId = function getId() {
	return this.projectId;
};

Project.prototype.getDescription = function getDescription() {
	return this.description;
};

Project.prototype.getTime = function getTime() {
	return this.time;
};

Project.prototype.addWork = function addWork(workEntryData) {
	workEntryData.id = this.work.length + 1;
	this.work.push(workEntryData);

	// multiple work entries now?
	if (this.work.length > 1) {
		// sort work entries in descending order of time spent
		this.work.sort(function sortTimeDescending(a, b) {
			return b.time - a.time;
		});
	}
};

Project.prototype.getWorkEntryCount = function getWorkEntryCount() {
	return this.work.length;
};

Project.prototype.getWorkEntryLocation = function getWorkEntryLocation(workEntryId) {
	// find where the entry sits in the new sorted list
	var entryIdx;
	for (let i = 0; i < this.work.length; i++) {
		if (this.work[i].id == workEntryId) {
			entryIdx = i;
			break;
		}
	}

	// insert the entry into the correct location in DOM
	if (entryIdx < (this.work.length - 1)) {
		return [this.work[entryIdx + 1].id, /*insertBefore=*/true];
	}
	else {
		return [this.work[entryIdx - 1].id, /*insertBefore=*/false];
	}
};

//var UI = setupUI();
var App = setupApp();

console.log(this)
App.initUI();

// hard coding some initial data
App.addProject("client features");
App.addProject("overhead");
App.addProject("backlog");
