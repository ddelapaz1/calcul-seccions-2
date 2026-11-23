import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface TexProps {
  /** Expressió LaTeX (sintaxi KaTeX). */
  children: string;
  /** Mode equació (display): fraccions grans i línia pròpia. */
  block?: boolean;
  className?: string;
}

/**
 * Renderitza una fórmula LaTeX amb KaTeX.
 * `\hl{...}` ressalta un resultat (classe CSS `tex-hl`).
 */
export const Tex: React.FC<TexProps> = ({ children, block = false, className }) => {
  const html = useMemo(
    () =>
      katex.renderToString(children, {
        displayMode: block,
        throwOnError: false,
        strict: false,
        trust: (ctx) => ctx.command === '\\htmlClass',
        macros: { '\\hl': '\\htmlClass{tex-hl}{#1}' },
      }),
    [children, block],
  );
  const Tag = block ? 'div' : 'span';
  return <Tag className={`tex ${block ? 'tex-block' : 'tex-inline'} ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: html }} />;
};

/** Número amb coma decimal per a LaTeX (`{,}` evita l'espai després de la coma). */
export const tn = (n: number, dec = 2): string => n.toFixed(dec).replace('.', '{,}');

/** Secció normalitzada (1.5 → 1{,}5). */
export const ts = (s: number): string => s.toString().replace('.', '{,}');
