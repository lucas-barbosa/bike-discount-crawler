import { type TradeInnStoredAttribute, type TradeInnAtributtesDictionary } from './get-store-info';

/**
 * Metadata returned by getInfoValorAtributo
 */
export interface TradeInnAttributeMeta {
  id_atributo?: string
  nombre_atributo?: string
  operador_atributo?: string
  prioridad_atributo?: string
  nombre_atributo_valor?: string
  info_atributos_valor?: Record<string, string>
}

/**
 * Refactored version of get_info_valor_atributo
 */
export function getInfoValorAtributo (
  atributos: TradeInnAtributtesDictionary,
  attributeId: string,
  attributeIdValue: string = '',
  getInfoAttributeValues: boolean = false
): TradeInnAttributeMeta {
  const meta: TradeInnAttributeMeta = {};
  const attribute: TradeInnStoredAttribute | undefined = atributos[attributeId];

  if (!attribute) {
    return meta;
  }

  if (attributeId !== '') {
    meta.id_atributo = attributeId;
    meta.nombre_atributo = attribute.nombre_atributo;
    meta.operador_atributo = attribute.operador;
    meta.prioridad_atributo = attribute.prioridad;

    if (getInfoAttributeValues) {
      if (attributeId === '1095' && attribute.valores['10415']) {
        delete attribute.valores['10415'];
      }
      meta.info_atributos_valor = attribute.valores;
    }

    return meta;
  }

  // Search by value
  for (const [attrId, attrData] of Object.entries(atributos)) {
    for (const [valorId, valorName] of Object.entries(attrData.valores)) {
      if (valorId === attributeIdValue) {
        meta.id_atributo = attrId;
        meta.nombre_atributo = attrData.nombre_atributo;
        meta.operador_atributo = attrData.operador;
        meta.prioridad_atributo = attrData.prioridad;
        meta.nombre_atributo_valor = valorName;
        return meta;
      }
    }
  }

  return meta;
}
