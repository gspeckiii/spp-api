const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")

// Debug exports
console.log("userController exports:", Object.keys(userController))

router.post("/users/checkRegUsername", userController.checkUsername)
router.post("/users/checkRegEmail", userController.checkEmail)
router.post("/users", userController.createUser)
router.post("/users/login", userController.login)
router.post("/users/request-password-reset", userController.requestPasswordReset)
router.post("/users/reset-password", userController.resetPassword)
router.post("/refresh", userController.refreshToken)
router.put("/users/change-password/:id", userController.changePassword)
router.get("/users", userController.getAllUsers)
router.get("/users/:id", userController.getUserById)
router.put("/users/:id", userController.updateUser)
router.delete("/users/:id", userController.deleteUser)

module.exports = router
