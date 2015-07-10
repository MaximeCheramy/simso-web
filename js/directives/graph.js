simsoApp.directive("graph", ['$timeout', function($timeout){
  return {
    restrict: "A",
    scope : {
      "step_x": "@",
      "duration": "@",
      "period": "=",
      "activationDate" : "=",
      "deadline" : "=",
      "wcet" : "="
    },
    // Draws the graph
    link: function(scope, element){
      var canvas = element[0];
      var ctx = canvas.getContext('2d');
      var marginSize = 10;
      var gradTextHeight = 20;
      var taskHeightOffset = 10;
      var myscope = {};
      myscope.refresh = {};
      myscope.refresh.background = true;
      myscope.refresh.outter = true;
      
      
      // Default values
      if(!scope.duration)
        scope.duration = 100;
      if(!scope.step_x)
        scope.step_x = 10;
      if(!scope.period)
        scope.period = 40;
      
      
      // Converts an event client position to a position relative to
      // the canvas' origin.
      var toRelative = function(e) {
        var bbox = canvas.getBoundingClientRect();
        
        return { x: e.clientX - bbox.left * (canvas.width  / bbox.width),
          y: e.clientY - bbox.top  * (canvas.height / bbox.height)
        };
      };
      
      // Determines if a given point is in a given rectangle.
      var isIn = function(x, y, rect) {
          var left = rect.x;
          var right = rect.x+rect.w;
          var top = rect.y;
          var bottom = rect.y+rect.h;
          return (right >= x
              && left <= x
              && bottom >= y
              && top <= y);
      }

      // Gets the drawing rect of the graph
      var getDrawRect = function () {
        return {
          x: marginSize+6, y:marginSize,
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
      
      // Gets the WCET rect
      var wcetRectWidth = 6;
      var getTaskWCETRect = function() {
        var taskRect = getTaskRect(0);
        return {
          x: taskRect.x + taskRect.w - wcetRectWidth,
          y: taskRect.y,
          w: wcetRectWidth,
          h: taskRect.h,
        };
      };
      
      // Gets the Activation Date rect
      var getTaskActivationDateRect = function() {
        var taskRect = getTaskRect(0);
        return {
          x: taskRect.x,
          y: taskRect.y,
          w: taskRect.w - wcetRectWidth,
          h: taskRect.h,
        };
      };
      
      // Gets the scale factor : time * scale => pixels
      var getScale = function() {
        return 1.0 * (canvas.width - marginSize * 2) / (scope.duration);
      };
      
      // Returns the rect of the ith task.
      var getTaskRect = function(i) {
        var activationDate = scope.activationDate + i * scope.period;
        var rect = getDrawRect();
        return {
          x: rect.x + activationDate * getScale(),
          y: rect.y + taskHeightOffset,
          w: scope.wcet * getScale(),
          h: rect.h - taskHeightOffset
        };
      };
      
      // Return all the task rectangles to draw
      var getTaskRects = function() {
        var maxTasks = scope.duration / scope.period;
        var mainRect = getDrawRect();
        var rects = [];
        for(var i = 0; i < maxTasks; i++) {
          var rect = getTaskRect(i);
          // If we reached the end : break
          if(rect.x >= mainRect.x + mainRect.w)
            break;
          
          rect.w = Math.max(0, Math.min(rect.w, mainRect.x + mainRect.w - rect.x));
          rects.push(rect);
        }
        
        return rects;
      };
      
      // Gets the deadline arrow rect.
      var getDeadlineRect = function() {
        var drawRect = getDrawRect();
        return {
          x: drawRect.x + (scope.activationDate + scope.deadline) * getScale() - 2,
          y: drawRect.y,
          w: 6,
          h: drawRect.h
        };
      };
      
      // Draws an arrow at the given date
      // if 'up' is true, draws an up-arrow.
      var drawArrow = function(date, color, up) {
        var drawRect = getDrawRect();
        var height = drawRect.h - taskHeightOffset;
        var arrowX = drawRect.x + date * getScale();
        var arrowStart = drawRect.y + drawRect.h - (up ? 0 : height);
        var arrowEnd = drawRect.y + drawRect.h - (up ? height : 0);
        var arrowDir = up ? 5 : -5;
        var points = [
          {x: arrowX - 2, y: arrowEnd+arrowDir},
          {x: arrowX, y:arrowEnd},
          {x: arrowX + 2, y: arrowEnd+arrowDir}
        ];
        
        if(!color)
          color = "#000000";
        
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowStart);
        ctx.lineTo(arrowX, arrowEnd);
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.lineTo(points[2].x, points[2].y);
        ctx.stroke();
      };
      
      // Refreshes the background
      // Should be called when the period changes
      var refreshBackground = function() {
        // Avoids having null periods.
        scope.period = Math.max(1, scope.period);
        
        
        var drawRect = getDrawRect();
        var period_w = getScale() * scope.period;
        // Draws the white area
        ctx.fillStyle = "#FAFAFA";
        ctx.fillRect(drawRect.x, drawRect.y, drawRect.w, drawRect.h);
        // Draws the gray area
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(drawRect.x + period_w, drawRect.y, drawRect.w - period_w, drawRect.h);
        
        // Draws the slider (if not on hover)
        if(myscope.refresh.hover != draggableElements[0])
        {
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.fillRect(drawRect.x + period_w - 2, drawRect.y, 3, drawRect.h);
        }
        
        // Draws the outter rectangle.
        ctx.strokeStyle = "#0040B0";
        ctx.strokeRect(drawRect.x, drawRect.y, drawRect.w, drawRect.h);
        
        // Draws the tasks rectangles.
        var taskRects = getTaskRects();
        ctx.strokeStyle = "#0040B0";
        ctx.fillStyle = "rgba(0, 125, 255, 0.5)";
        for(var i = 0; i < taskRects.length; i++) {
          var taskRect = taskRects[i];
          ctx.fillRect(taskRect.x, taskRect.y, taskRect.w, taskRect.h);
          ctx.strokeRect(taskRect.x, taskRect.y, taskRect.w, taskRect.h);
        }
        
        // Draws the deadline arrow
        drawArrow(scope.activationDate + scope.deadline);
        
        // Draws the hover rectangle
        if(myscope.refresh.hover) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
          ctx.strokeStyle = "rgba(125, 125, 200, 0.40)";
          var r = myscope.refresh.hover.rect();
          ctx.fillRect(r.x, r.y, r.w, r.h);
          ctx.strokeRect(r.x, r.y, r.w, r.h);
        }
      };
      
      // Refreshes the outter part of the graph.
      var refreshOutterPart = function() {
        var drawRect = getDrawRect();
        // Clears the part where the text is drawn
        ctx.clearRect(0, drawRect.y+drawRect.h, canvas.width, canvas.height-drawRect.y);
        
        // Scale factor :  time * scale => pixels
        var scale = getScale();
        
        // Draws the graduations
        var sub_x = scope.step_x / 5;
        var counter = 0;
        ctx.beginPath();
        for(var x = 0; x <= scope.duration; x += sub_x) {
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
        for(var x = 0; x <= scope.duration; x += scope.step_x) {
          var text = "" + x;
          var length = ctx.measureText(text).width;
          var posX = x * scale - length/2;//x * scale - length / 2;
          ctx.fillText(text, drawRect.x + posX, drawRect.y + drawRect.h + 20);
        }
        
        
      }; // refresh
      
      // Refreshes the elements that need to be redrawn.
      var refresh = function() {
        if(myscope.refresh.background) {
          refreshBackground();
          myscope.refresh.background = false;
        }
        if(myscope.refresh.outter) {
          refreshOutterPart();
          myscope.refresh.outter = false;
        }
      };
      
      // List of all the elements that can be dragged.
      var draggableElements = [
        {
          rect : getPeriodSliderRect, 
          property: function(time) { if(time) scope.period = Math.max(1, time); else return scope.period; },
          round: function() { scope.period = Math.round(scope.period*10) / 10; }
        },
        {
          rect : getTaskWCETRect, 
          property: function(time, delta) { 
            if(time) scope.wcet = Math.max(1, scope.wcet + delta); else return scope.wcet;
          },
          round: function() { scope.wcet = Math.round(scope.wcet*10) / 10; }
        },
        {
          rect : getTaskActivationDateRect, 
          property: function(time) { 
            if(time) scope.activationDate = Math.max(0, time); else return scope.activationDate; 
          },
          round: function() { scope.activationDate = Math.round(scope.activationDate*10) / 10; }
        },
        {
          rect : getDeadlineRect, 
          property: function(time, delta) { 
            if(time) scope.deadline += delta; else return scope.deadline; 
          },
          round: function() { scope.deadline = Math.round(scope.deadline*10) / 10; }
        }
      ];
      
      // On mouse down : start dragging events if needed
      canvas.addEventListener("mousedown", function(e) {
        var pos = toRelative(e);
        for(var i = 0; i < draggableElements.length; i++) {
          var elem = draggableElements[i];
          if(isIn(pos.x, pos.y, elem.rect())) {
            myscope.dragging = elem;
            myscope.draggingPos = {x: pos.x, y: pos.y};
          }
        }
      });
      
      // On mouse move : dragg elemnts
      canvas.addEventListener("mousemove", function(e) {
        var pos = toRelative(e);
        if(myscope.dragging) {
          // Here we are dragging an object.
          var deltaX = pos.x - myscope.draggingPos.x;
          var deltaTime = deltaX / getScale();
          
          // Set the new value of the property
          myscope.dragging.property(myscope.dragging.property() + deltaTime, deltaTime);
          myscope.draggingPos = pos;
          
          // Refreshes the proper elements.
          myscope.refresh.background = true;
          myscope.refresh.hover = myscope.dragging;
          refresh();
          
        }  else {
          // Now we are checking if the mouse is over an object.
          var oldHover = myscope.refresh.hover;
          myscope.refresh.hover = null;
          for(var i = 0; i < draggableElements.length; i++) {
            var elem = draggableElements[i];
            if(isIn(pos.x, pos.y, elem.rect())) {
              myscope.refresh.hover = elem;
            }
          }
          
          // If the hover changed, refresh.
          if(myscope.refresh.hover != oldHover)
          {
            myscope.refresh.background = true;
            refresh();
          }
        }
      });
      
      // On mouse up : ends dragging events.
      canvas.addEventListener("mouseup", function(e) {
        // Notifies the change to the parent scope once the
        // mouse up event triggers.
        if(myscope.dragging)
          scope.$parent.$apply(function() {
            myscope.dragging.round();
          });
          
        myscope.dragging = null;
      });
      
      scope.$watch("refresh", refresh);
      scope.$watch("max_x", function() { myscope.refresh.outter = true; refresh(); });
      scope.$watch("period", function() { myscope.refresh.background = true; refresh(); });
      scope.$watch("deadline", function() { myscope.refresh.background = true; refresh();});
      scope.$watch("activationDate", function() { myscope.refresh.background = true; refresh();});
      scope.$watch("wcet", function() { myscope.refresh.background = true; refresh(); });
      scope.$watch("duration", function() {
        canvas.width = scope.duration * 10; // 10px / ms
        myscope.refresh.outter = true;
        myscope.refresh.background = true;
        refresh();
      });
    } // link
  };
}]);