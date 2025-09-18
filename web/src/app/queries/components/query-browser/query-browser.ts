import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { Query, Folder } from '../../../shared/models';

interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'query';
  level: number;
  expandable: boolean;
  content?: string;
  tags?: string[];
  author?: string;
  updatedAt?: Date;
}

@Component({
  selector: 'app-query-browser',
  imports: [
    CommonModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatMenuModule,
    MatToolbarModule
  ],
  templateUrl: './query-browser.html',
  styleUrl: './query-browser.scss'
})
export class QueryBrowser implements OnInit {
  private _transformer = (node: any, level: number): TreeNode => {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      level: level,
      expandable: node.type === 'folder' && node.children && node.children.length > 0,
      content: node.content,
      tags: node.tags,
      author: node.author,
      updatedAt: node.updatedAt
    };
  };

  treeControl = new FlatTreeControl<TreeNode>(
    node => node.level, node => node.expandable);

  treeFlattener = new MatTreeFlattener(
    this._transformer, node => node.level, node => node.expandable, node => node.children);

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  selectedItem: TreeNode | null = null;

  constructor() {}

  ngOnInit(): void {
    this.loadQueryData();
  }

  loadQueryData(): void {
    // Mock folder and query structure
    const data = [
      {
        id: '1',
        name: 'Analytics Queries',
        type: 'folder',
        children: [
          {
            id: '2',
            name: 'User Behavior',
            type: 'folder',
            children: [
              {
                id: '3',
                name: 'Daily Active Users',
                type: 'query',
                content: 'SELECT COUNT(DISTINCT user_id) FROM user_events WHERE date = CURRENT_DATE',
                tags: ['users', 'daily', 'metrics'],
                author: 'John Doe',
                updatedAt: new Date('2024-02-15')
              },
              {
                id: '4',
                name: 'User Retention Analysis',
                type: 'query',
                content: 'WITH cohorts AS (SELECT user_id, DATE_TRUNC(\'month\', first_seen) as cohort_month FROM users) SELECT * FROM cohorts',
                tags: ['retention', 'cohort', 'analysis'],
                author: 'Jane Smith',
                updatedAt: new Date('2024-02-10')
              }
            ]
          },
          {
            id: '5',
            name: 'Revenue Reports',
            type: 'folder',
            children: [
              {
                id: '6',
                name: 'Monthly Revenue',
                type: 'query',
                content: 'SELECT DATE_TRUNC(\'month\', created_at) as month, SUM(amount) as revenue FROM orders GROUP BY month ORDER BY month',
                tags: ['revenue', 'monthly', 'reporting'],
                author: 'Bob Johnson',
                updatedAt: new Date('2024-02-12')
              }
            ]
          }
        ]
      },
      {
        id: '7',
        name: 'Data Science',
        type: 'folder',
        children: [
          {
            id: '8',
            name: 'ML Feature Engineering',
            type: 'query',
            content: 'SELECT user_id, AVG(session_duration) as avg_session, COUNT(*) as total_sessions FROM user_sessions GROUP BY user_id',
            tags: ['ml', 'features', 'engineering'],
            author: 'Alice Wilson',
            updatedAt: new Date('2024-02-08')
          }
        ]
      }
    ];

    this.dataSource.data = data;
  }

  hasChild = (_: number, node: TreeNode) => node.expandable;

  selectItem(node: TreeNode): void {
    this.selectedItem = node;
  }

  createFolder(): void {
    console.log('Create new folder');
  }

  createQuery(): void {
    console.log('Create new query');
  }

  editItem(item: TreeNode): void {
    console.log('Edit item:', item.name);
  }

  deleteItem(item: TreeNode): void {
    console.log('Delete item:', item.name);
  }

  moveItem(item: TreeNode): void {
    console.log('Move item:', item.name);
  }
}
