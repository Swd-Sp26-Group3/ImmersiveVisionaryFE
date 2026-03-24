async function testUpload() {
    const payload = {
        FileFormat: "OBJ",
        FileUrl: "test.obj",
        Base64Data: "data:;base64,dGVzdA==", // "test" in base64
        PolyCount: 0,
        TextureSize: "Unknown"
    };

    try {
        const res = await fetch("http://localhost:5000/api/asset-versions/1", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Body:", text);
    } catch (err) {
        console.error("Fetch failed:", err);
    }
}

testUpload();
