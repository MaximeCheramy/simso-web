/// <reference path="../typings/angularjs/angular.d.ts"/>
var simsoApp = angular.module('simso', ['ngRoute', 'simsoControllers', 
	'ui.bootstrap', 'ui.grid', 'ui.grid.edit', 'ui.grid.selection', 
	'ui.bootstrap.tabs', 'ui.bootstrap.accordion', 'ui.ace']);
	
var pythonFiles = { 
	"init" : ["../py/simso-init.py", "../py/simso-schedulers.py", "../py/simso-etm.py"],
	"files" : ["../py/gantt-renderer.py", "../py/simso-functions.py"],
	"finalize" : "../py/simso-finalize.py"
};

// Variable used to communicate from and to the python vm.
var python = { };

// Injects the filter provider into the app.
simsoApp.config(['$filterProvider', function($filterProvider)
{
	simsoApp.filter = $filterProvider.register;
	simsoApp.correctors = correctors;
}]);

simsoApp.config(['$routeProvider',
	function($routeProvider) {
		$routeProvider.
			when('/configuration', {
				templateUrl: 'partial/configuration.html',
				controller: 'configurationCtrl'
			}).
			when('/results', {
				templateUrl: 'partial/results.html',
				controller: 'resultsCtrl'
			}).
			otherwise({
				redirectTo: '/configuration'
			});
	}]
);









