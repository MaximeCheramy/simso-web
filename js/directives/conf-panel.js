simsoApp.directive('confPanel', function() {
	return {
		restrict: 'E',
		scope: {title: '=', html: '='},
		templateUrl: 'confPanel.html'
	};	
});