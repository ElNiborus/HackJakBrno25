# Login System - FN Brno Virtual Assistant

## Přehled
Jednoduchý přihlašovací systém pro hackathon projekt FN Brno Virtual Assistant.

## Přihlašovací údaje

### Formát
- **Email**: `uzivatel@fnbrno.cz`
- **Kód**: První část emailu před @

### Příklady uživatelů

1. **Anna Konecna** (Sestřička)
   - Email: `anna@fnbrno.cz` nebo `anna.konecna@fnbrno.cz`
   - Kód: `anna` (nebo `anna.konecna`)
   - User ID: 1

2. **Marek Dvorak** (Vedoucí oddělení)
   - Email: `marek@fnbrno.cz` nebo `marek.dvorak@fnbrno.cz`
   - Kód: `marek` (nebo `marek.dvorak`)
   - User ID: 2

3. **Petr Svoboda** (Údržbář)
   - Email: `petr@fnbrno.cz` nebo `petr.svoboda@fnbrno.cz`
   - Kód: `petr` (nebo `petr.svoboda`)
   - User ID: 3

## Validace

Přihlášení validuje:
1. Email musí končit na `@fnbrno.cz`
2. Kód musí být stejný jako první část emailu (část před @)
3. Uživatel musí existovat v systému

## Technické poznámky

- Uživatelská data jsou mapována z `user_info.json` v backend složce
- Hesla/kódy jsou na frontendu kvůli hackathon projektu (v produkci by to byla bezpečnostní díra)
- Po přihlášení se zobrazí jméno a role uživatele v hlavičce
- Tlačítko "Odhlásit se" pro reset session

## Komponenty

- `LoginForm.jsx` - Přihlašovací formulář
- `LoginForm.css` - Styling pro login
- `App.jsx` - Hlavní aplikace s login state management
