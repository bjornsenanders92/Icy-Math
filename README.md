# IcyMath 🐧

Mattespill der du klatrer på isblokker over iskaldt vann. Riktig svar = ett hopp opp, feil eller for sent = vannet tar deg igjen.

**Spill:** https://bjornsenanders92.github.io/Icy-Math/

Hele spillet er én fil: [`mathtower.html`](mathtower.html) (ingen byggesteg). `index.html` videresender dit og tar med utfordringslenker.

## Slik fungerer det
- **Tre nivåer** (Lett / Middels / Vanskelig) med oppgaver i 7 kategorier. Alle oppgavene lages på nytt med tilfeldige tall, så du kan ikke pugge svarene.
- **Lynrask:** svarer du innen 2,5 / 3 / 4 s, får du ×1,5 poeng og hopper 2 etasjer.
- **Bonusutfordring** (ca. 1 av 10 spørsmål): en av nivåets tøffeste oppgaver. Ja = +5 etasjer hvis riktig, ~2 etasjers fall hvis feil. Tiden går hele tiden. Svarer du på hovedspørsmålet i stedet, er det et «nei».
- **Combo** ×1,5–×4, **Frys tid** (tjenes hver 5. streak), XP og nivåer, 14 merker.
- **Dagens utfordring:** samme oppgaver for alle i dag, med dagsrekord og rekke av dager.
- **Utfordre en venn:** del en lenke, så får vennen nøyaktig de samme oppgavene og isblokkene.

Taster: `1–4` svar · `J`/`N` bonus · `F` frys · `M` lyd av/på.

## Versjoner
| Tag | Innhold |
|---|---|
| `v2.0` | Oppgaver som genereres, bonusutfordring, XP/merker, ny grafikk |
| `v2.1` | Balanse fra simulator, tøffere bonus, Dagens utfordring, Utfordre venn |
| `v2.2` | Ingenting dekker lenger svaralternativene; spillflaten måles riktig på mobil; tester ligger i repoet |

Gå tilbake til en versjon: `git checkout v2.1 -- mathtower.html`

## Tester og balansering
Se [`tools/README.md`](tools/README.md). Kort:
```bash
node tools/test-questions.js        # 115 500 oppgaver: gyldige, unike svar, riktig fasit, deterministisk
cd tools && npm install && cd ..    # én gang (playwright-core)
python3 -m http.server 8000 &       # server repoet
node tools/test-e2e.js              # nettlesertest, inkl. at ingenting dekker svarknappene på 5 skjermstørrelser
node tools/balance-sim.js '<json>'  # simuler 3 spillertyper × 3000 spill
```
