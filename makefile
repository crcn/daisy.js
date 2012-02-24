all: node web

clean:
	rm -rf lib

node:
	mesh merge node

web:
	mesh merge web
