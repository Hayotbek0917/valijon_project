export const productConfig = {
  1: {
    types: [
      { value: 'shakarli', label: 'Shakarli' },
      { value: 'shakarsiz', label: 'Shakarsiz' },
    ],
    sizes: ['0.5L', '1.0L', '1.5L', '2.0L'],
  },
  2: {
    types: [
      { value: 'shakarli', label: 'Shakarli' },
      { value: 'shakarsiz', label: 'Shakarsiz' },
    ],
    sizes: ['0.5L', '1.0L', '1.5L', '2.0L'],
  },
  3: {
    types: [
      { value: 'tuzli', label: 'Tuzli' },
      { value: 'tuzsiz', label: 'Tuzsiz' },
    ],
    sizes: ['300g', '500g'],
  },
  4: {
    types: [
      { value: 'tuzli', label: 'Tuzli' },
      { value: 'tuzsiz', label: 'Tuzsiz' },
    ],
    sizes: ['26g', '50g', '90g', '140g'],
  },
  5: {
    types: [{ value: 'standart', label: 'Standart' }],
    sizes: ['50g', '80g'],
  },
  6: {
    types: [{ value: 'standart', label: 'Standart' }],
    sizes: ['200g', '400g'],
  },
  7: {
    types: [{ value: 'standart', label: 'Standart' }],
    sizes: ['500g', '1000g'],
  },
};

export const defaultProductConfig = {
  types: [{ value: 'standart', label: 'Standart' }],
  sizes: ['1 ta', '5 ta', '10 ta'],
};

export const typeLabels = {
  tuzli: 'Tuzli',
  tuzsiz: 'Tuzsiz',
  shakarli: 'Shakarli',
  shakarsiz: 'Shakarsiz',
  standart: 'Standart',
};

/** Diler mahsulot qo'shganda tanlanadigan o'lchov birligi */
export const MEASURE_UNITS = [
  { value: 'dona', label: 'Dona (ta)' },
  { value: 'blok', label: 'Blok' },
  { value: 'litr', label: 'Litr (L)' },
  { value: 'ml', label: 'Millilitr (ml)' },
  { value: 'gram', label: 'Gram (g)' },
  { value: 'kg', label: 'Kilogramm (kg)' },
];

const MEASURE_QTY_LABELS = {
  dona: 'Dona soni',
  blok: 'Blok soni',
  litr: 'Litr miqdori',
  ml: 'Millilitr miqdori',
  gram: 'Gram miqdori',
  kg: 'Kilogramm miqdori',
};

export const MEASURE_LABELS = Object.fromEntries(
  MEASURE_UNITS.map((u) => [u.value, u.label])
);

export const UNIT_OPTIONS = [
  { value: 'dona', label: 'Dona' },
  { value: 'blok', label: 'Blok' },
  { value: 'kilo', label: 'Kilo' },
];

/**
 * Katalogdagi saqlangan o'lchov bo'yicha zakaz formasi (nomdan taxmin qilmaydi).
 */
export function getOrderProfileFromCatalog(catalogItem) {
  if (!catalogItem) return null;
  const measure = (catalogItem.unit || 'dona').toLowerCase();
  const productId = catalogItem.productId;
  const config = productId ? (productConfig[productId] ?? defaultProductConfig) : defaultProductConfig;
  const nameLower = (catalogItem.name || '').toLowerCase();
  const isDrink = /cola|pepsi|ichimlik|fanta|sprite|suv/.test(nameLower);
  const isSnack = /chips|lay|snickers|shirin|qopchoq/.test(nameLower);

  if (measure === 'blok') {
    return {
      units: ['blok'],
      defaultUnit: 'blok',
      showType: isDrink,
      showSize: isDrink,
      showBlockFields: true,
      sizeLabel: 'Hajmi',
      sizes: config.sizes,
      types: config.types,
      qtyLabel: { blok: 'Blok soni', dona: MEASURE_QTY_LABELS.dona },
      measureUnit: measure,
    };
  }

  if (measure === 'litr' || measure === 'ml') {
    return {
      units: [measure],
      defaultUnit: measure,
      showType: isDrink,
      showSize: isDrink,
      showBlockFields: false,
      sizeLabel: 'Hajmi',
      sizes: config.sizes,
      types: config.types,
      qtyLabel: { [measure]: MEASURE_QTY_LABELS[measure] },
      measureUnit: measure,
    };
  }

  if (measure === 'gram' || measure === 'kg') {
    return {
      units: [measure],
      defaultUnit: measure,
      showType: isSnack,
      showSize: isSnack,
      showBlockFields: false,
      sizeLabel: "Og'irlik",
      sizes: config.sizes.length ? config.sizes : ['50g', '80g', '200g', '500g'],
      types: config.types,
      qtyLabel: { [measure]: MEASURE_QTY_LABELS[measure] },
      measureUnit: measure,
    };
  }

  return {
    units: ['dona'],
    defaultUnit: 'dona',
    showType: true,
    showSize: isSnack || isDrink,
    showBlockFields: false,
    sizeLabel: isSnack ? "Pochka og'irligi" : 'Hajmi',
    sizes: config.sizes,
    types: config.types,
    qtyLabel: { dona: MEASURE_QTY_LABELS.dona },
    measureUnit: 'dona',
  };
}

const UNIT_LABELS = {
  dona: 'Dona soni',
  blok: 'Jami dona (blok hisobidan)',
  kilo: 'Kilo',
};

/**
 * Mahsulot nomi bo'yicha zakaz formasi (eski fallback).
 */
export function getOrderProfile(productName, productId) {
  const n = (productName || '').toLowerCase();
  const config = productId ? (productConfig[productId] ?? defaultProductConfig) : defaultProductConfig;

  if (/cola|pepsi|ichimlik|fanta|sprite|suv/.test(n)) {
    return {
      units: ['blok', 'dona'],
      defaultUnit: 'blok',
      showType: true,
      showSize: true,
      showBlockFields: true,
      sizeLabel: 'Hajmi',
      sizes: config.sizes,
      types: config.types,
      qtyLabel: UNIT_LABELS,
    };
  }

  if (/non\b|tandir|pasta|ermak|pochka|makaron|barilla/.test(n)) {
    return {
      units: ['dona'],
      defaultUnit: 'dona',
      showType: true,
      showSize: false,
      showBlockFields: false,
      sizes: [],
      types: config.types,
      qtyLabel: { dona: 'Dona soni (1 dona = 1 non/pochka)' },
    };
  }

  if (/chips|lay|snickers|shirin|qopchoq/.test(n)) {
    return {
      units: ['dona'],
      defaultUnit: 'dona',
      showType: true,
      showSize: true,
      showBlockFields: false,
      sizeLabel: "Pochka og'irligi",
      sizes: config.sizes.length ? config.sizes : ['50g', '80g', '140g'],
      types: config.types,
      qtyLabel: { dona: 'Pochka soni' },
    };
  }

  if (/smetana|qatiq|sut|yogurt|pishloq/.test(n)) {
    return {
      units: ['kilo', 'dona'],
      defaultUnit: 'kilo',
      showType: false,
      showSize: true,
      showBlockFields: false,
      sizeLabel: "Og'irlik",
      sizes: config.sizes.length ? config.sizes : ['200g', '400g', '500g', '1kg'],
      types: config.types,
      qtyLabel: UNIT_LABELS,
    };
  }

  return {
    units: ['dona', 'blok', 'kilo'],
    defaultUnit: 'dona',
    showType: true,
    showSize: false,
    showBlockFields: false,
    sizes: config.sizes,
    types: config.types,
    qtyLabel: UNIT_LABELS,
  };
}

export function getProductConfig(productId) {
  return productConfig[productId] ?? defaultProductConfig;
}

export function formatOrderQuantity(item) {
  const mode = item.unitMode || item.unit;
  if (mode === 'blok' && item.blocksCount) {
    return `${item.blocksCount} blok × ${item.itemsPerBlock || 1} = ${item.quantity} dona`;
  }
  if (mode === 'kilo' || mode === 'kg') {
    return `${item.quantity} kg`;
  }
  if (mode === 'litr') {
    return `${item.quantity} L`;
  }
  if (mode === 'ml') {
    return `${item.quantity} ml`;
  }
  if (mode === 'gram') {
    return `${item.quantity} g`;
  }
  if (mode === 'dona') {
    return `${item.quantity} dona`;
  }
  return `${item.quantity} ${MEASURE_LABELS[mode] || item.unit || 'ta'}`;
}
