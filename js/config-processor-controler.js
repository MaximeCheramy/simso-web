
// Manages the processors list
simsoControllers.controller('ConfigProcessorsCtrl', 
['confService', '$scope', 
function(confService, $scope) {
	$scope.selectedProcessors = [];
	$scope.conf = confService;
	$scope.baseColumnDefs = [
		{name: 'id', type: 'number', enableCellEdit: false},
		{name: 'name', type: 'string'},
		{name: 'csOverhead', displayName: 'CS overhead', type: 'number'},
		{name: 'clOverhead', displayName: 'CL overhead', type: 'number'},
		{name: 'speed', displayName: 'Speed', type: 'number'}
	];
	
	$scope.gridProcessorsOptions = {
		enableColumnResize: true,
		enableCellEdit: true,
		enableColumnMenus: false,
		enableHorizontalScrollbar: 0,
		enableVerticalScrollbar: 2,
		minRowsToShow: 4,
		columnDefs: $scope.baseColumnDefs,
		data: $scope.conf.processors,
	};
	
	// ------------------------------------------------------------------------
	// *** API Registering *** 
	// ------------------------------------------------------------------------
	$scope.gridProcessorsOptions.onRegisterApi = function(gridApi) {
		$scope.gridApi = gridApi;
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
	// ------------------------------------------------------------------------
	// *** Additional fields *** 
	// ------------------------------------------------------------------------

	$scope.showAdditionalFieldsModal = function() {
		$('#modalProcs').modal('show');
	};
}]);


// Manages the 'edit addional fields' modal dialog 
simsoControllers.controller('ConfigProcsAddFieldCtrl', 
['$scope', '$timeout',
function($scope, $timeout)  {
	
	var typemap = simsoApp.correctors.typemap;
	
	// Updates the grid's column to include additional fields.
	$scope.updateColumns = function()
	{
		$scope.gridProcessorsOptions.columnDefs = [];
		// Puts all the base processor options in the list.
		for(var i = 0; i < $scope.baseColumnDefs.length; i++) {
			$scope.gridProcessorsOptions.columnDefs.push($scope.baseColumnDefs[i]);
		}
		
		// Puts additional fields in the list
		for(var i = 0; i < $scope.conf.procAdditionalFields.length; i++) {
			var field = $scope.conf.procAdditionalFields[i];
			// function($scope, gridApi, field, corrector)
			var corrector = typemap[field.type][1] || simsoApp.correctors.string;
			
			if(typeof corrector != "undefined")
				simsoApp.correctors.register($scope, $scope.gridApi, field.name, corrector);
			
			// Corrects the current data
			$scope.gridProcessorsOptions.data[field.name] = corrector("", $scope.gridProcessorsOptions.data[field.name]);
			
			
			$scope.gridProcessorsOptions.columnDefs.push(
			{
				name:field.name,
				type:typemap[field.type][0],
				pytype:field.type,
				width:120
			});
			
		}
		
	};
	
	// Update column will be called when the additional task fields
	// are changed from outside of this controler.
	$scope.conf.onProcFieldsChanged = $scope.updateColumns;
	
	// Setup of the modal dialog.
	createFieldEditorModal($scope, "Procs", "Title", 
		$scope.conf.procAdditionalFields,
		$scope.updateColumns);
	
	// Init additional fields.
	$timeout(function () {
		if($scope.conf.procAdditionalFields.length != 0) {
			$scope.updateColumns();
		}
	}, 0);
}]);