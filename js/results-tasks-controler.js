simsoControllers.controller('ResultsTasksControler', 
['$scope', '$controller', '$timeout',
function($scope, $controller, $timeout)
{
	$scope.general = function()
	{
		return $scope.python['results-tasks-general']['general'];
	};
}]);