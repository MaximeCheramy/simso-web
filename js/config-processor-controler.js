
// Manages the processors list
simsoControllers.controller('ConfigProcessorsCtrl', ['confService', '$scope', function(confService, $scope) {
	$scope.selectedProcessors = [];
	$scope.conf = confService;

	
	$scope.gridProcessorsOptions = {
		enableColumnResize: true,
		enableCellEdit: true,
		enableColumnMenus: false,
		enableHorizontalScrollbar: 0,
		enableVerticalScrollbar: 2,
		minRowsToShow: 4,
		columnDefs: [
			{name: 'id', type: 'number', enableCellEdit: false},
			{name: 'name', type: 'string'},
			{name: 'csOverhead', displayName: 'CS overhead', type: 'number'},
			{name: 'clOverhead', displayName: 'CL overhead', type: 'number'},
			{name: 'speed', displayName: 'Speed', type: 'number'}
		],
		data: $scope.conf.processors,
	};
	
	// ------------------------------------------------------------------------
	// *** API Registering *** 
	// ------------------------------------------------------------------------
	$scope.gridProcessorsOptions.onRegisterApi = function(gridApi) {
		var updateRow = function(row) {
			if (row.isSelected) {
				$scope.selectedProcessors.push(row.entity);
			} else {
				var index = $scope.selectedProcessors.indexOf(row.entity);
				if (index > -1) {
					$scope.selectedProcessors.splice(index, 1);
				}
			}
		};
		
		// Registers correctors
		simsoApp.correctors.register($scope, gridApi, "csOverhead", correctors.isPositiveInt);
		simsoApp.correctors.register($scope, gridApi, "clOverhead", correctors.isPositiveInt);
		simsoApp.correctors.register($scope, gridApi, "speed", correctors.isPositiveFloat);
		
		gridApi.selection.on.rowSelectionChanged($scope, updateRow);
		gridApi.selection.on.rowSelectionChangedBatch($scope, function(rows)
		{
			for(var i = 0; i < rows.length; i++) {
				updateRow(rows[i]);
			}
		});
	};
	
	// ------------------------------------------------------------------------
	// *** Add / Delete processor *** 
	// ------------------------------------------------------------------------
	$scope.addNewProcessor = function() {
		var id = 1;
		for (var i = 0; i < $scope.conf.processors.length; i++) {
			if ($scope.conf.processors[i].id == id) {
				id++;
				i = 0;
			}
		}
		$scope.conf.processors.push(
		{
			'id': id,
			 'name': 'ProcName',
			 'csOverhead': 0,
			 'clOverhead': 0,
			 'speed': 1
		});
	};



	$scope.delProcessors = function() {
		for (var i = 0; i < $scope.selectedProcessors.length; i++) {
			var index = $scope.conf.processors.indexOf($scope.selectedProcessors[i]);
			if (index > -1) {
				$scope.conf.processors.splice(index, 1);
			}
		}
		$scope.selectedProcessors = [];
	};
}]);
