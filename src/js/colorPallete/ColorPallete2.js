"use strict";

import Color from '../Color';

const LOG_BASE = 1.0 / Math.log(2.0);
const LOG_BASE_HALF = Math.log(0.5) * LOG_BASE;

const BLACK_COLOR = new Color(0, 0, 0, 255);

export default class ColorPallete2
{

	smoothColor(iter, Tr, Ti)
	{
		return 5 + iter - LOG_BASE_HALF - Math.log(Math.log(Tr + Ti)) * LOG_BASE;
	}

	computeColor(iter, maxIter, Tr, Ti)
	{
		if (iter == maxIter) { // converged
			return BLACK_COLOR
		}

		const v = this.smoothColor(iter, Tr, Ti);

		return new Color.fromHSL(20.0 * v / maxIter, 1.0, 10.0 * v / maxIter);
	}

}
