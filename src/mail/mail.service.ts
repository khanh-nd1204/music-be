import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  public sendMail(email: string, name: string, codeId: number): void {
    this.mailerService
      .sendMail({
        to: email, // list of receivers
        subject: 'Activate your account', // Subject line
        template: 'register.hbs',
        context: {
          name: name,
          activationCode: codeId
        }
      })
      .then(() => {})
      .catch(() => {});
  }
}
