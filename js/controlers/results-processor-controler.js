
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

// Manages each gantt chart instance.
simsoControllers.controller('ActiveTasksGanttControler', ['$scope', '$controller', function($scope, $controller) 
{
	// Aggregates parameters into a 'python' dict
	$scope.aggregateParameters = function()
	{
		// List of items to be displayed in the gantt chart
		var gantt_item =  "{'id' : 0, 'type' : 'active_tasks'}";
		
		return "{'zoom' : 1," +
				"'item_height' : 120," +
				"'startDate' : " + $scope.conf.window.startDate + "," + 
				"'endDate' : " + $scope.conf.window.endDate + "," + 
				"'gantt_item' : " + gantt_item +
				 "}";
		
	};
}]);
