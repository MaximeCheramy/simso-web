import js

js.globals['python']['etm'] = [
	{
		'name' : 'wcet',
		'display_name' : 'WCET',
		'required_fields' : [],
		'required_proc_fields' : [],
		'required_task_fields' : []
	},
	{
		'name' : 'fixedpenalty',
		'display_name' : 'Fixed Penalty',
		'required_fields' : [],
		'required_proc_fields' : [],
		'required_task_fields' : []
	},
	{
		'name' : 'acet',
		'display_name' : 'ACET',
		'required_fields' : [],
		'required_proc_fields' : [],
		'required_task_fields' : [
			{
				'name' : 'acet',
				'display_name' : 'acet (ms)',
				'type' : 'float',
				'default' : '0'
			},
			{
				'name' : 'et_stddev',
				'display_name' : 'ET std dev (ms)',
				'type' : 'float',
				'default' : '0'
			}
		]
	},
	{
		'name' : 'cache',
		'display_name' : 'Cache Model',
		'required_fields' : [
			{
				'name' : 'memory_access_time',
				'display_name' : 'RAM Access Time (ms)',
				'type' : 'float',
				'default' : '0.0'
			},
		],
		'required_proc_fields' : [],
		'required_task_fields' : [
			{
				'name' : 'base_cpi',
				'display_name' : 'Base CPI',
				'type' : 'float',
				'default' : '1.0'
			},
			{
				'name' : 'n_instr',
				'display_name' : 'Instructions',
				'type' : 'int',
				'default' : '0'
			},
			{
				'name' : 'mix',
				'display_name' : 'MIX',
				'type' : 'float',
				'default' : '0.5'
			},
			{
				'name' : 'sdp',
				'display_name' : 'Stack file',
				'type' : 'file',
				'default' : ''
			},
			
			{
				'name' : 'preemption_cost',
				'display_name' : 'Preemption Cost',
				'type' : 'float',
				'default' : '0'
			}
		]
	}
]