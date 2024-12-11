const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const register = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Get role_id from roles table
    const [roleResult] = await db.query("SELECT role_id FROM roles WHERE role_name = ?", [role]);
    if (roleResult.length === 0) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const role_id = roleResult[0].role_id;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into users table
    await db.query("INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)", [
      username,
      hashedPassword,
      role_id,
    ]);

    res.status(201).json({ message: `User ${username} registered successfully!` });
  } catch (err) {
    res.status(500).json({ message: "Error registering user", error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Fetch user from the database
    const [userResult] = await db.query(
      "SELECT u.id, u.password, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.username = ?",
      [username]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, role: user.role_name }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
};

module.exports = { register, login };
