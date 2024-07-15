export const convertWeightToUnit = (value: number, productUnit: 'kg' | 'g', desirableUnit: 'kg' | 'g' = 'kg') => {
  if (!value) {
    return 0;
  }

  if (desirableUnit === productUnit) {
    return value;
  }

  const conversionFactors = {
    kg: 1000,
    g: 1
  };

  const fromFactor = conversionFactors[productUnit];
  const toFactor = conversionFactors[desirableUnit];

  if (!fromFactor || !toFactor) {
    return 0;
  }

  return parseFloat(((value * fromFactor) / toFactor).toFixed(3));
};

export const convertDimensionToUnit = (value: number, productUnit: 'm' | 'cm' | 'mm', desirableUnit: 'm' | 'cm' | 'mm' = 'cm') => {
  if (!value) {
    return 0;
  }

  if (desirableUnit === productUnit) {
    return value;
  }

  const conversionFactors = {
    mm: 0.1,
    cm: 1.0,
    m: 100.0
  };

  const systemValue = value * conversionFactors[productUnit];
  const outputValue = systemValue / conversionFactors[desirableUnit];

  return outputValue;
};
