"use strict";

import Utils from './Utils';
import Color from './Color';
import ColorsMix from './ColorsMix';

import ColorPallete1 from './colorPallete/ColorPallete1';
import ColorPallete2 from './colorPallete/ColorPallete2';
import ColorPallete3 from './colorPallete/ColorPallete3';

const SUPER_SAMPLES_COUNT = 4;
const ESCAPE_RADIUS = 10.0;

export default class Mandelbrot
{

	constructor(canvasWrapper, centerX, centerY, size)
	{
		this.canvasWrapper = canvasWrapper;
		this.centerX = centerX;
		this.centerY = centerY;
		this.size = size;
		this.timeout = null;

		this.elements = {
			redLine: document.getElementById('red-line'),
			progressBar: document.getElementById('progress-bar'),
			totalTime: document.getElementById('total-time'),
			totalPixels: document.getElementById('total-pixels'),
			pixelsPerSecond: document.getElementById('pixels-per-second'),
			step: document.getElementById('step'),
			maxIter: document.getElementById('max-iter')
		};

		this.computeData = {
			startTime: null,
			pixelsCount: null,
			reMin: null,
			reMax: null,
			imMin: null,
			imMax: null,
			reDiff: null,
			imDiff: null,
			step: null,
			maxIter: null,
			colorPallete: null
		};

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

	iterate(re, im, escapeRadius, maxIter) 
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

	drawLine(j)
	{
		let i, x, y, re, im, n, color, pixelsCount = 0;

		for (i = 0; i < this.canvasWrapper.width; i += this.computeData.step) {
			x = Utils.rand(i, Math.min(i + this.computeData.step, this.canvasWrapper.width));
			y = Utils.rand(j, Math.min(j + this.computeData.step, this.canvasWrapper.height));

			re = this.computeData.reMin + this.computeData.reDiff * (x / this.canvasWrapper.width);
			im = this.computeData.imMin + this.computeData.imDiff * (y / this.canvasWrapper.height);

			n = this.iterate(re, im, ESCAPE_RADIUS, this.computeData.maxIter);

			color = this.computeData.colorPallete.computeColor(n[0], this.computeData.maxIter, n[1], n[2]);

			if (this.computeData.step === 1) {
				this.canvasWrapper.putPixel(i, j, color);
			} else {
				this.canvasWrapper.putRectangle(
					i,
					j,
					Math.min(i + this.computeData.step, this.canvasWrapper.width),
					Math.min(j + this.computeData.step, this.canvasWrapper.height),
					color
				);
			}

			pixelsCount++;
		}

		return pixelsCount;
	}

	drawLineSupersampled(j)
	{
		let i, x, y, re, im, n, color, pixelsCount = 0;

		for (i = 0; i < this.canvasWrapper.width; i += this.computeData.step) {
			const colorsMix = new ColorsMix();

			for (let s = 0; s < SUPER_SAMPLES_COUNT; s++) {
				x = Utils.rand(i, Math.min(i + this.computeData.step, this.canvasWrapper.width)) + Utils.floatRand(-this.computeData.step/2, this.computeData.step);
				y = Utils.rand(j, Math.min(j + this.computeData.step, this.canvasWrapper.height)) + Utils.floatRand(-this.computeData.step, this.computeData.step);

				re = this.computeData.reMin + this.computeData.reDiff * (x / this.canvasWrapper.width);
				im = this.computeData.imMin + this.computeData.imDiff * (y / this.canvasWrapper.height);

				n = this.iterate(re, im, ESCAPE_RADIUS, this.computeData.maxIter);

				color = this.computeData.colorPallete.computeColor(n[0], this.computeData.maxIter, n[1], n[2]);

				colorsMix.add(color);

				pixelsCount++;
			}

			color = colorsMix.getColor();

			if (this.computeData.step === 1) {
				this.canvasWrapper.putPixel(i, j, color);
			} else {
				this.canvasWrapper.putRectangle(
					i,
					j,
					Math.min(i + this.computeData.step, this.canvasWrapper.width),
					Math.min(j + this.computeData.step, this.canvasWrapper.height),
					color
				);
			}
		}

		return pixelsCount;
	}

	nextLine(j) 
	{
		let pixelsCount = 0;

		if (this.computeData.step === 1) {
			pixelsCount += this.drawLineSupersampled(j);

			j += this.computeData.step;
		} else {
			for (let t = 0; t < this.computeData.step; t++) {
				pixelsCount +=  this.drawLine(j);

				j += this.computeData.step;

				if (j >= this.canvasWrapper.height) {
					break;
				}
			}
		}

		this.elements.redLine.style.top = Math.min(j, this.canvasWrapper.height) + 'px';
		this.elements.progressBar.style.width = ((j - this.computeData.step) / this.canvasWrapper.height) * 100 + '%';

		this.canvasWrapper.print();

		this.computeData.pixelsCount += pixelsCount;
		this.elements.totalTime.textContent = Math.round(((Date.now() / 1000) - this.computeData.startTime) * 100) / 100;
		this.elements.totalPixels.textContent = Utils.metricUnits(this.computeData.pixelsCount);
		this.elements.pixelsPerSecond.textContent = Utils.metricUnits(this.computeData.pixelsCount / ((Date.now() / 1000) - this.computeData.startTime));

		if (j - this.computeData.step < this.canvasWrapper.height) {
			this.timeout = setTimeout(() => {
				this.nextLine(j);
			}, 0);
		} else {
			if (this.computeData.step > 1) {
				this.computeData.step = Math.max(Math.round(this.computeData.step/4), 1);

				this.elements.step.textContent = this.computeData.step;

				this.timeout = setTimeout(() => {
					this.nextLine(0);
				}, 0);
			} else {
				this.elements.step.textContent = '-';
				this.elements.maxIter.textContent = '-';
				this.elements.progressBar.style.width = 0;
			}
		}
	}

	draw()
	{
		clearTimeout(this.timeout);

		const reMin = this.centerX - this.size * (this.canvasWrapper.width / this.canvasWrapper.height);
		const reMax = this.centerX + this.size * (this.canvasWrapper.width / this.canvasWrapper.height);
		const imMin = this.centerY - this.size;
		const imMax = this.centerY + this.size;

		this.computeData.startTime = Date.now() / 1000;
		this.computeData.pixelsCount = 0;
		this.computeData.reMin = reMin;
		this.computeData.reMax = reMax;
		this.computeData.imMin = imMin;
		this.computeData.imMax = imMax;
		this.computeData.reDiff = reMax - reMin;
		this.computeData.imDiff = imMax - imMin;
		this.computeData.step = 16;
		this.computeData.maxIter = Math.floor(223.0/Math.sqrt(0.001+2.0 * Math.min(Math.abs(reMax-reMin), Math.abs(imMax-imMin))));
		this.computeData.colorPallete = new ColorPallete1();
		//this.computeData.colorPallete = new ColorPallete2();
		//this.computeData.colorPallete = new ColorPallete3();

		this.elements.step.textContent = this.computeData.step;
		this.elements.maxIter.textContent = this.computeData.maxIter;

		this.timeout = setTimeout(() => {
			this.nextLine(0);
		}, 0);
	}

}
