import express from 'express';
import { Analytics } from '../models/Analytics';
import { Project } from '../models/Project';
import { authenticate } from '../middleware/auth';
import logger from '../utils/logger';

const router = express.Router();

// Get user analytics summary
router.get('/summary', authenticate, async (req: any, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage: any = {
      user: req.user._id
    };

    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) {
        matchStage.timestamp.$gte = new Date(startDate as string);
      }
      if (endDate) {
        matchStage.timestamp.$lte = new Date(endDate as string);
      }
    }

    // Get analytics summary
    const analyticsSummary = await Analytics.aggregate([
      {
        $match: matchStage
      },
      {
        $group: {
          _id: null,
          totalExecutions: { $sum: 1 },
          avgConfidence: { $avg: '$metrics.confidence' },
          totalTokens: { $sum: '$metrics.tokensUsed' },
          totalExecutionTime: { $sum: '$metrics.executionTime' },
          byAgent: {
            $push: {
              agent: '$agent',
              confidence: '$metrics.confidence',
              executionTime: '$metrics.executionTime'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalExecutions: 1,
          avgConfidence: { $round: ['$avgConfidence', 3] },
          totalTokens: 1,
          totalExecutionTime: 1,
          avgExecutionTime: {
            $cond: [
              { $eq: ['$totalExecutions', 0] },
              0,
              { $round: [{ $divide: ['$totalExecutionTime', '$totalExecutions'] }, 2] }
            ]
          },
          agentStats: {
            $reduce: {
              input: '$byAgent',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $let: {
                      vars: {
                        agent: '$$this.agent',
                        agentData: {
                          $cond: [
                            { $not: [{ $getField: { field: '$$this.agent', input: '$$value' } }] },
                            {
                              count: 1,
                              totalConfidence: '$$this.confidence',
                              totalTime: '$$this.executionTime'
                            },
                            {
                              count: { $add: [{ $getField: { field: 'count', input: { $getField: { field: '$$this.agent', input: '$$value' } } } }, 1] },
                              totalConfidence: { $add: [{ $getField: { field: 'totalConfidence', input: { $getField: { field: '$$this.agent', input: '$$value' } } } }, '$$this.confidence'] },
                              totalTime: { $add: [{ $getField: { field: 'totalTime', input: { $getField: { field: '$$this.agent', input: '$$value' } } } }, '$$this.executionTime'] }
                            }
                          ]
                        }
                      },
                      in: {
                        $mergeObjects: [
                          '$$value',
                          { ['$$agent']: '$$agentData' }
                        ]
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      }
    ]);

    // Get project statistics
    const projectStats = await Project.aggregate([
      {
        $match: { user: req.user._id }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$analytics.confidenceScore' }
        }
      }
    ]);

    // Get recent activity
    const recentActivity = await Analytics.find({
      user: req.user._id
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('project', 'title')
      .select('agent action metrics.timestamp');

    const summary = analyticsSummary[0] || {
      totalExecutions: 0,
      avgConfidence: 0,
      totalTokens: 0,
      totalExecutionTime: 0,
      avgExecutionTime: 0,
      agentStats: {}
    };

    // Process agent stats
    const processedAgentStats: Record<string, any> = {};
    if (summary.agentStats) {
      Object.entries(summary.agentStats).forEach(([agent, data]: [string, any]) => {
        processedAgentStats[agent] = {
          executions: data.count,
          avgConfidence: data.count > 0 ? data.totalConfidence / data.count : 0,
          avgExecutionTime: data.count > 0 ? data.totalTime / data.count : 0
        };
      });
    }

    const result = {
      summary: {
        totalExecutions: summary.totalExecutions,
        avgConfidence: summary.avgConfidence,
        totalTokens: summary.totalTokens,
        totalExecutionTime: summary.totalExecutionTime,
        avgExecutionTime: summary.avgExecutionTime
      },
      agentStats: processedAgentStats,
      projectStats: projectStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {} as Record<string, number>),
      recentActivity: recentActivity.map(activity => ({
        agent: activity.agent,
        action: activity.action,
        project: (activity.project as any)?.title || 'Unknown',
        timestamp: activity.timestamp
      }))
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Get analytics timeline
router.get('/timeline', authenticate, async (req: any, res, next) => {
  try {
    const { interval = 'day', limit = 30 } = req.query;

    const intervalMap: Record<string, string> = {
      hour: '%Y-%m-%d %H:00:00',
      day: '%Y-%m-%d',
      week: '%Y-%W',
      month: '%Y-%m'
    };

    const dateFormat = intervalMap[interval as string] || intervalMap.day;

    const timeline = await Analytics.aggregate([
      {
        $match: {
          user: req.user._id,
          timestamp: {
            $gte: new Date(Date.now() - parseInt(limit as string) * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: '$timestamp'
            }
          },
          executions: { $sum: 1 },
          avgConfidence: { $avg: '$metrics.confidence' },
          totalTokens: { $sum: '$metrics.tokensUsed' }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: '$_id',
          executions: 1,
          avgConfidence: { $round: ['$avgConfidence', 3] },
          totalTokens: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    next(error);
  }
});

// Get agent performance metrics
router.get('/agent-performance', authenticate, async (req: any, res, next) => {
  try {
    const performance = await Analytics.aggregate([
      {
        $match: { user: req.user._id }
      },
      {
        $group: {
          _id: '$agent',
          totalExecutions: { $sum: 1 },
          avgConfidence: { $avg: '$metrics.confidence' },
          avgExecutionTime: { $avg: '$metrics.executionTime' },
          successRate: {
            $avg: {
              $cond: [
                { $gt: ['$metrics.confidence', 0.7] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { totalExecutions: -1 }
      },
      {
        $project: {
          agent: '$_id',
          totalExecutions: 1,
          avgConfidence: { $round: ['$avgConfidence', 3] },
          avgExecutionTime: { $round: ['$avgExecutionTime', 2] },
          successRate: { $multiply: [{ $round: ['$successRate', 3] }, 100] },
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    next(error);
  }
});

// Get project analytics
router.get('/projects/:projectId', authenticate, async (req: any, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project belongs to user
    const project = await Project.findOne({
      _id: projectId,
      user: req.user._id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const projectAnalytics = await Analytics.find({
      project: projectId,
      user: req.user._id
    })
      .sort({ timestamp: -1 })
      .select('agent action metrics timestamp');

    // Calculate agent-specific metrics
    const agentMetrics = await Analytics.aggregate([
      {
        $match: {
          project: project._id,
          user: req.user._id
        }
      },
      {
        $group: {
          _id: '$agent',
          executions: { $sum: 1 },
          avgConfidence: { $avg: '$metrics.confidence' },
          totalTokens: { $sum: '$metrics.tokensUsed' },
          totalTime: { $sum: '$metrics.executionTime' }
        }
      }
    ]);

    const result = {
      project: {
        id: project._id,
        title: project.title,
        status: project.status,
        overallConfidence: project.analytics.confidenceScore,
        totalExecutionTime: project.analytics.executionTime,
        totalTokens: project.analytics.tokensUsed
      },
      agentMetrics: agentMetrics.map(metric => ({
        agent: metric._id,
        executions: metric.executions,
        avgConfidence: metric.avgConfidence,
        totalTokens: metric.totalTokens,
        totalTime: metric.totalTime
      })),
      activityLog: projectAnalytics.map(log => ({
        agent: log.agent,
        action: log.action,
        confidence: log.metrics.confidence,
        timestamp: log.timestamp
      }))
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Export analytics data
router.get('/export', authenticate, async (req: any, res, next) => {
  try {
    const { format = 'json' } = req.query;

    const analyticsData = await Analytics.find({
      user: req.user._id
    })
      .populate('project', 'title')
      .select('-__v')
      .lean();

    if (format === 'csv') {
      // Convert to CSV
      const headers = ['Timestamp', 'Agent', 'Action', 'Confidence', 'Execution Time', 'Tokens Used', 'Project'];
      const rows = analyticsData.map(item => [
        new Date(item.timestamp).toISOString(),
        item.agent,
        item.action,
        item.metrics.confidence,
        item.metrics.executionTime,
        item.metrics.tokensUsed,
        (item.project as any)?.title || 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${Date.now()}.csv`);
      res.send(csvContent);
    } else {
      // Return as JSON
      res.json({
        success: true,
        data: analyticsData,
        metadata: {
          totalRecords: analyticsData.length,
          exportDate: new Date().toISOString(),
          user: req.user.email
        }
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;