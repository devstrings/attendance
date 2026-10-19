const User = require('../models/User');
const { WORKER_PERMISSIONS } = User;

// Naya worker banao (sirf superadmin)
exports.createWorker = async (req, res) => {
  try {
    const { email, password, name, phoneNumber, permissions = [] } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password kam az kam 8 characters ka ho.' });
    }

    const invalid = permissions.filter((p) => !WORKER_PERMISSIONS.includes(p));
    if (invalid.length) {
      return res.status(400).json({ success: false, message: `Invalid permissions: ${invalid.join(', ')}` });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already exists.' });
    }

    const worker = await User.create({
      email,
      password,
      name,
      phoneNumber,
      role: 'worker',
      permissions,
      isEmailVerified: true,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, worker });
  } catch (error) {
    console.error('createWorker error:', error.message);
    res.status(500).json({ success: false, message: 'Could not create worker.' });
  }
};

// Saare workers ki list
exports.listWorkers = async (req, res) => {
  try {
    const workers = await User.find({ role: 'worker' }).sort({ createdAt: -1 });
    res.json({ success: true, workers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not fetch workers.' });
  }
};

// Worker ki permissions badlo
exports.updateWorkerPermissions = async (req, res) => {
  try {
    const { permissions = [] } = req.body;

    const invalid = permissions.filter((p) => !WORKER_PERMISSIONS.includes(p));
    if (invalid.length) {
      return res.status(400).json({ success: false, message: `Invalid permissions: ${invalid.join(', ')}` });
    }

    const worker = await User.findOne({ _id: req.params.id, role: 'worker' });
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    worker.permissions = permissions;
    await worker.save();
    res.json({ success: true, worker });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not update permissions.' });
  }
};

// Worker ko active / inactive karo
exports.toggleWorkerActive = async (req, res) => {
  try {
    const worker = await User.findOne({ _id: req.params.id, role: 'worker' });
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    worker.isActive = !worker.isActive;
    await worker.save();
    res.json({ success: true, worker });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not update worker.' });
  }
};