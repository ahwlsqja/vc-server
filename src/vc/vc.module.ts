import { Module } from '@nestjs/common';
import { VcService } from './vc.service';
import { VcController } from './vc.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auth } from './entities/auth.entity';
import { VC } from './entities/vc.entity';
import { Guardian } from './entities/guardian.entity';
import { Shelter } from './entities/shelter.entity';

@Module({
  imports: [  
    TypeOrmModule.forFeature([
      Auth,
      VC,
      Guardian,
      Shelter,
    ]),
  ],
  controllers: [VcController],
  providers: [VcService],
})
export class VcModule {}
