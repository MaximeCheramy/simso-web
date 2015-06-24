
// Manages the list of gantt charts and the grid to display/hide them.
// The gantt controler is a child of the results controler.
simsoControllers.controller('GanttListControler', ['$scope', '$controller', function($scope, $controller)
{
	$controller('resultsCtrl', {$scope:$scope});
	$scope.ganttWidth = 1500;
	$scope.ganttHeight = 100;
	$scope.ganttZoom = 100;
	
	// Options of the grid used to select processors and list to display.
	$scope.selectedItems = [];
	$scope.zoomPlus = function() {
		$scope.ganttZoom = Math.min($scope.ganttZoom + 20, 300);
	}
	$scope.zoomMinus = function() {
		$scope.ganttZoom = Math.max($scope.ganttZoom - 10, 50);
	}
	$scope.gridGanttOptions = {
		enableRowSelection: true,
		enableColumnResize: true,
		enableCellEdit: false,
		enableColumnMenus: false,
		enableHorizontalScrollbar: 0,
		enableVerticalScrollbar: 2,
		columnDefs: [{name: 'id', type: 'number'}, {name: 'name', type: 'string'}, {name:'type', type:'string'}],
		minRowsToShow: 5,
		data: $scope.conf.savedConf.all_gantt_items
	};
	
	// Performs item selection / deselection
	$scope.gridGanttOptions.onRegisterApi = function(gridApi) {
		gridApi.selection.setMultiSelect(true);
		gridApi.selection.selectAll = true;
		gridApi.selection.selectAllVisibleRows();
		var selectRow = function(row) {
			if (row.isSelected) {
				$scope.selectedItems.push(row.entity);
			} else {
				var index = $scope.selectedItems.indexOf(row.entity);
				if (index > -1) {
					$scope.selectedItems.splice(index, 1);
				}
			}
		};
		
		// Happens when the "select all" box is toggled.
		gridApi.selection.on.rowSelectionChanged($scope, function(row) {
			selectRow(row);
		});
		
		
		// Happens when the "select all" box is toggled.
		gridApi.selection.on.rowSelectionChangedBatch($scope, function(rows) {
			for(var rowId = 0; rowId < rows.length; rowId++)
			{
				var row = rows[rowId];
				selectRow(row);
			}
		});
	};
	
}]);

// Manages each gantt chart instance.
simsoControllers.controller('GanttControler', ['$scope', '$controller', function($scope, $controller) 
{
	// Aggregates parameters into a 'python' dict
	$scope.aggregateParameters = function()
	{
		// List of items to be displayed in the gantt chart
		var item = $scope.item;
		var gantt_item =  "{'id' : " + item.id + ", " +
					 		"'type' : '" + item.type + "'" +
							"}";
		
		return "{'zoom' : " + $scope.ganttZoom/100.0 + "," +
				"'width' : " + $scope.ganttWidth + "," +
				"'height' : " + $scope.ganttHeight + "," + 
				"'gantt_item' : " + gantt_item +
				 "}";
		
	};
	
	$scope.isDisabled = function()
	{
		return $scope.selectedItems.indexOf($scope.item) < 0;
	};
}]);