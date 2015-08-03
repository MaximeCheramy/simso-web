
// Manages the list of gantt charts and the grid to display/hide them.
// The gantt controler is a child of the results controler.
simsoControllers.controller('GanttListControler', 
['$scope', '$controller', 'confService', '$timeout',
function($scope, $controller, confService, $timeout)
{
	var MIN_ZOOM = 1;
	var MAX_ZOOM = 1000;
	$controller('resultsCtrl', {$scope:$scope});
	$scope.ganttZoom = 100;
	
	// Options of the grid used to select processors and list to display.
	$scope.selectedItems = [];

	$scope.ganttZoomProperty = correctors.makeProperty($scope, 'ganttZoom',
		function(oldValue, newValue) {
			if(isNaN(newValue))
				return oldValue;
			return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, parseInt(newValue)));
		}
	);
	
	$scope.updateZoom = function() {
		// These values MUST be identical to the one specified in gantt-renderer.py!
		var GRAPH_SIZE_OFFSETX = 60;
		var UNIT_WIDTH = 10;
		var newWidth = (($scope.conf.window.endDate - $scope.conf.window.startDate) * UNIT_WIDTH * $scope.ganttZoom / 100.0 + 2 * GRAPH_SIZE_OFFSETX) + "px";

		for (var i = 0; i < confService.allGanttItems.length; i++) {
			var item = confService.allGanttItems[i];
			var el = $("#resultsGantt" + item["type"] + item["id"]);
			if(el)
				el[0].style.width = newWidth;
		}
	};

	$scope.zoomPlus = function() {
		$scope.ganttZoom = Math.min($scope.ganttZoom + 10, MAX_ZOOM);
	};
	
	$scope.zoomMinus = function() {
		$scope.ganttZoom = Math.max($scope.ganttZoom - 10, MIN_ZOOM);
	};
	
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
		
		// Select all rows when loaded.
		$timeout(gridApi.selection.selectAllRows, 0);
	};

	// Gantt export
	$scope.onGanttExport = function(all) {
		var buff = document.getElementById('buffer');
		
		// Calculates the total size of the image, and gets all the images
		// to draw on the buffer
		var width = 0; var height = 0;
		var imgs = [];
		var heights = [];
		for(var i = 0; i < $scope.conf.allGanttItems.length; i++) {
			var item = $scope.conf.allGanttItems[i];
			var ganttCanvas = document.getElementById("resultsGantt" + item.type + "" + item.id);
			if(!all) {
				// Draw only the selected gantt items
				if($scope.selectedItems.indexOf(item) < 0)
					continue;
			}
			
			imgs.push(ganttCanvas);
			width = Math.max(ganttCanvas.width, width);
			heights.push(ganttCanvas.height);
			height += ganttCanvas.height;
			
		}
		
		// Resizes the buffer
		buff.width = width;
		buff.height = height;
		
		// Draws the images on the buffer (1 per diagram)
		var ctx = buff.getContext("2d");
		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, ctx.width, ctx.height);
		
		var y = 0;
		for(var i = 0; i < imgs.length; i++) {
			ctx.drawImage(imgs[i], 0, y);
			y += heights[i];
		}
		
		// Saves the buffer
		var image = buff.toDataURL("image/png");
		$("#gantt-download").attr(
			{href: image}
		);
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
