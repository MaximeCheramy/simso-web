simsoControllers.controller('ConfigSchedulerCtrl', 
['confService', 'pypyService',  '$scope', 
function(confService, pypyService, $scope) {
	$scope.conf = confService;
	
	pypyService.registerObserverCallback($scope, function() {
		confService.scheduler_list = python["schedulers"];
		confService.scheduler_class = confService.scheduler_list[0];
	});	
	
	$scope.toJsType = simsoApp.correctors.toJsType;
	$scope.toJsInputType = simsoApp.correctors.toJsInputType;
	
	$scope.showAdditionalFieldsModal = function() {
		$('#modalSched').modal('show');
	};
	
	
	// Called when the scheduler changes
	$scope.onSchedulerChanged = function() {
		confService.schedAdditionalFields = [];
		confService.taskAdditionalFields.splice(0, confService.taskAdditionalFields.length);
		var sched = confService.scheduler_class;
		for(var i = 0; i < sched.required_fields.length; i++) {
			var field = sched.required_fields[i];
			// Scheduler fields
			confService.schedAdditionalFields.push(
			{
				'name' : field.name,
			 	'type' : field.type, 
			 	'value' : simsoApp.correctors.applyTypeCorrector(field.default, field.type)
			});
		}
		
		for(var i = 0; i < sched.required_task_fields.length; i++) {
			var field = sched.required_task_fields[i];
			
			// Scheduler fields
			confService.taskAdditionalFields.push(
				{'name' : field.name, 'type' : field.type}
			);
			
			// Puts in default value
			for(var taskId = 0; taskId < confService.tasks.length; taskId++) {
				confService.tasks[taskId][field.name] = field.default;
			}
		}
		
		// Notify the change.
		confService.onTaskFieldsChanged();
	};
	
}]);

// Manages the 'edit addional fields' modal dialog 
simsoControllers.controller('ConfigSchedAddFieldCtrl', 
['$scope', '$timeout',
function($scope, $timeout)  {
	
	// Callback called when the additional item list changes.
	$scope.updateColumns = function()
	{
		
	};

	// Setup of the modal dialog.
	createFieldEditorModal($scope, "Sched", "Title", 
		$scope.conf.schedAdditionalFields,
		$scope.updateColumns);
	
	// Init additional fields.
	$timeout(function () {
		if($scope.conf.schedAdditionalFields.length != 0) {
			$scope.updateColumns();
		}
	}, 0);
}]);