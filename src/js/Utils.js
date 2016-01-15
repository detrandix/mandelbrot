"use strict";

export default class Utils
{

	static rand(a, b) 
	{
		return Math.floor((Math.random() * (b - a)) + a);
	}

	static floatRand(a, b)
	{
		return (Math.random() * (b - a)) + a;
	}

	static metricUnits(number)
	{
		const unit = ['', 'k', 'M', 'G', 'T', 'P', 'E'];
		const mag = Math.ceil((1 + Math.log(number) / Math.log(10)) / 3);

		return '' + (number / Math.pow(10, 3 * (mag - 1))).toFixed(2) + unit[mag];
	}

	static onDocumentReady(fn) 
	{
		if (document.readyState != 'loading'){
			fn();
		} else {
			document.addEventListener('DOMContentLoaded', fn);
		}
	}

}
