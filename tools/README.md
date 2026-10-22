# IcyMath – verktøy

| Fil | Hva den gjør | Krever |
|---|---|---|
| `test-questions.js` | Henter oppgavemotoren ut av `../mathtower.html` og lager 115 500 oppgaver. Sjekker 4 unike alternativer, ingen NaN, at negative svar ikke røper seg selv, fasit på sannsynlighetsoppgaver, at bonus er vanskeligere og at samme seed gir samme oppgaver. | Node |
| `test-e2e.js` | Spiller gjennom spillet i Chromium: balanse, bonus (+5 / fall), at Ja/Nei-popupen ikke dekker svarknappene, at bonuskortet holder seg over panelet på 5 skjermstørrelser, venneutfordring (identiske oppgaver og isblokker), Dagens utfordring, lyd av/på. Skjermbilder havner i `shots/`. | Node + `npm install` + server på port 8000 |
| `balance-sim.js` | Simulerer klatringen for svak, snitt og sterk spiller og skriver ut etasjer, tid og antall bonuser. Brukes når timer, fart eller straff skal endres. | Node |

```bash
cd tools && npm install && cd ..
python3 -m http.server 8000 --bind 127.0.0.1 &
node tools/test-questions.js && node tools/test-e2e.js
```
Miljøvariabler for `test-e2e.js`: `BASE` (URL til spillet), `CHROME` (sti til Chromium).
