// === NEW TEMPORARY FILE ===
const fetch = require("node-fetch");

exports.runDirectPrintfulTest = async (req, res) => {
  console.log("\n--- RUNNING ISOLATED EXPRESS ENDPOINT TEST ---");
  // Hardcode the credentials one last time for this definitive test.
  const apiKey = "33AlQKnc3OfOYuZQHNLNzgwSKoCNTF2ihA9ZBiwr"; // <-- PASTE YOUR NEW SINGLE-STORE KEY HERE
  const storeId = "16563272";

  if (apiKey === "your_NEW_single_store_api_key_here") {
    return res
      .status(500)
      .json({ error: "Please paste the key into TestController.js" });
  }

  const url = `https://api.printful.com/sync/products?store_id=${storeId}`;
  const options = {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
  };

  try {
    const response = await fetch(url, options);
    const apiResponse = await response.json();

    if (!response.ok) {
      console.error("Test failed: Printful returned an error", apiResponse);
      return res.status(response.status).json(apiResponse);
    }

    console.log("✅✅✅ ISOLATED TEST SUCCEEDED! ✅✅✅");
    console.log(`Found ${apiResponse.result.length} products.`);
    res.status(200).json({
      message: "Isolated test succeeded!",
      result: apiResponse.result,
    });
  } catch (error) {
    console.error("❌ ISOLATED TEST FAILED AT NETWORK LEVEL ❌", error);
    res
      .status(500)
      .json({ error: "Isolated test failed with 'fetch failed'." });
  }
};
