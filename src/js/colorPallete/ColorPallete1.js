"use strict";

import Color from '../Color';

const BLACK_COLOR = new Color(0, 0, 0, 255);

export default class ColorPallete1
{

	computeColor(iter, maxIter, Tr, Ti)
	{
		if (iter == maxIter) { // converged
			return BLACK_COLOR
		}

		return Color.fromHSL(0.10, 0.9, iter / maxIter);
	}

}
