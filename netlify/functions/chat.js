exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GEMINI_API_KEY belum dikonfigurasi di Netlify Environment Variables.' })
    };
  }

  try {
    const { messages, deepthink } = JSON.parse(event.body || '{}');

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Pesan tidak boleh kosong.' })
      };
    }

    // Transform message format to Gemini contents schema
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Choose model version
    const modelName = 'gemini-1.5-flash';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    let systemInstruction = "Anda adalah ASTRA AI, asisten virtual yang sangat cerdas, responsif, dan membantu.";
    if (deepthink) {
      systemInstruction += " Berikan jawaban yang mendalam, logis, terstruktur, dan dianalisis secara komprehensif.";
    }

    const payload = {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: contents
    };

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error('Gemini API Error:', data);
      return {
        statusCode: apiResponse.status,
        body: JSON.stringify({ error: data.error?.message || 'Gagal memproses ke Gemini API' })
      };
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, tidak ada respon dari model.";

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    };

  } catch (err) {
    console.error('Serverless Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error: ' + err.message })
    };
  }
};
    
