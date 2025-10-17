/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { type TradeInnAtributtesDictionary } from './get-store-info';
import { getInfoValorAtributo, type TradeInnAttributeMeta } from './get-attributes-value';

export interface TradeInnAttributeValue {
  id: string
  name: string
}

export interface TradeInnAttribute {
  id: string
  label: string
  values: TradeInnAttributeValue[]
}

export type TradeInnSearchResponse = Record<string, {
  atributos?: {
    id_atributo: {
      buckets: Array<{
        atributos: {
          id_atribut_valor: { buckets: TradeInnBucket[] }
        }
      }>
    }
  }
  id_atributo?: {
    buckets: Array<{
      atributos: {
        id_atribut_valor: { buckets: TradeInnBucket[] }
      }
    }>
  }
}>;

interface TradeInnBucket {
  key: string
  doc_count: number
  valor_atributos?: {
    ids_atributos_valor: {
      buckets: TradeInnBucket[]
    }
    id_atribut_valor: {
      buckets: TradeInnBucket[]
    }
  }
  atributos?: {
    id_atribut_valor: {
      buckets: TradeInnBucket[]
    }
  }
}

interface AttributeResult {
  id_atributo: string
  nombre_atributo?: string
  operador?: string
  prioridad?: number
  valores: Array<{
    id_atributo_valor: string
    nombre_id_atributo_valor: string
    doc_count: number
  }>
}

/**
 * Helper to process buckets for an attribute
 */
function processBuckets (
  attributeId: string,
  attributeBuckets: TradeInnBucket[],
  attributeInfo: TradeInnAttributeMeta,
  result: Record<string, AttributeResult>
) {
  if (!attributeBuckets || attributeBuckets.length === 0) return;

  if (!result[attributeId]) {
    result[attributeId] = {
      id_atributo: attributeId,
      nombre_atributo: attributeInfo.nombre_atributo,
      operador: attributeInfo.operador_atributo,
      prioridad: attributeInfo.prioridad_atributo ? parseInt(attributeInfo.prioridad_atributo, 10) : 0,
      valores: []
    };
  }

  attributeBuckets.forEach((bucket) => {
    const valueId = bucket.key;
    const valueName = attributeInfo.info_atributos_valor?.[valueId];

    if (valueName) {
      result[attributeId].valores.push({
        id_atributo_valor: valueId,
        nombre_id_atributo_valor: valueName,
        doc_count: bucket.doc_count
      });
    }
  });
}

/**
 * Groups attributes based on input data
 */
function getGroupByAttributes (
  attributes: TradeInnAtributtesDictionary,
  data: Record<string, any> | TradeInnBucket[],
  type: number
): Record<string, AttributeResult> {
  const result: Record<string, AttributeResult> = {};

  const isExcludedKey = (key: string) =>
    ['group_by_marca', 'group_by_tallas', 'group_by_categorias', 'group_by_tallas_pais', 'group_by_tallas_2'].includes(
      key
    );

  if (type === 1) {
    Object.keys(data).forEach((key) => {
      if (isExcludedKey(key)) return;

      const item = (data as Record<string, any>)[key];
      const attributeBuckets: TradeInnBucket[] = item.atributos?.id_atribut_valor?.buckets || item.id_atribut_valor?.buckets;
      if (!attributeBuckets || attributeBuckets.length === 0) return;

      const buckets = attributeBuckets[0]?.atributos?.id_atribut_valor?.buckets;
      if (!buckets || buckets.length === 0) return;

      const attributeInfo = getInfoValorAtributo(attributes, key, '', true);
      processBuckets(key, buckets, attributeInfo, result);
    });
  } else {
    (data as TradeInnBucket[]).forEach((bucket, i) => {
      const key = bucket.key;
      const attributeInfo = getInfoValorAtributo(attributes, key, '', true);

      const attributeBuckets: TradeInnBucket[] = bucket.valor_atributos?.ids_atributos_valor?.buckets || [];
      processBuckets(key, attributeBuckets, attributeInfo, result);
    });
  }

  return result;
}

/**
 * Extracts attributes from the fetched data
 */
export function extractAttributes (
  data: TradeInnSearchResponse,
  attributes: TradeInnAtributtesDictionary
): AttributeResult[] {
  let result: Record<string, AttributeResult> = {};

  if (data.group_by_atributos) {
    const buckets =
      data.group_by_atributos.atributos?.id_atributo?.buckets || data.group_by_atributos.id_atributo?.buckets || [];
    result = getGroupByAttributes(attributes, buckets, 0);
  } else {
    result = getGroupByAttributes(attributes, data, 1);
  }

  return Object.values(result);
}
