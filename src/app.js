"use strict";

class Utils
{
	static rand(a, b) {
		return Math.floor((Math.random() * (b - a)) + a);
	}

	static metricUnits(number) {
		var unit = ['', 'k', 'M', 'G', 'T', 'P', 'E'];
		var mag = Math.ceil((1+Math.log(number)/Math.log(10))/3);
		return '' + (number/Math.pow(10, 3*(mag-1))).toFixed(2) + unit[mag];
	}

	static onDocumentReady(fn) {
		if (document.readyState != 'loading'){
			fn();
		} else {
			document.addEventListener('DOMContentLoaded', fn);
		}
	}
}

class Color
{
	constructor(r, g, b, a) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	}

	/**
	 * Converts an HSL color value to RGB. Conversion formula
	 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
	 * Assumes h, s, and l are contained in the set [0, 1] and
	 * returns r, g, and b in the set [0, 255].
	 *
	 * @param   Number  h       The hue
	 * @param   Number  s       The saturation
	 * @param   Number  l       The lightness
	 * @return  Array           The RGB representation
	 */
	static hslToRgb(h, s, l){
	    var r, g, b;

	    if(s == 0){
	        r = g = b = l; // achromatic
	    }else{
	        var hue2rgb = function hue2rgb(p, q, t){
	            if(t < 0) t += 1;
	            if(t > 1) t -= 1;
	            if(t < 1/6) return p + (q - p) * 6 * t;
	            if(t < 1/2) return q;
	            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
	            return p;
	        }

	        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	        var p = 2 * l - q;
	        r = hue2rgb(p, q, h + 1/3);
	        g = hue2rgb(p, q, h);
	        b = hue2rgb(p, q, h - 1/3);
	    }

	    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	}
}

class CanvasWrapper
{
	constructor(canvas) {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		this.canvas = canvas;
		this.width = canvas.width;
		this.height = canvas.height;
		this.ctx = canvas.getContext('2d');
		this.canvasData = this.ctx.createImageData(canvas.width, canvas.height);
	}

	putPixel(x, y, color) {
		var index = (x + y * this.width) * 4;

		this.canvasData.data[index++] = color.r;
		this.canvasData.data[index++] = color.g;
		this.canvasData.data[index++] = color.b;
		this.canvasData.data[index] = color.a;
	}

	putRectangle(x1, y1, x2, y2, color) {
		for (var y = y1; y < y2; y++) {
			for (var x = x1; x < x2; x++) {
				this.putPixel(x, y, color);
			}
		}
	}

	print() {
		this.ctx.putImageData(this.canvasData, 0, 0);
	}
}


class Mandelbrot
{
	constructor(canvasWrapper, centerX, centerY, size) {
		this.canvasWrapper = canvasWrapper;
		this.centerX = centerX;
		this.centerY = centerY;
		this.size = size;
		this.timeout = null;

		this.startTime = null;
		this.pixelsCount = null;

		this.canvasWrapper.canvas.addEventListener('dblclick', (event) => {
			var widthPercent = (event.clientX - canvasWrapper.width/2) / canvasWrapper.width;
			var heightPercent = (event.clientY - canvasWrapper.height/2) / canvasWrapper.height;

			var reMin = this.centerX - this.size * (this.canvasWrapper.width / this.canvasWrapper.height);
			var reMax = this.centerX + this.size * (this.canvasWrapper.width / this.canvasWrapper.height);
			var imMin = this.centerY - this.size;
			var imMax = this.centerY + this.size;

			var width = reMax - reMin;
			var height = imMax - imMin;

			this.centerX += width * widthPercent;
			this.centerY += height * heightPercent;

			this.size *= 0.2;

			this.draw();
		}, false);

		this.canvasWrapper.canvas.addEventListener('mousewheel', (event) => {
			console.log('mousewheel');
			var normalized;
			if (event.wheelDelta) {
				normalized = (event.wheelDelta % 120 - 0) == -0 ? event.wheelDelta / 120 : event.wheelDelta / 12;
			} else {
				var rawAmmount = event.deltaY ? event.deltaY : event.detail;
				normalized = -(rawAmmount % 3 ? rawAmmount * 10 : rawAmmount / 3);
			}

			this.size *= (1 - normalized / canvasWrapper.height);

			this.draw();
		});

		var mousedown;

		this.canvasWrapper.canvas.addEventListener('mousedown', (event) => {
			mousedown = [event.clientX, event.clientY];
		});
		this.canvasWrapper.canvas.addEventListener('mouseup', (event) => {
			var widthPercent = -(event.clientX - mousedown[0]) / canvasWrapper.width;
			var heightPercent = -(event.clientY - mousedown[1]) / canvasWrapper.height;

			var reMin = this.centerX - this.size * (this.canvasWrapper.width / this.canvasWrapper.height);
			var reMax = this.centerX + this.size * (this.canvasWrapper.width / this.canvasWrapper.height);
			var imMin = this.centerY - this.size;
			var imMax = this.centerY + this.size;

			var width = reMax - reMin;
			var height = imMax - imMin;

			this.centerX += width * widthPercent;
			this.centerY += height * heightPercent;

			this.draw();
		});
	}

	computeMandelbrot(re, im, maxIter) {
		var n, a, b;

		var zr = re;
		var zi = im;

		for (n = 0; n < maxIter; n++) {
			a = zr * zr;
			b = zi * zi;
			if (a + b > 4) break;
			zi = 2 * zr * zi + im;
			zr = a - b + re;
		}

		return [n, a, b];
	}


	draw() {
		clearTimeout(this.timeout);

		var reMin = this.centerX - this.size * (this.canvasWrapper.width / this.canvasWrapper.height);
		var reMax = this.centerX + this.size * (this.canvasWrapper.width / this.canvasWrapper.height);
		var imMin = this.centerY - this.size;
		var imMax = this.centerY + this.size;

		var data = {
			canvasWrapper: this.canvasWrapper,
			reMin,
			reMax,
			imMin,
			imMax,
			reDiff: reMax - reMin,
			imDiff: imMax - imMin,
			step: 16,
			maxIter: Math.floor(223.0/Math.sqrt(0.001+2.0 * Math.min(Math.abs(reMax-reMin), Math.abs(imMax-imMin))))
		}

		this.startTime = Date.now() / 1000;
		this.pixelsCount = 0;

		document.getElementById('step').textContent = data.step;
		document.getElementById('max-iter').textContent = data.maxIter;

		this.timeout = setTimeout(() => {
			this.drawLine(data, 0);
		}, 0);
	}


	smoothColor(steps, n, Tr, Ti) {
		var logBase = 1.0 / Math.log(2.0);
		var logHalfBase = Math.log(0.5)*logBase;

		return 5 + n - logHalfBase - Math.log(Math.log(Tr+Ti))*logBase;
	}


	pickColor(steps, n, Tr, Ti) {
		if ( n == steps ) // converged?
			return new Color(0, 0, 0, 255);

		var v = this.smoothColor(steps, n, Tr, Ti);

		var rgb = Color.hslToRgb(20.0 * v / steps, 1.0, 10.0*v/steps);

		return new Color(rgb[0], rgb[1], rgb[2], 255);
	}

	drawLine(data, j) {
		var i, x, y, re, im, n, rgb;

		for (var t = 0; t < data.step; t++) {
			for (i = 0; i < data.canvasWrapper.width; i += data.step) {
				x = Utils.rand(i, Math.min(i + data.step, data.canvasWrapper.width));
				y = Utils.rand(j, Math.min(j + data.step, data.canvasWrapper.height));

				re = data.reMin + data.reDiff * (x / data.canvasWrapper.width);
				im = data.imMin + data.imDiff * (y / data.canvasWrapper.height);

				n = this.computeMandelbrot(re, im, data.maxIter);

				//rgb = Color.hslToRgb(0.10, 0.9, n / data.maxIter);
				//var color = new Color(rgb[0], rgb[1], rgb[2], 255);
				
				var color = this.pickColor(data.maxIter, n[0], n[1], n[2]);

				data.canvasWrapper.putRectangle(i, j, Math.min(i + data.step, data.canvasWrapper.width), Math.min(j + data.step, data.canvasWrapper.height), color);

				document.getElementById('red-line').style.top = Math.min(j + data.step, data.canvasWrapper.height) + 'px';
			}

			j += data.step;

			if (j >= data.canvasWrapper.height) {
				break;
			}
		}


		document.getElementById('progress-bar').style.width = ((j - data.step) / data.canvasWrapper.height) * 100 + '%';

		data.canvasWrapper.print();

		this.pixelsCount += Math.floor(data.canvasWrapper.width / data.step);
		document.getElementById('total-time').textContent = Math.round(((Date.now() / 1000) - this.startTime) * 100) / 100;
		document.getElementById('total-pixels').textContent = Utils.metricUnits(this.pixelsCount);
		document.getElementById('pixels-per-second').textContent = Utils.metricUnits(this.pixelsCount / ((Date.now() / 1000) - this.startTime));


		if (j - data.step < data.canvasWrapper.height) {
			this.timeout = setTimeout(() => {
				this.drawLine(data, j);
			}, 0);
		} else {
			if (data.step > 1) {
				data.step = Math.max(Math.round(data.step/4), 1);

				document.getElementById('step').textContent = data.step;

				this.timeout = setTimeout(() => {
					this.drawLine(data, 0);
				}, 0);
			} else {
				document.getElementById('step').textContent = '-';
				document.getElementById('max-iter').textContent = '-';
				document.getElementById('progress-bar').style.width = 0;
			}
		}
	}
}


Utils.onDocumentReady(() => {
	var canvasWrapper = new CanvasWrapper(document.getElementById('canvas'));
	var mandelbrot = new Mandelbrot(canvasWrapper, -0.5, 0, 1.0, 126);
	mandelbrot.draw();
});
