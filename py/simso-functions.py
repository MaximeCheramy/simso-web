from simso.core import Model
from simso.configuration import Configuration
from simso.core import JobEvent, ProcEvent
from simso.core.Scheduler import get_schedulers

import js

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


def update_schedulers_list():
    schedulers = []
    for scheduler in get_schedulers():
        schedulers.append({'name' : scheduler});
    
    js.globals["python"]["schedulers"] = schedulers;
    

def run():
    js.globals["python"]["sim-running"] = True
    
    # Runs the model
    configuration.check_all()
    model = Model(configuration)
    model.run_model()
    
    for log in model.logs:
        print(log)
    
    # Shares results with other python scripts.
    globs["model"] = model
    globs["results"] = model.results
    
    # Shares results with js
    update_results(globs["model"])
    js.globals["python"]["sim-running"] = False
    
    

update_schedulers_list();