const express = require("express");
const User = require("../models/User");
const Manager = require("../models/Manager");
const { basicAuth } = require("../middleware/basicAuth.middleware");

const router = express.Router();

router.use(basicAuth);

router.post("/manager", async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      department,
      designation,
      salary,
      cnic,
      address,
      joiningDate,
    } = req.body;

    if (!email || !password || !firstName || !lastName || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message:
          "email, password, firstName, lastName and phoneNumber are required.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      const existingManager = await Manager.findOne({ userId: existingUser._id });
      if (existingManager) {
        return res.status(200).json({
          success: true,
          message: "Manager already exists for this email.",
          data: { manager: existingManager, userId: existingUser._id },
        });
      }
    }

    const user = new User({
      email: normalizedEmail,
      password,
      role: "manager",
      isActive: true,
    });
    await user.save();

    const manager = new Manager({
      userId: user._id,
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      phoneNumber: String(phoneNumber).trim(),
      department: department || "General",
      designation: designation || "Manager",
      salary: salary || 0,
      cnic: cnic || "",
      address: address || "",
      joiningDate: joiningDate || new Date(),
    });
    await manager.save();

    return res.status(201).json({
      success: true,
      message: "Manager seeded successfully.",
      data: {
        userId: user._id,
        manager,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to seed manager.",
      error: error.message,
    });
  }
});

module.exports = router;
