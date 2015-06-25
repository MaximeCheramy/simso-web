
simsoControllers.controller('ResultsGeneralControler', 
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
			{name: 'Total load', type: 'number'},
			{name: 'Payload', type: 'number'},
			{name: 'System load', type:'number'}],
		minRowsToShow: 5,
		data: 'python["results-general"]'
	};
	
	$scope.gridOptions.onRegisterApi = function(gridApi) {
		$scope.gridApi = gridApi;
	};
}]);