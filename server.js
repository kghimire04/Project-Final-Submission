const express = require('express');
const bodyParser = require('body-parser');
const supabaseClient = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const https = require('https');

const app = express();
const port = 3000;

dotenv.config();
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseClient.createClient(supabaseUrl, supabaseKey);

const ZENSERP_API_KEY = process.env.ZENSERP_API_KEY;

app.get('/', (req, res) => {
  res.sendFile('public/index.html', { root: __dirname });
});

// GET - fetch all recent searches from Supabase
app.get('/api/brands', async (req, res) => {
  console.log('Attempting to get all searches!');
  const { data, error } = await supabase.from('searches').select().order('created_at', { ascending: false }).limit(20);
  if (error) {
    console.log(`Error: ${error}`);
    res.statusCode = 500;
    res.send(error);
  } else {
    console.log('Received Data:', data.length);
    res.json(data);
  }
});

// POST - log a searched brand to Supabase
app.post('/api/brands', async (req, res) => {
  console.log('Logging search');
  const brandName = req.body.brand_name;
  const { data, error } = await supabase.from('searches').insert({ brand_name: brandName }).select();
  if (error) {
    console.log(`Error: ${error}`);
    res.statusCode = 500;
    res.send(error);
  } else {
    res.json(data);
  }
});

// GET - search Zenserp for brand sustainability info
app.get('/api/brand-search', (req, res) => {
  const brand = req.query.brand;
  const searchQuery = brand + ' sustainability report labor practices carbon emissions ethical sourcing';
  const url = 'https://app.zenserp.com/api/v2/search?q=' + encodeURIComponent(searchQuery) + '&num=6';

  console.log('Searching Zenserp for: ' + brand);

  const options = new URL(url);
  options.headers = { 'apikey': ZENSERP_API_KEY };

  const request = https.get(options, (response) => {
    let body = '';
    response.on('data', (chunk) => { body += chunk; });
    response.on('end', () => {
      const data = JSON.parse(body);
      const organicResults = data.organic || [];

      const cleanedResults = organicResults.slice(0, 6).map((r) => ({
        title: r.title || 'No title',
        url: r.url || '#',
        description: r.description || 'No description available.'
      }));

      const text = JSON.stringify(cleanedResults).toLowerCase();
      let sustainabilityScore = 40;
      let laborScore = 40;
      let environmentalScore = 40;

      if (text.includes('sustainability')) sustainabilityScore += 25;
      if (text.includes('ethical')) sustainabilityScore += 15;
      if (text.includes('sourcing')) sustainabilityScore += 10;
      if (text.includes('labor')) laborScore += 25;
      if (text.includes('worker')) laborScore += 15;
      if (text.includes('supplier')) laborScore += 10;
      if (text.includes('carbon')) environmentalScore += 20;
      if (text.includes('emissions')) environmentalScore += 20;
      if (text.includes('environment')) environmentalScore += 10;

      res.json({
        brand: brand,
        results: cleanedResults,
        scores: {
          sustainability_score: Math.min(sustainabilityScore, 100),
          labor_score: Math.min(laborScore, 100),
          environmental_score: Math.min(environmentalScore, 100)
        }
      });
    });
  });

  request.setTimeout(10000, () => {
    request.destroy();
    res.statusCode = 504;
    res.json({ error: 'Zenserp search timed out. Please try again.' });
  });

  request.on('error', (error) => {
    res.statusCode = 500;
    res.json({ error: error.message });
  });
});

app.listen(port, () => {
  console.log(`App is available on port: ${port}`);
});
