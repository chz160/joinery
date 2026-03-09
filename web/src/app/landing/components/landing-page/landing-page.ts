import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedMaterialModule } from '../../../shared/modules/material.module';
import { BaseAuthComponent } from '../../../shared/components/base-auth-component';
import { DashboardPreviewComponent } from '../../../shared/components/dashboard-preview/dashboard-preview';

@Component({
  selector: 'app-landing-page',
  imports: [
    CommonModule,
    RouterModule,
    SharedMaterialModule,
    DashboardPreviewComponent
  ],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss'
})
export class LandingPage extends BaseAuthComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('workflowSection') workflowSection!: ElementRef;

  workflowVisible = false;

  private observer?: IntersectionObserver;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.workflowVisible = true;
      return;
    }

    const root = document.querySelector('mat-sidenav-content');
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          this.workflowVisible = true;
          this.observer?.disconnect();
        }
      },
      { threshold: 0.3, root: root ?? null }
    );
    if (this.workflowSection?.nativeElement) {
      this.observer.observe(this.workflowSection.nativeElement);
    }
  }

  override ngOnDestroy(): void {
    this.observer?.disconnect();
    super.ngOnDestroy();
  }
}