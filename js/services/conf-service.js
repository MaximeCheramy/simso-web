simsoApp.service("confService", 
["pypyService", "$timeout", function(pypyService, $timeout) {
	this.expertMode = false;
	this.cyclesPerMs = 1000000;
	this.durationMs = 100;
	this.duration = this.durationMs * this.cyclesPerMs;
	this.overheadSchedule = 0;
	this.overheadActivate = 0;
	this.overheadTerminate = 0;
	this.tasks = [
		{'id': 1, 'type': 0, 'name': 'T1', 'activationDate': 0, 'activationDates':"-", 'period': 10, 'deadline': 10, 'wcet': 5, 'followedBy': -1},
		{'id': 2, 'type': 1, 'name': 'T2', 'activationDate': "-", 'activationDates':"-", 'period': "-", 'deadline': 8, 'wcet': 3, 'followedBy': -1},
		{'id': 3, 'type': 2, 'name': 'T3', 'activationDate': "-", 'period': "-", 'activationDates':"", 'deadline': 8, 'wcet': 1, 'followedBy': -1},
	];
	
	this.processors = [
		{'id' : 0, 'name': 'Proc', 'csOverhead': 0, 'clOverhead': 0, 'speed' : 1, 'caches' : []}, 
		{'id' : 1, 'name' : 'Proc2', 'csOverhead': 0, 'clOverhead': 0, 'speed' : 1, 'caches' : []}
	];
	
	this.caches = [
		// { 'id': 1, 'name': 'Cache 1', 'size': 0, 'acces_time': 0, 'miss_penalty': 0 }
	];
	
	// Array of {'name':fieldName, 'type':fieldType, 'from' : 'scheduler' | 'etm' }
	// The value is in this.tasks.fieldName
	this.taskAdditionalFields = [];
	this.procAdditionalFields = [];
	this.cleanAdditionalFields = function(fieldArray, source) {
		for(var i = 0; i < fieldArray.length; i++) {
			if(fieldArray[i].from == source) {
				fieldArray.splice(i, 1);
				i--;
			}
		}
	};
	
	// -- ETM conf
	this.etm = null;
	this.etmList = [];
	this.etmAdditionalFields = []; // {'name':name,'type':pytype,'value':value}
	
	
	// -- Scheduler conf
	this.schedAdditionalFields = []; // {'name':name,'type':pytype,'value':value}
	this.schedulerClass = null; // if custom_shed == false
	this.schedulerList = [];
	this.customSched = false;
	this.customSchedCode = "";
	this.customSchedName = "Custom";
	
	this.window = {startDate: 0, endDate: 0};
	var othis = this;
	
	/* ------------------------------------------------------------------------
	 * Task functions
	 * ----------------------------------------------------------------------*/
	// Must be called when the tasks' additional fields are modified.
	this.onTaskFieldsChanged = function() {
		console.log("conf.onTaskFieldsChanged : not overrided yet.");	
	};
	

	/* ------------------------------------------------------------------------
	 * Gantt functions
	 * ----------------------------------------------------------------------*/
	this.allGanttItems = null;
	this.getAllGanttItems = function() {
		return $.merge(this.tasks.map(function(task) { 
				return {'id': task.id, 'name':task.name, 'type':'task' };
			}), this.processors.map(function(task) { 
				return {'id': task.id, 'name':task.name, 'type':'processor' };
		}));
	};
	
	/* ------------------------------------------------------------------------
	 * Processor functions
	 * ----------------------------------------------------------------------*/
	// Must be called when the processors' additional fields are modified.
	this.onProcFieldsChanged = function() {
		console.log("conf.onProcFieldsChanged : not overrided yet.");	
	};
	
	// Getter setter of the processor count used in BASIC mode.
	this.processorCount = function(val) {
		if(val) {
			// Setter
			var diff = val - this.processors.length;
			if(diff < 0)
				this.processors.splice(this.processors.length + diff, -diff);
			else if(diff > 0)
				for(var i = 0; i < diff; i++)
					this.addNewProcessor();
		} else {
			// Getter
			return this.processors.length;
		}
	};
	
	// Adds a new processor
	this.addNewProcessor = function() {
		var id = 1;
		for (var i = 0; i < this.processors.length; i++) {
			if (this.processors[i].id == id) {
				id++;
				i = 0;
			}
		}
		
		this.processors.push(
		{
			'id': id,
			 'name': 'ProcName',
			 'csOverhead': 0,
			 'clOverhead': 0,
			 'speed': 1, 
			 'caches' : []
		});
	};
	/* ------------------------------------------------------------------------
	 * Import / Export
	 * ----------------------------------------------------------------------*/
	// Creates a clone of the current configuration.
	this.clone = function() {
		return {
			cyclesPerMs: othis.cyclesPerMs,
			durationMs: othis.durationMs,
			duration: othis.duration,
			overheadSchedule: othis.overheadSchedule,
			overheadActivate: othis.overheadActivate,
			overheadTerminate: othis.overheadTerminate,
			schedulerClass: othis.schedulerClass.name,
			taskAdditionalFields: othis.taskAdditionalFields.slice(),
			procAdditionalFields: othis.procAdditionalFields.slice(),
			schedAdditionalFields: othis.schedAdditionalFields.slice(),
			etmAdditionalFields: othis.etmAdditionalFields.slice(),
			customSched: othis.customSched,
			customSchedCode: othis.customSchedCode,
			customSchedName: othis.customSchedName,
			etm: othis.etm.name,
			tasks: othis.tasks,
			processors: othis.processors,
			caches: othis.caches
		};
	};
	
	// Returns a string containing the current configuration in the JSON format.
	this.toJSON = function() {
		return JSON.stringify(this.clone());
	};
	
	// Loads the configuration from a JSON string.
	this.fromJSON = function(jsonStr) {
		var conf = JSON.parse(jsonStr);
		for(var key in conf) {
			switch(key) {
				case "taskAdditionalFields":
				case "procAdditionalFields":
				case "schedAdditionalFields":
				case "etmAdditionalFields":
				case "tasks":
				case "processors":
				case "caches":
					// We first delete all content.
					othis[key].splice(0, othis[key].length);
					break;
				case "etm":
					// ETM from name
					othis[key] = othis.etmList.filter(function(value, index) {
						return value.name === conf[key];
					})[0];
					break;
				case "schedulerClass":
					// Class from name
					othis[key] = othis.schedulerList.filter(function(value, index) {
						return value.name === conf[key];
					})[0];
					break;
				default:
					this[key] = conf[key]
			}
		}
		
		// We add the content in the arrays at the end of the digest cycle.
		// If we don't do that, the rows that were already present in the grid
		// won't change.
		$timeout(function() 
		{
			for(var key in conf) {
				switch(key) {
					case "taskAdditionalFields":
					case "procAdditionalFields":
					case "schedAdditionalFields":
					case "etmAdditionalFields":
					case "tasks":
					case "processors":
					case "caches":
						// Make a copy but keep the reference	
						othis[key].splice(0, othis[key].length);
						
						console.log("key = " + key);
						othis[key].splice(0, othis[key].length);
						for(var i = 0; i < conf[key].length; i++) {
							othis[key].push(conf[key][i]);
						}
	
						break;
				}
			}
		}, 0);
	
	};
}]);