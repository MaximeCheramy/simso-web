simsoControllers.controller('ConfigSchedulerCtrl', 
['confService', 'pypyService', '$scope', '$timeout',
function(confService, pypyService, $scope, $timeout) {
	$scope.conf = confService;
	
	pypyService.registerObserverCallback($scope, function() {
		confService.schedulerList = python["schedulers"];
		
		// Default scheduler class
		var defaultClass = $scope.conf.schedulerList.filter(function(value, index) {
			return value.name === "simso.schedulers.EDF";
		});
		
		if(defaultClass.length == 0)
			confService.schedulerClass = confService.schedulerList[0];
		else
			confService.schedulerClass = defaultClass[0];
	});	
	
	$scope.toJsType = simsoApp.correctors.toJsType;
	$scope.toJsInputType = simsoApp.correctors.toJsInputType;
	
	$scope.showAdditionalFieldsModal = function() {
		$('#modalSched').modal('show');
	};
	
	$scope.scheduler_template = null;
	$scope.onSchedulerTemplateChanged = function() {
		readSchedulerFile($scope.scheduler_template.name, function(code)
		{
			$scope.conf.customSchedCode = code;
		});
	};
	
	// Called when the scheduler changes
	$scope.onSchedulerChanged = function() {
		confService.cleanAdditionalFields(confService.schedAdditionalFields, 'scheduler');
		confService.cleanAdditionalFields(confService.taskAdditionalFields, 'scheduler');
		confService.cleanAdditionalFields(confService.procAdditionalFields, 'scheduler');
		var sched = confService.schedulerClass;
		
		// Updates scheduler fields
		for(var i = 0; i < sched.required_fields.length; i++) {
			var field = sched.required_fields[i];
			confService.schedAdditionalFields.push(
			{
				'name' : field.name,
			 	'type' : field.type,
				'display_name' : field.display_name || field.name,
			 	'value' : simsoApp.correctors.applyTypeCorrector(field.default, field.type),
				'from' : 'scheduler'
			});
		}
		
		// Updates task fields
		for(var i = 0; i < sched.required_task_fields.length; i++) {
			var field = sched.required_task_fields[i];
			
			// Adds the fields.
			confService.taskAdditionalFields.push(
				{
					'name' : field.name,
					'type' : field.type,
					'display_name' : field.display_name || field.name,
					'from' : 'scheduler'
				}
			);
			
			// Puts in default value
			for(var taskId = 0; taskId < confService.tasks.length; taskId++) {
				confService.tasks[taskId][field.name] = field.default;
			}
		}
		
		// Updates proc fields
		for(var i = 0; i < sched.required_proc_fields.length; i++) {
			var field = sched.required_proc_fields[i];
			
			// Adds the fields.
			confService.procAdditionalFields.push(
				{
					'name' : field.name,
					'type' : field.type,
					'display_name' : field.display_name || field.name,
					'from' : 'scheduler'
				}
			);
			
			// Puts in default value
			for(var procId = 0; procId < confService.processors.length; procId++) {
				confService.processors[procId][field.name] = field.default;
			}
		} 
		// Notify the change.
		confService.onTaskFieldsChanged();
		confService.onProcFieldsChanged();
	};
	
	// Used to fix the layout of the code editor.
	$scope.fixLayout = function() {
		$timeout(function(){
			$(window).resize();
		}, 100);
	};
	
}]);

// Manages the 'edit addional fields' modal dialog 
simsoControllers.controller('ConfigSchedAddFieldCtrl', 
['$scope', '$timeout',
function($scope, $timeout)  {
	
	// Callback called when the additional item list changes.
	$scope.updateColumns = function()
	{
		
	};

	// Setup of the modal dialog.
	createFieldEditorModal($scope, "Sched", "Title", 
		$scope.conf.schedAdditionalFields,
		$scope.updateColumns);
	
	// Init additional fields.
	$timeout(function () {
		if($scope.conf.schedAdditionalFields.length != 0) {
			$scope.updateColumns();
		}
	}, 0);
}]);