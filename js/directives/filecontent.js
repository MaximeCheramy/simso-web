// For use with <input type="file" filecontent="scopeVariable">
simsoApp.directive("filecontent", [function () {
    return {
        scope: {
            filecontent: "=",
			filename:"="
        },
        link: function (scope, element, attributes) {
            element.bind("change", function (changeEvent) {
                var reader = new FileReader();
                reader.onload = function (loadEvent) {
                    scope.$apply(function () {
	                   	scope.filecontent = loadEvent.target.result;
						if(scope.filename) {
							console.log("FILECONTENT CHANGE !!!");
							scope.filename = changeEvent.target.files[0];
						}
                    });
                };
                reader.readAsText(changeEvent.target.files[0]);
            });
        }
    };
}]);