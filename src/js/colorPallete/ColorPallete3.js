"use strict";

import Color from '../Color';

const LOG_BASE = 1.0 / Math.log(2.0);

const BLACK_COLOR = new Color(0, 0, 0, 255);

export default class ColorPallete3
{

	computeColor(iter, maxIter, Tr, Ti)
	{
		if (iter == maxIter) { // converged
			return BLACK_COLOR
		}

		const zn = Math.sqrt(Tr + Ti);
		let hue = iter + 1.0 - Math.log(Math.log(Math.abs(zn))) * LOG_BASE;
		hue = 0.95 + 20.0 * hue;

		while (hue > 360.0)
			hue -= 360.0;
		while (hue < 0.0)
			hue += 360.0;

		return Color.fromHSV(hue, 0.8, 1.0);
	}

}
