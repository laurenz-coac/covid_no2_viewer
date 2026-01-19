import { GeoTIFFDataSource } from './geotiffDataSource';

// Major German cities with population > 100k
export interface City {
  name: string;
  lat: number;
  lng: number;
  population: number;
  baselineValue: number; // no2 from city in 2019
}

export const MAJOR_GERMAN_CITIES: City[] = [
  { name: 'Berlin', lat: 52.52, lng: 13.405, population: 3645000 },
  { name: 'Hamburg', lat: 53.5511, lng: 9.9937, population: 1841000 },
  { name: 'Munich', lat: 48.1351, lng: 11.582, population: 1472000 },
  { name: 'Cologne', lat: 50.9375, lng: 6.9603, population: 1086000 },
  { name: 'Frankfurt', lat: 50.1109, lng: 8.6821, population: 753000 },
  { name: 'Stuttgart', lat: 48.7758, lng: 9.1829, population: 634000 },
  { name: 'Düsseldorf', lat: 51.2277, lng: 6.7735, population: 619000 },
  { name: 'Dortmund', lat: 51.5136, lng: 7.4653, population: 587000 },
  { name: 'Essen', lat: 51.4556, lng: 7.0116, population: 583000 },
  { name: 'Leipzig', lat: 51.3397, lng: 12.3731, population: 587000 },
  { name: 'Bremen', lat: 53.0793, lng: 8.8017, population: 569000 },
  { name: 'Dresden', lat: 51.0504, lng: 13.7373, population: 556000 },
  { name: 'Hanover', lat: 52.3759, lng: 9.732, population: 535000 },
  { name: 'Nuremberg', lat: 49.4521, lng: 11.0767, population: 518000 },
  { name: 'Duisburg', lat: 51.4344, lng: 6.7623, population: 498000 },
  { name: 'Bochum', lat: 51.4818, lng: 7.2162, population: 365000 },
  { name: 'Wuppertal', lat: 51.2562, lng: 7.1508, population: 355000 },
  { name: 'Bielefeld', lat: 52.0302, lng: 8.5325, population: 334000 },
  { name: 'Bonn', lat: 50.7374, lng: 7.0982, population: 327000 },
  { name: 'Münster', lat: 51.9607, lng: 7.6261, population: 315000 },
  { name: 'Karlsruhe', lat: 49.0069, lng: 8.4037, population: 313000 },
  { name: 'Mannheim', lat: 49.4875, lng: 8.4660, population: 310000 },
  { name: 'Augsburg', lat: 48.3705, lng: 10.8978, population: 296000 },
  { name: 'Wiesbaden', lat: 50.0826, lng: 8.2400, population: 278000 },
  { name: 'Gelsenkirchen', lat: 51.5177, lng: 7.0857, population: 260000 },
  { name: 'Mönchengladbach', lat: 51.1805, lng: 6.4428, population: 261000 },
  { name: 'Braunschweig', lat: 52.2689, lng: 10.5268, population: 249000 },
  { name: 'Chemnitz', lat: 50.8278, lng: 12.9214, population: 246000 },
  { name: 'Aachen', lat: 50.7753, lng: 6.0839, population: 249000 },
  { name: 'Kiel', lat: 54.3233, lng: 10.1228, population: 247000 },
];

export interface NO2Measurement { // TODO: remove
  cityName: string;
  lat: number;
  lng: number;
  value: number; // NO2 concentration in mol/m²
  timestamp: Date;
}

export interface CityTimepoint {
  cityName: string;
  timestamp: Date;
  value: number; // NO2 concentration in mol/m²
  incidence: number; // COVID-19 incidence rate
  pValue: number; // p-value for statistical significance
}

export interface GridPoint {
  lat: number;
  lng: number;
  value: number;
  difference: number;
}

export interface BaselineMeasurement { // TODO: remove
  cityName: string;
  meanValue: number; // NO2 from 2019
  stdDev: number; // Standard deviation
  measurements: number[]; // Array of individual measurements for statistical testing
}

// Data source configuration
export interface DataSourceConfig {
  mode: 'geotiff' | 'generated'; // Switch between GeoTIFF and generated data
  geotiffBaseUrl?: string; // Base URL for GeoTIFF files
  baselineGeotiffUrl?: string; // URL for baseline GeoTIFF
  citiesDataUrl?: string; // URL for cities JSON data
}

// Default configuration - uses generated data initially
let dataSourceConfig: DataSourceConfig = {
    mode: 'geotiff',
    geotiffBaseUrl: '/data',
    baselineGeotiffUrl: '/data/baseline.tif'
    // citiesDataUrl omitted - will use default MAJOR_GERMAN_CITIES
  }

/**
 * Configure data source for the application
 */
export function configureDataSource(config: Partial<DataSourceConfig>) {
  dataSourceConfig = { ...dataSourceConfig, ...config };
}


// Singleton GeoTIFF data source
let geotiffDataSource: GeoTIFFDataSource | null = null;

/**
 * Get or create GeoTIFF data source
 */
function getGeoTIFFDataSource(): GeoTIFFDataSource {
  if (!geotiffDataSource) {
    geotiffDataSource = new GeoTIFFDataSource(dataSourceConfig);
  }
  return geotiffDataSource;
}

/**
 * Reset GeoTIFF data source (useful when configuration changes)
 */
export function resetGeoTIFFDataSource(): void {
  if (geotiffDataSource) {
    geotiffDataSource.clearCache();
  }
  geotiffDataSource = null;
}


// Calculate difference from baseline
export function getMeasurementDifference(
  current: NO2Measurement,
  baseline: BaselineMeasurement
): number {
  return current.value - baseline.meanValue;
}

// Calculate percentage change from baseline
export function getPercentageChange(
  current: NO2Measurement,
  baseline: BaselineMeasurement
): number {
  return ((current.value - baseline.meanValue) / baseline.meanValue) * 100;
}

// Perform t-test to check if difference is significant
export function isStatisticallySignificant(
  current: NO2Measurement,
  baseline: BaselineMeasurement,
  alpha: number = 0.05
): boolean {
  // Generate current period measurements (simulate ~30 measurements at current level)
  const currentMeasurements: number[] = [];
  for (let i = 0; i < 30; i++) {
    currentMeasurements.push(current.value + (Math.random() - 0.5) * 5);
  }
  
  const n1 = baseline.measurements.length;
  const n2 = currentMeasurements.length;
  
  const mean1 = baseline.meanValue;
  const mean2 = currentMeasurements.reduce((a, b) => a + b, 0) / n2;
  
  const variance1 = baseline.stdDev * baseline.stdDev;
  const variance2 = currentMeasurements.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / n2;
  
  // Welch's t-test
  const tStatistic = (mean1 - mean2) / Math.sqrt(variance1 / n1 + variance2 / n2);
  
  // Simplified: using t-critical value of ~2.0 for typical degrees of freedom
  // A proper implementation would calculate exact degrees of freedom and use t-distribution
  const tCritical = 2.0;
  
  return Math.abs(tStatistic) > tCritical;
}

// Singleton baseline data
let baselineData: Map<string, BaselineMeasurement> | null = null;


/**
 * Async version of getBaselineData that works with both modes
 */
export async function getBaselineDataAsync(date: Date): Promise<Map<string, BaselineMeasurement>> {
  const source = getGeoTIFFDataSource();
  return await source.getBaselineData(date);
}

/**
 * Async version of getCurrentMeasurements that works with both modes
 */
export async function getCurrentMeasurementsAsync(date: Date): Promise<NO2Measurement[]> {
  const source = getGeoTIFFDataSource();
  return await source.getCurrentMeasurements(date);
  }

/**
 * Async version of getCityData that works with both modes
 */
export async function getCityDataAsync(cityName: string, date: Date) {
  const baseline = await getBaselineDataAsync(date);
  const measurements = await getCurrentMeasurementsAsync(date);
  
  const baselineData = baseline.get(cityName);
  const current = measurements.find(m => m.cityName === cityName);

  console.log('getCityDataAsync', cityName, date, baselineData, current);
  
  if (!baselineData || !current) return null;
  
  return {
    baseline: baselineData,
    current,
    difference: getMeasurementDifference(current, baselineData),
    percentageChange: getPercentageChange(current, baselineData),
    isSignificant: isStatisticallySignificant(current, baselineData)
  };
}

/**
 * Async version of getGridData that works with both modes
 * @param date - Date to get grid data for
 * @param samplingRate - For GeoTIFF mode, sample every Nth pixel (default 2 for performance)
 */
export async function getGridDataAsync(date: Date, samplingRate: number = 2): Promise<GridPoint[]> {
  const source = getGeoTIFFDataSource();
  return await source.getGridData(date, samplingRate);
}