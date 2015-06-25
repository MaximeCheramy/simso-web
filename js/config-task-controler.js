// Manages the tasks list.
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
		minRowsToShow: 6,
		data: $scope.conf.tasks,
	};
	
	// Column definitions
	$scope.gridTasksOptions.columnDefs = [
		{name: 'id', type: 'number'},
		{name: 'type', type:'number', editableCellTemplate: 'ui-grid/dropdownEditor', 
			editDropdownValueLabel:'name', 
			cellFilter:'taskTypeFilter',
			// /!\ This data is dupplicated in the taskTypeList factory...
			editDropdownOptionsArray: [
				{ id: 1, name:"Periodic" },
				{ id: 2, name:"Aperiodic" },
				{ id: 3, name:"Sporadic" } 
			]
		},
		{
			enableCellEdit: false,
			name: 'abortonmiss',
			field: 'abortonmiss',
		    displayName: "Abort on miss",
			cellTemplate: '<input type="checkbox" ng-model="row.entity.abortonmiss" ng-click="toggleAbortOnMiss(row.entity)">'
		},
		{
			
			name: 'activationDate',
			type: 'number',
			cellEditableCondition: function(scope) {
				// This cell is editable if the task is perdiodic.
				console.log(scope.row.entity);
				return scope.row.entity.type == 1;
			},
			// cellTemplate: 'partial/cells/conf-activationdate-cell.html'
		},
	    {name: 'name', type: 'string'},
		{name: 'activationDate', type: 'number'},
		{name: 'period', type: 'number'},
		{name: 'deadline', type: 'number'},
		{name: 'wcet', type: 'number', displayName: 'WCET'}
	];
	
	$scope.toggleAbortOnMiss = function(rowEntity) {
		rowEntity.abortonmiss = !rowEntity.abortonmiss;
	};

	$scope.gridTasksOptions.onRegisterApi = function(gridApi) {
		var updateRow = function(row) {
			if (row.isSelected) {
				$scope.selectedTasks.push(row.entity);
			} else {
				var index = $scope.selectedTasks.indexOf(row.entity);
				if (index > -1) {
					$scope.selectedTasks.splice(index, 1);
				}
			}
		};
		gridApi.selection.on.rowSelectionChanged($scope, updateRow);
		gridApi.selection.on.rowSelectionChangedBatch($scope, function(rows) {
			for(var i = 0; i < rows.length; i++) {
				updateRow(rows[i]);
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
}])

// Factory providing the mapping 
.factory('taskTypeList', function() { 
	return [
		{ id: 1, name: "Periodic"},
		{ id: 2, name: "Aperiodic"},
		{ id: 3, name: "Sporadic"}
	];
})
.filter('taskTypeFilter', function(taskTypeList) {
	return function(input) {
		var matches = taskTypeList.filter(function(task) 
		{
			return task.id == input;
		});
		
		if(matches.length == 1)
			return matches[0].name;
		
		return "<unknown_value>";
	};
});