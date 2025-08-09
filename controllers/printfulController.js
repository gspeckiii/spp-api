// === NEW FILE ===
const PrintfulSyncService = require("../services/PrintfulSyncService");

exports.syncPrintfulProducts = async (req, res) => {
  try {
    const result = await PrintfulSyncService.syncProducts();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in syncPrintfulProducts controller:", error.message);
    res.status(500).json({
      error: "An error occurred during the product sync process.",
    });
  }
};
