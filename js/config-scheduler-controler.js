simsoControllers.controller('ConfigSchedulerCtrl', 
['confService', 'pypyService',  '$scope', 
function(confService, pypyService, $scope) {
	$scope.conf = confService;
	
	pypyService.registerObserverCallback($scope, function() {
		confService.scheduler_list = python["schedulers"];
		confService.scheduler_class = confService.scheduler_list[0];
	});
}]);
