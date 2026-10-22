const Report = require("../models/reportModel");

const getOverview = async (req, res) => {
  try {
    const overview = await Report.getOverview();
    res.status(200).json({ message: "Overview report retrieved successfully", report: overview });
  } catch (error) {
    console.error("Error getting admin overview report:", error.message);
    res.status(500).json({ message: "Unable to load the overview report" });
  }
};

const getMyReport = async (req, res) => {
  try {
    const report = await Report.getStudentReport(req.user.id);
    res.status(200).json({ message: "Student report retrieved successfully", report });
  } catch (error) {
    console.error("Error getting student report:", error.message);
    res.status(500).json({ message: "Unable to load your learning report" });
  }
};

module.exports = { getOverview, getMyReport };
