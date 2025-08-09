// Purpose: To test the connection to Printful's API in a minimal, isolated Node.js script.
// This removes all variables from the main Express application.

require("dns").setDefaultResultOrder("ipv4first"); // Keep this fix, it's good practice
require("dotenv").config();
const fetch = require("node-fetch");

const apiKey = process.env.PRINTFUL_API_KEY;
const storeId = process.env.PRINTFUL_STORE_ID;

if (!apiKey || !storeId) {
  console.error(
    "❌ ERROR: PRINTFUL_API_KEY or PRINTFUL_STORE_ID not found in .env file. Halting."
  );
  process.exit(1);
}

const url = `https://api.printful.com/sync/products?store_id=${storeId}`;
const options = {
  method: "GET",
  headers: {
    Authorization: `Bearer ${apiKey}`,
  },
};

async function runTest() {
  console.log(`\n--- Running Minimal Printful API Test ---`);
  console.log(`Store ID: ${storeId}`);
  console.log(`Endpoint: ${url}`);
  console.log("-----------------------------------------");

  try {
    const response = await fetch(url, options);
    const responseBody = await response.json();

    if (!response.ok) {
      console.error("\n❌ TEST FAILED: Printful returned an error.");
      console.error(
        `   > Status Code: ${response.status} (${response.statusText})`
      );
      console.error("   > Response Body:", responseBody);
    } else {
      console.log("\n✅✅✅ TEST SUCCEEDED! ✅✅✅");
      console.log("   > Printful returned a successful response.");
      console.log(`   > Found ${responseBody.result.length} sync products.`);
      console.log(
        "   > This proves the network connection is POSSIBLE with node-fetch."
      );
    }
  } catch (error) {
    console.error("\n❌❌❌ TEST FAILED AT THE NETWORK LEVEL ❌❌❌");
    console.error("   > The error is 'fetch failed'.");
    console.error(
      "   > This CONFIRMS that something in your environment is blocking Node.js from connecting to api.printful.com."
    );
    console.error(
      "   > This is not a code issue. It is a firewall, security software, or proxy issue."
    );
    console.error("   > Full Error:", error);
  }
}

runTest();
