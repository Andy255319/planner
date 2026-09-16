export default async function handler(req, res) {
    const API_KEY = process.env.FIREBASE_API_KEY; 
    const PROJECT_ID = "aleph-planner-e9cb7";
    const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { action, collection, id, data } = req.body;

    const jsonToFirestore = (obj) => {
        const fields = {};
        for (const key in obj) {
            if (typeof obj[key] === 'string') fields[key] = { stringValue: obj[key] };
            else if (typeof obj[key] === 'number') fields[key] = { doubleValue: obj[key] };
            else if (typeof obj[key] === 'boolean') fields[key] = { booleanValue: obj[key] };
        }
        return { fields };
    };

    const firestoreToJson = (doc) => {
        if (!doc.fields) return {};
        const obj = { id: doc.name.split('/').pop() };
        for (const key in doc.fields) {
            if (doc.fields[key].stringValue !== undefined) obj[key] = doc.fields[key].stringValue;
            else if (doc.fields[key].integerValue !== undefined) obj[key] = parseInt(doc.fields[key].integerValue);
            else if (doc.fields[key].doubleValue !== undefined) obj[key] = parseFloat(doc.fields[key].doubleValue);
            else if (doc.fields[key].booleanValue !== undefined) obj[key] = doc.fields[key].booleanValue;
        }
        return obj;
    };

    try {
        let url, options = { headers: { 'Content-Type': 'application/json' } };
        
        if (action === 'GET_ALL') {
            url = `${BASE_URL}/${collection}?key=${API_KEY}`;
            const response = await fetch(url);
            const result = await response.json();
            const docs = (result.documents || []).map(firestoreToJson);
            return res.status(200).json(docs);
        } else if (action === 'ADD') {
            url = `${BASE_URL}/${collection}?key=${API_KEY}`;
            options.method = 'POST';
            options.body = JSON.stringify(jsonToFirestore(data));
            const response = await fetch(url, options);
            return res.status(200).json(firestoreToJson(await response.json()));
        } else if (action === 'UPDATE') {
            url = `${BASE_URL}/${collection}/${id}?key=${API_KEY}`;
            options.method = 'PATCH';
            options.body = JSON.stringify(jsonToFirestore(data));
            const response = await fetch(url, options);
            return res.status(200).json(firestoreToJson(await response.json()));
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
