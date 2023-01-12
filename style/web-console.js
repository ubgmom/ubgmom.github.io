(function() {
	function WebConsole(){}

	window.WebConsole = WebConsole;

	WebConsole.nativeConsole = window.console;
	WebConsole.container = null;

	WebConsole.defaultColor = "#000";
	WebConsole.errorColor = "#910000";
	WebConsole.warnColor = "#a87000";

	WebConsole.countLabels = [];
	WebConsole.timeLabels = [];
	
	WebConsole.buffer = [];

	/** @ignore */
	WebConsole.isReady = function() {
		return Boolean(WebConsole.container);
	};
	
	WebConsole.prepare = function() {
		window.console = WebConsole;
		window.onerror = WebConsole.nativeError;
	};

	/** @ignore */
	WebConsole.start = function() {
		if(WebConsole.isReady()) return;
		
		var c = document.createElement("div");
		c.style.width = "300px";
		c.style.height = "100%";
		c.style.position = "fixed";
		c.style.right = "0px";
		c.style.top = "0px";
		c.style.bottom = "0px";
		c.style.zIndex = 100500;
		c.style.background = "#fff";
		c.style.borderLeft = "1px solid #000";
		c.style.color = "#000";
		c.style.opacity = 0.9;
		c.style.overflowY = "auto";
		c.style.overflowX = "hidden";
		c.style.padding = "5px";
		c.style.fontSize = "14px";
		c.style.fontFamily = "monospace sans-serif serif cursive fantasy";
		c.style.pointerEvents = "none";
		c.style.webkitTransform = "translateX(0px)";
		
		document.body.appendChild(c);
		
		WebConsole.container = c;
		
		while(WebConsole.buffer.length) {
			var item = WebConsole.buffer.shift();
			WebConsole.print(item.str, item.color);
		}
	};

	/** @ignore */
	WebConsole.stop = function() {
		window.console = WebConsole.nativeConsole;
		window.onerror = null;
		window.removeEventListener("load", WebConsole.start);
		
		if(WebConsole.isReady()) {
			document.body.removeChild(WebConsole.container);
			WebConsole.container = null;
		}
	};

	/** @ignore */
	WebConsole.getStack = function(err, nesting) {
		var stack = err.stack.split("\n");
		if(nesting) stack.splice(0, nesting);
		return stack;
	};

	/** @ignore */
	WebConsole.nativeError = function(message, filename, lineno, colno, error) {
		if(!filename) return;
		
		filename = filename.split("/");
		filename = filename[filename.length-1];
		WebConsole.print(message + " at " + filename + ":" + lineno, WebConsole.errorColor);
	};

	/** @ignore */
	WebConsole.prepareVal = function(val) {
		var ret = val;
		if(typeof val == "object")
		{
			try {ret = JSON.stringify(ret);}
			catch(e){}
		}
		return String(ret);
	};

	/** @ignore */
	WebConsole.print = function(str, color) {
		if(!WebConsole.isReady()) {
			WebConsole.buffer.push({str: str, color: color});
			return;
		}
		
		var d = document.createElement("div");
		
		d.innerHTML = str;
		d.style.margin = "0px";
		d.style.padding = "0px";
		d.style.whiteSpace = "pre-wrap";
		d.style.color = color ? color : WebConsole.defaultColor;
		
		WebConsole.container.appendChild(d);
		
		WebConsole.autoScroll();
	};

	/** @ignore */
	WebConsole.printStackTrace = function(stack, color) {
		for(var i=0; i<stack.length; i++) {
			WebConsole.print("  " + (stack[i].name ? stack[i].name : stack[i]), color);
		}
	};

	/** @ignore */
	WebConsole.autoScroll = function() {
		if(!WebConsole.isReady()) return;
		
		if(WebConsole.container.scrollHeight > 0) {
			WebConsole.container.scrollTop = WebConsole.container.scrollHeight - WebConsole.container.offsetHeight;
			WebConsole.container.webkitTransform = "translateX(1px)";
			//Google Chrome hack
			WebConsole.container.style.zIndex++;
		}
	};

	/** @ignore */
	WebConsole.getObjectByLabel = function(stack, label) {
		var l = null;
		
		for(var i=0; i<stack.length; i++) {
			if(stack[i].label == label) {
				l = stack[i];
				break;
			}
		}
		
		return l;
	};

	WebConsole.assert = function(expression, object) {
		if(expression) {
			WebConsole.print("Assertion failed: " + WebConsole.prepareVal(object), WebConsole.errorColor);
			WebConsole.printStackTrace([arguments.callee.trace()[1]], WebConsole.errorColor);
		}
	};

	WebConsole.clear = function() {
		if(!WebConsole.isReady()) {
			WebConsole.buffer = [];
			return;
		}
		
		WebConsole.container.innerHTML = "";
	};

	WebConsole.count = function(label) {
		var l = WebConsole.getObjectByLabel(WebConsole.countLabels, label);
		
		if(!l) {
			l = {label: label, count: 0};
			WebConsole.countLabels.push(l);
		}
		
		l.count++;
		
		WebConsole.print(l.label + ": " + l.count);
	};

    WebConsole.prepareArguments = function(originalArgs) {
        if(!originalArgs || !originalArgs.length) return [];

        var args = [];
        for(var i=0; i<originalArgs.length; i++) {
            args.push(originalArgs[i]);
        }

        var ret = [];

        var first = args.shift();
        if(typeof first == "string") {
            var parts = first.split('%c');

            if(parts.length) {
                first = '';

                if (parts[0]) {
                    first += parts.shift();
                }

                for (i = 0; i < parts.length; i++) {
                    first += '<div style="display: inline-block; white-space: normal;' + args.shift() + '">';
                    first += parts[i].split(' ').join('&nbsp;');
                    first += '</div>';
                }
            }
        }
        else first = WebConsole.prepareVal(first);

        ret.push(first);
        while(args.length) {
            ret.push(WebConsole.prepareVal(args.shift()));
        }

        return ret;
    };

	WebConsole.log = function() {
        var args = WebConsole.prepareArguments(arguments);
		WebConsole.print(args.join(", "));
	};

    WebConsole.warn = function() {
        var args = WebConsole.prepareArguments(arguments);
        WebConsole.print(args.join(", "), WebConsole.warnColor);
    };

	WebConsole.debug = WebConsole.log;
	WebConsole.dir = WebConsole.log;
	WebConsole.dirxml = WebConsole.log;
	WebConsole.info = WebConsole.log;

	WebConsole.error = function(err) {
		WebConsole.print(err, WebConsole.errorColor);
		var stack = arguments.callee.trace();
		stack.splice(0, 1);
		WebConsole.printStackTrace(stack, WebConsole.errorColor);
	};

	WebConsole.group = function(){};
	WebConsole.groupCollapsed = function(){};
	WebConsole.groupEnd = function(){};
	WebConsole.profile = function(){};
	WebConsole.profileEnd = function(){};
	WebConsole.timeStamp = function(){};

	WebConsole.time = function(label) {
		var l = WebConsole.getObjectByLabel(WebConsole.timeLabels, label);
		
		if(!l)
		{
			l = {label: label, start: 0};
			WebConsole.timeLabels.push(l);
		}
		
		l.start = new Date().getTime();
	};

	WebConsole.timeEnd = function(label) {
		var l = WebConsole.getObjectByLabel(WebConsole.timeLabels, label);
		if(l) WebConsole.print(label + ": " + (new Date().getTime() - l.start) + "ms");
	};

	WebConsole.trace = function() {
		WebConsole.print("trace:");
		var stack = arguments.callee.trace();
		stack.splice(0, 1);
		WebConsole.printStackTrace(stack);
	};

	function parseGet() {
        var get = {};

        var s = window.location.toString();
        var p = window.location.toString().indexOf("?");
        var tmp, params;
        if (p >= 0) {
            s = s.substr(p + 1, s.length);
            params = s.split("&");
            for (var i=0; i<params.length; i++) {
            	var item = params[i];
                tmp = item.split("=");
                get[tmp[0]] = tmp[1];
            }
        }

        return get;
    }

    var params = parseGet();

	if(params.webconsole) {
		WebConsole.prepare();
		window.addEventListener("load", WebConsole.start);
	}

	/** @ignore */
	Function.prototype.trace = function() {
		var trace = [];
		var current = this;
		try {
			while (current) {
				trace.push(current.signature());
				current = current.caller;
			}
		}
		catch(e){}
		return trace;
	};

	/** @ignore */
	Function.prototype.signature = function() {
		var signature = {
			name: this.getName(),
			params: [],
			toString: function() {
				var params = this.params.length > 0 ?
					"'" + this.params.join("', '") + "'" : "";
				return this.name + "(" + params + ")";
			}
		};
		if(this.arguments) {
			for(var x=0; x<this .arguments.length; x++)
				signature.params.push(this.arguments[x]);
		}
		return signature;
	};

	/** @ignore */
	Function.prototype.getName = function() {
		if(this.name) return this.name;
		var definition = this.toString().split("\n")[0];
		var exp = /^function ([^\s(]+).+/;
		if(exp.test(definition)) return definition.split("\n")[0].replace(exp, "$1") || "anonymous";
		return "anonymous";
	};
})();