import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get('term') || '';
  const city = searchParams.get('city') || '';
  const state = searchParams.get('state') || '';
  const taxonomyCode = searchParams.get('taxonomy_code') || '';

  const apiParams = new URLSearchParams({
    version: '2.1',
    limit: '20',
  });

  if (taxonomyCode) {
    apiParams.set('taxonomy_description', taxonomyCode);
  } else if (term) {
    apiParams.set('first_name', term);
    // Alternatively pass as primary search term
  }

  if (city) apiParams.set('city', city);
  if (state) apiParams.set('state', state);

  // If no specific term provided but searching generally, fallback to basic search
  let apiUrl = `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=20`;
  
  if (taxonomyCode) {
    apiUrl += `&taxonomy_description=${encodeURIComponent(taxonomyCode)}`;
  } else if (term) {
    apiUrl += `&search_term=${encodeURIComponent(term)}`;
  }

  if (city) apiUrl += `&city=${encodeURIComponent(city)}`;
  if (state) apiUrl += `&state=${encodeURIComponent(state)}`;

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch NPI data' }, { status: 500 });
  }
}