import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-landing-page',
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss'
})
export class LandingPage {
  
}