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
		{name: 'activationDate', type: 'string', displayName:"Act. Date (ms)"},
		{name: 'period', type: 'string', displayName:"Period (ms)"},
		{name: 'activationDates', type: 'string', displayName:"List of Act. dates (ms)"},
	    {name: 'name', type: 'string'},
		{name: 'deadline', type: 'number'},
		{name: 'wcet', type: 'number', displayName: 'WCET'},
		{name: 'followedBy', type:'number', displayName: 'Followed by' }
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
		
		
		// **** Code ensuring grid data correctness. ****
		
		// List of disabled field indexed by their type.
		var disableList = {
			1: ['activationDates'],
			2: ['activationDate', 'activationDates', 'period'],
			3: ['activationDate', 'period']
		};
		
		// List of default value for some columns.
		var defaultList = {
			'activationDates': "",
			'activationDate':0,
			'period':10	
		};
		
		// Corrector ensuring the new value is a positive number
		var isPositiveNumber = function(oldValue, newValue) {
			if(isNaN(newValue))
				return oldValue;
			return Math.max(0, parseFloat(newValue));
		};
		
		// Corrector ensuring the new value is a comma-separated list of positive
		// numbers. This corrector will reject incorrect values in the list.
		var isListOfPositiveNumbers = function(oldValue, newValue) {
			var numbers = newValue.split(",");
			var list = []
			for(var i = 0; i < numbers.length; i++) {
				var correctedNumber = isPositiveNumber(-1, numbers[i]);
				if(correctedNumber != -1)
					list.push(correctedNumber);
				
			}
			
			return list.join(", ");	
		};
		// List of functions that are called to correct user input.
		var correctors = {
			'activationDate': isPositiveNumber,
			'period': isPositiveNumber,
			'wcet' : isPositiveNumber,
			'deadline' : isPositiveNumber,
			'activationDates' : isListOfPositiveNumbers
		};
		
		// Raised after a cell was edited.
		gridApi.edit.on.afterCellEdit($scope, function(rowEntity, colDef, newValue, oldValue)
		{
			if(colDef.name == "type")
			{
				var disabledColumns = disableList[newValue];
				// Disables the columns that are not needed for the new type.
				for(var i = 0; i < disabledColumns.length; i++)
				{
					rowEntity[disabledColumns[i]] = "-";
				}
				// Gives default value to the columns that have been enabled.
				var previouslyDisabledColumns = disableList[oldValue];
				for(var i = 0; i < previouslyDisabledColumns.length; i++)
				{
					// If the column has been enabled
					if(disabledColumns.indexOf(previouslyDisabledColumns[i]) == -1)
					{
						rowEntity[previouslyDisabledColumns[i]] = defaultList[previouslyDisabledColumns[i]];
					}
				}
			}
			else
			{
				var disabledColumns = disableList[rowEntity.type];
				// Cancels editing of disabled columns
				if(disabledColumns.indexOf(colDef.name) != -1)
				{
					rowEntity[colDef.name] = oldValue;
				}
				else
				{
					// Ensures the new value is correct.
					if(colDef.name in correctors)
					{
						var corrector = correctors[colDef.name];
						rowEntity[colDef.name] = corrector(oldValue, newValue);
					}
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