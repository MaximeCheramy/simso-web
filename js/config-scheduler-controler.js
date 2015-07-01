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