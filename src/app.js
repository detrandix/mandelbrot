"use strict";

import Utils from './Utils';
import CanvasWrapper from './CanvasWrapper';
import Mandelbrot from './Mandelbrot';

Utils.onDocumentReady(() => {
	var canvasWrapper = new CanvasWrapper(document.getElementById('canvas'));
	var mandelbrot = new Mandelbrot(canvasWrapper, -0.5, 0, 1.0, 126);
	mandelbrot.draw();
});
