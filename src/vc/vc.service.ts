// vc-service/src/vc/vc.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Auth } from './entities/auth.entity';
import { VC } from './entities/vc.entity';
import { Guardian } from './entities/guardian.entity';
import { Shelter } from './entities/shelter.entity';
import {
  VCErrorCode,
  VCResponse,
  createErrorResponse,
  createSuccessResponse,
} from '../common/const/vc-error-codes';


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
  async registerAuth(walletAddress: string): Promise<VCResponse> {
    try {
      const auth = await this.authRepository.findOne({
        where: { walletAddress }
      });

      if (auth) {
        return createErrorResponse(
          VCErrorCode.WALLET_ALREADY_EXISTS,
          `이미 지갑이 존재합니다. 주소: ${walletAddress}`
        );
      }

      const newAuth = await this.authRepository.save({ walletAddress });

      return createSuccessResponse({
        authId: newAuth.id,
      }, '지갑 등록 완료');
    } catch (error) {
      return createErrorResponse(
        VCErrorCode.DATABASE_ERROR,
        `지갑 등록 실패: ${error.message}`
      );
    }
  }

  async getGuardianInfo(walletAddress: string): Promise<VCResponse> {
    try {
      const auth = await this.authRepository.findOne({
        where: { walletAddress },
        relations: ['guardian']
      });

      if (!auth) {
        return createErrorResponse(VCErrorCode.WALLET_NOT_FOUND);
      }

      const guardian = await this.guardianRepository.findOne({
        where: { auth: { id: auth.id } }
      });

      console.log(guardian)

      if (!guardian) {
        return createErrorResponse(VCErrorCode.GUARDIAN_NOT_FOUND);
      }

      console.log(guardian.email)
      return createSuccessResponse({
        guardianId: guardian.id,
        email: guardian.email || '',
        phone: guardian.phone || '',
        name: guardian.name || '',
        isEmailVerified: guardian.isEmailVerified,
        isOnChainRegistered: guardian.isOnChainRegistered,
      });
    } catch (error) {
      return createErrorResponse(
        VCErrorCode.DATABASE_ERROR,
        `가디언 정보 조회 실패: ${error.message}`
      );
    }
  }

  /**
   * 지갑 등록 확인 (지갑 주소만)
   */
  async checkAuth(walletAddress: string): Promise<VCResponse> {
    try {
      const auth = await this.authRepository.findOne({
        where: { walletAddress }
      });

      if (!auth) {
        return createErrorResponse(
          VCErrorCode.WALLET_NOT_FOUND,
          `지갑이 존재하지 않습니다. 주소: ${walletAddress}`
        );
      }

      return createSuccessResponse({
        authId: auth.id,
      }, '지갑 확인 완료');
    } catch (error) {
      return createErrorResponse(
        VCErrorCode.DATABASE_ERROR,
        `지갑 확인 실패: ${error.message}`
      );
    }
  }
  

  /**
   * Guardian 정보 업데이트
   */
  async updateGuardianInfo(data: any): Promise<VCResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Auth 확인
      const auth = await queryRunner.manager.findOne(Auth, {
        where: { walletAddress: data.walletAddress }
      });

      if (!auth) {
        await queryRunner.rollbackTransaction();
        return createErrorResponse(
          VCErrorCode.WALLET_NOT_FOUND,
          '지갑이 없습니다! 이메일 인증을 먼저 해주세요.'
        );
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
          isOnChainRegistered: data.isOnChainRegistered ?? guardian.isOnChainRegistered
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

      return createSuccessResponse({
        guardianId: guardian.id,
      }, '가디언이 정보 업데이트 완료');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return createErrorResponse(
        VCErrorCode.TRANSACTION_FAILED,
        `가디언 정보 업데이트 실패: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Shelter 정보 업데이트
   */
  async updateShelterInfo(data: any): Promise<VCResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const auth = await queryRunner.manager.findOne(Auth, {
        where: { walletAddress: data.walletAddress }
      });

      if (!auth) {
        await queryRunner.rollbackTransaction();
        return createErrorResponse(
          VCErrorCode.WALLET_NOT_FOUND,
          '지갑이 없습니다! 이메일 인증을 먼저 해주세요.'
        );
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

      return createSuccessResponse({
        shelterId: shelter.id,
      }, 'Shelter info updated');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return createErrorResponse(
        VCErrorCode.TRANSACTION_FAILED,
        `Shelter 정보 업데이트 실패: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  async storeVC(data: any): Promise<VCResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const auth = await queryRunner.manager.findOne(Auth, {
        where: { walletAddress: data.guardianAddress }
      });

      if (!auth) {
        await queryRunner.rollbackTransaction();
        return createErrorResponse(VCErrorCode.WALLET_NOT_FOUND);
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

      return createSuccessResponse({
        vcId: vc.id,
      }, 'VC가 저장되었습니다!');
    } catch (error) {
      console.error('저장 실패했습니다!:', error);
      await queryRunner.rollbackTransaction();
      return createErrorResponse(
        VCErrorCode.TRANSACTION_FAILED,
        `VC 저장 실패: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  async getVC(data: any): Promise<VCResponse> {
    try {
      const auth = await this.authRepository.findOne({
        where: { walletAddress: data.guardianAddress }
      });

      if (!auth) {
        return createErrorResponse(VCErrorCode.WALLET_NOT_FOUND);
      }

      const vc = await this.vcRepository.findOne({
        where: {
          auth: { id: auth.id },
          petDID: data.petDID
        }
      });

      if (!vc) {
        return createErrorResponse(VCErrorCode.VC_NOT_FOUND);
      }

      return createSuccessResponse({
        vcJwt: vc.vcJwt,
        metadata: vc.metadata,
        createdAt: vc.createdAt.toISOString(),
      });
    } catch (error) {
      return createErrorResponse(
        VCErrorCode.DATABASE_ERROR,
        `VC 조회 실패: ${error.message}`
      );
    }
  }

  async getVCsByWallet(walletAddress: string): Promise<VCResponse> {
    try {
      const auth = await this.authRepository.findOne({
        where: { walletAddress },
        relations: ['vcs'],
      });

      if (!auth) {
        return createErrorResponse(VCErrorCode.WALLET_NOT_FOUND);
      }

      const vcs = (auth.vcs || []).map(vc => ({
        petDID: vc.petDID,
        vcJwt: vc.vcJwt,
        vcType: vc.vcType,
        createdAt: vc.createdAt.toISOString(),
      }));

      return createSuccessResponse({ vcs });
    } catch (error) {
      return createErrorResponse(
        VCErrorCode.DATABASE_ERROR,
        `VC 목록 조회 실패: ${error.message}`
      );
    }
  }


  /**
   * VC 무효화 (삭제 + 이유 기록)
   */
  async invalidateVC(data: { petDID: string; guardianAddress: string; reason: string }): Promise<VCResponse> {
    try {
      const auth = await this.authRepository.findOne({
        where: { walletAddress: data.guardianAddress }
      });

      if (!auth) {
        return createErrorResponse(VCErrorCode.WALLET_NOT_FOUND);
      }

      // VC 존재 여부 확인
      const vc = await this.vcRepository.findOne({
        where: {
          auth: { id: auth.id },
          petDID: data.petDID
        }
      });

      if (!vc) {
        return createErrorResponse(VCErrorCode.VC_NOT_FOUND);
      }

      // VC 삭제
      const result = await this.vcRepository.delete({
        auth: { id: auth.id },
        petDID: data.petDID,
      });

      if (result.affected > 0) {
        console.log(`VC 무효화 완료 - petDID: ${data.petDID}, guardianAddress: ${data.guardianAddress}, 이유: ${data.reason}`);
        return createSuccessResponse(null, 'VC가 무효화되었습니다.');
      }

      return createErrorResponse(
        VCErrorCode.DATABASE_ERROR,
        'VC 무효화 실패'
      );
    } catch (error) {
      return createErrorResponse(
        VCErrorCode.DATABASE_ERROR,
        `VC 무효화 실패: ${error.message}`
      );
    }
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