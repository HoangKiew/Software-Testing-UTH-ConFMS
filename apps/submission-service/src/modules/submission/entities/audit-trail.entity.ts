import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_trail')
export class AuditTrail {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    action: string; // CREATE, UPDATE, DELETE

    @Column()
    entity_type: string; // SUBMISSION, FILE, AUTHOR

    @Column()
    entity_id: number;

    @Column()
    actor_id: number; // User thực hiện

    @Column({ type: 'text', nullable: true })
    details: string; // Ghi chú thêm (JSON string)

    @CreateDateColumn()
    timestamp: Date;
}