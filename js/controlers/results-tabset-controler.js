// This controler is mainly a "fix" to the grid ui rendering issues.
simsoControllers.controller('ResultsTabsetControler',
['$scope', '$timeout', 
function($scope, $timeout)
{
	$scope.fixLayout = function() {
		$timeout(function(){
			$(window).resize();
		}, 1);
	};
}]);