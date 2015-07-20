simsoApp.service("confService", 
["pypyService", "$timeout", function(pypyService, $timeout) {
	this.expertMode = false;
	this.cyclesPerMs = 1000000;
	this.durationMs = 100;
	this.duration = this.durationMs * this.cyclesPerMs;
	this.overheadSchedule = 0;
	this.overheadActivate = 0;
	this.overheadTerminate = 0;
	
	this.overheadScheduleProperty = correctors.makeProperty(this, 'overheadSchedule', correctors.isPositiveInt);
	this.overheadActivateProperty = correctors.makeProperty(this, 'overheadActivate', correctors.isPositiveInt);
	this.overheadTerminateProperty = correctors.makeProperty(this, 'overheadTerminate', correctors.isPositiveInt);
	
	this.tasks = [
		{'id': 1, 'type': 0, 'name': 'T1', 'activationDate': 0, 'activationDates':"-", 'period': 10, 'deadline': 10, 'wcet': 5, 'followedBy': -1},
		{'id': 2, 'type': 0, 'name': 'T2', 'activationDate': 5, 'activationDates':"-", 'period': 15, 'deadline': 15, 'wcet': 7, 'followedBy': -1},
		{'id': 3, 'type': 0, 'name': 'T3', 'activationDate': 0, 'activationDates':"-", 'period': 20, 'deadline': 15, 'wcet': 8, 'followedBy': -1},
	];
	
	this.processors = [
		{'id' : 0, 'name': 'P0', 'csOverhead': 0, 'clOverhead': 0, 'speed' : 1, 'caches' : []}, 
		{'id' : 1, 'name' : 'P1', 'csOverhead': 0, 'clOverhead': 0, 'speed' : 1, 'caches' : []}
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
			var diff = val - othis.processors.length;
			if(diff < 0)
				othis.processors.splice(othis.processors.length + diff, -diff);
			else if(diff > 0)
				for(var i = 0; i < diff; i++)
					othis.addNewProcessor();
		} else {
			// Getter
			return othis.processors.length;
		}
	};
	
	// Adds a new processor
	this.addNewProcessor = function() {
		var id = 1;
		for (var i = 0; i < othis.processors.length; i++) {
			if (othis.processors[i].id == id) {
				id++;
				i = 0;
			}
		}
		
		othis.processors.push(
		{
			 'id': id,
			 'name': 'P' + id,
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
		return encodeURI(JSON.stringify(this.clone()));
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
	
	// This function generates XML conf file from python code.
	// It takes a callback to be executed when the conf file is generated.
	this.toXML = function(callback, errcalback) {
		var confScript = othis.makeScript() + "\n";
		confScript += "try:\n"; 
		confScript += "    js.globals['python']['xml'] = generate(configuration);\n";
		confScript += "except Exception, e:\n";
		confScript += "    exc_type, exc_value, exc_traceback = sys.exc_info()\n";
        confScript += "    error = traceback.format_exception_only(exc_type, exc_value)[0]\n";
		confScript += "    tb = traceback.extract_tb(exc_traceback)\n";
		confScript += "    raise Exception(str(error) + '\\n' + str(tb))";
		pypyService.vm.exec(confScript).then(function() {
			callback(python['xml']);
		}, function(err) { 
			alert("Error occured during export. " + err.toSource());
		});
	};
	// Generates a python configuration script.
	this.makeScript = function() {
		// Files and strings are directly passed to python to avoid escape sequence
		// issues.
		python["resx_strings"] = [];
		var stringId = 0;
		
		var script = "configuration = Configuration();\n";
		
		var pyNumber = function(n, defaultValue) {
			defaultValue = typeof defaultValue == "undefined" ? 0 : defaultValue;
			return isNaN(n) ? defaultValue : n;
		};
				
		var escape = function(n) {
			return n == "-" ? "" : n;
		};
		
		var getType = function(task) {
			if(task.type == 0)
				return "\"Periodic\"";
			else if(task.type == 1)
				return "\"APeriodic\"";
			else if(task.type == 2)
				return "\"Sporadic\"";
		};
		
		var follower = function(task) {
			return task.followedBy == -1 ? "None" : task.followedBy;
		};
		
		var formatCustomData = function(obj, arr) {
			var data = [];
			for(var i = 0; i < arr.length; i++) {
				var attr = arr[i];
				
				// Skip undefined values
				if(typeof(obj[attr.name]) == "undefined")
					continue;
					
				data.push("\"" + attr.name + "\" : " + toPy(obj[attr.name], attr.type));
			}
			return "{" + data.join(',') + '}';
		};
		
		var formatTaskData = function(task) {
			return formatCustomData(task, othis.taskAdditionalFields);	
		};
		
		var formatProcData = function(proc) {
			return formatCustomData(proc, othis.procAdditionalFields);
		};
		
		var toPy = function(value, pytype) {
			if(pytype == "float" || pytype == "int")
				return value;
			else if(pytype == "bool")
				return value == "true" ? "True" : "False";
			else
			{
				python["resx_strings"].push(value);
				return 'js.globals["python"]["resx_strings"]['+ stringId++ + ']';
			}
		};
		
		// Global
		script += "configuration.duration = " + othis.duration + ";\n";
		script += "configuration.cycles_per_ms = " + othis.cyclesPerMs + ";\n";
		
		// Etm
		script += "configuration.etm = \"" + othis.etm.name + "\";\n";
		
		// Additional conf fields
		for(var i = 0; i < othis.etmAdditionalFields.length; i++) {
			var field = othis.etmAdditionalFields[i];
			script += "configuration." + field.name + " = " + toPy(field.value, field.type) + ";\n";
		}
		
		// Add tasks
		for (var i = 0; i < othis.tasks.length; i++) {
			var task = othis.tasks[i];
			script += "configuration.add_task(name=\"" + task.name
				+ "\", identifier=" + task.id
				+ ", abort_on_miss=" + (task.abortonmiss ? "True" : "False")
				+ ", activation_date=" + pyNumber(task.activationDate)
				+ ", list_activation_dates=[" + escape(task.activationDates) + "]"
				+ ", period=" + pyNumber(task.period)
				+ ", deadline=" + task.deadline
				+ ", task_type=" + getType(task)
				+ ", followed_by=" + follower(task)
				+ ", data=" + formatTaskData(task)
				+ ", wcet=" + task.wcet + ");\n";
		}
		
		script += "caches = {};\n";
		// Add caches
		for (var i = 0; i < othis.caches.length; i++) {
			var cache = othis.caches[i];
			
			script += "caches['" + cache.id + "'] = Cache(";
			script += cache.id + ", ";
			script += '"' + cache.name + "\", ";
			script += pyNumber(cache.size) + ", ";
			script += "0, ";
			script += pyNumber(cache.access_time);
			script += ");\n";
			
			
			script += "configuration.caches_list.append(caches['" + cache.id + "']);\n";
		}
		
		// Add processors
		for (var i = 0; i < othis.processors.length; i++) {
			var proc = othis.processors[i];
			script += "proc = ProcInfo(";
			script += proc.id + ", ";
			script += '"' + proc.name + "\", ";
			script += "cs_overhead=" + pyNumber(proc.csOverhead) + ", ";
			script += "cl_overhead=" + pyNumber(proc.clOverhead) + ", ";
			script += "speed = " + pyNumber(proc.speed, 1.0) + ", ";
			script += "data = " + formatProcData(proc);
			script += ");\n";
			
			for(var j = 0; j < proc.caches.length; j++) {
				script += "proc.add_cache(caches['" + proc.caches[j] + "']);\n";
			}
			
			script += "configuration.proc_info_list.append(proc);\n";
		}


		// Set scheduler
		if(othis.customSched)
		{
			script += "configuration.scheduler_info.clas = "  + othis.customSchedName +  ";\n";
		}
		else
		{
			script += "configuration.scheduler_info.clas = '" + othis.schedulerClass.name + "';\n";
		}
		script += "configuration.scheduler_info.overhead = " + othis.overheadSchedule + ";\n";
		script += "configuration.scheduler_info.overhead_activate = " + othis.overheadActivate + ";\n";
		script += "configuration.scheduler_info.overhead_terminate = " + othis.overheadTerminate + ";\n";
		
		// Additional scheduler fields.
		script += "configuration.scheduler_info.data = {};\n";
		for(var i = 0; i < othis.schedAdditionalFields.length; i++) {
			var field = othis.schedAdditionalFields[i];
			script += "configuration.scheduler_info.data[\"" + field.name + "\"] = " + toPy(field.value, field.type) + ";\n";
		}
		
		return script;
	}; // make script
	

}]);