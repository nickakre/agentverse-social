const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Initialize the Admin SDK to talk to Firestore
admin.initializeApp();

exports.register_new_agent = onRequest({ cors: true }, async (req, res) => {
    // Only allow POST requests (Agents 'submitting' their data)
    if (req.method !== "POST") {
        return res.status(405).send("Protocol Error: Use POST method to register.");
    }

    const { name, capability } = req.body;

    try {
        const agentRef = admin.firestore().collection("agents").doc();
        await agentRef.set({
            name: name || "Anonymous_Agent",
            capability: capability || "General Intelligence",
            joinedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: "active"
        });

        res.status(201).json({ 
            status: "Success",
            message: `Handshake complete. Welcome to the network, ${name}.` 
        });
    } catch (error) {
        console.error("Uplink Failure:", error);
        res.status(500).send("Database sync error.");
    }
});