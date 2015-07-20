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
	$scope.simRunning = false;
	$scope.setSchedErrors = function(value) {
		$scope.$apply(function() {
			$scope.schedHasErrors = value;
			$scope.schedRun = true;
		});
	};
	$scope.setSimRunning = function(value) {
		$scope.$apply(function() {
			$scope.simRunning = false;
		});
	};
	
	// Function used to make ui grids resize properly.
	$scope.fixLayout = function() {
		$timeout(function(){
			$(window).resize();
		}, 1);
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
	
	// JSON Export
	$scope.onXMLExport = function() {
		$scope.conf.toXML(function(xml) {
			$("#config-download-xml").attr(
				{href: "data:application/xml;charset=utf-8," + encodeURI(xml)}
			);
			$("#modalXML").modal('show');
		});;

		
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
		var logScriptErrors = function(err) {
			// err : object given by pypy.js
			
			if(typeof err.name != "undefined" && typeof err.message != "undefined")
			{
				pypyService.logSchedulerError({
		            'type' : 'errorCode',
		            'value' : err.name + " : " + err.message
		        });
			}

			
			if(typeof err.trace != "undefined") {
				var stacklines = err.trace.split("\n");
				for(var i = 0; i < stacklines.length; i++)
				{
					pypyService.logSchedulerError({
						'type' : 'stack',
						'value' : stacklines[i]
					});
				}
			}

			$scope.disableResults();
			$scope.setSchedErrors(true);
			$scope.setSimRunning(false);
		};
		script = $scope.conf.makeScript();
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
				$scope.conf.window.endDate = $scope.conf.durationMs;
				
				// Clear error logs
				$scope.setSchedErrors(false);
			}
			else
			{
				$scope.disableResults();
				$scope.setSchedErrors(true);
			}
			$scope.setSimRunning(false);
		};
		
		$scope.simRunning = true;
		$timeout(function() {
			if($scope.conf.customSched)
			{
				// Custom scheduler
				pypyService.vm.exec($scope.conf.customSchedCode).then(function() {
					pypyService.vm.exec(script).then(execScriptCallback, logScriptErrors);
				}, logScriptErrors);
			}
			else
			{
				// Non custom scheduler
				pypyService.vm.loadModuleData($scope.conf.schedulerClass.name).then(function() {
					pypyService.vm.exec(script).then(execScriptCallback, logScriptErrors);
				}, logScriptErrors);
			}
		}, 10);


	}
	
	// Initialises tooltips
	$timeout(function() { 
		$('[data-toggle="tooltip"]').tooltip();
 		$('[data-toggle-s="popover"]').popover();
	}, 0);
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