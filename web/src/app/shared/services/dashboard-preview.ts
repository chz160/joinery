import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DashboardPreview, Query, ActivityItem, Notification } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DashboardPreviewService {
  
  constructor() { }

  /**
   * Get dashboard preview data for authenticated user
   */
  getDashboardPreview(): Observable<DashboardPreview> {
    const mockData: DashboardPreview = {
      stats: {
        organizations: 2,
        teams: 5,
        queries: 18,
        repositories: 8
      },
      recentActivity: [
        {
          id: '1',
          action: 'Created query',
          item: 'User Engagement Analysis',
          time: '10 minutes ago',
          icon: 'add_circle'
        },
        {
          id: '2',
          action: 'Updated team',
          item: 'Analytics Team',
          time: '2 hours ago',
          icon: 'group'
        },
        {
          id: '3',
          action: 'Shared query',
          item: 'Monthly Revenue Report',
          time: '5 hours ago',
          icon: 'share'
        },
        {
          id: '4',
          action: 'Joined organization',
          item: 'Data Science Hub',
          time: '1 day ago',
          icon: 'business'
        }
      ],
      recentQueries: [
        {
          id: '1',
          name: 'User Engagement Analysis',
          description: 'Weekly active users and engagement metrics',
          content: 'SELECT user_id, COUNT(*) as sessions FROM user_events WHERE date >= CURRENT_DATE - INTERVAL 7 DAY GROUP BY user_id',
          authorId: '1',
          tags: ['users', 'engagement', 'weekly'],
          createdAt: new Date('2024-02-18'),
          updatedAt: new Date('2024-02-18')
        },
        {
          id: '2',
          name: 'Revenue Tracking',
          description: 'Monthly revenue breakdown by product',
          content: 'SELECT product_id, SUM(amount) as total_revenue FROM orders WHERE MONTH(created_at) = MONTH(CURRENT_DATE) GROUP BY product_id',
          authorId: '1',
          tags: ['revenue', 'monthly', 'products'],
          createdAt: new Date('2024-02-15'),
          updatedAt: new Date('2024-02-17')
        },
        {
          id: '3',
          name: 'Team Performance',
          description: 'Query execution and collaboration metrics',
          content: 'SELECT team_id, COUNT(*) as queries_created, AVG(execution_time) as avg_time FROM query_logs WHERE created_at >= CURRENT_DATE - INTERVAL 30 DAY GROUP BY team_id',
          authorId: '1',
          tags: ['team', 'performance', 'metrics'],
          createdAt: new Date('2024-02-10'),
          updatedAt: new Date('2024-02-16')
        }
      ],
      notifications: [
        {
          id: '1',
          type: 'info',
          title: 'New team member',
          message: 'Sarah joined your Analytics Team',
          time: '30 minutes ago',
          read: false
        },
        {
          id: '2',
          type: 'success',
          title: 'Query shared',
          message: 'Your Monthly Revenue Report was shared with 3 teams',
          time: '2 hours ago',
          read: false
        },
        {
          id: '3',
          type: 'warning',
          title: 'Repository sync',
          message: 'analytics-queries repository needs attention',
          time: '1 day ago',
          read: true
        }
      ]
    };

    return of(mockData);
  }
}