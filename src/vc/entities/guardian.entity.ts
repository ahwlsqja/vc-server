import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Auth } from "./auth.entity";

@Entity('guardian')
export class Guardian {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Auth)
  @JoinColumn()
  auth: Auth;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  name: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: false })
  isOnChainRegistered: boolean;
}