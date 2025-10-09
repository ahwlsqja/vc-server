// vc-service/src/vc/vc.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Auth } from './entities/auth.entity';
import { VC } from './entities/vc.entity';
import { Guardian } from './entities/guardian.entity';
import { Shelter } from './entities/shelter.entity';


@Injectable()
export class VcService {
  constructor(
    @InjectRepository(Auth)
    private authRepository: Repository<Auth>,
    @InjectRepository(Guardian)
    private guardianRepository: Repository<Guardian>,
    @InjectRepository(Shelter)
    private shelterRepository: Repository<Shelter>,
    private dataSource: DataSource,
    @InjectRepository(VC)
    private vcRepository: Repository<VC>,
  ) {}

  /**
   * Auth 등록 (지갑 주소만)
   */
  async registerAuth(walletAddress: string){
    const auth = await this.authRepository.findOne({
      where: { walletAddress }
    });

    if (auth) {
      throw new Error(`이미 지갑이 존재합니다. 주소: ${walletAddress}`);
    }

    return {
      success: true,
      authId: auth.id,
      message: '지갑 등록 완료',
    };
  }

  /**
   * 지갑 등록 확인 (지갑 주소만)
   */
  async checkAuth(walletAddress: string){
    const auth = await this.authRepository.findOne({
      where: { walletAddress }
    });

    if (!auth) {
      throw new NotFoundException(`지갑이 존재하지 않습니다. 주소: ${walletAddress}`);
    }

    return {
      success: true,
      authId: auth.id,
      message: '지갑 확인 완료',
    };
  }
  

  /**
   * Guardian 정보 업데이트
   */
  async updateGuardianInfo(data: any): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Auth 확인
      const auth = await queryRunner.manager.findOne(Auth, {
        where: { walletAddress: data.walletAddress }
      });

      if (!auth) {
        return {
          success: false,
          error: '지갑이 없습니다! 이메일 인증을 먼저 해주세요.',
        };
      }

      // Guardian 확인 or 생성
      let guardian = await queryRunner.manager.findOne(Guardian, {
        where: { auth: { id: auth.id } }
      });

      if (guardian) {
        // 업데이트
        await queryRunner.manager.update(Guardian, guardian.id, {
          email: data.email || guardian.email,
          phone: data.phone || guardian.phone,
          name: data.name || guardian.name,
          isEmailVerified: data.isEmailVerified ?? guardian.isEmailVerified,
        });
      } else {
        // 새로 생성
        guardian = await queryRunner.manager.save(Guardian, {
          auth,
          email: data.email,
          phone: data.phone,
          name: data.name,
          isEmailVerified: data.isEmailVerified || false,
        });
      }

      await queryRunner.commitTransaction();

      return {
        success: true,
        guardianId: guardian.id,
        message: '가디언이 정보 업데이트 완료',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return {
        success: false,
        error: error.message,
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Shelter 정보 업데이트
   */
  async updateShelterInfo(data: any): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const auth = await queryRunner.manager.findOne(Auth, {
        where: { walletAddress: data.walletAddress }
      });

      if (!auth) {
        return {
          success: false,
          error: '지갑이 없습니다! 이메일 인증을 먼저 해주세요.',
        };
      }

      let shelter = await this.shelterRepository.findOne({
        where: { auth: { id: auth.id } }
      });

      if (shelter) {
        await queryRunner.manager.update(Shelter, shelter.id, {
          name: data.name || shelter.name,
          location: data.location || shelter.location,
          licenseNumber: data.licenseNumber || shelter.licenseNumber,
          capacity: data.capacity || shelter.capacity,
        });
      } else {
        shelter = await queryRunner.manager.save(Shelter, {
          auth,
          name: data.name,
          location: data.location,
          licenseNumber: data.licenseNumber,
          capacity: data.capacity,
          status: 'PENDING',
        });
      }

      await queryRunner.commitTransaction();

      return {
        success: true,
        shelterId: shelter.id,
        message: 'Shelter info updated',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return {
        success: false,
        error: error.message,
      };
    } finally {
      await queryRunner.release();
    }
  }

  async storeVC(data: any): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const auth = await queryRunner.manager.findOne(Auth, {
        where: { walletAddress: data.guardianAddress }
      });

      if (!auth) {
        throw new Error('지갑이 없습니다!');
      }

      const vc = await queryRunner.manager.save(VC, {
        auth,
        petDID: data.petDID,
        vcJwt: data.vcJwt,
        vcType: 'GuardianIssuedPetVC',
        metadata: data.metadata || '',
        createdAt: new Date(),
      });

      await queryRunner.commitTransaction();

      return {
        success: true,
        vcId: vc.id,
        message: 'VC가 저장되었습니다!',
      };
    } catch (error) {
      console.error('저장 실패했습니다!:', error);
      await queryRunner.rollbackTransaction();
      return {
        success: false,
        error: error.message,
      };
    } finally {
      await queryRunner.release();
    }
  }

  async getVC(data: any): Promise<any> {
    const auth = await this.authRepository.findOne({
      where: { walletAddress: data.guardianAddress }
    });

    if (!auth) {
      return { 
        success: false, 
        error: '지갑이 없습니다!' 
      };
    }

    const vc = await this.vcRepository.findOne({
      where: { 
        auth: { id: auth.id },
        petDID: data.petDID 
      }
    });

    if (!vc) {
      return { 
        success: false, 
        error: 'vc가 없습니다!' 
      };
    }

    return {
      success: true,
      vcJwt: vc.vcJwt,
      metadata: vc.metadata,
      createdAt: vc.createdAt.toISOString(),
    };
  }

  async getVCsByWallet(walletAddress: string): Promise<any> {
    const auth = await this.authRepository.findOne({
      where: { walletAddress },
      relations: ['vcs'],
    });

    if (!auth || !auth.vcs) {
      return { vcs: [] };
    }

    const vcs = auth.vcs.map(vc => ({
      petDID: vc.petDID,
      vcJwt: vc.vcJwt,
      vcType: vc.vcType,
      createdAt: vc.createdAt.toISOString(),
    }));

    return { vcs };
  }

  async deleteVC(data: any): Promise<any> {
    const auth = await this.authRepository.findOne({
      where: { walletAddress: data.guardianAddress }
    });

    if (!auth) {
      return {
        success: false,
        error: 'Auth not found'
      };
    }

    const result = await this.vcRepository.delete({
      auth: { id: auth.id },
      petDID: data.petDID,
    });

    return {
      success: result.affected > 0,
      message: result.affected > 0 ? 'VC deleted' : 'VC not found',
    };
  }

  /**
   * gRPC Health Check
   */
  async healthCheck(data: { service?: string }): Promise<any> {
    // gRPC service is responding - return SERVING status
    return {
      status: 1, // SERVING
      message: 'VCService is serving',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}