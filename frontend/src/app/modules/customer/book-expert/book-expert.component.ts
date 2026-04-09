import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ExpertProfile } from '../../../core/models/user.model';

@Component({
  selector: 'app-book-expert',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-container">

      <div class="page-header">
        <div>
          <h1><i class="bi bi-calendar2-plus-fill me-2" style="color:#6c63ff;"></i>Book an Expert</h1>
          <p class="text-muted mb-0">Fill in your requirements to request a session</p>
        </div>
        <a routerLink="/customer/experts" class="btn btn-outline-secondary fw-semibold">
          <i class="bi bi-arrow-left me-2"></i>Back to Experts
        </a>
      </div>

      <div class="loading-container" *ngIf="loading">
        <div class="spinner-border spinner-border-ih" role="status"></div>
      </div>

      <div class="row g-4 align-items-start" *ngIf="!loading">

        <!-- Expert summary -->
        <div class="col-lg-4" *ngIf="expert">
          <div class="ih-card">
            <div class="ih-card-body text-center py-4">
              <div class="expert-avatar mx-auto mb-3" style="width:80px;height:80px;font-size:2rem;">
                {{ expert.name.charAt(0).toUpperCase() }}
              </div>
              <h4 class="fw-bold mb-1">{{ expert.name }}</h4>
              <p class="mb-1 fw-semibold" style="color:#6c63ff;">{{ expert.category }}</p>
              <p class="text-muted small mb-3" *ngIf="expert.description">{{ expert.description | slice:0:120 }}...</p>

              <div class="d-flex justify-content-center gap-3 flex-wrap" style="font-size:0.8rem; color:#6c757d;">
                <span *ngIf="expert.location">
                  <i class="bi bi-geo-alt-fill me-1"></i>{{ expert.location }}
                </span>
                <span>
                  <i class="bi bi-briefcase-fill me-1"></i>{{ expert.experienceYears }} yrs exp
                </span>
                <span *ngIf="expert.averageRating" class="rating-stars fw-semibold">
                  ★ {{ expert.averageRating.toFixed(1) }}
                </span>
              </div>

              <div *ngIf="expert.skills" class="d-flex flex-wrap gap-1 justify-content-center mt-3">
                <span *ngFor="let sk of getSkills(expert.skills).slice(0,5)" class="skill-chip">{{ sk }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Booking form -->
        <div class="col-lg-8">
          <div class="ih-card">
            <div class="ih-card-header"><i class="bi bi-file-text-fill me-2"></i>Booking Details</div>
            <div class="ih-card-body">

              <div class="success-message" *ngIf="successMessage">
                <i class="bi bi-check-circle-fill me-2"></i>{{ successMessage }}
              </div>
              <div class="error-message" *ngIf="errorMessage">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ errorMessage }}
              </div>

              <form [formGroup]="bookingForm" (ngSubmit)="onSubmit()" novalidate>

                <div class="mb-4">
                  <label class="form-label fw-semibold">
                    What do you need help with? <span class="text-danger">*</span>
                  </label>
                  <textarea class="form-control"
                            [class.is-invalid]="submitted && bf['requirementNote'].errors"
                            formControlName="requirementNote" rows="6"
                            placeholder="Describe your requirements in detail. The more specific you are, the better the expert can prepare..."></textarea>
                  <div class="invalid-feedback">Please describe your requirements.</div>
                  <div class="form-text">Be as specific as possible to help the expert understand your needs.</div>
                </div>

                <div class="mb-4">
                  <label class="form-label fw-semibold">
                    Preferred Date <span class="text-danger">*</span>
                  </label>
                  <input type="date" class="form-control"
                         [class.is-invalid]="submitted && bf['scheduledDate'].errors"
                         formControlName="scheduledDate"
                         [min]="today">
                  <div class="invalid-feedback">Please select a preferred date.</div>
                  <div class="form-text">Select the date you would like the expert to visit.</div>
                </div>

                <button type="submit"
                        class="btn btn-primary btn-ih-primary w-100 py-3 fw-bold fs-6"
                        [disabled]="submitting">
                  <span *ngIf="submitting" class="spinner-border spinner-border-sm me-2"></span>
                  <i *ngIf="!submitting" class="bi bi-send-fill me-2"></i>
                  {{ submitting ? 'Submitting booking...' : 'Confirm Booking Request' }}
                </button>

              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class BookExpertComponent implements OnInit {
  expert: ExpertProfile | null = null;
  bookingForm: FormGroup;
  loading = true;
  submitting = false;
  submitted = false;
  successMessage = '';
  errorMessage = '';
  today = new Date().toISOString().split('T')[0];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.bookingForm = this.fb.group({
      requirementNote: ['', Validators.required],
      scheduledDate:   [null, Validators.required]
    });
  }

  get bf() { return this.bookingForm.controls; }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.apiService.get<ExpertProfile>(`/customer/experts/${+id}`).subscribe({
        next: (e) => { this.expert = e; this.loading = false; },
        error: ()  => { this.loading = false; }
      });
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.bookingForm.invalid || !this.expert) return;

    this.submitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const rawDate = this.bookingForm.value.scheduledDate;
    const payload = {
      expertId:        this.expert.userId,
      requirementNote: this.bookingForm.value.requirementNote,
      scheduledDate:   rawDate ? `${rawDate}T00:00:00` : null
    };

    this.apiService.post('/customer/bookings', payload).subscribe({
      next: () => {
        this.successMessage = 'Booking request submitted! The expert will review and respond to you soon.';
        this.submitting = false;
        setTimeout(() => this.router.navigate(['/customer/my-bookings']), 2500);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to create booking. Please try again.';
        this.submitting = false;
      }
    });
  }

  getSkills(skills: string): string[] {
    return skills.split(',').map(s => s.trim()).filter(Boolean);
  }
}
