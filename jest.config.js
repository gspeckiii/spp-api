const request = require("supertest")
const app = require("../server") // Adjust path to your server.js
const jwt = require("jsonwebtoken")
require("dotenv").config()

describe("Product Routes", () => {
  let token
  let productId

  beforeAll(async () => {
    // Generate a test JWT token (mock or use a real one from your login)
    token = jwt.sign({ user_id: 1, username: "testadmin", admin: true }, process.env.JWT_SECRET, { expiresIn: "1h" })

    // Create a test product to use in subsequent tests
    const res = await request(app).post("/api/products").set("Authorization", `Bearer ${token}`).send({
      cat_fk: 1,
      prod_name: "Test Product",
      prod_cost: 9.99,
      prod_desc: "Initial test description"
    })
    productId = res.body.id
  })

  afterAll(async () => {
    // Clean up: Delete the test product
    await request(app).delete(`/api/products/${productId}`).set("Authorization", `Bearer ${token}`)
  })

  describe("GET /api/products", () => {
    it("should return all products", async () => {
      const res = await request(app).get("/api/products").set("Authorization", `Bearer ${token}`)
      expect(res.statusCode).toBe(200)
      expect(res.body).toBeInstanceOf(Array)
    })

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/products")
      expect(res.statusCode).toBe(401)
      expect(res.body.error).toBe("Access denied, no token provided")
    })
  })

  describe("GET /api/products/:id", () => {
    it("should return a specific product", async () => {
      const res = await request(app).get(`/api/products/${productId}`).set("Authorization", `Bearer ${token}`)
      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty("id", productId)
      expect(res.body).toHaveProperty("prod_name", "Test Product")
    })

    it("should return 404 for non-existent product", async () => {
      const res = await request(app).get("/api/products/9999").set("Authorization", `Bearer ${token}`)
      expect(res.statusCode).toBe(404)
      expect(res.body.error).toBe("Product not found")
    })
  })

  describe("GET /api/products/category/:id", () => {
    it("should return products for a category", async () => {
      const res = await request(app).get("/api/products/category/1").set("Authorization", `Bearer ${token}`)
      expect(res.statusCode).toBe(200)
      expect(res.body).toBeInstanceOf(Array)
      // Expect at least the test product if cat_fk matches
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty("id")
        expect(res.body[0]).toHaveProperty("prod_name")
      }
    })

    it("should return empty array for non-existent category", async () => {
      const res = await request(app).get("/api/products/category/9999").set("Authorization", `Bearer ${token}`)
      expect(res.statusCode).toBe(200)
      expect(res.body).toEqual([])
    })
  })

  describe("PUT /api/products/:id", () => {
    it("should update a product", async () => {
      const res = await request(app).put(`/api/products/${productId}`).set("Authorization", `Bearer ${token}`).send({
        prod_name: "Updated Test Product",
        prod_cost: 19.99,
        prod_desc: "Updated test description"
      })
      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty("prod_name", "Updated Test Product")
      expect(res.body).toHaveProperty("prod_cost", 19.99)
    })

    it("should return 404 for non-existent product", async () => {
      const res = await request(app).put("/api/products/9999").set("Authorization", `Bearer ${token}`).send({ prod_name: "Nonexistent" })
      expect(res.statusCode).toBe(404)
      expect(res.body.error).toBe("Product not found")
    })
  })

  describe("DELETE /api/products/:id", () => {
    it("should delete a product", async () => {
      const res = await request(app).delete(`/api/products/${productId}`).set("Authorization", `Bearer ${token}`)
      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty("message", "Product deleted")
    })

    it("should return 404 for non-existent product", async () => {
      const res = await request(app).delete("/api/products/9999").set("Authorization", `Bearer ${token}`)
      expect(res.statusCode).toBe(404)
      expect(res.body.error).toBe("Product not found")
    })
  })
})
