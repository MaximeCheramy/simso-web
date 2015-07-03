/// <reference path="../typings/angularjs/angular.d.ts"/>
var simsoApp = angular.module('simso', ['ngRoute', 'simsoControllers', 
	'ui.bootstrap', 'ui.grid', 'ui.grid.edit', 'ui.grid.selection', 
	'ui.bootstrap.tabs', 'ui.bootstrap.accordion']);
	
var pythonFiles = { 
	"init" : ["../py/simso-init.py", "../py/simso-schedulers.py", "../py/simso-etm.py"],
	"files" : ["../py/gantt-renderer.py", "../py/simso-functions.py"],
	"finalize" : "../py/simso-finalize.py"
};

// Variable used to communicate from and to the python vm.
var python = { };

// Injects the filter provider into the app.
simsoApp.config(['$filterProvider', function($filterProvider)
{
	simsoApp.filter = $filterProvider.register;
	simsoApp.correctors = correctors;
}]);

simsoApp.config(['$routeProvider',
	function($routeProvider) {
		$routeProvider.
			when('/configuration', {
				templateUrl: 'partial/configuration.html',
				controller: 'configurationCtrl'
			}).
			when('/results', {
				templateUrl: 'partial/results.html',
				controller: 'resultsCtrl'
			}).
			otherwise({
				redirectTo: '/configuration'
			});
	}]
);




simsoApp.service("confService", ["pypyService", function(pypyService) {
	this.cycles_per_ms = 1000000;
	this.duration_ms = 100;
	this.duration = this.duration_ms * this.cycles_per_ms;
	this.overhead_schedule = 0;
	this.overhead_activate = 0;
	this.overhead_terminate = 0;
	this.memory_access_time = 0; // Cache Model only
	
	this.tasks = [
		{'id': 1, 'type': 0, 'name': 'T1', 'activationDate': 0, 'activationDates':"-", 'period': 10, 'deadline': 10, 'wcet': 5, 'followedBy': -1},
		{'id': 2, 'type': 1, 'name': 'T2', 'activationDate': "-", 'activationDates':"-", 'period': "-", 'deadline': 8, 'wcet': 3, 'followedBy': -1},
		{'id': 3, 'type': 2, 'name': 'T3', 'activationDate': "-", 'period': "-", 'activationDates':"", 'deadline': 8, 'wcet': 1, 'followedBy': -1},
	];
	
	this.processors = [
		{'id' : 0, 'name': 'Proc', 'csOverhead': 0, 'clOverhead': 0, 'speed' : 1}, 
		{'id' : 1, 'name' : 'Proc2', 'csOverhead': 0, 'clOverhead': 0, 'speed' : 1}
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
	this.etm_list = [];
	this.etmAdditionalFields = []; // {'name':name,'type':pytype,'value':value}
	
	
	// -- Scheduler conf
	this.schedAdditionalFields = []; // {'name':name,'type':pytype,'value':value}
	this.scheduler_class = 'simso.schedulers.EDF';
	this.scheduler_list = [];
	this.window = {startDate: 0, endDate: 0};
	
	
	// Creates a clone of the variables contained in this service
	// This is used to get the simulation parameters in the results.
	var othis = this;
	this.savedConf = null;
	
	// Must be called when the tasks' additional fields are modified.
	this.onTaskFieldsChanged = function() {
		console.log("conf.onTaskFieldsChanged : not overrided yet.");	
	};
	
	// Must be called when the processors' additional fields are modified.
	this.onProcFieldsChanged = function() {
		console.log("conf.onProcFieldsChanged : not overrided yet.");	
	};
	
	this.clone = function() {
		return {
			cycles_per_ms: othis.cycles_per_ms,
			duration_ms: othis.duration_ms,
			duration: othis.duration,
			overhead_schedule: othis.overhead_schedule,
			overhead_activate: othis.overhead_activate,
			overhead_terminate: othis.overhead_terminate,
			ram_access_time: othis.ram_access_time,
			tasks: othis.tasks.slice(),
			processors: othis.processors.slice(),
			scheduler_class: othis.scheduler_class,
			scheduler_list: othis.scheduler_list,
			taskAdditionalFields: othis.taskAdditionalFields.slice(),
			procAdditionalFields: othis.procAdditionalFields.slice(),
			schedAdditionalFields: othis.schedAdditionalFields.slice(),
			etmAdditionalFields: othis.etmAdditionalFields.slice(),
			etm: othis.etm,
			etm_list: othis.etm_list,
			// Aggregates all gantt items
			all_gantt_items: $.merge(this.tasks.map(function(task) { 
					return {'id': task.id, 'name':task.name, 'type':'task' };
				}), this.processors.map(function(task) { 
					return {'id': task.id, 'name':task.name, 'type':'processor' };
			})) 
		};
	};
}]);

simsoApp.service("logsService", function() {
	this.logs = [];
	this.schedEventLogs = [];
	this.schedErrorLogs = [];
});

simsoApp.service("pypyService", ['logsService', function(logsService) {
	var othis = this;
	this.pypyready = false;
	this.pythonFiles = pythonFiles;
	this.vm = new PyPyJS();
	
	// Python's 'print' is redirected here.
	this.vm.stdout = this.vm.stderr = function(data) {
		console.log("Python print : ");
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

simsoApp.directive("gantt", ['$timeout', function($timeout){
  return {
    restrict: "A",
    link: function(scope, element){
		scope.vm.exec("draw_canvas(" + scope.aggregateParameters() + ")");
		
		// Redraws the diagram if the zoom value changes.
		scope.$watch("ganttZoom", function (newValue, oldValue) {
			scope.updateZoom();
			$timeout(function() {
				// Delay changes (dont redraw while the user is typing)
				if(scope.ganttZoom == newValue) {
					scope.vm.exec("draw_canvas(" + scope.aggregateParameters() + ")");
				}
			}, 300);
		});
		
		// Redraws the diagram if the start date changes
		scope.$watch("conf.window.startDate", function (newValue, oldValue) {
			// Delay changes (dont redraw while the user is typing)
			if(scope.conf.window.startDate == newValue) {
				scope.vm.exec("draw_canvas(" + scope.aggregateParameters() + ")");
			}
		});
		
	 	// Redraws the diagram if the end date changes
		scope.$watch("conf.window.endDate", function (newValue, oldValue) {
			// Delay changes (dont redraw while the user is typing)
			if(scope.conf.window.endDate == newValue) {
				scope.vm.exec("draw_canvas(" + scope.aggregateParameters() + ")");
			}
		});
    }
  };
}]);

simsoApp.directive('aDisabled', function() {
    return {
        compile: function(tElement, tAttrs, transclude) {
            //Disable ngClick
            tAttrs["ngClick"] = "!("+tAttrs["aDisabled"]+") && ("+tAttrs["ngClick"]+")";

            //Toggle "disabled" to class when aDisabled becomes true
            return function (scope, iElement, iAttrs) {
                scope.$watch(iAttrs["aDisabled"], function(newValue) {
                    if (newValue !== undefined) {
                        iElement.toggleClass("disabled", newValue);
                    }
                });

                //Disable href on click
                iElement.on("click", function(e) {
                    if (scope.$eval(iAttrs["aDisabled"])) {
                        e.preventDefault();
                    }
                });
            };
        }
    };
});

simsoApp.directive('confPanel', function() {
	return {
		restrict: 'E',
		scope: {title: '=', html: '='},
		templateUrl: 'confPanel.html'
	};	
});
