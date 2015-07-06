
// Manages the list of gantt charts and the grid to display/hide them.
// The gantt controler is a child of the results controler.
simsoControllers.controller('GanttListControler', ['$scope', '$controller', 'confService', function($scope, $controller, confService)
{
	$controller('resultsCtrl', {$scope:$scope});
	$scope.ganttZoom = 100;
	
	// Options of the grid used to select processors and list to display.
	$scope.selectedItems = [];

	$scope.updateZoom = function() {
		// These values MUST be identical to the one specified in gantt-renderer.py!
		var GRAPH_SIZE_OFFSETX = 40;
		var UNIT_WIDTH = 10;
		var newWidth = (($scope.conf.window.endDate - $scope.conf.window.startDate) * UNIT_WIDTH * $scope.ganttZoom / 100.0 + 2 * GRAPH_SIZE_OFFSETX) + "px";

		for (var i = 0; i < confService.allGanttItems.length; i++) {
			var item = confService.allGanttItems[i];
			var el = $("#resultsGantt" + item["type"] + item["id"])[0];
			el.style.width = newWidth;
		}
	}

	$scope.zoomPlus = function() {
		$scope.ganttZoom = Math.min($scope.ganttZoom + 10, 300);
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
		data: $scope.conf.allGanttItems
	};
	
	// Performs item selection / deselection
	$scope.gridGanttOptions.onRegisterApi = function(gridApi) {
		gridApi.selection.setMultiSelect(true);
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
				"'startDate' : " + $scope.conf.window.startDate + "," + 
				"'endDate' : " + $scope.conf.window.endDate + "," + 
				"'gantt_item' : " + gantt_item +
				 "}";
		
	};
	
	$scope.isDisabled = function()
	{
		return $scope.selectedItems.indexOf($scope.item) < 0;
	};
}]);
