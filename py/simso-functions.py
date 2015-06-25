from simso.core import Model
from simso.configuration import Configuration
from simso.core import JobEvent, ProcEvent

import js

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
    
def run():
    js.globals["python"]["sim-running"] = True
    
    # Runs the model
    configuration.check_all()
    model = Model(configuration)
    model.run_model()
    
    # Shares results with js
    js.globals["python"]["results-general"] = aggregate_general_results(model)
    
    
    # Shares results with other python scripts.
    globs["results"] = model.results
    
    js.globals["python"]["sim-running"] = False
    
    
