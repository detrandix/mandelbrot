"use strict";

export default class CanvasWrapper
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
		let index = (x + y * this.width) * 4;

		this.canvasData.data[index++] = color.r;
		this.canvasData.data[index++] = color.g;
		this.canvasData.data[index++] = color.b;
		this.canvasData.data[index] = color.a;
	}

	putRectangle(x1, y1, x2, y2, color) {
		for (let y = y1; y < y2; y++) {
			for (let x = x1; x < x2; x++) {
				this.putPixel(x, y, color);
			}
		}
	}

	print() {
		this.ctx.putImageData(this.canvasData, 0, 0);
	}

}
