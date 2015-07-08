simsoApp.directive('confPanel', function() {
	return {
		restrict: 'E',
		scope: {title: '=', html: '='},
		templateUrl: 'partial/components/conf-panel.html'
	};	
});