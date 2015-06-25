
simsoControllers.controller('ResultsProcessorControler', 
['$scope', '$controller', '$timeout', 'uiGridConstants',
function($scope, $controller, $timeout, uiGridConstants)
{
	// $controller('resultsCtrl', {$scope:$scope});	
	
	$scope.gridResultsProcessorOptions = {
		enableRowSelection: false,
		enableColumnResize: false,
		enableCellEdit: false,
		enableColumnMenus: true,
		enableHorizontalScrollbar: 0,
		enableVerticalScrollbar: 1,
		columnDefs: [
			{name: 'CPU', type: 'string'},
			{name: 'Ctx Save Count', type: 'number'},
			{name: 'Ctx Load Count', type: 'number'},
			{name: 'Ctx Save Overhead', type:'string'},
			{name: 'Ctx Load Overhead', type:'string'}],
		minRowsToShow: 5,
		data: $scope.python["results-processors"]
	};
	
	$scope.gridResultsProcessorOptions.onRegisterApi = function(gridApi) {
		$scope.gridApi = gridApi;
	};
	
	$scope.$watch("conf.window.startDate", function (newValue, oldValue) {
		$timeout(function() {
			// Delay changes (dont execute while the user is typing)
			if($scope.conf.window.startDate == newValue) {
				$scope.gridResultsProcessorOptions.data = $scope.python["results-processors"];
			}
		}, 100);
	});
	
	$scope.$watch("conf.window.endDate", function (newValue, oldValue) {
		$timeout(function() {
			// Delay changes (dont execute while the user is typing)
			if($scope.conf.window.endDate == newValue) {
				$scope.gridResultsProcessorOptions.data = $scope.python["results-processors"];
			}
		}, 100);
	});
}]);