import Task from '../models/Task.js';

// Get all tasks for user
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Create a new task
export const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;
    const newTask = new Task({
      title,
      description,
      status,
      priority,
      dueDate,
      user: req.user._id
    });
    await newTask.save();
    // Return formatted to match frontend expectation (uses id instead of _id)
    const formattedTask = { ...newTask._doc, id: newTask._id.toString() };
    res.status(201).json({ success: true, task: formattedTask });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Update task
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const formattedTask = { ...task._doc, id: task._id.toString() };
    res.json({ success: true, task: formattedTask });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Delete task
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
