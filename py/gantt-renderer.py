from simso.core import Model
from simso.configuration import Configuration
from simso.core import JobEvent, ProcEvent

import js

class Style(object):
    def __init__(self, color, linedash=[]):
        self.color = color
        self.linedash = linedash
        
# Class used to render gantt charts.
class GanttRenderer(object):
    ITEM_HEIGHT = 60 # Height of a gantt chart
    ITEM_SPACING = 20
    UNIT_WIDTH = 10 # Length of a time unit in pixels at scale 1
    GRAPH_SIZE_OFFSETX = 40
    GRAPH_SIZE_OFFSETY = 10
    GRAPH_OX = 20
    GRAPH_OY = 15
    GRAD_HEIGHT = 4
    FILL_HEIGHT = ITEM_HEIGHT - 10
    
    def __init__(self, canvas, parameters, results):
        """Creates a renderer instance with the given parameters"""
        self.ctx = canvas.getContext('2d')
        self.canvas = canvas
        self.zoom = parameters["zoom"]
        self.selected_item = parameters["gantt_item"]
        self.results = results
        self.start_date = parameters["startDate"] #0
        self.end_date = parameters["endDate"] #min(results.model.now(), results.model.duration) // results.model.cycles_per_ms
        # number of graduation steps for each annotation
        self.graduation_substeps = 5 
        # length of a graduation step in time units
        self.graduation_steps = self.get_graduation_steps()
        
    def get_graduation_steps(self):
        """Gets the number of graduation steps in function of the zoom value"""
        if self.zoom < 2:
            return 2
        return 1
    
    def render(self):
        self.resize_canvas()
        i = 0
        if(self.selected_item["type"] == "task"):
            for task in [x for x in self.results.model.task_list if x.identifier == self.selected_item["id"]]:
                self.plot_task(i, task)
                i+= 1
        else:
            print("processors : " + str(map((lambda x : x.identifier), self.results.model.processors)) + " ; id = " + str(self.selected_item["id"]))
            for proc in [x for x in self.results.model.processors if x.identifier == self.selected_item["id"]]:
                print("id = " + str(x.identifier))
                self.plot_processor(i, proc)
                i+= 1
        
    def resize_canvas(self):
        size = self.get_size()
        self.canvas.width = size[0] + self.GRAPH_SIZE_OFFSETX
        self.canvas.height = size[1]
    
    def get_size(self):
        """Gets the size of the context where we are going to draw the chart"""
        return [(self.end_date - self.start_date) * self.UNIT_WIDTH * self.zoom + self.GRAPH_SIZE_OFFSETX, # x
                self.GRAPH_SIZE_OFFSETY + (self.ITEM_HEIGHT + self.ITEM_SPACING)] # y
    
    def get_abs_x(self, x):
        """Gets the pixel X position of the graph's X position in time units"""
        return (x - self.start_date) * self.get_size()[0] / float(self.end_date - self.start_date)
       
    def get_graph_origin(self, itemId):
        """Gets the graph's origin"""
        return (self.GRAPH_OX, itemId * (self.ITEM_HEIGHT + self.ITEM_SPACING) + self.GRAPH_OY)
        
    def get_graph_rect(self, itemId):
        """Gets the rect where the given item should be drawn"""
        origin = self.get_graph_origin(itemId);
        return  [origin[0],
             origin[1],
             self.get_abs_x(self.end_date) - self.get_abs_x(self.start_date),
             self.ITEM_HEIGHT]
             
    def get_style(self, taskId):
        """Gets the style of a given taskId"""
        colors = [
            "rgb(150, 50, 0)", "rgb(20, 180, 20)", "rgb(50, 200, 250)", 
            "rgb(240, 230, 0)", "rgb(190, 0, 250)", "rgb(50, 50, 200)", 
            "rgb(238, 135, 178)", "rgb(40, 100, 100)", "rgb(250, 180, 0)", 
            "rgb(0, 150, 100)"
        ]
        patterns = [[], [1, 2], [1, 4]]
        return Style(colors[taskId % len(colors)],
            patterns[(taskId / len(colors)) % len(patterns)])
            
    def plot_processor(self, itemId, processor):
        """Plots a processor on the graph with the given itemId"""
        # Plot processors
        self.plot_graph(itemId, processor.name)

        x1 = self.start_date
        style = None
        for evt in processor.monitor:
            current_date = float(evt[0]) / self.results.model.cycles_per_ms
            changed = False
            if current_date > self.end_date:
                break

            if evt[1].event == ProcEvent.RUN:
                nstyle = self.get_style(evt[1].args.task.identifier)
                changed = True
            elif evt[1].event == ProcEvent.OVERHEAD:
                nstyle = Style("#808080") # (Qstyle(150, 150, 150), Qt.SolidPattern)
                changed = True
            elif evt[1].event == ProcEvent.IDLE:
                nstyle = None
                changed = True

            if changed:
                if current_date > x1 and style:
                    self.plot_rect(itemId, x1, current_date, style)
                style = nstyle
                x1 = current_date

        if style:
            self.plot_rect(itemId, x1, self.end_date, style)
        
    def plot_task(self, itemId, task):
        """Plots a task on the graph with the given itemId"""
        style = None
        x1 = self.start_date
        
        # Draws the graph
        self.plot_graph(itemId, task.name)
        
        # Draws all events
        for evt in task.monitor:
            current_date = evt[0] / float(self.results.model.cycles_per_ms)
            if(current_date > self.end_date):
                break
            
            if evt[1].event != JobEvent.ACTIVATE:
                # Draws the item
                if style and x1 < current_date:
                    self.plot_rect(itemId, x1, current_date, style)
                
                if evt[1].event == JobEvent.EXECUTE:
                    style = self.get_style(task.identifier) # TODO
                elif evt[1].event == JobEvent.PREEMPTED:
                    style = None
                elif evt[1].event == JobEvent.TERMINATED:
                    style = None
                elif evt[1].event == JobEvent.ABORTED:
                    style = None
                x1 = current_date
        
        # Draws the last item   
        if x1 < self.end_date and style:
            self.plot_rect(itemId, x1, current_date, style)
        
        # Draw activation lines.
        for evt in task.monitor:
            current_date = evt[0] / float(self.results.model.cycles_per_ms)
            if current_date > self.end_date:
                break
                
            if evt[1].event == JobEvent.ACTIVATE:
                self.plot_line(itemId, current_date,
                                          Style("#202020", []),
                                          arrowUp=True)
        # Draw deadlines and dots.
        for evt in task.monitor:
            current_date = evt[0] / float(self.results.model.cycles_per_ms)
            if current_date > self.end_date:
                break
            # Plots deadline
            if evt[1].event == JobEvent.ACTIVATE:
                if current_date + task.deadline <= self.end_date:
                    job_end = evt[1].job.end_date or self.end_date
                    if (job_end > evt[1].job.absolute_deadline
                            * self.results.model.cycles_per_ms or evt[1].job.aborted):
                        color = "#FF0000"
                    else:
                        color = "#202020"
                    self.plot_line(itemId, current_date + task.deadline, Style(color), 
                        arrowDown=True)
            # Plot end
            elif evt[1].event == JobEvent.TERMINATED:
                self.plot_dot(
                    itemId, current_date, "#000000")
            elif evt[1].event == JobEvent.ABORTED:
                self.plot_dot(
                    itemId, current_date, "#FF0000")
                    
    def apply_style(self, style):
        """Applies the given style to the current context"""
        self.ctx.fillStyle = style.color
        self.ctx.strokeStyle = style.color
        self.ctx.lineWidth = 1
        
    def plot_rect(self, itemId, startDate, endDate, style):
        """Plots a rect that starts and ends at the given dates (in time units)"""
        
        # Checks the bounds.
        if endDate <= self.start_date: return
        startDate = max(self.start_date, startDate)
        
        # Rect's dimentions
        origin = self.get_graph_rect(itemId)
        posX = origin[0] + self.get_abs_x(startDate)
        posY = origin[1] + (self.ITEM_HEIGHT - self.FILL_HEIGHT)
        w = self.get_abs_x(endDate) - self.get_abs_x(startDate)
        h = self.FILL_HEIGHT 
        
        self.apply_style(style)
        self.ctx.fillRect(posX, posY, w, h)
        
    def plot_dot(self, itemId, date, color, width=4):
        """Plots a dot at the given date"""
        if date <= self.start_date: return
        
        origin = self.get_graph_rect(itemId)
        
        # Rect's dimentions
        posX = origin[0] + self.get_abs_x(date)
        posY = origin[1] + self.ITEM_HEIGHT
        self.fillStyle = color
        self.ctx.beginPath()
        self.ctx.arc(posX, posY, width/2, 0, 90)
        self.ctx.fill()
        
        
    def plot_graph(self, itemId, title="te"):
        """Draws the plotting area in which the item with the given id will be drawn, 
        with graduations"""
        self.draw_graph_rect(itemId)
        for timeStep in range(self.start_date, self.end_date+1):
            posX = timeStep
            
            if timeStep % self.graduation_steps <= 0.0001:
                if ((timeStep / self.graduation_steps) % self.graduation_substeps) <= 0.0001:
                    self.draw_graph_graduation(itemId, posX, -self.ITEM_HEIGHT, True)
                    self.draw_annotation(itemId, posX, str(timeStep))
                    self.draw_graph_graduation(itemId, posX, self.GRAD_HEIGHT/2)
                else:
                    self.draw_graph_graduation(itemId, posX, self.GRAD_HEIGHT)
                
        # Draws text legend
        origin = self.get_graph_rect(itemId)
        self.ctx.save()
        self.ctx.font = "12px Arial"
        self.ctx.translate(self.GRAPH_OX - 12, origin[1] + self.ITEM_HEIGHT)
        self.ctx.rotate(-3.14/2)
        self.ctx.fillStyle = "#000000"
        self.ctx.fillText(title, 10, 10)
        self.ctx.restore()
    
    def plot_line(self, itemId, date, style, arrowUp=False, arrowDown=False):
        """Plots a vertical line for the given itemId at the given date."""
        # Checks for the bounds
        if date < self.start_date: return
        
        origin = self.get_graph_rect(itemId)
        posX = origin[0] + self.get_abs_x(date)
        top = origin[1] + (self.ITEM_HEIGHT - self.FILL_HEIGHT)
        self.apply_style(style)
        self.ctx.fillRect(posX, top, 1, self.FILL_HEIGHT)
        
        arrows = []
        p1 = (0, 0)
        p2 = (0, 0)
        
        if arrowUp:
            p1 = (posX - 5, top + 5)
            p2 = (posX, top)
            p3 = (posX + 5, top + 5)
            arrows.append([p1, p2, p3])
            
        if arrowDown:
            bottom = origin[1] + self.ITEM_HEIGHT
            p1 = (posX - 5, bottom - 5)
            p2 = (posX, bottom)
            p3 = (posX + 5, bottom - 5)
            arrows.append([p1, p2, p3])
            
            
        self.ctx.strokeStyle = "#000000"
        for arrow in arrows:
            self.ctx.beginPath()
            self.ctx.moveTo(arrow[0][0], arrow[0][1])
            self.ctx.lineTo(arrow[1][0], arrow[1][1])
            self.ctx.lineTo(arrow[2][0], arrow[2][1])
            self.ctx.stroke()
    
    def draw_graph_rect(self, itemId):
        """Draws the area in which the item with the given id will be drawn"""
        self.ctx.fillStyle = "#EEEEEE"
        self.ctx.strokeStyle = "#000000"
        rect = self.get_graph_rect(itemId)
        self.ctx.strokeRect(rect[0], rect[1], rect[2], rect[3])
        self.ctx.fillRect(rect[0], rect[1], rect[2], rect[3])
    
    def draw_annotation(self, itemId, centerPosition, text):
        """Draws the given text for the item (whose id is itemId) at the given position, under the X axis.
        CenterPosition is the center position of the text in time units"""
        
        self.ctx.font = "12px Arial"
        textsize = self.ctx.measureText(text)
        origin = self.get_graph_rect(itemId)
        posX = origin[0] + self.get_abs_x(centerPosition) - float(textsize.width / 2)
        
        self.ctx.fillStyle = "#000000"
        self.ctx.fillText(text,
             posX, origin[1] + self.ITEM_HEIGHT + 15)
            
        
    def draw_graph_graduation(self, itemId, position, height, dotdash=False):
        """Draws the vertical line for the given item, at the given position (in time units) with
        the given height"""
        
        origin = self.get_graph_rect(itemId)
        bottom = origin[1] + self.ITEM_HEIGHT
        posX = self.get_abs_x(position) + origin[0]
        
        if dotdash:
            self.ctx.setLineDash([1, 4])
            
        self.ctx.strokeStyle = "#000000"
        self.ctx.beginPath()
        self.ctx.moveTo(posX, bottom)
        self.ctx.lineTo(posX, bottom + height)
        self.ctx.stroke()
        self.ctx.setLineDash([])
        
        
        
def draw_canvas(parameters):
    # Gets the gantt canvas using jquery.
    js.globals["python"]["renderer-running"] = True
    jquery = js.globals["$"]
    item = parameters["gantt_item"]
    canvas = jquery("#resultsGantt" + item["type"] + str(item["id"]))[0];
    renderer = GanttRenderer(canvas, parameters, globs["results"])
    renderer.render()
    js.globals["python"]["renderer-running"] = False
    
