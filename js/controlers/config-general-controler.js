
simsoControllers.controller('ConfigGeneralCtrl', 
['confService', 'pypyService', '$scope', 
function(confService, pypyService, $scope) {
	$scope.conf = confService;
	
	pypyService.registerObserverCallback($scope, function() {
		confService.etmList = python["etm"];
		confService.etm = confService.etmList[0];
	});	
	
	// Called when the ETM changes
	$scope.onEtmChanged = function() {
		confService.cleanAdditionalFields(confService.etmAdditionalFields, 'etm');
		confService.cleanAdditionalFields(confService.taskAdditionalFields, 'etm');
		confService.cleanAdditionalFields(confService.procAdditionalFields, 'etm');
		var etm = confService.etm;
		
		
		// Updates scheduler fields
		for(var i = 0; i < etm.required_fields.length; i++) {
			var field = etm.required_fields[i];
			confService.etmAdditionalFields.push(
			{
				'name' : field.name,
				'display_name' : field.display_name || field.name,
			 	'type' : field.type, 
			 	'value' : simsoApp.correctors.applyTypeCorrector(field.default, field.type),
				'from' : 'etm'
			});
		}
		
		// Updates task fields
		for(var i = 0; i < etm.required_task_fields.length; i++) {
			var field = etm.required_task_fields[i];
			
			// Adds the fields.
			confService.taskAdditionalFields.push(
				{
					'name' : field.name,
					'type' : field.type,
					'display_name' : field.display_name || field.name,
					'from' : 'etm'
				}
			);
			
			// Puts in default value
			for(var taskId = 0; taskId < confService.tasks.length; taskId++) {
				confService.tasks[taskId][field.name] = field.default;
			}
		}
		
		// Updates proc fields
		for(var i = 0; i < etm.required_proc_fields.length; i++) {
			var field = etm.required_proc_fields[i];
			
			// Adds the fields.
			confService.procAdditionalFields.push(
				{
					'name' : field.name,
					'type' : field.type,
					'display_name' : field.display_name || field.name,
					'from' : 'etm'
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
}]);