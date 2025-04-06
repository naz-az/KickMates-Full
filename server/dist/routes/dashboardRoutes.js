"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// All dashboard routes require authentication
router.use(auth_1.authenticate);
// Get top recommended events
router.get('/top-events', dashboardController_1.getTopCourses);
// Get user events
router.get('/user-events', dashboardController_1.getUserCourses);
// Get user statistics
router.get('/statistics', dashboardController_1.getUserStatistics);
// Get activity data
router.get('/activity', dashboardController_1.getProductivityData);
// Get upcoming events
router.get('/upcoming-events', dashboardController_1.getUpcomingEvents);
exports.default = router;
