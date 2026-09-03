import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLoaderData, useNavigate, useSearchParams } from 'react-router';
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  Download,
  Leaf,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCarbon } from '@/lib/formatters';
import { complianceRepository, reportRepository } from '../../repositories';
import { generateEmissionReportPDF } from '@/lib/generateEmissionReportPDF';
import { useToast } from '@/hooks/use-toast';
import type {
  CalculationData,
  CalculationEntry,
  CalculatorReportSubmission,
  CalculationEntryMetadata,
  EmissionActivityType,
  CalculationMethod,
  ActivityUnit,
} from '@/types';
import {
  CALCULATOR_FACTOR_SET_ID,
  CALCULATOR_SCHEMA_VERSION,
  CREDIT_CATEGORY_OPTIONS,
  ELECTRICITY_LOCATION_OPTIONS,
  FINANCED_EMISSION_FACTOR,
  FLIGHT_FACTORS,
  COUNTRY_OPTIONS,
  getCountryOption,
  getElectricityLocation,
  getFuelOption,
  getMobileFuelOption,
  getRailClassOption,
  MOBILE_FUEL_OPTIONS,
  RAIL_CLASS_OPTIONS,
  SECURITY_CATEGORY_OPTIONS,
  STATIONARY_FUEL_OPTIONS,
} from '@/lib/emission-calculator';
import { SECTOR_REFERENCE_THRESHOLDS_TCO2E } from '@/lib/emission-thresholds';

export async function clientLoader() {
  return complianceRepository.getComplianceData().catch(() => null);
}

clientLoader.hydrate = true as const;

interface SectorDefinition {
  id: string;
  name: string;
  description: string;
  referenceThresholdTCO2e: number;
}

const SECTORS: SectorDefinition[] = [
  {
    id: 'manufaktur',
    name: 'Manufaktur & Industri',
    description: 'Pabrik, pengolahan, dan produksi barang',
    referenceThresholdTCO2e: SECTOR_REFERENCE_THRESHOLDS_TCO2E.manufaktur,
  },
  {
    id: 'pertambangan',
    name: 'Pertambangan & Energi',
    description: 'Pertambangan mineral, batu bara, minyak, dan gas',
    referenceThresholdTCO2e: SECTOR_REFERENCE_THRESHOLDS_TCO2E.pertambangan,
  },
  {
    id: 'perbankan',
    name: 'Perbankan & Jasa Keuangan',
    description: 'Bank, asuransi, fintech, dan sekuritas',
    referenceThresholdTCO2e: SECTOR_REFERENCE_THRESHOLDS_TCO2E.perbankan,
  },
  {
    id: 'konstruksi',
    name: 'Konstruksi & Properti',
    description: 'Kontraktor, pengembang, dan infrastruktur',
    referenceThresholdTCO2e: SECTOR_REFERENCE_THRESHOLDS_TCO2E.konstruksi,
  },
  {
    id: 'pertanian',
    name: 'Pertanian & Perkebunan',
    description: 'Sawah, kebun, peternakan, dan perikanan',
    referenceThresholdTCO2e: SECTOR_REFERENCE_THRESHOLDS_TCO2E.pertanian,
  },
  {
    id: 'perhotelan',
    name: 'Perhotelan & Pariwisata',
    description: 'Hotel, resort, restoran, dan wisata',
    referenceThresholdTCO2e: SECTOR_REFERENCE_THRESHOLDS_TCO2E.perhotelan,
  },
];

type DraftScope = 1 | 2 | 3;
type DraftActivityType =
  | 'stationary_combustion'
  | 'mobile_combustion'
  | 'purchased_electricity'
  | 'flight'
  | 'hotel'
  | 'rail'
  | 'financed_credit'
  | 'financed_security';

interface ActivityDraft {
  id: string;
  scope: DraftScope;
  activityType: DraftActivityType;
  mobileMethod?: 'fuel_consumption' | 'distance_travelled';
  distanceMethod?: 'standard' | 'user_input';
  fuelCode?: string;
  electricityLocationCode?: string;
  flightType?: 'domestic' | 'international';
  countryCode?: string;
  railClassCode?: string;
  financedCategory?: string;
  financedEntityName?: string;
  investmentValueIDR?: string;
  issuerDenominatorIDR?: string;
  issuerEmissionsTCO2e?: string;
  quantity?: string;
  secondaryQuantity?: string;
  customFactor?: string;
}

let draftSequence = 0;

function createDraft(scope: DraftScope, activityType: DraftActivityType): ActivityDraft {
  draftSequence += 1;
  return {
    id: `activity-${Date.now()}-${draftSequence}`,
    scope,
    activityType,
    mobileMethod: activityType === 'mobile_combustion' ? 'fuel_consumption' : undefined,
    distanceMethod: 'standard',
    fuelCode:
      scope === 1 ? (activityType === 'mobile_combustion' ? 'diesel_cn53' : 'coal') : undefined,
    electricityLocationCode: scope === 2 ? 'jakarta' : undefined,
    flightType: activityType === 'flight' ? 'domestic' : undefined,
    countryCode: activityType === 'hotel' ? 'ID' : undefined,
    railClassCode: activityType === 'rail' ? 'economy' : undefined,
    financedCategory:
      activityType === 'financed_credit'
        ? CREDIT_CATEGORY_OPTIONS[0]?.code
        : activityType === 'financed_security'
          ? SECURITY_CATEGORY_OPTIONS[0]?.code
          : undefined,
  };
}

function parseQuantity(value: string | undefined): number {
  const quantity = Number(value ?? '');
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
}

function buildEntry(draft: ActivityDraft): CalculationEntry | null {
  const quantity = parseQuantity(draft.quantity);
  if (quantity <= 0 && draft.activityType !== 'financed_security') return null;

  let sourceCode: string = draft.activityType;
  let sourceLabel = 'Aktivitas emisi';
  let method: CalculationMethod = 'fuel_consumption';
  let unit: ActivityUnit = 'kg';
  let emissionFactor = 0;
  let factorUnit = 'kgCO2e/unit';
  let metadata: CalculationEntryMetadata = {};

  if (draft.activityType === 'stationary_combustion') {
    const fuel = getFuelOption(draft.fuelCode ?? '');
    if (!fuel) return null;
    sourceCode = fuel.code;
    sourceLabel = `Pembakaran stasioner - ${fuel.label}`;
    unit = fuel.unit;
    emissionFactor = fuel.factor.value;
    factorUnit = fuel.factor.factorUnit;
    metadata = { fuelCode: fuel.code, fuelLabel: fuel.label };
  } else if (draft.activityType === 'mobile_combustion') {
    const fuel = getMobileFuelOption(draft.fuelCode ?? '');
    if (!fuel) return null;
    sourceCode = fuel.code;
    sourceLabel = `Kendaraan operasional - ${fuel.label}`;
    metadata = { fuelCode: fuel.code, fuelLabel: fuel.label };
    if (draft.mobileMethod === 'distance_travelled') {
      method = draft.distanceMethod === 'user_input' ? 'user_distance' : 'standard_distance';
      unit = 'km';
      if (draft.distanceMethod === 'user_input') {
        emissionFactor = parseQuantity(draft.customFactor);
        factorUnit = 'kgCO2e/km';
        if (emissionFactor <= 0) return null;
      } else {
        emissionFactor = 0.171;
        factorUnit = 'kgCO2e/km';
      }
      metadata.distanceMethod = draft.distanceMethod;
    } else {
      unit = fuel.unit;
      emissionFactor = fuel.factor.value;
      factorUnit = fuel.factor.factorUnit;
    }
  } else if (draft.activityType === 'purchased_electricity') {
    const location = getElectricityLocation(draft.electricityLocationCode ?? '');
    if (!location) return null;
    sourceCode = location.code;
    sourceLabel = `Listrik - ${location.label}`;
    method = 'location_based';
    unit = 'kwh';
    emissionFactor = location.factor.value;
    factorUnit = location.factor.factorUnit;
    metadata = {
      electricityLocationCode: location.code,
      electricityLocationLabel: location.label,
    };
  } else if (draft.activityType === 'flight') {
    const flightType = draft.flightType ?? 'domestic';
    const flightFactor = FLIGHT_FACTORS[flightType];
    sourceCode = `flight_${flightType}`;
    sourceLabel = `Pesawat - ${flightType === 'domestic' ? 'Domestik' : 'Internasional'}`;
    method = 'flight_passenger';
    unit = 'passenger';
    emissionFactor = flightFactor.value;
    factorUnit = flightFactor.factorUnit;
    metadata = { flightType };
  } else if (draft.activityType === 'hotel') {
    const country = getCountryOption(draft.countryCode ?? '');
    const nights = parseQuantity(draft.secondaryQuantity);
    if (!country || nights <= 0) return null;
    sourceCode = country.code;
    sourceLabel = `Hotel - ${country.label}`;
    method = 'hotel_room_night';
    unit = 'room_night';
    emissionFactor = country.factor.value;
    factorUnit = country.factor.factorUnit;
    const roomNights = quantity * nights;
    return {
      id: draft.id,
      scope: 3,
      activityType: draft.activityType,
      calculationMethod: method,
      sourceCode,
      sourceLabel,
      quantity: roomNights,
      unit,
      factorCode: country.factor.factorCode,
      factorSetId: country.factor.factorSetId,
      emissionFactor,
      factorUnit,
      emissionsTCO2e: (roomNights * emissionFactor) / 1000,
      metadata: { countryCode: country.code, countryLabel: country.label },
    };
  } else if (draft.activityType === 'rail') {
    const railClass = getRailClassOption(draft.railClassCode ?? '');
    if (!railClass) return null;
    sourceCode = railClass.code;
    sourceLabel = railClass.label;
    method = 'rail_distance';
    unit = 'km';
    emissionFactor = railClass.factor.value;
    factorUnit = railClass.factor.factorUnit;
    metadata = { railClassCode: railClass.code, railClassLabel: railClass.label };
  } else if (draft.activityType === 'financed_credit') {
    const categoryOptions = CREDIT_CATEGORY_OPTIONS;
    const category = categoryOptions.find((option) => option.code === draft.financedCategory);
    if (!category) return null;
    sourceCode = category.code;
    sourceLabel = category.label;
    method = 'financed_emissions';
    unit = 'tco2e';
    emissionFactor = FINANCED_EMISSION_FACTOR.value;
    factorUnit = FINANCED_EMISSION_FACTOR.factorUnit;
    metadata = {
      financedType: draft.activityType === 'financed_credit' ? 'credit' : 'security',
      financedCategory: category.code,
      financedEntityName: draft.financedEntityName,
    };
  } else if (draft.activityType === 'financed_security') {
    const category = SECURITY_CATEGORY_OPTIONS.find(
      (option) => option.code === draft.financedCategory
    );
    if (!category) return null;

    const isGovernmentBond = category.code === 'government_bond';
    const investmentValueIDR = parseQuantity(draft.investmentValueIDR);
    if (isGovernmentBond) {
      if (!draft.countryCode || investmentValueIDR <= 0) return null;

      // Emisi SBN tidak boleh ditebak dari nilai nominal. Perhitungan baru
      // dapat dibuat setelah referensi resmi negara dikonfigurasi sistem.
      return null;
    }

    const issuerDenominatorIDR = parseQuantity(draft.issuerDenominatorIDR);
    const issuerEmissionsTCO2e = parseQuantity(draft.issuerEmissionsTCO2e);
    const attributionFactor = investmentValueIDR / issuerDenominatorIDR;

    if (
      investmentValueIDR <= 0 ||
      issuerDenominatorIDR <= 0 ||
      issuerEmissionsTCO2e <= 0 ||
      !Number.isFinite(attributionFactor) ||
      attributionFactor <= 0 ||
      attributionFactor > 1
    ) {
      return null;
    }

    sourceCode = category.code;
    sourceLabel = category.label;
    method = 'financed_emissions';
    unit = 'tco2e';
    emissionFactor = attributionFactor;
    factorUnit = 'tCO₂e/tCO₂e';
    metadata = {
      financedType: 'security',
      financedCategory: category.code,
      financedEntityName: draft.financedEntityName,
      securityInstrument: category.code as CalculationEntryMetadata['securityInstrument'],
      investmentValueIDR,
      issuerDenominatorIDR,
      issuerEmissionsTCO2e,
    };

    return {
      id: draft.id,
      scope: 3,
      activityType: draft.activityType,
      calculationMethod: method,
      sourceCode,
      sourceLabel,
      quantity: issuerEmissionsTCO2e,
      unit,
      factorCode: `scope_3_financed_${category.code}`,
      factorSetId: CALCULATOR_FACTOR_SET_ID,
      emissionFactor,
      factorUnit,
      emissionsTCO2e: issuerEmissionsTCO2e * attributionFactor,
      metadata,
    };
  }

  const factorCode =
    draft.activityType === 'mobile_combustion' && draft.mobileMethod === 'distance_travelled'
      ? `scope_1_mobile_${draft.distanceMethod ?? 'standard'}`
      : sourceCode;

  return {
    id: draft.id,
    scope: draft.scope,
    activityType: draft.activityType as EmissionActivityType,
    calculationMethod: method,
    sourceCode,
    sourceLabel,
    quantity,
    unit,
    factorCode,
    factorSetId: CALCULATOR_FACTOR_SET_ID,
    emissionFactor,
    factorUnit,
    emissionsTCO2e: (quantity * emissionFactor) / 1000,
    metadata,
  };
}

function SelectField({
  value,
  placeholder,
  onValueChange,
  children,
}: {
  value: string | undefined;
  placeholder: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <Select value={value ?? ''} onValueChange={onValueChange}>
      <SelectTrigger className="h-11 rounded-xl border-slate-200 text-sm font-semibold">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

function NumberField({
  value,
  placeholder,
  unit,
  onChange,
}: {
  value: string | undefined;
  placeholder: string;
  unit: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min="0"
        step="0.01"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl border-slate-200 font-mono text-sm"
      />
      <span className="shrink-0 text-xs font-bold text-slate-500">{unit}</span>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-xs font-bold uppercase tracking-wide text-slate-600">{children}</label>
  );
}

function ActivityForm({
  draft,
  update,
}: {
  draft: ActivityDraft;
  update: (changes: Partial<ActivityDraft>) => void;
}) {
  if (draft.activityType === 'stationary_combustion') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel>Jenis bahan bakar</FieldLabel>
          <SelectField
            value={draft.fuelCode}
            placeholder="Pilih bahan bakar"
            onValueChange={(fuelCode) => update({ fuelCode })}
          >
            {STATIONARY_FUEL_OPTIONS.map((fuel) => (
              <SelectItem key={fuel.code} value={fuel.code}>
                {fuel.label}
              </SelectItem>
            ))}
          </SelectField>
        </div>
        <div className="space-y-2">
          <FieldLabel>Jumlah konsumsi</FieldLabel>
          <NumberField
            value={draft.quantity}
            placeholder="Contoh: 500"
            unit={getFuelOption(draft.fuelCode ?? '')?.unit ?? 'unit'}
            onChange={(quantity) => update({ quantity })}
          />
        </div>
      </div>
    );
  }

  if (draft.activityType === 'mobile_combustion') {
    const isDistance = draft.mobileMethod === 'distance_travelled';
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <FieldLabel>Metode aktivitas</FieldLabel>
          <SelectField
            value={draft.mobileMethod}
            placeholder="Pilih metode"
            onValueChange={(mobileMethod) =>
              update({
                mobileMethod: mobileMethod as ActivityDraft['mobileMethod'],
                quantity: '',
                customFactor: '',
              })
            }
          >
            <SelectItem value="fuel_consumption">Pemakaian</SelectItem>
            <SelectItem value="distance_travelled">Jarak Tempuh</SelectItem>
          </SelectField>
        </div>
        {isDistance && (
          <div className="space-y-2">
            <FieldLabel>Jenis perhitungan jarak</FieldLabel>
            <SelectField
              value={draft.distanceMethod}
              placeholder="Pilih jenis perhitungan"
              onValueChange={(distanceMethod) =>
                update({
                  distanceMethod: distanceMethod as ActivityDraft['distanceMethod'],
                  quantity: '',
                  customFactor: '',
                })
              }
            >
              <SelectItem value="standard">
                Berdasarkan Permen LHK No. 12 Tahun 2010 (Terstandar)
              </SelectItem>
              <SelectItem value="user_input">
                Berdasarkan Data Input Pengguna (Non-Standar)
              </SelectItem>
            </SelectField>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel>Jenis bahan bakar</FieldLabel>
            <SelectField
              value={draft.fuelCode}
              placeholder="Pilih bahan bakar"
              onValueChange={(fuelCode) => update({ fuelCode })}
            >
              {MOBILE_FUEL_OPTIONS.map((fuel) => (
                <SelectItem key={fuel.code} value={fuel.code}>
                  {fuel.label}
                </SelectItem>
              ))}
            </SelectField>
          </div>
          <div className="space-y-2">
            <FieldLabel>{isDistance ? 'Jarak tempuh' : 'Jumlah konsumsi bahan bakar'}</FieldLabel>
            <NumberField
              value={draft.quantity}
              placeholder={isDistance ? 'Contoh: 1000' : 'Contoh: 500'}
              unit={
                isDistance ? 'km' : (getMobileFuelOption(draft.fuelCode ?? '')?.unit ?? 'liter')
              }
              onChange={(quantity) => update({ quantity })}
            />
          </div>
        </div>
        {isDistance && draft.distanceMethod === 'user_input' && (
          <div className="space-y-2">
            <FieldLabel>Faktor emisi input pengguna</FieldLabel>
            <NumberField
              value={draft.customFactor}
              placeholder="Contoh: 0,171"
              unit="kgCO₂e/km"
              onChange={(customFactor) => update({ customFactor })}
            />
            <p className="text-[11px] font-medium text-slate-500">
              Cantumkan sumber faktor pada dokumen pendukung agar dapat diperiksa auditor.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (draft.activityType === 'purchased_electricity') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel>Lokasi atau sistem kelistrikan</FieldLabel>
          <SelectField
            value={draft.electricityLocationCode}
            placeholder="Pilih lokasi listrik"
            onValueChange={(electricityLocationCode) => update({ electricityLocationCode })}
          >
            {ELECTRICITY_LOCATION_OPTIONS.map((location) => (
              <SelectItem key={location.code} value={location.code}>
                {location.label}
              </SelectItem>
            ))}
          </SelectField>
        </div>
        <div className="space-y-2">
          <FieldLabel>Jumlah pemakaian listrik</FieldLabel>
          <NumberField
            value={draft.quantity}
            placeholder="Contoh: 50000"
            unit="kWh"
            onChange={(quantity) => update({ quantity })}
          />
        </div>
      </div>
    );
  }

  if (draft.activityType === 'flight') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel>Jenis penerbangan</FieldLabel>
          <SelectField
            value={draft.flightType}
            placeholder="Pilih jenis penerbangan"
            onValueChange={(flightType) =>
              update({ flightType: flightType as ActivityDraft['flightType'] })
            }
          >
            <SelectItem value="domestic">Domestik</SelectItem>
            <SelectItem value="international">Internasional</SelectItem>
          </SelectField>
        </div>
        <div className="space-y-2">
          <FieldLabel>Jumlah penumpang</FieldLabel>
          <NumberField
            value={draft.quantity}
            placeholder="Contoh: 25"
            unit="penumpang"
            onChange={(quantity) => update({ quantity })}
          />
        </div>
      </div>
    );
  }

  if (draft.activityType === 'hotel') {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <FieldLabel>Negara</FieldLabel>
          <SelectField
            value={draft.countryCode}
            placeholder="Pilih negara"
            onValueChange={(countryCode) => update({ countryCode })}
          >
            {COUNTRY_OPTIONS.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.label}
              </SelectItem>
            ))}
          </SelectField>
        </div>
        <div className="space-y-2">
          <FieldLabel>Jumlah hari menginap</FieldLabel>
          <NumberField
            value={draft.secondaryQuantity}
            placeholder="Contoh: 3"
            unit="hari"
            onChange={(secondaryQuantity) => update({ secondaryQuantity })}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel>Jumlah kamar</FieldLabel>
          <NumberField
            value={draft.quantity}
            placeholder="Contoh: 5"
            unit="kamar"
            onChange={(quantity) => update({ quantity })}
          />
        </div>
      </div>
    );
  }

  if (draft.activityType === 'rail') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel>Kelas kereta</FieldLabel>
          <SelectField
            value={draft.railClassCode}
            placeholder="Pilih kelas kereta"
            onValueChange={(railClassCode) => update({ railClassCode })}
          >
            {RAIL_CLASS_OPTIONS.map((railClass) => (
              <SelectItem key={railClass.code} value={railClass.code}>
                {railClass.label}
              </SelectItem>
            ))}
          </SelectField>
        </div>
        <div className="space-y-2">
          <FieldLabel>Jarak tempuh</FieldLabel>
          <NumberField
            value={draft.quantity}
            placeholder="Contoh: 800"
            unit="km"
            onChange={(quantity) => update({ quantity })}
          />
        </div>
      </div>
    );
  }

  if (draft.activityType === 'financed_credit') {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 md:col-span-2">
          <FieldLabel>Jenis kredit</FieldLabel>
          <SelectField
            value={draft.financedCategory}
            placeholder="Pilih jenis kredit"
            onValueChange={(financedCategory) => update({ financedCategory })}
          >
            {CREDIT_CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.code} value={option.code}>
                {option.label}
              </SelectItem>
            ))}
          </SelectField>
        </div>
        <div className="space-y-2">
          <FieldLabel>Emisi entitas yang dibiayai</FieldLabel>
          <NumberField
            value={draft.quantity}
            placeholder="Contoh: 500"
            unit="tCO₂e"
            onChange={(quantity) => update({ quantity })}
          />
        </div>
        <div className="space-y-2 md:col-span-3">
          <FieldLabel>Nama entitas atau proyek</FieldLabel>
          <Input
            value={draft.financedEntityName ?? ''}
            placeholder="Nama perusahaan atau proyek"
            onChange={(event) => update({ financedEntityName: event.target.value })}
            className="h-11 rounded-xl border-slate-200 text-sm"
          />
        </div>
      </div>
    );
  }

  const securityCategory = SECURITY_CATEGORY_OPTIONS.find(
    (option) => option.code === draft.financedCategory
  );
  const isGovernmentBond = securityCategory?.code === 'government_bond';

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FieldLabel>Jenis surat berharga</FieldLabel>
        <SelectField
          value={draft.financedCategory}
          placeholder="Pilih jenis surat berharga"
          onValueChange={(financedCategory) => update({ financedCategory })}
        >
          {SECURITY_CATEGORY_OPTIONS.map((option) => (
            <SelectItem key={option.code} value={option.code}>
              {option.label}
            </SelectItem>
          ))}
        </SelectField>
      </div>

      {isGovernmentBond ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel>Negara penerbit</FieldLabel>
              <SelectField
                value={draft.countryCode}
                placeholder="Pilih negara penerbit"
                onValueChange={(countryCode) => update({ countryCode })}
              >
                {COUNTRY_OPTIONS.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectField>
            </div>
            <div className="space-y-2">
              <FieldLabel>Nilai SBN yang dimiliki</FieldLabel>
              <NumberField
                value={draft.investmentValueIDR}
                placeholder="Contoh: 1000000000"
                unit="IDR"
                onChange={(investmentValueIDR) => update({ investmentValueIDR })}
              />
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-500">
            Perhitungan emisi SBN menggunakan referensi resmi negara yang dikelola sistem. Emitter
            cukup memilih negara penerbit dan mengisi nilai SBN yang dimiliki.
          </p>
        </>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <FieldLabel>Nilai pasar/buku investasi</FieldLabel>
            <NumberField
              value={draft.investmentValueIDR}
              placeholder="Contoh: 1000000000"
              unit="IDR"
              onChange={(investmentValueIDR) => update({ investmentValueIDR })}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>Nilai EVIC atau utang + modal penerbit</FieldLabel>
            <NumberField
              value={draft.issuerDenominatorIDR}
              placeholder="Contoh: 10000000000"
              unit="IDR"
              onChange={(issuerDenominatorIDR) => update({ issuerDenominatorIDR })}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>Total emisi penerbit</FieldLabel>
            <NumberField
              value={draft.issuerEmissionsTCO2e}
              placeholder="Contoh: 25000"
              unit="tCO₂e"
              onChange={(issuerEmissionsTCO2e) => update({ issuerEmissionsTCO2e })}
            />
          </div>
        </div>
      )}

      {!isGovernmentBond && (
        <div className="space-y-2">
          <FieldLabel>Nama penerbit</FieldLabel>
          <Input
            value={draft.financedEntityName ?? ''}
            placeholder="Nama perusahaan penerbit"
            onChange={(event) => update({ financedEntityName: event.target.value })}
            className="h-11 rounded-xl border-slate-200 text-sm"
          />
        </div>
      )}
    </div>
  );
}

function getActivityTitle(activityType: DraftActivityType): string {
  const labels: Record<DraftActivityType, string> = {
    stationary_combustion: 'Pembakaran stasioner',
    mobile_combustion: 'Kendaraan operasional',
    purchased_electricity: 'Pemakaian listrik',
    flight: 'Pesawat',
    hotel: 'Hotel',
    rail: 'Kereta api',
    financed_credit: 'Kredit',
    financed_security: 'Surat berharga',
  };
  return labels[activityType];
}

function ScopeSection({
  scope,
  drafts,
  onAdd,
  onUpdate,
  onRemove,
}: {
  scope: DraftScope;
  drafts: ActivityDraft[];
  onAdd: (activityType: DraftActivityType) => void;
  onUpdate: (id: string, changes: Partial<ActivityDraft>) => void;
  onRemove: (id: string) => void;
}) {
  const [activityType, setActivityType] = useState<DraftActivityType>(
    scope === 1 ? 'stationary_combustion' : scope === 2 ? 'purchased_electricity' : 'flight'
  );
  const scopeDrafts = drafts.filter((draft) => draft.scope === scope);
  const scopeColor =
    scope === 1
      ? 'border-red-100 bg-red-50/30'
      : scope === 2
        ? 'border-amber-100 bg-amber-50/30'
        : 'border-blue-100 bg-blue-50/30';

  return (
    <section className={`space-y-5 rounded-3xl border p-6 ${scopeColor}`}>
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
          Scope {scope}
        </p>
        <h3 className="mt-1 text-xl font-black text-slate-900">
          {scope === 1
            ? 'Direct Emissions'
            : scope === 2
              ? 'Indirect Emissions from Purchased Energy'
              : 'Value Chain Indirect Emissions'}
        </h3>
        <p className="mt-1 text-xs font-medium text-slate-500">
          {scope === 1
            ? 'Emisi langsung dari pembakaran dan kendaraan operasional.'
            : scope === 2
              ? 'Emisi tidak langsung dari listrik yang dibeli.'
              : 'Emisi tidak langsung dari perjalanan, akomodasi, dan pembiayaan.'}
        </p>
      </div>

      {scopeDrafts.map((draft, index) => (
        <div key={draft.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h4 className="text-sm font-black text-slate-900">
              Aktivitas {index + 1}: {getActivityTitle(draft.activityType)}
            </h4>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onRemove(draft.id)}
              className="h-9 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Hapus
            </Button>
          </div>
          <ActivityForm draft={draft} update={(changes) => onUpdate(draft.id, changes)} />
        </div>
      ))}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <FieldLabel>Tambah jenis aktivitas</FieldLabel>
          <SelectField
            value={activityType}
            placeholder="Pilih aktivitas"
            onValueChange={(value) => setActivityType(value as DraftActivityType)}
          >
            {scope === 1 ? (
              <>
                <SelectItem value="stationary_combustion">Pembakaran stasioner</SelectItem>
                <SelectItem value="mobile_combustion">Kendaraan operasional</SelectItem>
              </>
            ) : scope === 2 ? (
              <SelectItem value="purchased_electricity">Pemakaian listrik</SelectItem>
            ) : (
              <>
                <SelectItem value="flight">Pesawat</SelectItem>
                <SelectItem value="hotel">Hotel</SelectItem>
                <SelectItem value="rail">Kereta api</SelectItem>
                <SelectItem value="financed_credit">Kredit</SelectItem>
                <SelectItem value="financed_security">Surat berharga</SelectItem>
              </>
            )}
          </SelectField>
        </div>
        <Button
          type="button"
          onClick={() => onAdd(activityType)}
          className="h-11 rounded-xl bg-slate-900 px-5 text-xs font-bold text-white hover:bg-slate-800"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Tambah Aktivitas
        </Button>
      </div>
    </section>
  );
}

export function meta() {
  return [
    { title: 'Kalkulator Hijau | RekaKarbon' },
    { name: 'description', content: 'Kalkulator emisi Scope 1, Scope 2, dan Scope 3 RekaKarbon' },
  ];
}

export default function KalkulatorHijauPage() {
  const navigate = useNavigate();
  const complianceData = useLoaderData<typeof clientLoader>();
  const [searchParams] = useSearchParams();
  const [selectedSectorId, setSelectedSectorId] = useState(searchParams.get('sector') ?? '');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [drafts, setDrafts] = useState<ActivityDraft[]>([
    createDraft(1, 'stationary_combustion'),
    createDraft(2, 'purchased_electricity'),
    createDraft(3, 'flight'),
  ]);
  const [selectedComplianceData, setSelectedComplianceData] = useState(complianceData);
  const [isQuotaLoading, setIsQuotaLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPdfData, setGeneratedPdfData] = useState<{
    submission: CalculatorReportSubmission;
    calculationData: CalculationData;
  } | null>(null);
  const { toast } = useToast();

  const selectedSector = useMemo(
    () => SECTORS.find((sector) => sector.id === selectedSectorId) ?? null,
    [selectedSectorId]
  );

  useEffect(() => {
    let cancelled = false;
    if (complianceData?.complianceYear === selectedYear) {
      setSelectedComplianceData(complianceData);
      setIsQuotaLoading(false);
      return () => {
        cancelled = true;
      };
    }
    setIsQuotaLoading(true);
    setSelectedComplianceData(null);
    void complianceRepository
      .getComplianceData(selectedYear)
      .then((data) => {
        if (!cancelled) setSelectedComplianceData(data);
      })
      .catch(() => {
        if (!cancelled) setSelectedComplianceData(null);
      })
      .finally(() => {
        if (!cancelled) setIsQuotaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [complianceData, selectedYear]);

  const entries = useMemo(
    () => drafts.map(buildEntry).filter((entry): entry is CalculationEntry => entry !== null),
    [drafts]
  );
  const totals = useMemo(() => {
    const scope1 = entries
      .filter((entry) => entry.scope === 1)
      .reduce((sum, entry) => sum + entry.emissionsTCO2e, 0);
    const scope2 = entries
      .filter((entry) => entry.scope === 2)
      .reduce((sum, entry) => sum + entry.emissionsTCO2e, 0);
    const scope3 = entries
      .filter((entry) => entry.scope === 3)
      .reduce((sum, entry) => sum + entry.emissionsTCO2e, 0);
    return { scope1, scope2, scope3, total: scope1 + scope2 + scope3 };
  }, [entries]);

  const calculationData: CalculationData = {
    schemaVersion: CALCULATOR_SCHEMA_VERSION,
    factorSetId: CALCULATOR_FACTOR_SET_ID,
    ...totals,
    entries,
  };

  const addDraft = (scope: DraftScope, activityType: DraftActivityType) => {
    setDrafts((current) => [...current, createDraft(scope, activityType)]);
  };

  const updateDraft = (id: string, changes: Partial<ActivityDraft>) => {
    setDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, ...changes } : draft))
    );
  };

  const removeDraft = (id: string) => {
    setDrafts((current) => current.filter((draft) => draft.id !== id));
  };

  const handleSubmit = async () => {
    if (!selectedSectorId) {
      toast({
        variant: 'destructive',
        title: 'Sektor belum dipilih',
        description: 'Pilih sektor industri terlebih dahulu.',
      });
      return;
    }
    if (entries.length === 0 || totals.total <= 0) {
      toast({
        variant: 'destructive',
        title: 'Data aktivitas belum lengkap',
        description: 'Isi minimal satu aktivitas dengan nilai lebih besar dari nol.',
      });
      return;
    }
    if (drafts.some((draft) => parseQuantity(draft.quantity) > 0 && !buildEntry(draft))) {
      toast({
        variant: 'destructive',
        title: 'Data aktivitas belum valid',
        description: 'Lengkapi pilihan dan nilai pada setiap aktivitas yang diisi.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const submission = await reportRepository.submitCalculatorReport(
        selectedYear,
        selectedSectorId,
        totals.total,
        calculationData
      );
      setGeneratedPdfData({ submission, calculationData });
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Gagal menyimpan laporan',
        description: error instanceof Error ? error.message : 'Gagal menyimpan laporan kalkulator.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!generatedPdfData || !selectedSector) return;
    const fieldValues: Record<string, string> = Object.fromEntries(
      generatedPdfData.calculationData.entries.map((entry) => [entry.id, String(entry.quantity)])
    );
    generateEmissionReportPDF({
      year: selectedYear,
      sectorName: selectedSector.name,
      reportTitle: `Laporan Emisi ${selectedSector.name} Tahun ${selectedYear}`,
      reportMethod: 'CALCULATOR',
      reportStatus: 'submitted',
      total: totals.total,
      scope1: totals.scope1,
      scope2: totals.scope2,
      scope3: totals.scope3,
      merkleRoot: generatedPdfData.submission.merkleRoot,
      txHash: generatedPdfData.submission.txHash,
      blockchainReportId: generatedPdfData.submission.blockchainReportId,
      thresholdTCO2e: selectedSector.referenceThresholdTCO2e,
      fieldValues,
      calculationData: generatedPdfData.calculationData,
    });
  };

  const hasMatchingQuota = selectedComplianceData?.complianceYear === selectedYear;
  const officialQuotaTCO2e = hasMatchingQuota ? selectedComplianceData.quotaPTBAE : null;

  if (generatedPdfData) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="mb-2 text-2xl font-black text-slate-900">Laporan Emisi Berhasil Dibuat</h2>
          <p className="mb-8 text-sm text-slate-500">
            Laporan telah tersimpan dan menunggu proses audit.
          </p>
          <div className="mb-8 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-left">
            <div className="flex justify-between border-b border-slate-200 pb-4 text-sm">
              <span className="font-bold text-slate-500">Total Emisi</span>
              <span className="font-black text-emerald-700">{formatCarbon(totals.total)}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Merkle Root</span>
              <p className="mt-1 break-all rounded-lg bg-slate-200/60 p-2 font-mono text-xs text-slate-700">
                {generatedPdfData.submission.merkleRoot}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/laporan')}
              variant="outline"
              className="h-12 flex-1 rounded-xl font-bold"
            >
              Kembali ke Laporan
            </Button>
            <Button
              onClick={handleDownloadPDF}
              className="h-12 flex-1 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700"
            >
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 text-left">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
            <Calculator className="h-7 w-7 text-emerald-600" /> Kalkulator Hijau
          </h2>
          <p className="mt-1 max-w-3xl text-xs font-semibold text-slate-500">
            Hitung emisi berdasarkan tiga scope GHG dan aktivitas aktual perusahaan.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/laporan')}
          className="h-9 rounded-xl border-slate-200 text-xs font-bold"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Kembali
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <FieldLabel>Tahun kepatuhan</FieldLabel>
          <Select
            value={String(selectedYear)}
            onValueChange={(value) => setSelectedYear(Number(value))}
          >
            <SelectTrigger className="mt-2 h-11 rounded-xl border-slate-200 text-sm font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">FY 2026</SelectItem>
              <SelectItem value="2025">FY 2025</SelectItem>
              <SelectItem value="2024">FY 2024</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <FieldLabel>Sektor industri</FieldLabel>
          <Select value={selectedSectorId} onValueChange={(value) => setSelectedSectorId(value)}>
            <SelectTrigger className="mt-2 h-11 rounded-xl border-slate-200 text-sm font-bold">
              <SelectValue placeholder="Pilih sektor industri" />
            </SelectTrigger>
            <SelectContent>
              {SECTORS.map((sector) => (
                <SelectItem key={sector.id} value={sector.id}>
                  {sector.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div>
          <p className="text-xs font-black uppercase text-emerald-800">
            PTBAE-PU tahun {selectedYear}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-emerald-800/80">
            Kuota resmi dipakai untuk perhitungan kepatuhan dan defisit.
          </p>
        </div>
        <span className="font-mono text-sm font-black text-emerald-900">
          {isQuotaLoading
            ? 'Memuat...'
            : officialQuotaTCO2e === null
              ? 'Belum tersedia'
              : formatCarbon(officialQuotaTCO2e)}
        </span>
      </div>

      <div className="space-y-6">
        <ScopeSection
          scope={1}
          drafts={drafts}
          onAdd={(activityType) => addDraft(1, activityType)}
          onUpdate={updateDraft}
          onRemove={removeDraft}
        />
        <ScopeSection
          scope={2}
          drafts={drafts}
          onAdd={(activityType) => addDraft(2, activityType)}
          onUpdate={updateDraft}
          onRemove={removeDraft}
        />
        <ScopeSection
          scope={3}
          drafts={drafts}
          onAdd={(activityType) => addDraft(3, activityType)}
          onUpdate={updateDraft}
          onRemove={removeDraft}
        />
      </div>

      <div className="sticky bottom-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-xl backdrop-blur">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ['Scope 1', totals.scope1, 'text-red-700'],
            ['Scope 2', totals.scope2, 'text-amber-700'],
            ['Scope 3', totals.scope3, 'text-blue-700'],
            ['Total Emisi', totals.total, 'text-emerald-700'],
          ].map(([label, value, color]) => (
            <div key={String(label)} className="rounded-xl bg-slate-50 px-4 py-3">
              <span className="block text-[10px] font-bold uppercase text-slate-500">{label}</span>
              <span className={`font-mono text-sm font-black ${String(color)}`}>
                {formatCarbon(Number(value))}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Leaf className="h-4 w-4 text-emerald-600" /> Hasil dihitung ulang oleh server saat
            disubmit.
          </span>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-11 rounded-xl bg-emerald-600 px-6 text-xs font-bold text-white hover:bg-emerald-700"
          >
            <Save className="mr-1.5 h-4 w-4" />{' '}
            {isSubmitting ? 'Menyimpan...' : 'Selesai & Simpan Data'}
          </Button>
        </div>
      </div>
    </div>
  );
}
