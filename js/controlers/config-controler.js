// Main controler of the conf service.
simsoControllers.controller('configurationCtrl', 
['confService', 'logsService', 'pypyService', '$scope', '$timeout',
function(confService, logsService, pypyService, $scope, $timeout) {
	// conf is our model containing the configuration.
	$scope.tmp =  {};
	$scope.tmp.importedJSON = "";
	
	$scope.conf = confService;
	$scope.pypyService = pypyService;
	$scope.pypyready = pypyService.pypyready;
	$scope.schedHasErrors = false;
	$scope.schedRun = false;
	$scope.setSchedErrors = function(value) {
		$scope.$apply(function() {
			$scope.schedHasErrors = value;
			$scope.schedRun = true;
		});
	};
	if (!$scope.pypyready) {
		$scope.pypyService.registerObserverCallback($scope, function() {
			$scope.$apply(function() {
				$scope.pypyready = true;
			});
		});
	}
	
	// Refreshes the python script (debug only)
	$scope.refresh_py = function() {
		for(var i = 0; i < pypyService.pythonFiles["files"].length; i++) {
			pypyService.vm.execfile(pypyService.pythonFiles["files"][i]);
		}
	};
	
	// JSON Export
	$scope.onJSONExport = function() {
		$("#config-download").attr(
			{href: "data:application/json;charset=utf-8," + $scope.conf.toJSON()}
		);
	};
	
	// JSON import
	$scope.onJSONImport = function() {
		$("#config-upfile").trigger('click');	
	};
	
	$scope.$watch('tmp.importedJSON', function() {
		if($scope.tmp.importedJSON != "")
			$scope.conf.fromJSON($scope.tmp.importedJSON);
	});
	
	$scope.run = function() {
		// Files and strings are directly passed to python to avoid escape sequence
		// issues.
		python["resx_strings"] = [];
		var stringId = 0;
		
		var script = "configuration = Configuration();\n";
		
		var pyNumber = function(n, defaultValue) {
			defaultValue = typeof defaultValue == "undefined" ? 0 : defaultValue;
			return isNaN(n) ? defaultValue : n;
		};
		
		var logScriptErrors = function(err) {
			// err : object given by pypy.js
			pypyService.logSchedulerError({
	            'type' : 'errorCode',
	            'value' : err.name + " : " + err.message
	        });
			var stacklines = err.trace.split("\n");
			for(var i = 0; i < stacklines.length; i++)
			{
				pypyService.logSchedulerError({
					'type' : 'stack',
					'value' : stacklines[i]
				});
			}
		
			$scope.disableResults();
			$scope.setSchedErrors(true);
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
			return formatCustomData(task, $scope.conf.taskAdditionalFields);	
		};
		
		var formatProcData = function(proc) {
			return formatCustomData(proc, $scope.conf.procAdditionalFields);
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
		script += "configuration.duration = " + $scope.conf.duration + ";\n";
		script += "configuration.cycles_per_ms = " + $scope.conf.cycles_per_ms + ";\n";
		
		// Etm
		script += "configuration.etm = \"" + $scope.conf.etm.name + "\";\n";
		
		// Additional conf fields
		for(var i = 0; i < $scope.conf.etmAdditionalFields.length; i++) {
			var field = $scope.conf.etmAdditionalFields[i];
			script += "configuration." + field.name + " = " + toPy(field.value, field.type) + ";\n";
		}
		
		// Add tasks
		for (var i = 0; i < $scope.conf.tasks.length; i++) {
			var task = $scope.conf.tasks[i];
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
		for (var i = 0; i < $scope.conf.caches.length; i++) {
			var cache = $scope.conf.caches[i];
			
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
		for (var i = 0; i < $scope.conf.processors.length; i++) {
			var proc = $scope.conf.processors[i];
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
		if($scope.conf.custom_sched)
		{
			script += "configuration.scheduler_info.clas = "  + $scope.conf.custom_sched_name +  ";\n";
		}
		else
		{
			script += "configuration.scheduler_info.clas = '" + $scope.conf.scheduler_class.name + "';\n";
		}
		script += "configuration.scheduler_info.overhead = " + $scope.conf.overhead_schedule + ";\n";
		script += "configuration.scheduler_info.overhead_activate = " + $scope.conf.overhead_activate + ";\n";
		script += "configuration.scheduler_info.overhead_terminate = " + $scope.conf.overhead_terminate + ";\n";
		
		// Additional scheduler fields.
		script += "configuration.scheduler_info.data = {};\n";
		for(var i = 0; i < $scope.conf.schedAdditionalFields.length; i++) {
			var field = $scope.conf.schedAdditionalFields[i];
			script += "configuration.scheduler_info.data[\"" + field.name + "\"] = " + toPy(field.value, field.type) + ";\n";
			
		}
		
		
		script += "run()";
		console.log(script);
		
		logsService.schedErrorLogs.splice(0, logsService.schedErrorLogs.length);
		
		// Callback executed once the python simulation has ended.
		function execScriptCallback() {
			if(python["sim-success"])
			{
				$scope.enableResults();
				$scope.conf.allGanttItems = $scope.conf.getAllGanttItems();
				$scope.conf.window.startDate = 0;
				$scope.conf.window.endDate = $scope.conf.duration_ms;
				
				// Clear error logs
				$scope.setSchedErrors(false);
			}
			else
			{
				$scope.disableResults();
				$scope.setSchedErrors(true);
			}
		
		};
		
		if($scope.conf.custom_sched)
		{
			// Custom scheduler
			pypyService.vm.exec($scope.conf.custom_sched_code).then(function() {
				pypyService.vm.exec(script).then(execScriptCallback, logScriptErrors);
			}, logScriptErrors);
		}
		else
		{
			// Non custom scheduler
			pypyService.vm.loadModuleData($scope.conf.scheduler_class.name).then(function() {
				pypyService.vm.exec(script).then(execScriptCallback, logScriptErrors);
			}, logScriptErrors);
		}

	}
}]);



simsoControllers.controller('SchedErrorLogCtrl', 
['confService', 'logsService', '$scope', 
function(confService, logsService, $scope) {
	$scope.conf = confService;
	$scope.schedErrorLogs = logsService.schedErrorLogs;
	$scope.formatLogEntry = function(logEntry) {
		var s = "";
		if(logEntry.type == 'stack')
		{
			s += "<h2>" + logEntry.value + "</h2>";
			s += "<p>" + logEntry.code + "<p>";
		}
		else if(logEntry.type == 'errorCode')
		{
			s += "<h4>" + logEntry.value + "</h4>";
		}
		
		return s;
	};
}]);