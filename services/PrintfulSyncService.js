// === FINAL, DEFINITIVE, AND CORRECT FILE ===

const fetch = require("node-fetch");
const pool = require("../config/database");

class PrintfulSyncService {
  static async syncProducts() {
    const apiKey = process.env.PRINTFUL_API_KEY;
    const storeId = process.env.PRINTFUL_STORE_ID;

    if (!storeId || !apiKey) {
      throw new Error(
        "PRINTFUL_STORE_ID or PRINTFUL_API_KEY is not defined in the .env file."
      );
    }

    const url = `https://api.printful.com/sync/products?store_id=${storeId}`;
    const options = {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    };

    let apiResponse;
    try {
      const response = await fetch(url, options);
      apiResponse = await response.json();
      if (!response.ok) {
        throw new Error(
          `Printful API Error: ${response.status} - ${
            apiResponse.error?.message || JSON.stringify(apiResponse)
          }`
        );
      }
    } catch (error) {
      console.error("Direct fetch to Printful failed:", error);
      throw error;
    }

    const productSummaries = apiResponse.result;

    if (!productSummaries || productSummaries.length === 0) {
      return {
        message:
          "Success! No products were found in the specified Printful store.",
        syncedCount: 0,
      };
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      let syncedCount = 0;

      const categoryResult = await client.query(
        "SELECT id FROM categories WHERE cat_name = 'Printful Merch'"
      );
      const printfulCategoryId =
        categoryResult.rows.length > 0 ? categoryResult.rows[0].id : null;

      if (!printfulCategoryId) {
        throw new Error(
          "The 'Printful Merch' category does not exist. Please create it first."
        );
      }

      // We must loop through the summaries and fetch the full data for each product.
      for (const productSummary of productSummaries) {
        const productDetailUrl = `https://api.printful.com/sync/products/${productSummary.id}`;
        const detailResponse = await fetch(productDetailUrl, options);
        const detailApiResponse = await detailResponse.json();

        if (!detailResponse.ok) {
          console.warn(
            `Could not fetch details for product ${productSummary.id}. Skipping.`
          );
          continue; // Skip this product if details can't be fetched
        }

        const fullProduct = detailApiResponse.result;
        const thumbnailUrl = fullProduct.sync_product.thumbnail_url;

        if (
          !fullProduct.sync_variants ||
          fullProduct.sync_variants.length === 0
        )
          continue;

        for (const variant of fullProduct.sync_variants) {
          const query = `
              INSERT INTO products (
                prod_name, prod_cost, prod_desc, is_printful_product, 
                printful_variant_id, cat_fk, printful_thumbnail_url
              )
              VALUES ($1, $2, $3, TRUE, $4, $5, $6)
              ON CONFLICT (printful_variant_id) 
              DO UPDATE SET
                  prod_name = EXCLUDED.prod_name,
                  prod_cost = EXCLUDED.prod_cost,
                  prod_desc = EXCLUDED.prod_desc,
                  cat_fk = EXCLUDED.cat_fk,
                  printful_thumbnail_url = EXCLUDED.printful_thumbnail_url;
          `;
          const description = fullProduct.sync_product.name;
          const price = variant.retail_price || "0.00";
          const variantName = variant.name;

          await client.query(query, [
            variantName,
            price,
            description,
            variant.id,
            printfulCategoryId,
            thumbnailUrl,
          ]);
          syncedCount++;
        }
      }
      await client.query("COMMIT");

      return {
        message: `Successfully synced/updated ${syncedCount} product variants from Printful.`,
        syncedCount: syncedCount,
      };
    } catch (dbError) {
      await client.query("ROLLBACK");
      console.error("Database Error:", dbError);
      throw dbError;
    } finally {
      client.release();
    }
  }
}

module.exports = PrintfulSyncService;
