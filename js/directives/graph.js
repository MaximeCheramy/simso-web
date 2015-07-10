simsoApp.directive("graph", ['$timeout', function($timeout){
  return {
    restrict: "A",
    scope : {
      "total-duration" : "@",
      "step_x": "@",
      "min_x": "@",
      "max_x": "@",
      "period": "@",
    },
    // Draws the graph
    link: function(scope, element){
      var canvas = element[0];
      var ctx = canvas.getContext('2d');
      var marginSize = 10;
      var gradTextHeight = 20;
      var myscope = {};
      // Default values
      if(!scope.min_x)
        scope.min_x = 0;
      if(!scope.max_x)
        scope.max_x = 100;
      if(!scope.step_x)
        scope.step_x = 10;
      if(!scope.period)
        scope.period = 40;

      function isIn(x, y, rect) {
          var left = rect.x, right = rect.x+rect.w;
          var top = rect.y, bottom = rect.y+rect.h;
          return (right >= x
              && left <= x
              && bottom >= y
              && top <= y);
      }

      // Gets the drawing rect of the graph
      var getDrawRect = function () {
        return {
          x: marginSize, y:marginSize,
          w: canvas.width -marginSize*2,
          h: canvas.height - marginSize*2 - gradTextHeight
        };
      };
      
      // Gets the period slider rect
      var getPeriodSliderRect = function() {
        var rect_width = 6;
        var drawRect = getDrawRect();
        var period_w = getScale() * scope.period;
        return {
          x: drawRect.x + period_w - rect_width / 2,
          y: drawRect.y,
          w: rect_width,
          h: drawRect.h
        };
      };
      
      // Gets the scale factor : time * scale => pixels
      var getScale = function() {
        return 1.0 * (canvas.width - marginSize * 2) / (scope.max_x - scope.min_x);
      };
      
      // Refreshes the background
      // Should be called when the period changes
      var refreshBackground = function() {
        var drawRect = getDrawRect();
        var period_w = getScale() * scope.period;
        ctx.fillStyle = "#FAFAFA";
        ctx.fillRect(drawRect.x, drawRect.y, period_w, drawRect.h);
        ctx.fillStyle = "#E0E0E0";
        ctx.fillRect(drawRect.x + period_w, drawRect.y, drawRect.w - period_w, drawRect.h);
        ctx.strokeStyle = "#0040B0";
        ctx.strokeRect(drawRect.x, drawRect.y, drawRect.w, drawRect.h);
      };
      
      // Refreshes the outter part of the graph.
      var refreshOutterPart = function() {
        // Clears all the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var drawRect = getDrawRect();
      
        // Scale factor :  time * scale => pixels
        var scale = getScale();
        
        // Draws the graduations
        var sub_x = scope.step_x / 5;
        var counter = 0;
        ctx.beginPath();
        for(var x = scope.min_x; x <= scope.max_x; x += sub_x) {
          var high = counter % 5 == 0;
          var posX = drawRect.x + x * scale;
          var startY = drawRect.y + drawRect.h;
          var endY = startY + (high ? 8 : 4);
          ctx.moveTo(posX, startY);
          ctx.lineTo(posX, endY);
          counter++;
        }
        ctx.stroke();
        
        // Draws the text below the graduations
        ctx.font = "12px Arial";
        ctx.fillStyle = "#0040B0";
        for(var x = scope.min_x; x <= scope.max_x; x += scope.step_x) {
          var text = "" + x;
          var length = ctx.measureText(text).width;
          var posX = x * scale - length/2;//x * scale - length / 2;
          ctx.fillText(text, drawRect.x + posX, drawRect.y + drawRect.h + 20);
        }
      }; // refresh
      
      
      canvas.addEventListener("mousedown", function() {
        
        
      });
      scope.$watch("min_x", function() { refreshOutterPart(); refreshBackground();});
      scope.$watch("max_x", function() { refreshOutterPart(); refreshBackground();});
      scope.$watch("period", function() { refreshBackground();});
    } // link
  };
}]);