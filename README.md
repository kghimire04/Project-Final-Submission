# Ethical Threads

## Description
Ethical Threads is a web application that helps users research the sustainability and labor practices of fashion brands. Search any brand to see public information about sustainability reports, carbon emissions, and ethical sourcing. Every search is automatically logged and shown in a recent searches table.

## Target Browsers
Designed for desktop browsers — Chrome, Firefox, and Edge.

---

## Developer Manual

### How to Install
Requires Node.js v18 or higher.

```bash
npm install
npm start
```

Then open `http://localhost:3000` in your browser.



### API Endpoints
- `GET /api/brand-search?brand=Nike` — searches Zenserp for sustainability info about a brand
- `GET /api/brands` — returns the 20 most recent searches from Supabase
- `POST /api/brands` — logs a brand name to Supabase

### Known Bugs
- Scores are estimated from keyword matching only, not verified data
- Save data crashes server

### Future Development
- Real score calculation using certification databases
- Delete searches from the UI
- Mobile responsive layout