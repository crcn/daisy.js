var spawn = require('child_process').spawn;


function spawnn()
{
	console.log('reset')

	var proc = spawn('/usr/local/bin/node',['./app1-1.js'], { cwd: __dirname });

	proc.on('exit', function() {
		spawnn();
	});


		setTimeout(function() {
			proc.kill();
		}, 1000);

}


spawnn();
