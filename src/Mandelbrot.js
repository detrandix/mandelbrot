"use strict";

import Utils from './Utils';
import Color from './Color';

export default class Mandelbrot
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

		return new Color.fromHSL(20.0 * v / steps, 1.0, 10.0*v/steps);
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

				//var color = Color.fromHSL(0.10, 0.9, n[0] / data.maxIter);
				
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
