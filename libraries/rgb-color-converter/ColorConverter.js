class ColorConverter {
	static getGamutRanges(){
		let gamutA = {
			red: [0.704, 0.296],
			green: [0.2151, 0.7106],
			blue: [0.138, 0.08]
		};

		let gamutB = {
			red: [0.675, 0.322],
			green: [0.409, 0.518],
			blue: [0.167, 0.04]
		};

		let gamutC = {
			red: [0.692, 0.308],
			green: [0.17, 0.7],
			blue: [0.153, 0.048]
		};

		let defaultGamut ={
			red: [1.0, 0],
			green: [0.0, 1.0],
			blue: [0.0, 0.0]
		};

		return {"gamutA":gamutA,"gamutB": gamutB, "gamutC":gamutC,"default": defaultGamut}
	}

	static getLightColorGamutRange(modelId = null){
		let ranges = ColorConverter.getGamutRanges();
		let gamutA = ranges.gamutA;
		let gamutB = ranges.gamutB;
		let gamutC = ranges.gamutC;

		let philipsModels = {
			LST001 : gamutA,
			LLC010 : gamutA,
			LLC011 : gamutA,
			LLC012 : gamutA,
			LLC006 : gamutA,
			LLC005 : gamutA,
			LLC007 : gamutA,
			LLC014 : gamutA,
			LLC013 : gamutA,

			LCT001 : gamutB,
			LCT007 : gamutB,
			LCT002 : gamutB,
			LCT003 : gamutB,
			LLM001 : gamutB,

			LCT010 : gamutC,
			LCT014 : gamutC,
			LCT015 : gamutC,
			LCT016 : gamutC,
			LCT011 : gamutC,
			LLC020 : gamutC,
			LST002 : gamutC,
			LCT012 : gamutC,
		};

		if(!!philipsModels[modelId]){
			return philipsModels[modelId];
		}

		return ranges.default;
	}


	static rgbToXy(red, green, blue,modelId = null) {
		function getGammaCorrectedValue(value) {
			return (value > 0.04045) ? Math.pow((value + 0.055) / (1.0 + 0.055), 2.4) : (value / 12.92)
		}

		let colorGamut = ColorConverter.getLightColorGamutRange(modelId);

		red = parseFloat(red / 255);
		green = parseFloat(green / 255);
		blue = parseFloat(blue / 255);

		red = getGammaCorrectedValue(red);
		green = getGammaCorrectedValue(green);
		blue = getGammaCorrectedValue(blue);

		let x = red * 0.649926 + green * 0.103455 + blue * 0.197109;
		let y = red * 0.234327 + green * 0.743075 + blue * 0.022598;
		let z = red * 0.0000000 + green * 0.053077 + blue * 1.035763;

		let xy = {
			x: x / (x + y + z),
			y: y / (x + y + z)
		};

		if(!ColorConverter.xyIsInGamutRange(xy, colorGamut)){
			xy = ColorConverter.getClosestColor(xy,colorGamut);
		}

		return xy;
	}

	static xyIsInGamutRange(xy, gamut) {
		gamut = gamut || ColorConverter.getGamutRanges().gamutC;
		if (Array.isArray(xy)) {
			xy = {
				x: xy[0],
				y: xy[1]
			};
		}

		let v0 = [gamut.blue[0] - gamut.red[0], gamut.blue[1] - gamut.red[1]];
		let v1 = [gamut.green[0] - gamut.red[0], gamut.green[1] - gamut.red[1]];
		let v2 = [xy.x - gamut.red[0], xy.y - gamut.red[1]];

		let dot00 = (v0[0] * v0[0]) + (v0[1] * v0[1]);
		let dot01 = (v0[0] * v1[0]) + (v0[1] * v1[1]);
		let dot02 = (v0[0] * v2[0]) + (v0[1] * v2[1]);
		let dot11 = (v1[0] * v1[0]) + (v1[1] * v1[1]);
		let dot12 = (v1[0] * v2[0]) + (v1[1] * v2[1]);

		let invDenom = 1 / (dot00 * dot11 - dot01 * dot01);

		let u = (dot11 * dot02 - dot01 * dot12) * invDenom;
		let v = (dot00 * dot12 - dot01 * dot02) * invDenom;

		return ((u >= 0) && (v >= 0) && (u + v < 1));
	}

	static getClosestColor(xy, gamut) {
		function getLineDistance(pointA,pointB){
			return Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
		}

		function getClosestPoint(xy, pointA, pointB) {
			let xy2a = [xy.x - pointA.x, xy.y - pointA.y];
			let a2b = [pointB.x - pointA.x, pointB.y - pointA.y];
			let a2bSqr = Math.pow(a2b[0],2) + Math.pow(a2b[1],2);
			let xy2a_dot_a2b = xy2a[0] * a2b[0] + xy2a[1] * a2b[1];
			let t = xy2a_dot_a2b /a2bSqr;

			return {
				x: pointA.x + a2b[0] * t,
				y: pointA.y + a2b[1] * t
			}
		}

		let greenBlue = {
			a: {
				x: gamut.green[0],
				y: gamut.green[1]
			},
			b: {
				x: gamut.blue[0],
				y: gamut.blue[1]
			}
		};

		let greenRed = {
			a: {
				x: gamut.green[0],
				y: gamut.green[1]
			},
			b: {
				x: gamut.red[0],
				y: gamut.red[1]
			}
		};

		let blueRed = {
			a: {
				x: gamut.red[0],
				y: gamut.red[1]
			},
			b: {
				x: gamut.blue[0],
				y: gamut.blue[1]
			}
		};

		let closestColorPoints = {
			greenBlue : getClosestPoint(xy,greenBlue.a,greenBlue.b),
			greenRed : getClosestPoint(xy,greenRed.a,greenRed.b),
			blueRed : getClosestPoint(xy,blueRed.a,blueRed.b)
		};

		let distance = {
			greenBlue : getLineDistance(xy,closestColorPoints.greenBlue),
			greenRed : getLineDistance(xy,closestColorPoints.greenRed),
			blueRed : getLineDistance(xy,closestColorPoints.blueRed)
		};

		let closestDistance;
		let closestColor;
		for (let i in distance){
			if(distance.hasOwnProperty(i)){
				if(!closestDistance){
					closestDistance = distance[i];
					closestColor = i;
				}

				if(closestDistance > distance[i]){
					closestDistance = distance[i];
					closestColor = i;
				}
			}

		}
		return  closestColorPoints[closestColor];
	}

	xyBriToRgb(x,y,bri){
		function getReversedGammaCorrectedValue(value){
			return value <= 0.0031308 ? 12.92 * value : (1.0 + 0.055) * Math.pow(value, (1.0 / 2.4)) - 0.055;
		}

		let xy = {
			x: x,
			y: y
		};

		let z = 1.0 - xy.x - xy.y;
		let Y = bri / 255;
		let X = (Y / xy.y) * xy.x;
		let Z = (Y / xy.y) * z;
		let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
		let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
		let b =  X * 0.051713 - Y * 0.121364 + Z * 1.011530;

		r = getReversedGammaCorrectedValue(r);
		g = getReversedGammaCorrectedValue(g);
		b = getReversedGammaCorrectedValue(b);

		let red = parseInt(r * 255) > 255 ? 255: parseInt(r * 255);
		let green = parseInt(g * 255) > 255 ? 255: parseInt(g * 255);
		let blue = parseInt(b * 255) > 255 ? 255: parseInt(b * 255);

		red = Math.abs(red);
		green = Math.abs(green);
		blue = Math.abs(blue);

		return red+","+green+","+blue;
	}

	colorTempToRGB(kelvin){

		let temp = kelvin/100;
	
		let red, green, blue;
	
		if( temp <= 66 ){ 
	
			red = 255; 
			
			green = temp;
			green = 99.4708025861 * Math.log(green) - 161.1195681661;
	
			
			if( temp <= 19){
	
				blue = 0;
	
			} else {
	
				blue = temp-10;
				blue = 138.5177312231 * Math.log(blue) - 305.0447927307;
	
			}
	
		} else {
	
			red = temp - 60;
			red = 329.698727446 * Math.pow(red, -0.1332047592);
			
			green = temp - 60;
			green = 288.1221695283 * Math.pow(green, -0.0755148492 );
	
			blue = 255;
	
		}
	
	
		return clamp(red,   0, 255)+","+clamp(green, 0, 255)+","+clamp(blue,  0, 255);

		function clamp( x, min, max ) {
	
			if(x<min){ return min; }
			if(x>max){ return max; }
		
			return x;
		
		}
	}
	
}
