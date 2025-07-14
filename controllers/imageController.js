// This controller code is now correct and will work with the updated model.
const Image = require("../models/image");
const path = require("path");
const fs = require("fs");

exports.createImage = async (req, res) => {
  const { productId } = req.params;
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No image files provided." });
    }

    const imagePromises = req.files.map((file) => {
      const newImgPath = path
        .join("images/products", file.filename)
        .replace(/\\/g, "/");

      console.log(`Saving image record with path: ${newImgPath}`);

      // This call now perfectly matches the new model function signature
      return Image.create({
        prod_fk: parseInt(productId), // This key matches the model
        img_path: newImgPath,
        img_name: file.originalname,
      });
    });

    const createdImages = await Promise.all(imagePromises);

    res.status(201).json({
      message: "Images uploaded successfully",
      images: createdImages,
      count: createdImages.length,
    });
  } catch (error) {
    console.error("Error creating image(s):", error.stack);
    res
      .status(500)
      .json({ error: "Internal server error while creating image." });
  }
};

// ... rest of the controller functions are fine ...
exports.getImagesByProductId = async (req, res) => {
  const { productId } = req.params;
  try {
    console.log("Fetching images for product ID:", productId);
    const images = await Image.findByProductId(productId);
    console.log("Fetched images:", images);
    res.status(200).json(images);
  } catch (error) {
    console.error("Get images by product ID error:", error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getImageById = async (req, res) => {
  const { id } = req.params;
  try {
    console.log("Fetching image by ID:", id);
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }
    console.log("Fetched image:", image);
    res.status(200).json(image);
  } catch (error) {
    console.error("Get image by ID error:", error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteImage = async (req, res) => {
  // ... all the logic inside this function is correct ...
  const { id } = req.params;
  try {
    console.log("Attempting to delete image with ID:", id);
    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({ error: "Image not found in database." });
    }

    const basePath = process.env.UPLOAD_PATH
      ? process.env.UPLOAD_PATH
      : path.join(__dirname, "..", "images");

    const relativePath = image.img_path.replace(/^images\//, "");
    const fullFilePath = path.join(basePath, relativePath);

    console.log("Attempting to delete file from filesystem at:", fullFilePath);

    if (fs.existsSync(fullFilePath)) {
      fs.unlinkSync(fullFilePath);
      console.log("Successfully deleted image file from filesystem.");
    } else {
      console.warn(
        "Could not find image file to delete at path:",
        fullFilePath
      );
    }

    await Image.delete(id);

    console.log("Successfully deleted image record from database.");
    res.status(200).json({ message: "Image deleted" });
  } catch (error) {
    console.error("Delete image error:", error.stack);
    res
      .status(500)
      .json({ error: "Internal server error while deleting image." });
  }
};

exports.updateImage = async (req, res) => {
  const { id } = req.params;
  const { img_desc, img_order, img_media } = req.body;
  console.log(
    "Received update request for image ID:",
    id,
    "with data:",
    req.body
  );
  try {
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    await Image.update(id, { img_desc, img_order, img_media });
    console.log("Image updated successfully");
    res.status(200).json({ message: "Image updated" });
  } catch (error) {
    console.error("Update image error:", error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
};
