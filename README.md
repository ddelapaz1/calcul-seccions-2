<img src="assets/icon.svg" width="64" height="64" alt="">

# ITC-BT-19 · Càlcul de Seccions de Conductors (REBT)

Aplicació web didàctica basada en la documentació oficial del **REBT (RD 842/2002)**: **ITC-BT-19**, **GUÍA-BT-19** i **GUÍA-BT-ANEXO 2** (descarregats a [`docs/`](./docs/)).

## Funcionalitats

1. **Procediment i Taules:** Explicació pas a pas del càlcul de seccions (criteris d'escalfament, caiguda de tensió i curtcircuit, Coure vs Alumini, aïllaments PVC/Z1 i XLPE/EPR, identificació de colors i taules interactives oficials).
2. **Calculadora Pas a Pas:** Selecció de totes les condicions de la instal·lació amb resolució didàctica detallada, fórmules substituïdes, consulta ressaltada a taula, 2a iteració a temperatura real i càlcul del conductor de protecció (PE).
3. **Generador d'Exercicis Aleatoris:** Exercicis autocorregibles amb paràmetres aleatoris (incloent Coure i Alumini, diversos mètodes i nivells de dificultat), comprovació instantània de càlculs i cable normalitzat, pistes i taules consultables.
4. **Visor 3D d'Instal·lacions:** Models 3D interactius amb Three.js de tots els mètodes de la ITC-BT-19 (`A1`, `A2`, `B1`, `B2`, `C`, `E`, `F`, `G` i `D` soterrat) amb vista de tall/transparència, canvi de sistema (2x/3x), material (Cu/Al) i comparativa de dissipació tèrmica.

## Posada en marxa

```bash
npm install
npm run dev
```

Tests unitaris i compilació:

```bash
npm test
npm run build
```
