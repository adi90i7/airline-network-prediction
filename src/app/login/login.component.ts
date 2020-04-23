import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AppService } from 'src/app/app.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  errorMessage = null;
  loginFormGroup: FormGroup;
  returnUrl: string;
  identificationError = false;
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private appService: AppService) {
    // redirect to home if already logged in
    if (this.appService.currentUserValue) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    this.loginFormGroup = this.formBuilder.group({
      username: ['', [Validators.required, Validators.pattern('[a-zA-Z0-9]*')]],
      password: ['', [Validators.required]]
    });

    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams.returnUrl || '/';
  }

  onSubmit(e) {
    if (e) {
      e.preventDefault();
    }

    this.loginFormGroup.markAllAsTouched();
    const formIns = this.loginFormGroup.getRawValue();

    // stop here if form is invalid
    if (this.loginFormGroup.invalid) {
      return;
    }

    //const el = document.getElementById('paxInfo');
    //el.classList.add('be-loading-active');
    const formData = {
      username: formIns.username,
      password: formIns.password
    };

    this.appService.identifyLogin(formData).subscribe((response: any) => {
      //el.classList.remove('be-loading-active');
      if (response === null) {
        this.identificationError = true;
      } else {
        this.router.navigate([this.returnUrl]);
      }
    }, (err) => {
      this.identificationError = true;
      //el.classList.remove('be-loading-active');
    });
  }

  public hasError = (controlName: string, errorName: string) => {
    return this.loginFormGroup.controls[controlName].hasError(errorName);
  }
}
