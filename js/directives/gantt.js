simsoApp.directive("gantt", ['$timeout', function($timeout){
  return {
    restrict: "A",
    link: function(scope, element){
		scope.vm.exec("draw_canvas(" + scope.aggregateParameters() + ")");
		
		// Redraws the diagram if the zoom value changes.
		scope.$watch("ganttZoom", function (newValue, oldValue) {
			if(scope.updateZoom)
			{
				scope.updateZoom();
				$timeout(function() {
					// Delay changes (dont redraw while the user is typing)
					if(scope.ganttZoom == newValue) {
						scope.vm.exec("draw_canvas(" + scope.aggregateParameters() + ")");
					}
				}, 300);
			}
		});
		
		// Redraws the diagram if the start date changes
		scope.$watch("conf.window.startDate", function (newValue, oldValue) {
			// Delay changes (dont redraw while the user is typing)
			if(scope.conf.window.startDate == newValue) {
				scope.vm.exec("draw_canvas(" + scope.aggregateParameters() + ")");
			}
		});
		
	 	// Redraws the diagram if the end date changes
		scope.$watch("conf.window.endDate", function (newValue, oldValue) {
			// Delay changes (dont redraw while the user is typing)
			if(scope.conf.window.endDate == newValue) {
				scope.vm.exec("draw_canvas(" + scope.aggregateParameters() + ")");
			}
		});
    }
  };
}]);