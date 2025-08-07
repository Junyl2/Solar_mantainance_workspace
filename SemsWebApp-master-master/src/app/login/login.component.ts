import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { AuthServiceModule } from '../auth-service.module'
import { SemsService } from '../services/sems-service'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  form: FormGroup
  returnUrl: string
  showLoginError: boolean = false

  constructor(
    private authService: AuthServiceModule,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    console.log(localStorage.getItem('account'));

    if (localStorage.getItem('account') != null) {
      router.navigate(['/'])
    }
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      account: ['', Validators.required],
      password: ['', Validators.required]
    })

    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/'
  }

  changeLoginstatus() {
    console.log('changeLoginStatus');
    this.authService.emitChange(true);
  }

  confirmLoginError() {
    this.showLoginError = false;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      alert('계정과 비밀번호를 입력하세요')
      return
    }

    this.authService
      .login(this.form.value.account, this.form.value.password)
      .subscribe(res => {
        console.log(res)

        if (res.accessToken) {
          this.authService
            .getUserInfo(this.form.value.account)
            .subscribe(res => {
              console.log(res)

              if (res.account) {
                this.changeLoginstatus();
                this.router.navigate(['/']);
              }
            })
        }
      },
        (err => {
          console.log(err);
          this.showLoginError = true;
        })
      )

  }
}
