var simsoControllers = angular.module('simsoControllers', []);

simsoControllers.controller('HeaderController', ['logsService', '$scope', '$rootScope', '$location', function(logsService, $scope, $rootScope, $location) { 
	$scope.isActive = function(viewLocation) { 
		return viewLocation === $location.path();
	};
	$scope.go = function(path) {
		$location.path(path);
	}
	$scope.disableResults = true;
	$rootScope.enableResults = function() {
		$scope.$apply(function() {
			$scope.disableResults = false;
		});
	}
}]);

simsoControllers.controller('resultsCtrl', ['logsService', 'pypyService', '$scope', 'confService', 
function(logsService, pypyService, $scope, confService) {
	
	$scope.logs = logsService.logs;
	$scope.vm = pypyService.vm;
	$scope.conf = confService;
}]);

// The gant controler is a child of the results controler.
simsoControllers.controller('GanttControler', ['$scope', '$controller', function($scope, $controller)
{
	$controller('resultsCtrl', {$scope:$scope});
	$scope.ganttWidth = 1500;
	$scope.ganttHeight = 500;
	$scope.ganttZoom = 1;
	
	// Options of the grid used to select processors and list to display.
	$scope.selectedItems = [];
	
	$scope.gridGanttOptions = {
		enableRowSelection: true,
		enableColumnResize: true,
		enableCellEdit: false,
		enableColumnMenus: false,
		enableHorizontalScrollbar: 0,
		enableVerticalScrollbar: 2,
		columnDefs: [{name: 'id', type: 'number'}, {name: 'name', type: 'string'}, {name:'type', type:'string'}],
		minRowsToShow: 5,
		data: $scope.conf.savedConf.all_gantt_items
	};
	
	// Performs item selection / deselection
	$scope.gridGanttOptions.onRegisterApi = function(gridApi) {
		gridApi.selection.setMultiSelect(true);
		gridApi.selection.selectAll = true;
		gridApi.selection.selectAllVisibleRows();
		var selectRow = function(row) {
			if (row.isSelected) {
				$scope.selectedItems.push(row.entity);
			} else {
				var index = $scope.selectedItems.indexOf(row.entity);
				if (index > -1) {
					$scope.selectedItems.splice(index, 1);
				}
			}
		};
		
		// Happens when the "select all" box is toggled.
		gridApi.selection.on.rowSelectionChanged($scope, function(row) {
			selectRow(row);
			$scope.vm.exec("draw_canvas(" + $scope.aggregateParameters() + ")");
		});
		
		
		// Happens when the "select all" box is toggled.
		gridApi.selection.on.rowSelectionChangedBatch($scope, function(rows) {
			for(var rowId = 0; rowId < rows.length; rowId++)
			{
				var row = rows[rowId];
				selectRow(row);
			}
			$scope.vm.exec("draw_canvas(" + $scope.aggregateParameters() + ")");
		});
	};
	

		
	// Aggregates parameters into a 'python' dict
	$scope.aggregateParameters = function()
	{
		// List of items to be displayed in the gantt chart
		var ganttlist = ("[" + $scope.selectedItems.map(function(item) {
			return "{'id' : " + item.id + ", " +
					 "'type' : '" + item.type + "'" +
					"}";
		}).join(', ') + "]");
		// console.log(ganttlist);
		return "{'zoom' : " + $scope.ganttZoom + "," +
				"'width' : " + $scope.ganttWidth + "," +
				"'height' : " + $scope.ganttHeight + "," + 
				"'gantt_item_list' : " + ganttlist +
				 "}";
		
	};
}]);

simsoControllers.controller('ConfigGeneralCtrl', ['confService', '$scope', function(confService, $scope) {
	$scope.conf = confService;
}]);

simsoControllers.controller('ConfigSchedulerCtrl', ['confService', '$scope', function(confService, $scope) {
	$scope.conf = confService;
}]);

simsoControllers.controller('ConfigTasksCtrl', ['confService', '$scope', function(confService, $scope) {
	$scope.conf = confService;
	// Used for removing tasks.
	$scope.selectedTasks = [];
	$scope.gridTasksOptions = {
		enableRowSelection: true,
		enableColumnResize: true,
		enableCellEdit: true,
		enableColumnMenus: false,
		enableHorizontalScrollbar: 0,
		enableVerticalScrollbar: 2,
		columnDefs: [{name: 'id', type: 'number'}, {name: 'name', type: 'string'}, {name: 'activationDate', type: 'number'}, {name: 'period', type: 'number'}, {name: 'deadline', type: 'number'}, {name: 'wcet', type: 'number', displayName: 'WCET'}],
		minRowsToShow: 6,
		data: $scope.conf.tasks,
	};



	$scope.gridTasksOptions.onRegisterApi = function(gridApi) {
		gridApi.selection.on.rowSelectionChanged($scope, function(row) {
			if (row.isSelected) {
				$scope.selectedTasks.push(row.entity);
			} else {
				var index = $scope.selectedTasks.indexOf(row.entity);
				if (index > -1) {
					$scope.selectedTasks.splice(index, 1);
				}
			}
		});
	};
	$scope.addNewTask = function() {
		var id = 1;
		for (var i = 0; i < $scope.conf.tasks.length; i++) {
			if ($scope.conf.tasks[i].id == id) {
				id++;
				i = 0;
			}
		}
		$scope.conf.tasks.push({'id': id, 'name': 'Task ' + id, 'activationDate': 0, 'period': 100, 'deadline': 0, 'wcet': 0});
	};
	$scope.delTasks = function() {
		for (var i = 0; i < $scope.selectedTasks.length; i++) {
			var index = $scope.conf.tasks.indexOf($scope.selectedTasks[i]);
			if (index > -1) {
				$scope.conf.tasks.splice(index, 1);
			}
		}
		$scope.selectedTasks = [];
	};
}]);

simsoControllers.controller('ConfigProcessorsCtrl', ['confService', '$scope', function(confService, $scope) {
	$scope.selectedProcessors = [];
	$scope.conf = confService;

	
	$scope.gridProcessorsOptions = {
		enableColumnResize: true,
		enableCellEdit: true,
		enableColumnMenus: false,
		enableHorizontalScrollbar: 0,
		enableVerticalScrollbar: 2,
		minRowsToShow: 4,
		columnDefs: [{name: 'id', type: 'number'}, {name: 'name', type: 'string'}],
		data: $scope.conf.processors,
	};

	$scope.gridProcessorsOptions.onRegisterApi = function(gridApi) {
		gridApi.selection.on.rowSelectionChanged($scope, function(row) {
			if (row.isSelected) {
				$scope.selectedProcessors.push(row.entity);
			} else {
				var index = $scope.selectedProcessors.indexOf(row.entity);
				if (index > -1) {
					$scope.selectedProcessors.splice(index, 1);
				}
			}
		});
	};

	$scope.addNewProcessor = function() {
		var id = 1;
		for (var i = 0; i < $scope.conf.processors.length; i++) {
			if ($scope.conf.processors[i].id == id) {
				id++;
				i = 0;
			}
		}
		$scope.conf.processors.push({'id': id, 'name': 'ProcName'});
	};



	$scope.delProcessors = function() {
		for (var i = 0; i < $scope.selectedProcessors.length; i++) {
			var index = $scope.conf.processors.indexOf($scope.selectedProcessors[i]);
			if (index > -1) {
				$scope.conf.processors.splice(index, 1);
			}
		}
		$scope.selectedProcessors = [];
	};
}]);

simsoControllers.controller('configurationCtrl', ['confService', 'logsService', 'pypyService', '$scope', function(confService, logsService, pypyService, $scope) {
	// conf is our model containing the configuration.
	$scope.conf = confService;

	$scope.pypyService = pypyService;
	$scope.pypyready = pypyService.pypyready;
	if (!$scope.pypyready) {
		$scope.pypyService.registerObserverCallback($scope, function() {
			$scope.$apply(function() {
				$scope.pypyready = true;
			});
		});
	}
	
	// Refreshes the python script (debug only)
	$scope.refresh_py = function() {
		pypyService.vm.execfile('../simso-functions.py')
	};
	
	$scope.run = function() {
		var script = "configuration = Configuration();";

		// Global
		script += "configuration.duration = " + $scope.conf.duration + ";";
		script += "configuration.cycles_per_ms = " + $scope.conf.cycles_per_ms + ";";
		// Add tasks
		for (var i = 0; i < $scope.conf.tasks.length; i++) {
			var task = $scope.conf.tasks[i];
			script += "configuration.add_task(name=\"" + task.name
				+ "\", identifier=" + task.id
				+ ", period=" + task.period
				+ ", deadline=" + task.deadline
				+ ", wcet=" + task.wcet + ");";
		}
		// Add processors
		for (var i = 0; i < $scope.conf.processors.length; i++) {
			var task = $scope.conf.processors[i];
			script += "configuration.add_processor(name=\"" + task.name + "\", identifier=" + i + ");";
		}
		// Set scheduler
		script += "configuration.scheduler_info.clas = '" + $scope.conf.scheduler_class + "';"
		script += "run()";
		pypyService.vm.exec(script).then(function() {
			$scope.enableResults();
			$scope.conf.savedConf = $scope.conf.clone();
		});
	}
}]);


