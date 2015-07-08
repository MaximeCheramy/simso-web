simsoApp.service("pypyService", ['logsService', function(logsService) {
	var othis = this;
	this.pypyready = false;
	this.pythonFiles = pythonFiles;
	this.vm = new PyPyJS();
	
	// Python's 'print' is redirected here.
	this.vm.stdout = this.vm.stderr = function(data) {
		console.log("Python print : " + data);
		logsService.logs.push(data);
	};
	
	// Function called to log errors that happen within the 
	// schedulers.
	this.logSchedulerError = function(error) {
		logsService.schedErrorLogs.push(error);
	};
	
	// Function called to log events that happen within the 
	// scheduler
	this.logSchedulerEvent = function(event) {
		logsService.schedEventLogs.push(event);
	};
	
	python["logSchedulerError"] = this.logSchedulerError;
	python["logSchedulerEvent"] = this.logSchedulerEvent;
	
	// File execution with error output
	this.safe_execfile = function(file) {
		return othis.vm.execfile(file).then(function () {
			
		}, function(err) {
			console.log("Python ERROR (" + file +" ) : " + err.name + ": " + err.message + " || " + err.toSource());
		});
	};
	
	// Recursive execution of the files in the given file group name.
	var exec_rec = function(groupName, i) {		
		return othis.safe_execfile(othis.pythonFiles[groupName][i]).then(function() {
			if(i > 0)
				exec_rec(groupName, i - 1);
		});
	};
	
	// Executes in this order :
	// 		- the files in the init group name.
	//		- the files in the files group name.
	//		- the first file of the finalize group name.
	this.vm.ready.then(function() {
		exec_rec("init", othis.pythonFiles["init"].length-1).then(function() {
			exec_rec("files", othis.pythonFiles["files"].length-1).then(function() {
				othis.safe_execfile(othis.pythonFiles["finalize"]).then(function() {
					othis.pypyready = true;
					notifyObservers();
				});
			});
		});
	});
	
	
	// Observer pattern
	var observersCallbacks = [];
	this.registerObserverCallback = function($scope, cb) {
		observersCallbacks.push(cb);
		$scope.$on('$destroy', function () {
			var i = observersCallbacks.indexOf(cb);
			if (i > -1) {
				observersCallbacks.splice(i, 1);
			}
		});
	};

	var notifyObservers = function() {
		observersCallbacks.forEach(function(callback) {
			callback();
		});
	};
}]);
