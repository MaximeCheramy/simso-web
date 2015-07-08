
simsoControllers.controller('ResultsGeneralControler', 
['$scope', '$controller', '$timeout', 'uiGridConstants',
function($scope, $controller, $timeout, uiGridConstants)
{
	// $controller('resultsCtrl', {$scope:$scope});	
	
	$scope.gridResultsGeneralOptions = {
		enableRowSelection: false,
		enableColumnResize: false,
		enableCellEdit: false,
		enableColumnMenus: true,
		enableHorizontalScrollbar: 0,
		enableVerticalScrollbar: 1,
		columnDefs: [
			{name: 'CPU', type: 'string'},
			{name: 'Total load', type: 'number'},
			{name: 'Payload', type: 'number'},
			{name: 'System load', type:'number'}],
		minRowsToShow: 5,
		data: $scope.python["results-general"]
	};
	
	$scope.gridResultsGeneralOptions.onRegisterApi = function(gridApi) {
		$scope.gridApi = gridApi;
	};
	
	$scope.$watch("conf.window.startDate", function (newValue, oldValue) {
		$timeout(function() {
			// Delay changes (dont execute while the user is typing)
			if($scope.conf.window.startDate == newValue) {
				$scope.gridResultsGeneralOptions.data = $scope.python["results-general"];
			}
		}, 100);
	});
	
	$scope.$watch("conf.window.endDate", function (newValue, oldValue) {
		$timeout(function() {
			// Delay changes (dont execute while the user is typing)
			if($scope.conf.window.endDate == newValue) {
				$scope.gridResultsGeneralOptions.data = $scope.python["results-general"];
			}
		}, 100);
	});
}]);