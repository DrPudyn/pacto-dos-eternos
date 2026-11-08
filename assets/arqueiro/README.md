# Sprites do arqueiro

Folhas finais (`archer-idle.png`, `archer-walk.png`, `archer-attack.png`) já estão normalizadas no repositório:

- corpo ~15px de altura na célula 32×32
- pés alinhados em **y=19**
- centro horizontal ~**x=16**
- tecidos base `(54,39,136)`, `(86,83,187)`, `(123,146,213)` para recoloração

`preparar-offline.cjs` apenas copia estes PNGs para os nomes hasheados em `minihero-offline/build/`.

Originais anteriores (antes do novo visual): `original/`.

Para reescalar a partir de arte bruta (opcional, fora do build), use Python+Pillow localmente; o fluxo de build **não** depende disso.
