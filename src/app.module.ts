// vc-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VcModule } from './vc/vc.module';
import * as Joi from 'joi';
import { envVariableKeys } from './common/const/env.const';
import { ResponseTimeInterceptor } from './common/interceptor/response-time.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Auth } from './vc/entities/auth.entity';
import { VC } from './vc/entities/vc.entity';
import { Guardian } from './vc/entities/guardian.entity';
import { Shelter } from './vc/entities/shelter.entity';
import { TransactionInterceptor } from './common/interceptor/transaction-interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        ENV: Joi.string().valid('dev', 'prod').required(),
        DB_TYPE: Joi.string().valid('postgres').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
      })
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>(envVariableKeys.dbType) as 'postgres',
        host: configService.get<string>(envVariableKeys.dbHost),
        port: configService.get<number>(envVariableKeys.dbPort),
        username: configService.get<string>(envVariableKeys.dbUsername),
        password: configService.get<string>(envVariableKeys.dbPassword),
        database: configService.get<string>(envVariableKeys.dbDatabase),
        entities: [
          Auth,
          VC,
          Guardian,
          Shelter,
        ],
        synchronize: configService.get<string>(envVariableKeys.env) === 'prod' ? false : true,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    VcModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTimeInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransactionInterceptor,
    },
  ]
})
export class AppModule {}