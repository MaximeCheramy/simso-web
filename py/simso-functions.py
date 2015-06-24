from simso.core import Model
from simso.configuration import Configuration
from simso.core import JobEvent, ProcEvent

import js

def run():
    configuration.check_all()
    
    model = Model(configuration)
    
    model.run_model()
    
    print("logs :")
    for log in model.logs:
        print(log)
        
    globs["results"] = model.results;
    
