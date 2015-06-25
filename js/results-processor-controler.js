
simsoControllers.controller('ResultsProcessorControler', 
['$scope', '$controller', '$timeout', 'uiGridConstants',
function($scope, $controller, $timeout, uiGridConstants)
{
	// $controller('resultsCtrl', {$scope:$scope});	
	
	$scope.gridOptions = {
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
		data: 'python["results-processors"]'
	};
	
	$scope.gridOptions.onRegisterApi = function(gridApi) {
		$scope.gridApi = gridApi;
	};
}]);