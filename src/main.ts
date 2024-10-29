import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { TransformInterceptor } from './core/transform.interceptor';
import { JwtAuthGuard } from './auth/guard/jwt-auth.guard';
import { RolesGuard } from './guards/role.guard';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('PORT');

  // guard
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  // validate
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  // transform res
  app.useGlobalInterceptors(new TransformInterceptor());

  // static file
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // api/v1
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // cookie
  app.use(cookieParser());

  // helmet
  app.use(helmet());

  // config cors
  app.enableCors({
    origin: configService.get('FE_URL'),
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
  });

  await app.listen(port);
}
bootstrap();
