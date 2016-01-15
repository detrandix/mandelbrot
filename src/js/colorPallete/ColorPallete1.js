"use strict";

import Color from '../Color';

export default class ColorPallete1
{

	computeColor(iter, maxIter, Tr, Ti)
	{
		return Color.fromHSL(0.10, 0.9, iter / maxIter);
	}

}
