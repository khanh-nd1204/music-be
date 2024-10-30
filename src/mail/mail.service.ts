import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  public sendMail(email: string, name: string, otp: number, type: string): void {
    this.mailerService
      .sendMail({
        to: email, // list of receivers
        subject: type === 'activate' ? 'Activate your account' : 'Reset your password', // Subject line
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
