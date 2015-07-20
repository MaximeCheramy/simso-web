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
// Corrector ensuring the new value is a positive integers
correctors.isInt = function(oldValue, newValue) {
	if(isNaN(newValue))
		return oldValue;
	return parseInt(newValue);
};
// Corrector ensuring the new value is a positive float
correctors.isFloat = function(oldValue, newValue) {
	if(isNaN(newValue))
		return oldValue;
	return parseFloat(newValue);
};

// Corrector ensuring the new value is a boolean
correctors.isBoolean = function(oldValue, newValue) {
	var map = {
		'true' : true,
		'false' : false,
		'1' : true,
		'0' : false,
		'True' : true,
		'False' : false
	};
	if(newValue in map)
		return map[newValue];
	return oldValue;
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

// maps python types to js types and their correctors
correctors.typemap = {
	'string': ['string', correctors.string, 'string', ""],
	'int': ['number', correctors.isInt, 'number', 0],
	'float': ['number', correctors.isFloat, 'number', 0.0],
	'bool': ['boolean', correctors.isBoolean, 'checkbox', false],
	'file': ['string', correctors.string, 'file', ""]
};

correctors.toJsType = function(pytype) {
	return correctors.typemap[pytype][0];
};
correctors.defaultValue = function(pytype) {
	return correctors.typemap[pytype][3];
};

correctors.applyTypeCorrector = function(value, pytype) {
	return correctors.typemap[pytype][1](correctors.defaultValue(pytype), value);
};

correctors.toJsInputType = function(pytype) {
	return correctors.typemap[pytype][2];
};

correctors.makeProperty = function(obj, field, corrector) {
	return function(value) {
		if(arguments.length == 0) {
			return obj[field];
		}
		else {
			
			obj[field] = corrector(obj[field], value);
		}
	};
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