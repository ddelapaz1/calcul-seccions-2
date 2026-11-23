# ITC-BT-19 — Instalaciones interiores o receptoras. Prescripciones generales

Referència normativa del **Reglament Electrotècnic per a Baixa Tensió (REBT — Reial decret 842/2002, de 2 d'agost)** i la seva **Guia Tècnica d'Aplicació** del Ministeri d'Indústria i Turisme.

## Fitxers oficials descarregats en aquesta carpeta

| Fitxer | Descripció | Font oficial |
| :--- | :--- | :--- |
| [guia_bt_19_feb09R2.pdf](./guia_bt_19_feb09R2.pdf) | **GUÍA-BT-19** (Edició feb 09, Revisió 2): text reglamentari complet de la ITC-BT-19 + guia tècnica d'aplicació i taules (Taula 1, Taules A–I, Taula 2, Taula 3). | [Ministeri d'Indústria i Turisme](https://industria.gob.es/Calidad-Industrial/seguridadindustrial/instalacionesindustriales/baja-tension/Documents/bt/guia_bt_19_feb09R2.pdf) |
| [guia_bt_anexo_2_feb26R2.pdf](./guia_bt_anexo_2_feb26R2.pdf) | **GUÍA-BT-ANEXO 2** (Edició febrer 2026, Revisió 2): *Cálculo de las caídas de tensión*. Annex referenciat per la GUÍA-BT-19 amb fórmules, conductivitats, resistivitats, taules de caigudes de tensió unitàries i exemples resolts. | [Ministeri d'Indústria i Turisme](https://industria.gob.es/Calidad-Industrial/seguridadindustrial/instalacionesindustriales/baja-tension/Documents/bt/guia_bt_anexo_2_sep03R1.pdf) |
| [itc_bt_19_boe.xml](./itc_bt_19_boe.xml) | Text legal consolidat vigent de la **ITC-BT-19** (BOE-A-2002-18099, bloc `ib-19`). | [BOE Dades Obertes](https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/BOE-A-2002-18099/texto/bloque/ib-19) |
| [itc_bt_19_tabla1_boe.png](./itc_bt_19_tabla1_boe.png) | Imatge oficial d'alta resolució de la **Tabla 1** publicada al BOE. | [BOE](https://www.boe.es/datos/imagenes/disp/2002/224/18099_image32.png) |

> **Nota normativa:** El text de la ITC-BT-19 remet originalment a la norma `UNE 20460-5-523`, substituïda posteriorment en les actualitzacions de la ITC-BT-02 per la sèrie `UNE-HD 60364-5-52`.

---

## 1. Camp d'aplicació

Les prescripcions de la ITC-BT-19 s'estenen a les instal·lacions interiors o receptores dins del camp d'aplicació de l'article 2 i dins dels marges de tensió de l'article 4 del REBT. No inclou les xarxes de distribució d'energia elèctrica.

---

## 2. Prescripcions de caràcter general

### 2.1 Regla general
La determinació de les característiques de la instal·lació s'efectuarà d'acord amb la norma UNE 20460-3 (utilització prevista, estructura i esquema de distribució, influències externes, compatibilitat i facilitat de manteniment).

### 2.2 Conductors actius

#### 2.2.1 Naturalesa dels conductors
- Els conductors i cables seran de **coure** o **alumini**, i sempre aïllats (llevat del muntatge sobre aïlladors previst a la ITC-BT-20).
- En habitatges i instal·lacions similars (oficines, locals comercials, etc.), els conductors han de ser de coure (ITC-BT-26).

#### 2.2.2 Secció dels conductors i caigudes de tensió màximes admissibles
La secció s'ha de determinar de manera que la caiguda de tensió entre l'origen de la instal·lació interior i qualsevol punt d'utilització (amb tots els receptors susceptibles de funcionar simultàniament) sigui inferior a:

| Tipus d'instal·lació / tram | Caiguda de tensió màxima (%) | Trifàsica 400 V (`e`) | Monofàsica 230 V (`e`) |
| :--- | :---: | :---: | :---: |
| **LGA** — Comptadors totalment concentrats (ITC-BT-14) | 0,5 % | 2,0 V | — |
| **LGA** — Centralitzacions parcials de comptadors (ITC-BT-14) | 1,0 % | 4,0 V | — |
| **DI** — Subministrament a un únic usuari (ITC-BT-15) | 1,5 % | 6,0 V | 3,45 V |
| **DI** — Comptadors totalment concentrats (ITC-BT-15) | 1,0 % | 4,0 V | 2,30 V |
| **DI** — Centralitzacions parcials de comptadors (ITC-BT-15) | 0,5 % | 2,0 V | 1,15 V |
| **Interior habitatges** (qualsevol circuit) | **3,0 %** | 12,0 V | 6,90 V |
| **Altres instal·lacions interiors — Enllumenat** | **3,0 %** | 12,0 V | 6,90 V |
| **Altres instal·lacions interiors — Altres usos (força)** | **5,0 %** | 20,0 V | 11,50 V |
| **Industrial amb transformador propi d'AT — Enllumenat** | **4,5 %** | 18,0 V | 10,35 V |
| **Industrial amb transformador propi d'AT — Altres usos** | **6,5 %** | 26,0 V | 14,95 V |

- **Compensació:** La caiguda de tensió es pot compensar en tots dos sentits entre la instal·lació interior i la derivació individual (DI), sempre que la suma total sigui inferior a la suma dels límits corresponents a l'esquema utilitzat.
- **Conductor neutre:** En instal·lacions interiors, llevat de justificació per càlcul (harmònics i desequilibris), la secció del neutre serà com a mínim igual a la de les fases.

##### Fórmules de càlcul de secció per caiguda de tensió (GUÍA-BT-ANEXO 2)
- **Mètode simplificat (seccions ≤ 120 mm², efecte pell/proximitat i reactància negligibles):**
  - Trifàsic: `S = (P · L) / (γ · e · U)`
  - Monofàsic: `S = (2 · P · L) / (γ · e · U)`
- **Mètode detallat amb reactància i factor `c ≈ 1,02`:**
  - Trifàsic: `ΔU_III = (R + X · tan φ) · (P / U_1)` ; amb `R = c · ρ_θ · L / S`
  - Monofàsic: `ΔU_I = 2 · (R + X · tan φ) · (P / U_1)`
- **Temperatura real estimada en servei:**
  - `T = T_0 + (T_màx - T_0) · (I / I_màx)^2` (on `T_0 = 40 °C` a l'aire, `25 °C` enterrat; `T_màx = 70 °C` PVC/Z1, `90 °C` XLPE/EPR).

**Resistivitat (`ρ`), conductivitat (`γ`) i coeficient de temperatura (`α`) (GUÍA-BT-ANEXO 2, Taules 2 i 3):**

| Material | ρ₂₀ (Ω·mm²/m) | ρ₇₀ (Ω·mm²/m) | ρ₉₀ (Ω·mm²/m) | γ₂₀ (m/Ω·mm²) | γ₇₀ (m/Ω·mm²) | γ₉₀ (m/Ω·mm²) | α (°C⁻¹) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Coure** | 0,018 | 0,021 | 0,023 | 56 | 48 | 44 | 0,00392 |
| **Alumini** | 0,029 | 0,033 | 0,036 | 35 | 30 | 28 | 0,00403 |
| **Almelec (Al-Mg-Si)** | 0,032 | 0,038 | 0,041 | — | — | — | 0,00360 |

---

#### 2.2.3 Intensitats màximes admissibles

##### Tabla 1 (ITC-BT-19 oficial del BOE) — Intensitats admissibles (A) per a coure a l'aire a 40 °C

**Correspondència de columnes (1 a 11) segons mètode d'instal·lació, nombre de conductors carregats i aïllament:**

| Mètode | Descripció | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **A** | Conductors aïllats en tubs encastats en parets aïllants | | 3x PVC | 2x PVC | | 3x XLPE/EPR | 2x XLPE/EPR | | | | | |
| **A2** | Cables multiconductors en tubs encastats en parets aïllants | 3x PVC | 2x PVC | | 3x XLPE/EPR | 2x XLPE/EPR | | | | | | |
| **B** | Conductors aïllats en tubs² en muntatge superficial o encastats en obra | | | | 3x PVC | 2x PVC | | | 3x XLPE/EPR | 2x XLPE/EPR | | |
| **B2** | Cables multiconductors en tubs² en muntatge superficial o encastats en obra | | | 3x PVC | 2x PVC | | 3x XLPE/EPR | | 2x XLPE/EPR | | | |
| **C** | Cables multiconductors directament sobre la paret³ | | | | | 3x PVC | 2x PVC | | 3x XLPE/EPR | 2x XLPE/EPR | | |
| **E** | Cables multiconductors a l'aire lliure⁴ (distància a paret ≥ 0,3 D⁵) | | | | | | 3x PVC | | 2x PVC | 3x XLPE/EPR | 2x XLPE/EPR | |
| **F** | Cables unipolars en contacte mutu⁴ (distància a paret ≥ D⁵) | | | | | | | 3x PVC | | | 3x XLPE/EPR¹ | |
| **G** | Cables unipolars separats mínim D⁵ | | | | | | | | | 3x PVC¹ | | 3x XLPE/EPR |

**Valors d'intensitat màxima admissible (A) — Coure, 40 °C a l'aire:**

| Secció (mm²) | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1,5 | 11 | 11,5 | 13 | 13,5 | 15 | 16 | — | 18 | 21 | 24 | — |
| 2,5 | 15 | 16 | 17,5 | 18,5 | 21 | 22 | — | 25 | 29 | 33 | — |
| 4 | 20 | 21 | 23 | 24 | 27 | 30 | — | 34 | 38 | 45 | — |
| 6 | 25 | 27 | 30 | 32 | 36 | 37 | — | 44 | 49 | 57 | — |
| 10 | 34 | 37 | 40 | 44 | 50 | 52 | — | 60 | 68 | 76 | — |
| 16 | 45 | 49 | 54 | 59 | 66 | 70 | — | 80 | 91 | 105 | — |
| 25 | 59 | 64 | 70 | 77 | 84 | 88 | 96 | 106 | 116 | 123 | 166 |
| 35 | — | 77 | 86 | 96 | 104 | 110 | 119 | 131 | 144 | 154 | 206 |
| 50 | — | 94 | 103 | 117 | 125 | 133 | 145 | 159 | 175 | 188 | 250 |
| 70 | — | — | — | 149 | 160 | 171 | 188 | 202 | 224 | 244 | 321 |
| 95 | — | — | — | 180 | 194 | 207 | 230 | 245 | 271 | 296 | 391 |
| 120 | — | — | — | 208 | 225 | 240 | 267 | 284 | 314 | 348 | 455 |
| 150 | — | — | — | 236 | 260 | 278 | 310 | 338 | 363 | 404 | 525 |
| 185 | — | — | — | 268 | 297 | 317 | 354 | 386 | 415 | 464 | 601 |
| 240 | — | — | — | 315 | 350 | 374 | 419 | 455 | 490 | 552 | 711 |
| 300 | — | — | — | 360 | 404 | 423 | 484 | 524 | 565 | 640 | 821 |

*Notes de la Tabla 1:* 1) A partir de 25 mm² de secció. 2) Incloent canals per a instal·lacions (canaletes) i conductes de secció no circular. 3) O en safata no perforada. 4) O en safata perforada. 5) `D` és el diàmetre del cable.

---

##### Tabla A (GUÍA-BT-19, basada en UNE 20460-5-523:2004, Taula A.52-1bis) — Coure, no enterrats, 40 °C a l'aire

**Correspondència de columnes (2 a 13):**

| Mètode | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **A1** | | 3x PVC | 2x PVC | | 3x XLPE | 2x XLPE | | | | | | |
| **A2** | 3x PVC | 2x PVC | | 3x XLPE | 2x XLPE | | | | | | | |
| **B1** | | | | 3x PVC | 2x PVC | | 3x XLPE | | 2x XLPE | | | |
| **B2** | | | 3x PVC | 2x PVC | | 3x XLPE | 2x XLPE | | | | | |
| **C** | | | | | 3x PVC | | 2x PVC | 3x XLPE | | 2x XLPE | | |
| **E** | | | | | | 3x PVC | | 2x PVC | 3x XLPE | | 2x XLPE | |
| **F** | | | | | | | 3x PVC | | 2x PVC | 3x XLPE | | 2x XLPE |

**Valors d'intensitat màxima admissible (A) — Coure, no enterrats, 40 °C:**

| Secció (mm²) | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1,5 | 11 | 11,5 | 13 | 13,5 | 15 | 16 | 16,5 | 19 | 20 | 21 | 24 | — |
| 2,5 | 15 | 16 | 17,5 | 18,5 | 21 | 22 | 23 | 26 | 26,5 | 29 | 33 | — |
| 4 | 20 | 21 | 23 | 24 | 27 | 30 | 31 | 34 | 36 | 38 | 45 | — |
| 6 | 25 | 27 | 30 | 32 | 36 | 37 | 40 | 44 | 46 | 49 | 57 | — |
| 10 | 34 | 37 | 40 | 44 | 50 | 52 | 54 | 60 | 65 | 68 | 76 | — |
| 16 | 45 | 49 | 54 | 59 | 66 | 70 | 73 | 81 | 87 | 91 | 105 | — |
| 25 | 59 | 64 | 70 | 77 | 84 | 88 | 95 | 103 | 110 | 116 | 123 | 140 |
| 35 | — | 77 | 86 | 96 | 104 | 110 | 119 | 127 | 137 | 144 | 154 | 174 |
| 50 | — | 94 | 103 | 117 | 125 | 133 | 145 | 155 | 167 | 175 | 188 | 210 |
| 70 | — | — | — | 149 | 160 | 171 | 185 | 199 | 214 | 224 | 244 | 269 |
| 95 | — | — | — | 180 | 194 | 207 | 224 | 241 | 259 | 271 | 296 | 327 |
| 120 | — | — | — | 208 | 225 | 240 | 260 | 280 | 301 | 314 | 348 | 380 |
| 150 | — | — | — | 236 | 260 | 278 | 299 | 322 | 343 | 363 | 404 | 438 |
| 185 | — | — | — | 268 | 297 | 317 | 341 | 368 | 391 | 415 | 464 | 500 |
| 240 | — | — | — | 315 | 350 | 374 | 401 | 435 | 468 | 490 | 552 | 590 |
| 300 | — | — | — | 361 | 401 | 430 | 461 | 500 | 538 | 563 | 638 | 678 |
| 400 | — | — | — | 431 | 480 | 515 | 552 | 699* | 645 | 674 | 770 | 812 |
| 500 | — | — | — | 493 | 551 | 592 | 633 | 687 | 741 | 774 | 889 | 931 |
| 630 | — | — | — | 565 | 632 | 681 | 728 | 790 | 853 | 890 | 1028 | 1071 |

*Notes de la Tabla A:*
- `3x` = circuits trifàsics, `2x` = monofàsics. Els cables amb aïllament termoplàstic de poliolefina (`Z1`) són equivalents als de `PVC (V)`.
- `*` A la fila de `400 mm²`, columna `9`, el PDF oficial de la GUÍA-BT-19 Rev. 2 imprimeix `699` (probable errata d'impremta per `599` a l'original ministerial).
- La descripció detallada dels mètodes d'instal·lació `A1`, `A2`, `B1`, `B2`, `C`, `E` i `F` es troba a la **Tabla B** (pàgina 10 de [guia_bt_19_feb09R2.pdf](./guia_bt_19_feb09R2.pdf)).

---

##### Tabla D (GUÍA-BT-19) — Intensitat admissible (A) per a cables soterrats sota tub (0,6/1 kV)
*Condicions de càlcul: resistivitat tèrmica del terreny 1,5 K·m/W, temperatura del terreny 25 °C, profunditat 70 cm.*

| Secció (mm²) | 3 XLPE Coure | 3 XLPE Alumini | 2 XLPE Coure | 2 XLPE Alumini |
| :---: | :---: | :---: | :---: | :---: |
| 1,5 | 23 | — | 27 | — |
| 2,5 | 30 | 23 | 36 | 27 |
| 4 | 39 | 30 | 46 | 36 |
| 6 | 48 | 37 | 58 | 44 |
| 10 | 64 | 49 | 77 | 58 |
| 16 | 82 | 62 | 100 | 77 |
| 25 | 105 | 82 | 130 | 98 |
| 35 | 130 | 98 | 155 | 120 |
| 50 | 155 | 115 | 183 | 139 |
| 70 | 190 | 145 | 225 | 170 |
| 95 | 225 | 175 | 265 | 205 |
| 120 | 260 | 200 | 305 | 230 |
| 150 | 300 | 230 | 340 | 265 |
| 185 | 335 | 260 | 385 | 295 |
| 240 | 400 | 305 | 440 | 340 |
| 300 | 455 | 350 | 500 | 385 |
| 400 | 530 | 405 | 570 | 445 |
| 500 | 610 | 465 | 660 | 510 |
| 630 | 710 | 530 | 735 | 575 |

---

##### Factores de reducció per agrupació de circuits (GUÍA-BT-19, Taules E, F, G, H, I)
*(No s'apliquen si el tram paral·lel és inferior a 2 m).*

**Tabla E — Agrupament de circuits/cables contigus (UNE 20460-5-523:2004, Tabla A.52-3):**

| Ref. | Disposició de cables contigus | 1 | 2 | 3 | 4 | 6 | 9 | 12 | 16 | 20 |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | Encastats o embutits | 1,00 | 0,80 | 0,70 | 0,70 | 0,55 | 0,50 | 0,45 | 0,40 | 0,40 |
| 2 | Capa única sobre paret, terra o superfície sense perforar | 1,00 | 0,85 | 0,80 | 0,75 | 0,70 | 0,70 | 0,70 | 0,70 | 0,70 |
| 3 | Capa única fixada sota sostre | 0,95 | 0,80 | 0,70 | 0,70 | 0,65 | 0,60 | 0,60 | 0,60 | 0,60 |
| 4 | Capa única en safata perforada vertical o horitzontal | 1,00 | 0,90 | 0,80 | 0,75 | 0,75 | 0,70 | 0,70 | 0,70 | 0,70 |
| 5 | Capa única sobre safata d'escala o abraçadores | 1,00 | 0,85 | 0,80 | 0,80 | 0,80 | 0,80 | 0,80 | 0,80 | 0,80 |

*(Ref. 2 a 5: sense reducció addicional per a més de 9 circuits o cables multiconductors).*

**Tabla F — Factor de reducció addicional per a cables en diverses capes:**

| N.º de capes | 2 | 3 | 4 o 5 | 6 a 8 | 9 o més |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Factor** | 0,80 | 0,73 | 0,70 | 0,68 | 0,66 |

**Tabla G — Cables dins de tubs en contacte en posició horitzontal, a l'aire (una o diverses capes):**

| Capes en vertical \ Tubs en horitzontal | 1 | 2 | 3 | 4 | 5 | 6 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | 1,00 | 0,94 | 0,91 | 0,88 | 0,87 | 0,86 |
| **2** | 0,92 | 0,87 | 0,84 | 0,81 | 0,80 | 0,79 |
| **3** | 0,85 | 0,81 | 0,78 | 0,76 | 0,75 | 0,74 |
| **4** | 0,82 | 0,78 | 0,74 | 0,73 | 0,72 | 0,72 |
| **5** | 0,80 | 0,76 | 0,72 | 0,71 | 0,70 | 0,70 |
| **6** | 0,79 | 0,75 | 0,71 | 0,70 | 0,69 | 0,68 |

**Tabla H — Cables multiconductors en tubs enterrats, un cable per tub (UNE 20460-5-523:2004, Tabla 52 E3 A):**

| N.º de cables | Nul·la (en contacte) | 0,25 m | 0,50 m | 1,0 m |
| :---: | :---: | :---: | :---: | :---: |
| **2** | 0,85 | 0,90 | 0,95 | 0,95 |
| **3** | 0,75 | 0,85 | 0,90 | 0,95 |
| **4** | 0,70 | 0,80 | 0,85 | 0,90 |
| **5** | 0,65 | 0,80 | 0,85 | 0,90 |
| **6** | 0,60 | 0,80 | 0,80 | 0,90 |

**Tabla I — Cables dins de tubs en contacte, enterrats o embeguts en formigó (diverses capes):**

| Capes en vertical \ Tubs en horitzontal | 1 | 2 | 3 | 4 | 5 | 6 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **2** | 0,87 | 0,71 | 0,62 | 0,57 | 0,53 | 0,50 |
| **3** | 0,77 | 0,62 | 0,53 | 0,48 | 0,45 | 0,42 |
| **4** | 0,72 | 0,57 | 0,48 | 0,44 | 0,40 | 0,38 |
| **5** | 0,68 | 0,53 | 0,45 | 0,40 | 0,37 | 0,35 |
| **6** | 0,65 | 0,50 | 0,42 | 0,38 | 0,35 | 0,32 |

---

#### 2.2.4 Identificació de conductors
- **Neutre** (o fase amb previsió de passar a neutre): **blau clar**.
- **Protecció (PE):** **verd-groc**.
- **Fases:** **marró**, **negre** i **gris** (en trifàsica cal distingir les tres fases; en monofàsica, marró o negre).

---

### 2.3 Conductors de protección (Tabla 2)

| Secció dels conductors de fase `S` (mm²) | Secció mínima del conductor de protecció (mm²) |
| :---: | :---: |
| `S ≤ 16` | `S` (*) |
| `16 < S ≤ 35` | `16` |
| `S > 35` | `S / 2` |

`(*)` Amb un mínim de:
- **2,5 mm²** si els conductors de protecció no formen part de la canalització d'alimentació i tenen protecció mecànica.
- **4 mm²** si no formen part de la canalització d'alimentació i no tenen protecció mecànica.

---

### 2.4 – 2.11 Altres prescripcions generals de la ITC-BT-19
- **2.4 Subdivisió de les instal·lacions:** Divisió en circuits coordinats i selectius per limitar fallades i facilitar verificacions i manteniment.
- **2.5 Equilibrat de càrregues:** Repartiment equilibrat entre fases o conductors polars.
- **2.6 Separació de l'alimentació:** Dispositius de desconnexió omnipolar (excepte neutre en xarxes TN-C): fusibles, seccionadors, interruptors (separació > 3 mm; 4 mm segons EN 60669-2-4), borns de connexió en derivacions.
- **2.7 Connexió i desconnexió en càrrega:** En una sola maniobra; tall omnipolar obligatori a quadres generals i secundaris, circuits (excepte TN-C i casos TN-S), receptors > 1.000 W, làmpades de descàrrega/autotransformadors i tubs de descàrrega d'AT.
- **2.8 Protecció contra contactes directes o indirectes:** Segons ITC-BT-24 i UNE 20460-4-41 / 4-47.
- **2.9 Resistència d'aïllament i rigidesa dielèctrica (Tabla 3):**
  - MBTS / MBTP: assaig a `250 V CC`, resistència `≥ 0,25 MΩ`
  - `≤ 500 V` (excepte anterior): assaig a `500 V CC`, resistència `≥ 0,5 MΩ`
  - `> 500 V`: assaig a `1000 V CC`, resistència `≥ 1,0 MΩ`
  - Rigidesa dielèctrica: `2U + 1000 V` (mínim `1.500 V`) a freqüència industrial durant 1 minut.
- **2.10 Bases de presa de corrent:** Figures C2a, C3a, ESB 25-5a (i ESB 32a segons UNE 20315:2004) i UNE-EN 60309 fora d'habitatges.
- **2.11 Connexions:** Prohibida la unió per simple retorçament; sempre amb borns, regletes o brides dins de caixes d'empalmament/derivació (o canals IP4X amb tapa d'obertura amb eina). Per a conductors cablejats de secció `> 6 mm²` amb cargol i volandera, ús obligatori de terminals engastats.
