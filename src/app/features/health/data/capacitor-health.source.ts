import { Injectable } from '@angular/core';
import type { HealthDataType } from '@capgo/capacitor-health';
import { HEALTH_METRICS, HealthSource, type HealthMetric, type HealthSample } from '../domain/health-source';

/** Tipo de dato de Health Connect que corresponde a cada medida de Forge. */
const TYPE_OF: Readonly<Record<HealthMetric, HealthDataType>> = {
  steps: 'steps',
  distance: 'distance',
  calories: 'totalCalories',
  heartRate: 'heartRate',
  oxygenSaturation: 'oxygenSaturation',
};

/** Máximo de muestras por lectura; se lee de a un día, y un día no se acerca a esto. */
const READ_LIMIT = 5000;

/** Capacitor define `window.Capacitor` solo dentro de la app nativa; en la web no existe. */
function isNativePlatform(): boolean {
  const capacitor = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return capacitor?.isNativePlatform?.() === true;
}

/**
 * El plugin se carga recién al usarlo: así no entra al bundle inicial de la web. Se devuelve el
 * módulo y no el plugin: el plugin es un Proxy de Capacitor que también responde a `then`, así que
 * devolverlo desde una función async o hacerle await llama a `Health.then()`, que en Android no existe
 * y deja la promesa colgada para siempre.
 */
function healthModule() {
  return import('@capgo/capacitor-health');
}

@Injectable()
export class CapacitorHealthSource extends HealthSource {
  async isAvailable(): Promise<boolean> {
    if (!isNativePlatform()) return false;
    try {
      const { Health } = await healthModule();
      return (await Health.isAvailable()).available;
    } catch {
      return false;
    }
  }

  async requestAccess(): Promise<HealthMetric[]> {
    if (!isNativePlatform()) return [];
    const { Health } = await healthModule();
    const status = await Health.requestAuthorization({
      read: HEALTH_METRICS.map((metric) => TYPE_OF[metric]),
      requestHistoryAccess: true,
    });
    return HEALTH_METRICS.filter((metric) => status.readAuthorized.includes(TYPE_OF[metric]));
  }

  async read(metric: HealthMetric, fromMs: number, toMs: number): Promise<HealthSample[]> {
    if (!isNativePlatform()) return [];
    const { Health } = await healthModule();
    const { samples } = await Health.readSamples({
      dataType: TYPE_OF[metric],
      startDate: new Date(fromMs).toISOString(),
      endDate: new Date(toMs).toISOString(),
      limit: READ_LIMIT,
      ascending: true,
    });
    return samples.map((s) => ({ startMs: Date.parse(s.startDate), value: s.value, sourceId: s.sourceId ?? null }));
  }
}
