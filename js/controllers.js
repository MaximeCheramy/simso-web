var simsoControllers = angular.module('simsoControllers', []);

simsoControllers.controller('HeaderController', ['logsService', '$scope', '$rootScope', '$location', function(logsService, $scope, $rootScope, $location) { 
	$scope.isActive = function(viewLocation) { 
		return viewLocation === $location.path();
	};
	$scope.go = function(path) {
		$location.path(path);
	};
	$scope.disableResults = true;
	$rootScope.enableResults = function() {
		$scope.$apply(function() {
			$scope.disableResults = false;
		});
	};
}]);

simsoControllers.controller('resultsCtrl', ['logsService', 'pypyService', '$scope', 'confService', 
function(logsService, pypyService, $scope, confService) {
	
	$scope.logs = logsService.logs;
	$scope.vm = pypyService.vm;
	$scope.conf = confService;
	$scope.python = python;
	$scope.tmpWindow = {startDate: 0, endDate: $scope.conf.window.endDate};
	
	$scope.updateObservationWindow = function() {
		var windowStr = "(" + $scope.conf.window.startDate + ", " + $scope.conf.window.endDate + ")";
		$scope.vm.exec("change_observation_window(" + windowStr + ")");

	};
	// Ensures the startDate and endDate values are always valid.
	$scope.validateWindowStart = function() {
		$scope.conf.window.startDate = Math.max(0, Math.min($scope.tmpWindow.startDate, $scope.conf.window.endDate));
		$scope.tmpWindow.startDate = $scope.conf.window.startDate;
		$scope.updateObservationWindow();
	};
	
	$scope.validateWindowEnd = function() {
		$scope.conf.window.endDate = Math.max($scope.conf.window.startDate, Math.min($scope.tmpWindow.endDate, $scope.conf.duration_ms));
		$scope.tmpWindow.endDate = $scope.conf.window.endDate;		
		$scope.updateObservationWindow();
	};
}]);



