simsoControllers.controller('ConfigTasksCtrl', ['confService', '$scope', function(confService, $scope) {
	$scope.conf = confService;
	
	// Used for removing tasks.
	$scope.selectedTasks = [];
	
	$scope.gridTasksOptions = {
		enableRowSelection: true,
		enableColumnResize: true,
		enableCellEdit: true,
		enableColumnMenus: false,
		enableHorizontalScrollbar: 1,
		enableVerticalScrollbar: 1,
		minRowsToShow: 6,
		data: $scope.conf.tasks,
	};
	
	$scope.taskTypes = [
		{ id: 0, name:"Periodic" },
		{ id: 1, name:"Aperiodic" },
		{ id: 2, name:"Sporadic" } 
	];
	

	
	// Column definitions for all required fields.
	$scope.baseColumnDefs = [
		{name: 'id', type: 'number', width: 20},
		{
			name: 'type', 
			type:'number', 
			editableCellTemplate: 'ui-grid/dropdownEditor', 
			editDropdownValueLabel:'name', 
			cellFilter:'taskTypeFilter',
			editDropdownOptionsArray: $scope.taskTypes,
			width:100
			
		},
		{name: 'name', type: 'string', width: 100},
		{name: 'period', type: 'string', displayName:"Period (ms)", width: 120},
		{name: 'deadline', type: 'number', width:100},
		{name: 'wcet', type: 'number', displayName: 'WCET', width:100},
		{
			name: 'followedBy', 
			type:'number', 
			displayName: 'Followed by',
			enableCellEdit: false,
			cellTemplate: 'partial/cells/conf-followedby-dropdown-cell.html',
			width: 100
		},
		{name: 'activationDate', type: 'string', displayName:"Act. Date (ms)", width: 120},
		{name: 'activationDates', type: 'string', displayName:"List of Act. dates (ms)", width:250},
		{
			enableCellEdit: false,
			name: 'abortonmiss',
			field: 'abortonmiss',
		    displayName: "Abort on miss",
			cellTemplate: '<input type="checkbox" ng-model="row.entity.abortonmiss" ng-click="toggleAbortOnMiss(row.entity)">',
			width: 100
		},
	];
	

	// Column definitions
	$scope.gridTasksOptions.columnDefs = $scope.baseColumnDefs;
	
	// Function called when the checkboxof the abortOnMiss field is checked / unchecked.
	$scope.toggleAbortOnMiss = function(rowEntity) {
		rowEntity.abortonmiss = !rowEntity.abortonmiss;
	};
	
	
	// ------------------------------------------------------------------------
	// *** API Registering *** 
	// ------------------------------------------------------------------------
	$scope.gridTasksOptions.onRegisterApi = function(gridApi) {
		$scope.gridApi = gridApi;
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
		
		
	
		// ------------------------------------------------------------------------
		// *** Code ensuring grid data correctness and managing disabled fields *** 
		// ------------------------------------------------------------------------
		
		// List of disabled field indexed by their type.
		var disableList = {
			0: ['activationDates'],
			1: ['activationDate', 'activationDates', 'period'],
			2: ['activationDate', 'period']
		};
		
		// List of default value for some columns.
		var defaultList = {
			'activationDates': "",
			'activationDate':0,
			'period':10	
		};
			
		// List of functions that are called to correct user input.
		var correctors = {
			'activationDate': simsoApp.correctors.isPositiveFloat,
			'period': simsoApp.correctors.isPositiveFloat,
			'wcet' : simsoApp.correctors.isPositiveFloat,
			'deadline' : simsoApp.correctors.isPositiveFloat,
			'activationDates' : simsoApp.correctors.isListOfPositiveFloats
		};
		
		// Raised after a cell was edited.
		// We use this callback to update disabled cells after selection of the task's type
		// We also use it to ensure the user's input is correct.
		gridApi.edit.on.afterCellEdit($scope, function(rowEntity, colDef, newValue, oldValue)
		{
			if(colDef.name == "type") {
				var disabledColumns = disableList[newValue];
				// Disables the columns that are not needed for the new type.
				for(var i = 0; i < disabledColumns.length; i++) {
					rowEntity[disabledColumns[i]] = "-";
				}
				// Gives default value to the columns that have been enabled.
				var previouslyDisabledColumns = disableList[oldValue];
				for(var i = 0; i < previouslyDisabledColumns.length; i++) {
					// If the column has been enabled
					if(disabledColumns.indexOf(previouslyDisabledColumns[i]) == -1) {
						rowEntity[previouslyDisabledColumns[i]] = defaultList[previouslyDisabledColumns[i]];
					}
				}
				
				$scope.checkFollowers();
			}
			else if(colDef.name == "followedBy")
			{
				rowEntity.edit = false;
			}
			else {
				var disabledColumns = disableList[rowEntity.type];
				// Cancels editing of disabled columns
				if(disabledColumns.indexOf(colDef.name) != -1) {
					rowEntity[colDef.name] = "-";
				}
				else {
					// Ensures the new value is correct.
					if(colDef.name in correctors) {
						var corrector = correctors[colDef.name];
						rowEntity[colDef.name] = corrector(oldValue, newValue);
					}
				}
			}
		});
	};
	
	
	// ------------------------------------------------------------------------
	// *** 'Followed by' field management *** 
	// ------------------------------------------------------------------------
	// This task is used to simulate the 'None' option.
	var dummyTask = {id: -1, name:'None'};
	
	
	// Returns the list of aperiodic tasks that can be set as
	// followers for the given task.
	$scope.getFollowersList = function(rowEntity) {
		var tasks =  $scope.conf.tasks.filter(function(task) {
			return task.type == 1 && task.id != rowEntity.id;
		});
		tasks.push(dummyTask);
		return tasks;
	};
	
	// Happens when a new follower is selected for a given task.
	$scope.onSelectFollowedBy = function(task, follower) {
		task.edit = false;
		task.followedBy = follower.id;
	};
	

	
	// Checks that all the followers are valid, and deletes invalid ones.
	$scope.checkFollowers = function() {
		for(var i = 0; i < $scope.conf.tasks.length; i++) {
			var task = $scope.conf.tasks[i];
			var allowedFollowers = $scope.getFollowersList(task);
			var followerOK = false;
			for(var followerId = 0; followerId < allowedFollowers.length; followerId++) {
				if(task.followedBy == allowedFollowers[followerId].id) {
					followerOK = true;
					break;
				}
			}
			if(!followerOK) {
				task.followedBy = -1;
			}
		}
	};
	

	
	// ------------------------------------------------------------------------
	// *** Add / Delete tasks *** 
	// ------------------------------------------------------------------------
	$scope.addNewTask = function() {
		var id = 1;
		for (var i = 0; i < $scope.conf.tasks.length; i++) {
			if ($scope.conf.tasks[i].id == id) {
				id++;
				i = 0;
			}
		}
		$scope.conf.tasks.push(
			{'id': id, 'type': 0, 'name': 'Task ' + id, 'activationDate': 0,
			 'activationDates': "-",
			 'period': 20, 'deadline': 10, 'wcet': 5, 'followedBy': -1});
	};
	$scope.deleteTask = function(task) {
		$scope.conf.tasks.splice($scope.conf.tasks.indexOf(task), 1);
	};
	$scope.delTasks = function() {
		for (var i = 0; i < $scope.selectedTasks.length; i++) {
			var index = $scope.conf.tasks.indexOf($scope.selectedTasks[i]);
			if (index > -1) {
				$scope.conf.tasks.splice(index, 1);
			}
		}
		$scope.selectedTasks = [];
		$scope.checkFollowers();
	};	
	
	// ------------------------------------------------------------------------
	// *** Additional fields *** 
	// ------------------------------------------------------------------------

	$scope.showAdditionalFieldsModal = function() {
		$('#modalTasks').modal('show');
	};
	
	// ------------------------------------------------------------------------
	// *** Filters and stuff *** 
	// ------------------------------------------------------------------------
	$scope.followedByFilter = function(taskId) {
		var tasks = $scope.conf.tasks.filter(function(t)
		{
			return t.id == taskId;
		});
		if(tasks.length == 0)
			if(taskId == -1)
				return "None";
			else
				return "<invalid id>";
		else {
			var task = tasks[0];
			return task.name + " ("  + task.id + ")";
		}
	};
	
	simsoApp.filter('followedByFilter', function(){
		return $scope.followedByFilter;
	});
	
	// Filter displaying the task types names given their id.
	simsoApp.filter('taskTypeFilter', function() {
		return function(input) {
			var matches = $scope.taskTypes.filter(function(task) 
			{
				return task.id == input;
			});
			
			if(matches.length == 1)
				return matches[0].name;
			
			return "<unknown_value>";
		};
	});
}]);
// Manages the 'edit addional fields' modal dialog 
simsoControllers.controller('ConfigTasksAddFieldCtrl', 
['$scope', '$timeout',
function($scope, $timeout)  {
	
	var typemap = simsoApp.correctors.typemap;
	
	// Updates the grid's column to include additional fields.
	$scope.updateColumns = function()
	{
		$scope.gridTasksOptions.columnDefs = [];
		// Puts all the base processor options in the list.
		for(var i = 0; i < $scope.baseColumnDefs.length; i++) {
			$scope.gridTasksOptions.columnDefs.push($scope.baseColumnDefs[i]);
		}
		
		// Puts additional fields in the list
		for(var i = 0; i < $scope.conf.taskAdditionalFields.length; i++) {
			var field = $scope.conf.taskAdditionalFields[i];
			// function($scope, gridApi, field, corrector)
			var corrector = typemap[field.type][1] || simsoApp.correctors.string;
			simsoApp.correctors.register($scope, $scope.gridApi, field.name, corrector);
			
			// Corrects the current data
			var tasks = $scope.conf.tasks;
			for(var j = 0; j < tasks.length; j++) {
				tasks[j][field.name] = corrector(
					simsoApp.correctors.defaultValue(field.type),
					tasks[j][field.name]);
			}
			
			if(field.type == 'file')
			{
				$scope.gridTasksOptions.columnDefs.push({
					 enableCellEdit:false,
					 name: field.display_name || field.name,
					 cellTemplate:'<input type="file" filecontent="row.entity.' + field.name + '"' +
					 			   'filename="row.entity.' + field.name + '_"></input></div>',
					 pytype:field.type,
					 width: 400,
				});
			}
			else
			{
				$scope.gridTasksOptions.columnDefs.push(
				{
					name:field.name,
					type:typemap[field.type][0],
					display_name: field.display_name || field.name,
					pytype:field.type,
					width:120
				});
			}
			
		}
		
	};
	
	// Update column will be called when the additional task fields
	// are changed from outside of this controler.
	$scope.conf.onTaskFieldsChanged = $scope.updateColumns;
	
	// Setup of the modal dialog.
	createFieldEditorModal($scope, "Tasks", "Title", 
		$scope.conf.taskAdditionalFields,
		$scope.updateColumns);
	
	// Init additional fields.
	$timeout(function () {
		if($scope.conf.taskAdditionalFields.length != 0) {
			$scope.updateColumns();
		}
	}, 0);
}]);