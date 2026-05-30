export type ResultadoBusqueda<T> = {
  indice: number;
  elemento?: T;
  encontrado: boolean;
};

export type DireccionOrden = "asc" | "desc";

export function filtrarElementos<T>(
  elementos: T[],
  predicado: (elemento: T) => boolean,
): T[] {
  if (elementos.length === 0) {
    return [];
  }

  return elementos.filter(predicado);
}

export function ordenarElementos<T>(
  elementos: T[],
  comparador: (a: T, b: T) => number,
  direccion: DireccionOrden = "asc",
): T[] {
  if (elementos.length <= 1) {
    return [...elementos];
  }

  const multiplicador = direccion === "asc" ? 1 : -1;
  return [...elementos].sort((a, b) => comparador(a, b) * multiplicador);
}

export function busquedaLineal<T>(
  elementos: T[],
  predicado: (elemento: T) => boolean,
): ResultadoBusqueda<T> {
  for (let indice = 0; indice < elementos.length; indice += 1) {
    const elemento = elementos[indice];
    if (predicado(elemento)) {
      return { indice, elemento, encontrado: true };
    }
  }

  return { indice: -1, encontrado: false };
}

export function busquedaBinariaPor<T>(
  elementosOrdenados: T[],
  objetivo: number,
  selectorValor: (elemento: T) => number,
): ResultadoBusqueda<T> {
  if (elementosOrdenados.length === 0) {
    return { indice: -1, encontrado: false };
  }

  let izquierda = 0;
  let derecha = elementosOrdenados.length - 1;

  while (izquierda <= derecha) {
    const medio = Math.floor((izquierda + derecha) / 2);
    const valorActual = selectorValor(elementosOrdenados[medio]);

    if (valorActual === objetivo) {
      return {
        indice: medio,
        elemento: elementosOrdenados[medio],
        encontrado: true,
      };
    }

    if (valorActual < objetivo) {
      izquierda = medio + 1;
    } else {
      derecha = medio - 1;
    }
  }

  return { indice: -1, encontrado: false };
}

export function agruparPor<T, K extends PropertyKey>(
  elementos: T[],
  selectorClave: (elemento: T) => K,
): Map<K, T[]> {
  const grupos = new Map<K, T[]>();

  for (const elemento of elementos) {
    const clave = selectorClave(elemento);
    const grupo = grupos.get(clave);

    if (grupo) {
      grupo.push(elemento);
      continue;
    }

    grupos.set(clave, [elemento]);
  }

  return grupos;
}