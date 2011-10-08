## Beanpole + Rabbitmq



### Roadmap

- passing files
- support for other transports

### Setting Up

1. make sure you have rabbitmq (duh).
2. `npm install daisy -g`
3. In terminal, type `daisy --host rabbitmq-server` to startup the daisy server.
4. In the apps you want to hook up with rabbitMQ, setup your package.json like so:


```javascript

{
    "name": "app-name",
    "version": "0.0.1",

    "dependencies": {
        "beanpole": "*",
		"daisy": "*"
    },

	"beans": {
		"daisy": {
			"name": "name-of-app-queue",
			"host": "localhost"
		}
	},
    
    "main": "./lib/index.js"
}


```

5. you'll need to write a chunk of code kinda like this:

```javascript

var beanpole = require('beanpole'),
router = beanpole.router();

router.require(__dirname + '/package.json');

router.on({
	
	/**
	 */
	
	'push -public my/public/message': function()
	{
		//handle response from networked app
	}
});

//initialize the beans!
router.push('init');

``` 