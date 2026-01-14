
const fetch = require('node-fetch');

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY;
const URL = 'https://api-dashboard.influencers.club/public/v1/discovery/';

async function probePagination() {
    if (!INFLUENCER_CLUB_API_KEY) return;

    // Baseline
    console.log("--- Baseline (Offset 0) ---");
    const base = await callApi({});
    const baseUser = base.first;
    console.log(`First User: ${baseUser}`);

    // Attempt 1: offset in filters
    console.log("\n--- Attempt 1: 'offset' inside filters ---");
    const t1 = await callApi({ filters: { offset: 5 } });
    console.log(`First User: ${t1.first} (Match? ${t1.first === baseUser})`);

    // Attempt 2: 'page' top level
    console.log("\n--- Attempt 2: 'page' top level (page 1) ---"); // page 0 is usually first
    const t2 = await callApi({ page: 1 });
    console.log(`First User: ${t2.first} (Match? ${t2.first === baseUser})`);

    // Attempt 3: 'from' top level
    console.log("\n--- Attempt 3: 'from' top level (from 5) ---");
    const t3 = await callApi({ from: 5 });
    console.log(`First User: ${t3.first} (Match? ${t3.first === baseUser})`);

    // Attempt 4: 'skip' top level
    console.log("\n--- Attempt 4: 'skip' top level (skip 5) ---");
    const t4 = await callApi({ skip: 5 });
    console.log(`First User: ${t4.first} (Match? ${t4.first === baseUser})`);
}

async function callApi(customBody) {
    const body = {
        platform: "instagram",
        limit: 50,
        offset: 0,
        filters: { keywords_in_bio: "travel", min_followers: 10000, max_followers: 500000 },
        ...customBody,
        ...(customBody.filters ? { filters: { ...{ keywords_in_bio: "travel", min_followers: 10000, max_followers: 500000 }, ...customBody.filters } } : {})
    };

    const res = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${INFLUENCER_CLUB_API_KEY}` },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    const list = data.accounts || data.results || data.data || [];
    const first = list.length > 0 ? (list[0].profile?.username || list[0].username) : "NONE";
    return { first, count: list.length };
}

probePagination();
