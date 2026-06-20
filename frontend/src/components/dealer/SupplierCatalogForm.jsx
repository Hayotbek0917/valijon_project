import { useState } from 'react';
import {
  Button, Chip, TextField, FormControl, InputLabel, Select, MenuItem, Autocomplete,
} from '@mui/material';
import {
  MEASURE_UNITS, getCatalogMeasureField,
  buildCatalogSizeWithPieces, buildVolumeCatalogSize, catalogChipLabel,
} from '../../config/dealerProducts';

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

export default function SupplierCatalogForm({
  items = [],
  onItemsChange,
  singleMode = false,
  onAddSingle,
  onError,
}) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('dona');
  const [sizeValue, setSizeValue] = useState('');
  const [volumeLitr, setVolumeLitr] = useState('');
  const [volumeMl, setVolumeMl] = useState('');
  const [cost, setCost] = useState('');
  const [barcode, setBarcode] = useState('');

  const measureField = getCatalogMeasureField(unit);

  const resetMeasureFields = () => {
    setSizeValue('');
    setVolumeLitr('');
    setVolumeMl('');
  };

  const resetForm = () => {
    setName('');
    resetMeasureFields();
    setCost('');
    setBarcode('');
  };

  const buildSize = () => {
    if (measureField?.kind === 'volume') {
      return buildVolumeCatalogSize({ litr: volumeLitr, ml: volumeMl, pieces: '' });
    }
    if (measureField) {
      return buildCatalogSizeWithPieces(unit, { sizeValue, litr: volumeLitr, ml: volumeMl });
    }
    return '';
  };

  const handleAdd = () => {
    if (!name.trim()) {
      onError?.('Mahsulot nomini kiriting');
      return;
    }
    const barcodeTrimmed = barcode.trim();
    if (!barcodeTrimmed) {
      onError?.('Shtrix-kodni skanerlang yoki kiriting');
      return;
    }
    const costNum = parseFloat(cost);
    if (!costNum || costNum <= 0) {
      onError?.('Kirim narxini kiriting');
      return;
    }

    if (measureField?.kind === 'volume') {
      if (!volumeLitr.trim() && !volumeMl.trim()) {
        onError?.('Hajmni litr yoki ml da kiriting (masalan: 1.25 L yoki 500 ml)');
        return;
      }
    } else if (measureField && !sizeValue.trim()) {
      onError?.(`${measureField.label} ni tanlang yoki kiriting`);
      return;
    }

    onError?.('');

    const item = {
      name: name.trim(),
      unit,
      size: buildSize(),
      defaultCost: costNum,
      barcode: barcodeTrimmed,
    };

    if (singleMode) {
      onAddSingle?.(item);
      resetForm();
      return;
    }

    onItemsChange?.([...items, item]);
    resetForm();
  };

  return (
    <div className="border rounded-xl p-4 space-y-4 bg-gray-50/50">
      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
        Mahsulot ma&apos;lumotlari
      </p>

      <TextField
        size="small"
        fullWidth
        label="Mahsulot nomi"
        placeholder="Masalan: Lay's Chips, Cola"
        value={name}
        onChange={(e) => setName(e.target.value)}
        sx={fieldSx}
      />

      <FormControl size="small" fullWidth sx={fieldSx}>
        <InputLabel>O&apos;lchov</InputLabel>
        <Select
          label="O'lchov"
          value={unit}
          onChange={(e) => {
            setUnit(e.target.value);
            resetMeasureFields();
          }}
        >
          {MEASURE_UNITS.map((u) => (
            <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {measureField?.kind === 'volume' && (
        <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3">
          <p className="text-xs font-bold text-blue-900 uppercase tracking-wide">
            Bitta shisha hajmi
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField
              size="small"
              fullWidth
              type="number"
              inputProps={{ step: '0.1', min: '0' }}
              label="Nechi litrlik"
              placeholder="Masalan: 1 yoki 1.25"
              value={volumeLitr}
              onChange={(e) => setVolumeLitr(e.target.value)}
              InputProps={{
                endAdornment: <span className="text-sm text-gray-400 pr-1">L</span>,
              }}
              sx={fieldSx}
            />
            <TextField
              size="small"
              fullWidth
              type="number"
              label="yoki millilitr"
              placeholder="Masalan: 500"
              value={volumeMl}
              onChange={(e) => setVolumeMl(e.target.value)}
              InputProps={{
                endAdornment: <span className="text-sm text-gray-400 pr-1">ml</span>,
              }}
              sx={fieldSx}
            />
          </div>
          <p className="text-[11px] text-blue-700">Zakaz berishda necha dona olish alohida kiritiladi</p>
        </div>
      )}

      {measureField?.kind === 'preset' && (
        <Autocomplete
          freeSolo
          options={measureField.presets.map((p) => p.value)}
          value={sizeValue}
          onChange={(_, val) => setSizeValue(val || '')}
          onInputChange={(_, val) => setSizeValue(val)}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label={measureField.label}
              placeholder="100 yoki ro'yxatdan tanlang"
              helperText={measureField.helperText}
              sx={fieldSx}
            />
          )}
        />
      )}

      {measureField?.kind === 'number' && (
        <TextField
          size="small"
          fullWidth
          type="number"
          label={measureField.label}
          placeholder={measureField.placeholder}
          value={sizeValue}
          onChange={(e) => setSizeValue(e.target.value)}
          helperText={measureField.helperText}
          InputProps={{
            endAdornment: measureField.suffix ? (
              <span className="text-sm text-gray-400 pr-1">{measureField.suffix}</span>
            ) : null,
          }}
          sx={fieldSx}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          size="small"
          fullWidth
          type="number"
          label="1 dona kirim narxi (so'm)"
          placeholder="5000"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          helperText="Har bir dona/shisha narxi — zakazda miqdor alohida"
          sx={fieldSx}
        />
        <TextField
          size="small"
          fullWidth
          label="Shtrix-kod"
          placeholder="Skaner bilan o'qing..."
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          helperText="Skanerlang, keyin «Ro'yxatga qo'shish» tugmasini bosing"
          sx={fieldSx}
        />
      </div>

      <Button variant="outlined" onClick={handleAdd} sx={{ textTransform: 'none' }}>
        {singleMode ? 'Mahsulotni saqlash' : 'Ro\'yxatga qo\'shish'}
      </Button>

      {!singleMode && items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {items.map((item, i) => (
            <Chip
              key={`${item.name}-${i}`}
              label={catalogChipLabel(item)}
              size="small"
              onDelete={() => onItemsChange?.(items.filter((_, j) => j !== i))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
