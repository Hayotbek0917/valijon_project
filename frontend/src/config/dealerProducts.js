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

/** Pachka/dona mahsulotlar uchun og'irlik variantlari (chips, snickers...) */
export const PACKAGE_WEIGHT_PRESETS = [
  { value: '50g', label: '50 g' },
  { value: '80g', label: '80 g' },
  { value: '100g', label: '100 g' },
  { value: '150g', label: '150 g' },
  { value: '200g', label: '200 g' },
  { value: '500g', label: '500 g' },
];

/** O'lchov birligi bo'yicha ikkinchi maydon (pachka og'irligi, hajm...) */
export function getCatalogMeasureField(unit) {
  switch (unit) {
    case 'dona':
      return {
        kind: 'preset',
        label: "Bitta dona og'irligi",
        helperText: 'Chips: 50g, 100g. Zakazda necha dona olish alohida',
        presets: PACKAGE_WEIGHT_PRESETS,
        needsPieces: false,
      };
    case 'gram':
      return {
        kind: 'number',
        label: 'Bitta dona grammi',
        placeholder: '100',
        suffix: 'g',
        helperText: 'Masalan: 100g — zakazda miqdor alohida kiritiladi',
        needsPieces: false,
      };
    case 'kg':
      return {
        kind: 'number',
        label: 'Bitta dona og\'irligi (kg)',
        placeholder: '1',
        suffix: 'kg',
        helperText: 'Kilogrammda kiriting',
        needsPieces: false,
      };
    case 'litr':
    case 'ml':
      return {
        kind: 'volume',
        helperText: 'Faqat bitta shisha hajmi — masalan: 1 L yoki 1.25 L',
        needsPieces: false,
      };
    default:
      return null;
  }
}

/** Ichimlik hajmi: litr, ml va dona soni */
export function buildVolumeCatalogSize({ litr = '', ml = '', pieces = '' }) {
  const parts = [];
  const l = String(litr).trim().replace(',', '.');
  const m = String(ml).trim();
  const p = parseInt(String(pieces).trim(), 10);

  if (l) {
    const num = parseFloat(l);
    if (!Number.isNaN(num)) {
      parts.push(Number.isInteger(num) ? `${num}L` : `${num}L`);
    }
  } else if (m) {
    parts.push(/ml/i.test(m) ? m : `${m} ml`);
  }

  if (!Number.isNaN(p) && p > 0) {
    parts.push(`${p} dona`);
  }

  return parts.join(' · ');
}

export function buildCatalogSizeWithPieces(unit, { sizeValue = '', litr = '', ml = '' }) {
  if (unit === 'litr' || unit === 'ml') {
    return buildVolumeCatalogSize({ litr, ml, pieces: '' });
  }

  const v = String(sizeValue).trim();
  if (unit === 'dona') {
    if (!v) return '';
    return /[a-zA-Z]/.test(v) ? v : `${v}g`;
  }
  if (unit === 'gram') {
    if (!v) return '';
    return /g$/i.test(v) ? v : `${v}g`;
  }
  if (unit === 'kg') {
    if (!v) return '';
    return /kg/i.test(v) ? v : `${v} kg`;
  }
  return v;
}

/** Katalog size — faqat hajm/og'irlik (eski "· N dona" qismini olib tashlaydi) */
export function formatCatalogSizeDisplay(sizeStr) {
  return String(sizeStr || '')
    .replace(/\s*·\s*[\d.,]+\s*dona\s*$/i, '')
    .trim();
}

export function parseVolumeCatalogSize(sizeStr) {
  const raw = String(sizeStr || '');
  const litrMatch = raw.match(/([\d.,]+)\s*L/i);
  const mlMatch = raw.match(/([\d.,]+)\s*ml/i);
  const donaMatch = raw.match(/([\d.,]+)\s*dona/i);
  return {
    litr: litrMatch ? litrMatch[1] : '',
    ml: mlMatch ? mlMatch[1] : '',
    pieces: donaMatch ? donaMatch[1] : '',
  };
}

export function parseCatalogSizeWithPieces(sizeStr) {
  const raw = String(sizeStr || '');
  const donaMatch = raw.match(/([\d.,]+)\s*dona/i);
  const pieces = donaMatch ? donaMatch[1] : '';
  const beforePieces = donaMatch ? raw.slice(0, donaMatch.index).replace(/\s*·\s*$/, '').trim() : raw.trim();
  return { sizeValue: beforePieces, pieces };
}

export function formatCatalogSize(unit, raw) {
  const v = String(raw || '').trim();
  if (!v) return '';
  if (/[a-zA-Z]/.test(v)) return v;
  if (unit === 'kg') return `${v} kg`;
  if (unit === 'gram') return `${v}g`;
  if (unit === 'dona') return `${v}g`;
  if (unit === 'litr') return `${v}L`;
  if (unit === 'ml') return `${v} ml`;
  return v;
}

export function catalogChipLabel(item) {
  const parts = [item.name];
  const size = formatCatalogSizeDisplay(item.size);
  if (size) parts.push(size);
  parts.push(MEASURE_LABELS[item.unit] || item.unit);
  if (item.barcode) parts.push(item.barcode);
  if (item.defaultCost > 0) {
    parts.push(`${Number(item.defaultCost).toLocaleString('uz-UZ')} so'm`);
  }
  return parts.join(' · ');
}

export function formatCatalogItemOption(item) {
  if (!item?.name) return '';
  const u = MEASURE_LABELS[item.unit] || item.unit;
  const size = formatCatalogSizeDisplay(item.size);
  const sizePart = size ? ` · ${size}` : '';
  const cost = item.defaultCost > 0
    ? ` · ${Number(item.defaultCost).toLocaleString('uz-UZ')} so'm`
    : '';
  return `${item.name}${sizePart} (${u})${cost}`;
}

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
    const savedSize = formatCatalogSizeDisplay(catalogItem.size);
    return {
      units: ['dona'],
      defaultUnit: 'dona',
      showType: false,
      showSize: false,
      showBlockFields: false,
      catalogSize: savedSize,
      sizeLabel: 'Hajmi',
      sizes: savedSize ? [savedSize] : config.sizes,
      types: config.types,
      qtyLabel: { dona: 'Necha dona (shisha/qadoq)' },
      measureUnit: 'dona',
    };
  }

  if (measure === 'gram' || measure === 'kg') {
    const savedSize = formatCatalogSizeDisplay(catalogItem.size);
    return {
      units: ['dona'],
      defaultUnit: 'dona',
      showType: isSnack,
      showSize: false,
      showBlockFields: false,
      catalogSize: savedSize,
      sizeLabel: "Og'irlik",
      sizes: savedSize ? [savedSize] : (config.sizes.length ? config.sizes : ['50g', '80g', '200g', '500g']),
      types: config.types,
      qtyLabel: { dona: 'Necha dona' },
      measureUnit: 'dona',
    };
  }

  const savedSize = formatCatalogSizeDisplay(catalogItem.size);
  return {
    units: ['dona'],
    defaultUnit: 'dona',
    showType: !savedSize,
    showSize: false,
    showBlockFields: false,
    catalogSize: savedSize,
    sizeLabel: savedSize ? "1 dona og'irligi" : (isSnack ? "Pochka og'irligi" : 'Hajmi'),
    sizes: savedSize ? [savedSize] : config.sizes,
    types: config.types,
    qtyLabel: { dona: 'Necha dona' },
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
