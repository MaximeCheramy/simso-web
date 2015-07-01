// This files contains a set of "corrector" functions.
// These functions are used to correct user input.

var correctors = {};

correctors.string = function(oldValue, newValue) {
	return newValue;
}

// Corrector ensuring the new value is a positive number
correctors.isPositiveFloat = function(oldValue, newValue) {
	if(isNaN(newValue))
		return oldValue;
	return Math.max(0, parseFloat(newValue));
};
// Corrector ensuring the new value is a positive number
correctors.isPositiveInt = function(oldValue, newValue) {
	if(isNaN(newValue))
		return oldValue;
	return Math.max(0, parseInt(newValue));
};
// Corrector ensuring the new value is a positive number
correctors.isInt = function(oldValue, newValue) {
	if(isNaN(newValue))
		return oldValue;
	return parseInt(newValue);
};
// Corrector ensuring the new value is a comma-separated list of positive
// numbers. This corrector will reject incorrect values in the list.
correctors.isListOfPositiveFloats = function(oldValue, newValue) {
	var numbers = newValue.split(",");
	var list = []
	for(var i = 0; i < numbers.length; i++) {
		var correctedNumber = correctors.isPositiveFloat(-1, numbers[i]);
		if(correctedNumber != -1)
			list.push(correctedNumber);
	}
	
	return list.join(", ");	
};

// Registers a corrector for the given field of a given gridApi.
correctors.register = function($scope, gridApi, field, corrector) {
	if(typeof gridApi._registeredCorrectors == "undefined")
		gridApi._registeredCorrectors = [];
	
	if(typeof gridApi._registeredCorrectors[field] != "undefined") {
		// unregisters the event
		gridApi._registeredCorrectors[field]();
	}	
	
	gridApi._registeredCorrectors[field] = gridApi.edit.on.afterCellEdit($scope, function(rowEntity, colDef, newValue, oldValue) {
		if(colDef.name == field) {
			rowEntity[colDef.name] = corrector(oldValue, newValue);
		}
	});
};