/*
This parser sends a request for a json file, 
send back an object with associated attributes: vertices and colors, BBox, index.
*/

var JSONParser = (function() {
	function JSONParser(config) {    
		// defined once to reduce number of empty functions
		var __empty_func = function(){};

		var start = config.start || __empty_func;
		var parse = config.parse || __empty_func;
		var end = config.end || __empty_func;

		var pathToFile = null; 
		var AJAX = null;

		/**
			Stop downloading and parsing the associated point cloud.
		*/
		this.stop = function() {
			if(AJAX){
				AJAX.abort();
			}
		};

		/**
			@param {String} path Path to the resource.
		*/
		this.load = function(path) {
			pathToFile = path;

			AJAX = new XMLHttpRequest();

			// Put a reference to the parser in the AJAX object
			// so we can give the library a reference to the
			// parser within the AJAX event handler scope.
			AJAX.parser = this;

			/**
				@private        
				Occurs exactly once when the resource begins to be downloaded
			*/
			AJAX.onloadstart = function(evt) {
				start(AJAX.parser);      // step 1
			};

			/**
				@private
				Occurs exactly once, when the file is done being downloaded
			*/
			AJAX.onload = function(evt){
				var obj = null;     
				if(AJAX.readyState==4 && AJAX.status==200) {
					var string = AJAX.responseText;
					obj = JSON.parse(string); 
				}
				//create attributes: vertices and color, BBox, index. 
				AJAX.parseObj(obj);  // step 2
				end(AJAX.parser);    // step 3
			};
         
			AJAX.parseObj = function(obj){       
				var verts, cols;
				var num = obj.Point.length/6;   
				verts = new Float32Array(num * 3);
				cols = new Float32Array(num * 3);
			
				var level = obj.Level;
				var numOfCh = obj.numChildren;
				var boundingbox = obj.BB;

				for(var i=0; i<num; i++) {
					verts[3*i] = obj.Point[6*i];
					verts[3*i+1] = obj.Point[6*i+1];
					verts[3*i+2] = obj.Point[6*i+2];
					cols[3*i] = obj.Point[6*i+3]/255;
					cols[3*i+1] = obj.Point[6*i+4]/255;
					cols[3*i+2] = obj.Point[6*i+5]/255; 				
				}

				// XB PointStream expects an object with named/value pairs
				// which contain the attribute arrays. These must match attribute
				// names found in the shader
				var attributes = {};
				if(verts)  {attributes["ps_Vertex"] = verts;}
				if(cols)  {attributes["ps_Color"] = cols;}
				if(boundingbox)  {attributes["ps_BBox"] = boundingbox;}
				if(typeof numOfCh != "undefined")  {attributes["ps_numchildren"] = numOfCh;}		
				parse(AJAX.parser, attributes);  // step 2 
			}

			// open an asynchronous request to the path
			if(AJAX.overrideMimeType) {
				// Firefox generates a misleading error if we don't have this line
				AJAX.overrideMimeType("application/json");
			}
			AJAX.open("GET", "action.php?a=getnode&path="+path, true);   //true
			AJAX.send(null);

		};// load
	}// ctor
	return JSONParser;
}());