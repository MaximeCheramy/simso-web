#!/usr/bin/env python
#
# Schedulers discovery
# Use this script to generate a list containing all the data about the
# schedulers.
# Returns a list of hashmap with the given fields : 
# 		name : the complete name of the scheduler (ex : simso.schedulers.EDF)
#       display_name : the display name of the scheduler
# 		required_fields : list of required fields for this scheduler to work correctly.
# 			It should be a dict with the following keys : 
# 				name: name of the field
# 				type: type of the field
# 				default: default value of the field
# 		required_task_fields : list of required fields for this scheduler's tasks
# 			to work correctly. Same format as required_fields
# 		required_proc_fields : list of required fields for this scheduler's processors
# 			to work correctly. Same format as required_fields
# 
import importlib
import inspect
import sys
import pkgutil


sys.path = ["../submodules/simso"] + sys.path

from simso.core.Scheduler import Scheduler
from simso.schedulers import get_loaded_schedulers
def discover_schedulers():
    modules = []

    package = importlib.import_module('simso.schedulers')
    for importer, modname, ispkg in pkgutil.walk_packages(
            path=package.__path__,
            prefix=package.__name__ + '.',
            onerror=lambda x: None):
        modules.append(modname)
    
    imported = []
    for modname in sorted(modules):
        imported.append((modname, importlib.import_module(modname)))
    
    for module in get_loaded_schedulers():
        yield module
    # for modname, m in imported:
    #     try:
    #         for name in dir(m):
    #             c = m.__getattribute__(name)
    #             if inspect.isclass(c) and issubclass(c, Scheduler) and hasattr(c, 'simso_name'):
    #                 yield {'name': modname, 'display_name': c.simso_name, 
    #                        'required_fields': c.simso_required_fields,
    #                        'required_task_fields': c.simso_required_task_fields,
    #                        'required_proc_fields':  c.simso_required_proc_fields}
    #                 break
    #     except (ImportError, SyntaxError):
    #         print("Import error: ", modname)

print("import js")
print("js.globals['python']['schedulers'] = [" + ",\n".join(map(str, (discover_schedulers()))) + "]")