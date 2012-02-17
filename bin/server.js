var args = process.argv.concat(),
ops = { host: 'localhost' };


while(args.length)
{
	switch(args.shift())
	{
		case '--host':
		case '-h':
			ops.host = args.shift();
		break;
	}
}

require('../lib/node/server').connect(ops);
