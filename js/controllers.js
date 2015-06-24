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
	$scope.python = python;
}]);



