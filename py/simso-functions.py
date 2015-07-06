from simso.core import Model
from simso.configuration import Configuration
from simso.core import JobEvent, ProcEvent
from simso.core.Processor import ProcInfo
from simso.core.Caches import Cache
from simso.core.Caches import Cache_LRU
from math import sqrt
import sys
import traceback
import js

def average(l):
    return float(sum(l))/max(len(l), 1)

def std(l):
    avg = average(l)
    diffs = [(x - avg)**2 for x in l]
    return sqrt(average(diffs))

def toReadable(n, digits=3):
    return ("{:." + str(digits) + "f}").format(n);
    
def change_observation_window(window):
    """Changes the model observation window.
    Window is a 2-tuple (start_date, end_date)."""
    model = globs["model"]
    model.results.observation_window = (window[0] * model.cycles_per_ms,
                                        window[1] * model.cycles_per_ms)
    print(window)
    update_results(model)

def update_results(model):
    """Communicates all results to the 'python' global variable of js"""
    js.globals["python"]["results-general"] = aggregate_general_results(model)
    js.globals["python"]["results-processors"] = aggregate_processor_results(model)
    js.globals["python"]["results-scheduler"] = aggregate_scheduler_results(model)
    js.globals["python"]["results-tasks-general"] = aggregate_task_results(model)
    js.globals["python"]["results-tasks-jobs"] = aggregate_job_results(model)

def aggregate_scheduler_results(model):
    res = model.results.scheduler
    timers = model.results.timers
    timersJs = []
    
    for proc, value in timers.items():
        timersJs.append({'name':proc.name, 'value':value})
    
    return {
        'schedule_overhead' : res.schedule_overhead,
        'activate_overhead' : res.activate_overhead,
        'terminate_overhead' : res.terminate_overhead,
        'schedule_count' : res.schedule_count,
        'activate_count' : res.activate_count,
        'terminate_count' : res.terminate_count,
        'timers' : timersJs
    }

def aggregate_processor_results(model):
    """Gets an array containing the data to put in the 'Processors' tab of the result page"""
    procs = []
    for proc in model.processors:
        proc_r = model.results.processors[proc]
        values = { }
        values["CPU"] = proc.name
        values["Ctx Save Count"] = str(proc_r.context_save_count)
        values["Ctx Load Count"] = str(proc_r.context_load_count)
        overhead = float(proc_r.context_save_overhead) / model.cycles_per_ms
        values["Ctx Save Overhead"] = "{0:.4f}ms ({1:.0f} cycles)".format(overhead, proc_r.context_save_overhead)
        overhead = float(proc_r.context_load_overhead) / model.cycles_per_ms
        values["Ctx Load Overhead"] = "{0:.4f}ms ({1:.0f} cycles)".format(overhead, proc_r.context_load_overhead)
        procs.append(values)
    return procs
    
    
def aggregate_general_results(model):
    """Gets an array containing the data to put in the 'General' tab of the result page"""
    proc_loads = []
    sum_load = 0.0
    sum_overhead = 0.0
    i = 0
    
    for proc, load, overhead in model.results.calc_load():
        proc_loads.append({})
        proc_loads[i]["CPU"] = str(proc.name)
        proc_loads[i]["Total load"] = str(load + overhead)
        proc_loads[i]["Payload"] = str(load)
        proc_loads[i]["System load"] = str(overhead)
        i += 1
        sum_load += load
        sum_overhead += overhead
        
    proc_loads.append({})
    proc_loads[i]["CPU"] = "Average"
    load = sum_load / len(model.processors)
    overhead = sum_overhead / len(model.processors)
    proc_loads[i]["Total load"] = str(load + overhead)
    proc_loads[i]["Payload"] = str(load)
    proc_loads[i]["System load"] = str(overhead)
    return proc_loads
    
def get_metrics(model, field, metrics, transform=lambda x: x):
    """
    Returns the given set of metrics for the given field of all the tasks's jobs
    The field value is transformed using the 'transform' function before being 
    processed. """
    funcs = {'min' : lambda l : min(l), 
             'avg' : lambda l : average(l),
             'max' : lambda l : max(l),
             'sum' : lambda l : sum(l),
             'std_dev' : lambda l : std(l) }
    data = []
    result = model.results
    for task in model.task_list:
        jobs = result.tasks[task].jobs
        
        # Gets the lists of job.field values transformed 
        # by the given 'transform' function.
        l = [transform(getattr(job, field)) for job in jobs 
            if getattr(job, field) is not None and not job.aborted]
            
        if l:
            elem = {' name' : task.name }
            for m in metrics:
                elem[m] = toReadable(funcs[m](l))
            data.append(elem)
    return data
    
def aggregate_task_results(model):
    result = model.results
    cycles_per_ms = float(model.cycles_per_ms)
    data = {}
    data['general'] = {}
    data['general']['computation_time'] = []
    data['general']['task_migrations'] = []
    

        
    # Taken from simso-gui
    # -- Computation time
    for curRow, task in enumerate(result.model.task_list):
        jobs = result.tasks[task].jobs
        computationTimes = [job.computation_time for job in jobs if
                            job.computation_time and job.end_date
                            and not job.aborted]
        if len(computationTimes) == 0:
            continue
        cycles_per_ms = float(result.model.cycles_per_ms)
        computationMin = min(computationTimes) / cycles_per_ms
        computationMax = max(computationTimes) / cycles_per_ms
        computationAvg = average(computationTimes) / cycles_per_ms
        computationStdDev = std(computationTimes) / cycles_per_ms
        computationOccupancy = sum(
            [job.computation_time for job in jobs
             if job.computation_time],
            0.0) / result.observation_window_duration
        
        data['general']['computation_time'].append({
          ' name' : task.name,
          'min' : toReadable(computationMin),
          'max' : toReadable(computationMax),
          'avg' : toReadable(computationAvg),
          'std_dev' : toReadable(computationStdDev),
          'occupancy' : toReadable(computationOccupancy  )
        })
        
    # -- Task Migrations
    sum_ = 0
    for task in model.task_list:
        rtask = model.results.tasks[task]
        data['general']['task_migrations'].append({
            ' name': task.name,
            'task_migrations' : str(len(rtask.task_migrations))
        })
        sum_ += len(rtask.task_migrations)
    
    data['general']['task_migrations'].append({
        ' name' : 'sum',
        'task_migrations' : str(sum_)
    })
        
    # -- Others
    data['general']['migration_count'] = get_metrics(model, 'migration_count', 
                                         ['min', 'avg', 'max', 'sum'])
    data['general']['preemption_count'] = get_metrics(model, 'preemption_count', 
                                         ['min', 'avg', 'max', 'sum'])
    data['general']['response_time'] = get_metrics(model, 'response_time', 
                                         ['min', 'avg', 'max', 'std_dev'],
                                         lambda x : x / cycles_per_ms)
    return data



def aggregate_job_results(model):
    cycles_per_ms = float(model.cycles_per_ms)
    data = {}
    # Job data
    # data['taskId'] = [ { 'name' : ..., 'Activation' : ..., ...}, ... ]
    for task in model.task_list:
        arr = []
        jobs = model.results.tasks[task].jobs
        for job in jobs:
            # Spaces are a hacky way to put things in the right column.
            elem = { '        name' : task.name }
            elem['       Activation'] = str(job.activation_date / cycles_per_ms)
            elem['      Start'] = job.start_date / cycles_per_ms if job.start_date is not None else ""
            elem['     End'] = job.end_date / cycles_per_ms if job.end_date else ""
            elem['   Deadline'] = job.absolute_deadline / cycles_per_ms
            elem['deadline_ok'] = job.end_date is not None and job.end_date <= job.absolute_deadline
            elem['Preemptions'] = job.preemption_count
            elem['Migrations'] = job.migration_count
            
            ok = job.computation_time and job.end_date
            elem['  Comp. time'] = job.computation_time / cycles_per_ms if ok else ""
            elem[' Resp. time'] = job.response_time / cycles_per_ms if ok else ""
            if ok and job.task.n_instr != 0:
                elem['CPI'] = float(job.computation_time) / job.task.n_instr
            else:
                elem['CPI'] = ""  
                          
            arr.append(elem)
        
        data[str(task.name) + " (" + str(task.identifier) + ")"] = arr
        
    
    return data
    
    
def run():
    # Init
    js.globals["python"]["sim-success"] = False
    errorLogger = js.globals["python"]["logSchedulerError"];
    eventLogger = js.globals["python"]["logSchedulerEvent"];
    
    # Runs the model
    try:
        configuration.check_all()
        print("Configuration OK")
        model = Model(configuration)
        model.run_model()
        print("Successfully run simulation")
      
    except Exception, err:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        error = traceback.format_exception_only(exc_type, exc_value)[0]
        tb = traceback.extract_tb(exc_traceback)
        
        # Puts the error into the error logger.
        errorLogger({
            'type' : 'errorCode',
            'value' : error
        })
        for tb_line in tb:
            filename, line, inn, code = tb_line
            errorLogger({
                'type': 'stack',
                'value' : "  File \"" + filename + "\", line " + str(line) + ", in " + inn,
                'code' : code
            })
        
        # errorLogger(str(traceback.format_exc()))
        return
        
    for log in model.logs:
        date_cycles, tup = log
        message, isKernelCode = tup
        date_ms = date_cycles / model.cycles_per_ms;
        eventLogger({
            'date_cycles' : date_cycles,
            'date_ms' : date_ms,
            'message' : message,
            'is_kernel_code' : isKernelCode
        })
    
    # Shares results with other python scripts.
    globs["model"] = model
    globs["results"] = model.results
    
    # Shares results with js
    try:
        update_results(globs["model"])
    except Exception, err:
        # !!!!! TEMPORARY ERROR HANDLING / FOR DEBUG ONLY !!!!!
        exc_type, exc_value, exc_traceback = sys.exc_info()
        error = traceback.format_exception_only(exc_type, exc_value)[0]
        tb = traceback.extract_tb(exc_traceback)
        
        errorLogger({
            'type' : 'errorCode',
            'value' : error
        })
        for tb_line in tb:
            filename, line, inn, code = tb_line
            errorLogger({
                'type': 'stack',
                'value' : "  File \"" + filename + "\", line " + str(line) + ", in " + inn,
                'code' : code
            })
        
        return
    
    js.globals["python"]["sim-success"] = True
