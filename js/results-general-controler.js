
simsoControllers.controller('ResultsGeneralControler', ['$scope', '$controller', function($scope, $controller)
{
	$controller('resultsCtrl', {$scope:$scope});
	$scope.generalResults = python["general-results"]
	
	
	$scope.gridOptions = {
		enableRowSelection: false,
		enableColumnResize: true,
		enableCellEdit: false,
		enableColumnMenus: false,
		enableHorizontalScrollbar: 0,
		enableVerticalScrollbar: 2,
		columnDefs: [
			{name: 'CPU', type: 'string'},
			{name: 'Total load', type: 'number'},
			{name: 'Payload', type: 'number'},
			{name: 'System load', type:'number'}],
		minRowsToShow: 5,
		data: $scope.python["results-general"]
	};
	
	
}]);