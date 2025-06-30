import { NextRequest } from 'next/server';
import { Parser } from 'json2csv';

// Flatten object recursively
function flatten(obj: any, prefix = '', res: any = {}) {
  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(value)) {
      if (value.every(v => v && typeof v === 'object' && 'name' in v && 'value' in v)) {
        // Special case: Array of objects with "name" and "value" keys (e.g., stats[])
        value.forEach(v => {
          res[`${newKey}.${v.name}`] = v.value;
        });
      } else {
        res[newKey] = JSON.stringify(value);
      }
    } else if (typeof value === 'object' && value !== null) {
      flatten(value, newKey, res);
    } else {
      res[newKey] = value;
    }
  }
  return res;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  const cacheBuster = searchParams.get('cacheBuster');
  console.log(`Cache Buster: ${cacheBuster}`);
  
  if (!url) {
    return new Response(JSON.stringify({ error: 'Missing ?url=' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const response = await fetch(url);
    const data = await response.json();

    let rows: any[] = [];

    if (Array.isArray(data)) {
      rows = data.map(item => flatten(item));
    } else if (typeof data === 'object') {
      const arrayKey = Object.keys(data).find(k => Array.isArray(data[k]));
      if (arrayKey) {
        rows = data[arrayKey].map((item: any) => flatten(item));
      } else {
        rows = [flatten(data)];
      }
    } else {
      return new Response('Unsupported JSON format', { status: 400 });
    }

    const parser = new Parser();
    const csv = parser.parse(rows);

    return new Response(csv, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Fetch or parse failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}