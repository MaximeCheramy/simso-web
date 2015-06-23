/// <reference path="../typings/angularjs/angular.d.ts"/>
var simsoApp = angular.module('simso', ['ngRoute', 'simsoControllers', 'ui.bootstrap', 'ui.grid', 'ui.grid.edit', 'ui.grid.selection']);

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


simsoApp.service("confService", function() {
	this.cycles_per_ms = 1000000;
	this.duration_ms = 100;
	this.duration = this.duration_ms * this.cycles_per_ms;
	this.tasks = [
		{'id': 1, 'name': 'T1', 'activationDate': 0, 'period': 10, 'deadline': 10, 'wcet': 5},
		{'id': 2, 'name': 'T2', 'activationDate': 0, 'period': 8, 'deadline': 8, 'wcet': 3},
		{'id': 3, 'name': 'T3', 'activationDate': 0, 'period': 8, 'deadline': 8, 'wcet': 1},
	];
	this.processors = [{'name': "Proc"}];
	this.scheduler_class = 'simso.schedulers.EDF';
});

simsoApp.service("logsService", function() {
	this.logs = []
});

simsoApp.service("pypyService", function(logsService) {
	this.pypyready = false;
	this.vm = new PyPyJS();
	this.vm.stdout = this.vm.stderr = function(data) {
		logsService.logs.push(data);
	};
	var othis = this;
	this.vm.ready.then(function() {
		othis.vm.execfile('../simso-init.py');
		othis.vm.execfile('../simso-functions.py').then(function() {
			othis.pypyready = true;
			notifyObservers();
		});
	});
	
	
	// Observer pattern
	var observersCallbacks = [];
	this.registerObserverCallback = function($scope, cb) {
		observersCallbacks.push(cb);
		$scope.$on('$destroy', function () {
			var i = observersCallbacks.indexOf(cb);
			if (i > -1) {
				observersCallbacks.splice(i, 1);
			}
		});
	};

	var notifyObservers = function() {
		observersCallbacks.forEach(function(callback) {
			callback();
		});
	};
});

simsoApp.directive("gantt", function(){
  return {
    restrict: "A",
    link: function(scope, element){
		  scope.vm.exec("draw_canvas(" + scope.aggregateParameters() + ")");
    }
  };
});

simsoApp.directive('aDisabled', function() {
    return {
        compile: function(tElement, tAttrs, transclude) {
            //Disable ngClick
            tAttrs["ngClick"] = "!("+tAttrs["aDisabled"]+") && ("+tAttrs["ngClick"]+")";

            //Toggle "disabled" to class when aDisabled becomes true
            return function (scope, iElement, iAttrs) {
                scope.$watch(iAttrs["aDisabled"], function(newValue) {
                    if (newValue !== undefined) {
                        iElement.toggleClass("disabled", newValue);
                    }
                });

                //Disable href on click
                iElement.on("click", function(e) {
                    if (scope.$eval(iAttrs["aDisabled"])) {
                        e.preventDefault();
                    }
                });
            };
        }
    };
});

simsoApp.directive('confPanel', function() {
	return {
		restrict: 'E',
		scope: {title: '=', html: '='},
		templateUrl: 'confPanel.html'
	};	
});
