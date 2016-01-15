"use strict";

import Color from './Color';

export default class ColorsMix
{

	constructor()
	{
		this.colors = [];
	}

	add(color)
	{
		this.colors.push(color);
	}

	getColor()
	{
		let r = 0, g = 0, b = 0, a = 0, n = this.colors.length;

		for (let color of this.colors) {
			r += color.r;
			g += color.g;
			b += color.b;
			a += color.a;
		}

		return new Color(
			Math.round(r / n),
			Math.round(g / n),
			Math.round(b / n),
			Math.round(a / n)
		);
	}

}
