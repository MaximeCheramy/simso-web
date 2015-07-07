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
	
	$rootScope.disableResults = function() {
		$scope.$apply(function() {
			$scope.disableResults = true;
		});
	};
}]);
