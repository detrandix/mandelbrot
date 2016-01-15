"use strict";

import Utils from './Utils';
import Color from './Color';
import ColorsMix from './ColorsMix';

const SUPER_SAMPLES_COUNT = 4;
const ESCAPE_RADIUS = 10.0;

const logBase = 1.0 / Math.log(2.0);
const logHalfBase = Math.log(0.5) * logBase;

export default class Mandelbrot
{

	constructor(canvasWrapper, centerX, centerY, size)
	{
		this.canvasWrapper = canvasWrapper;
		this.centerX = centerX;
		this.centerY = centerY;
		this.size = size;
		this.timeout = null;

		this.startTime = null;
		this.pixelsCount = null;

		this.canvasWrapper.canvas.addEventListener('dblclick', (event) => {
			const widthPercent = (event.clientX - canvasWrapper.width/2) / canvasWrapper.width;
			const heightPercent = (event.clientY - canvasWrapper.height/2) / canvasWrapper.height;

			const reMin = this.centerX - this.size * (this.canvasWrapper.width / this.canvasWrapper.height);
			const reMax = this.centerX + this.size * (this.canvasWrapper.width / this.canvasWrapper.height);
			const imMin = this.centerY - this.size;
			const imMax = this.centerY + this.size;

			const width = reMax - reMin;
			const height = imMax - imMin;

			this.centerX += width * widthPercent;
			this.centerY += height * heightPercent;

			this.size *= 0.2;

			this.draw();
		}, false);

		this.canvasWrapper.canvas.addEventListener('mousewheel', (event) => {
			let normalized;

			if (event.wheelDelta) {
				normalized = (event.wheelDelta % 120 - 0) == -0 ?
					event.wheelDelta / 120 : event.wheelDelta / 12;
			} else {
				const rawAmmount = event.deltaY ? event.deltaY : event.detail;
				normalized = -(rawAmmount % 3 ? rawAmmount * 10 : rawAmmount / 3);
			}

			this.size *= (1 - normalized / canvasWrapper.height);

			this.draw();
		});

		let mousedown;

		this.canvasWrapper.canvas.addEventListener('mousedown', (event) => {
			mousedown = [event.clientX, event.clientY];
		});

		this.canvasWrapper.canvas.addEventListener('mouseup', (event) => {
			const widthPercent = -(event.clientX - mousedown[0]) / canvasWrapper.width;
			const heightPercent = -(event.clientY - mousedown[1]) / canvasWrapper.height;

			const reMin = this.centerX - this.size * (this.canvasWrapper.width / this.canvasWrapper.height);
			const reMax = this.centerX + this.size * (this.canvasWrapper.width / this.canvasWrapper.height);
			const imMin = this.centerY - this.size;
			const imMax = this.centerY + this.size;

			const width = reMax - reMin;
			const height = imMax - imMin;

			this.centerX += width * widthPercent;
			this.centerY += height * heightPercent;

			this.draw();
		});
	}

	computeMandelbrot(re, im, escapeRadius, maxIter) 
	{
		let iter, a = 0, b = 0, zr = 0, zi = 0;

		for (iter = 0; iter < maxIter && (a + b) <= escapeRadius; ++iter) {
			zi = 2 * zr * zi + im;
			zr = a - b + re;
			a = zr * zr;
			b = zi * zi;
		}

		/*
		* Four more iterations to decrease error term;
		* see http://linas.org/art-gallery/escape/escape.html
		*/
		for (let e = 0; e < 4; ++e) {
			zi = 2 * zr * zi + im;
			zr = a - b + re;
			a = zr * zr;
			b = zi * zi;
		}

		return [iter, a, b];
	}


	draw()
	{
		clearTimeout(this.timeout);

		const reMin = this.centerX - this.size * (this.canvasWrapper.width / this.canvasWrapper.height);
		const reMax = this.centerX + this.size * (this.canvasWrapper.width / this.canvasWrapper.height);
		const imMin = this.centerY - this.size;
		const imMax = this.centerY + this.size;

		const data = {
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

	smoothColor(steps, n, Tr, Ti)
	{
		return 5 + n - logHalfBase - Math.log(Math.log(Tr+Ti))*logBase;
	}


	pickColor(steps, n, Tr, Ti) 
	{
		if (n == steps) // converged
			return new Color(0, 0, 0, 255);

		const v = this.smoothColor(steps, n, Tr, Ti);

		return new Color.fromHSL(20.0 * v / steps, 1.0, 10.0 * v / steps);
	}

	drawLine(data, j) 
	{
		let i, x, y, re, im, n, t, color, pixelsCount = 0;

		for (t = 0; t < data.step; t++) {
			for (i = 0; i < data.canvasWrapper.width; i += data.step) {
				if (data.step === 1) {
					const colorsMix = new ColorsMix();

					for (let s = 0; s < SUPER_SAMPLES_COUNT; s++) {
						x = i + Utils.floatRand(-0.5, 0.5);
						y = j + Utils.floatRand(-0.5, 0.5);

						re = data.reMin + data.reDiff * (x / data.canvasWrapper.width);
						im = data.imMin + data.imDiff * (y / data.canvasWrapper.height);

						n = this.computeMandelbrot(re, im, ESCAPE_RADIUS, data.maxIter);

						color = Color.fromHSL(0.10, 0.9, n[0] / data.maxIter);
						//color = this.pickColor(data.maxIter, n[0], n[1], n[2]);

						colorsMix.add(color);

						pixelsCount++;
					}

					color = colorsMix.getColor();
				} else {
					x = Utils.rand(i, Math.min(i + data.step, data.canvasWrapper.width));
					y = Utils.rand(j, Math.min(j + data.step, data.canvasWrapper.height));

					re = data.reMin + data.reDiff * (x / data.canvasWrapper.width);
					im = data.imMin + data.imDiff * (y / data.canvasWrapper.height);

					n = this.computeMandelbrot(re, im, ESCAPE_RADIUS, data.maxIter);

					color = Color.fromHSL(0.10, 0.9, n[0] / data.maxIter);
					//color = this.pickColor(data.maxIter, n[0], n[1], n[2]);

					pixelsCount++;
				}


				if (data.step === 1) {
					data.canvasWrapper.putPixel(i, j, color);
				} else {
					data.canvasWrapper.putRectangle(
						i,
						j,
						Math.min(i + data.step, data.canvasWrapper.width),
						Math.min(j + data.step, data.canvasWrapper.height),
						color
					);
				}

				document.getElementById('red-line').style.top = Math.min(j + data.step, data.canvasWrapper.height) + 'px';
			}

			j += data.step;

			if (j >= data.canvasWrapper.height) {
				break;
			}
		}


		document.getElementById('progress-bar').style.width = ((j - data.step) / data.canvasWrapper.height) * 100 + '%';

		data.canvasWrapper.print();

		this.pixelsCount += pixelsCount;
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
