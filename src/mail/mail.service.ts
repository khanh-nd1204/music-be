import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  public sendMail(email: string, name: string, otp: number, type: string): void {
    this.mailerService
      .sendMail({
        to: email,
        subject: type === 'activate' ? 'Activate your account' : 'Reset your password',
        template: type === 'activate' ? 'activate.hbs' : 'password.hbs',
        context: {
          name: name,
          activationCode: otp
        }
      })
      .then(() => {})
      .catch(() => {});
  }
}
