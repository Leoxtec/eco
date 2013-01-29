var Camera = (function(){
    function Camera(config) {
		var self = this;
		var nearR = config.closest || 10;
		var farR = config.farthest || 160;
		var radius = farR / 2;
		if(config.distance && config.distance <= farR && config.distance >= nearR) {
		  radius = config.distance;
		}
		var point = V3.$(0, 0, 0);
		var globalUp = V3.$(0, 0, 1);
		var tilt = Math.PI / 2;
		var pan = -tilt;
		var tiltMin = 5 * Math.PI / 180;
		var tiltMax = 175 * Math.PI / 180;
		var mode = 0;
		var dir = V3.$(0, 1, 0);
		var straightVel = 0;
		var sideVel = 0;
		var lastTime = 0;
		var zoomVel = 0;
		var elapsedTime = 0;
		var temp = V3.$(0, -1, 0);
		
		this.setViewMode = function(m){
			mode = m;
			radius = farR / 2;
			tilt = Math.PI / 2;
			zoomVel = 0;
			switch(mode) {
				case 0:
					point = V3.$(0, 0, 0);				
					pan = -tilt;
					globalUp = V3.$(0, 0, 1);
					temp = V3.$(0, -1, 0);
					break;
				case 1:
				case 2:
					point = V3.$(0, -radius, 0);
					pan = tilt;
					dir = V3.$(0, 1, 0);
					straightVel = sideVel = 0;
					globalUp = V3.$(0, 0, 1);
					break;
				case 3:
				case 4:
					point = V3.$(0, 0, radius);
					dir = V3.$(0, 0, -1);
					globalUp = V3.$(0, 1, 0);
					break;
			}
		};
		
		this.setStraightVel = function(v) {
			straightVel = v;
		};
		
		this.setSideVel = function(v) {
			sideVel = v;
		};
		
		this.updateTime = function() {
			lastTime = (new Date()).getTime();
		};
		
		this.timeElapsed = function() {
			return elapsedTime;
		};
		
		this.setZoomVel = function(v) {
			zoomVel = v;
		};
		
		this.zoomVelocity = function() {
			return zoomVel;
		};
		
		this.pos = function() {
			updatePos();
			if(mode === 0) {
				temp = sphericalToCartesian();
				return V3.scale(temp, radius);
			}
			else {
				return point;
			}
		};
		
		this.at = function() {
			if(mode === 0) {
				return point;
			}
			else {
				return V3.add(dir, point);
			}
		};
		
		this.up = function() {
			return globalUp;
		};
		
		this.getTemp = function() {
			return temp;
		};
		
		this.getDir = function() {
			return dir;
		};
		
		this.getPan = function() {
			return pan;
		};
		
		this.getTilt = function() {
			return tilt;
		};
		
		this.getPoint = function() {
			return point;
		};
		
		this.getRadius = function() {
			return radius;
		};
		
		this.updateRadius = function(deltaR) {
			radius += deltaR;
			if(radius > farR) {
				radius = farR;
			}
			else if(radius < nearR) {
				radius = nearR;
			}
		};
		
		this.updatePan = function(deltaP) {
			pan += deltaP;
		};
		
		this.updateTilt = function(deltaT) {
			switch(mode) {
				case 0:
					tilt += deltaT;
					break;
				case 1:
				case 2:
					tilt -= deltaT;
					break;
			}		
			if(tilt > tiltMax) {
				tilt = tiltMax;
			}
			else if(tilt < tiltMin) {
				tilt = tiltMin;
			}
		};

		this.mapScrollX = function(dx) {
			point[0] += dx;
		};
		
		this.mapScrollY = function(dy) {
			point[1] += dy;
		};
		
		function updatePos() {
			var now = (new Date()).getTime();
			elapsedTime = now - lastTime;
			lastTime = now;			
			switch(mode) {
				case 0:
					self.updatePan(sideVel * -0.03 * elapsedTime);
					self.updateTilt(straightVel * 0.03 * elapsedTime);
					self.updateRadius(elapsedTime * zoomVel);
					break;
				case 1:
					dir = sphericalToCartesian();
					var right = V3.normalize(V3.cross(dir, globalUp));
					point = V3.add(point, V3.scale(V3.add(V3.scale(dir, straightVel), V3.scale(right, sideVel)), elapsedTime));
					break;
				case 2:
					dir = sphericalToCartesian();
					var forward = V3.normalize(V3.$(dir[0], dir[1], 0));
					var right = V3.cross(forward, globalUp);
					point = V3.add(point, V3.scale(V3.add(V3.scale(forward, straightVel), V3.scale(right, sideVel)), elapsedTime));
					break;
				case 3:
					self.updateRadius(elapsedTime * zoomVel);
					point[2] = radius;
				case 4:
					self.mapScrollX(sideVel * -0.5 * elapsedTime);
					self.mapScrollY(straightVel * -0.5 * elapsedTime);
					break;
			}
		};
		
		function sphericalToCartesian() {
			var sinPan = Math.sin(pan);
			var cosPan = Math.cos(pan);
			var sinTilt = Math.sin(tilt);
			var cosTilt = Math.cos(tilt);
			return V3.$(cosPan * sinTilt, sinPan * sinTilt, cosTilt);
		};
	}
	return Camera;
}());
