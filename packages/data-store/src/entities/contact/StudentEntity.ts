import {BaseContactEntity} from "./BaseContactEntity";
import {BeforeInsert, BeforeUpdate, ChildEntity, Column} from "typeorm";
import {IsNotEmpty, Validate, ValidationError, validate} from "class-validator";
import {IsNonEmptyStringConstraint} from "../validators";
import {ValidationConstraint} from "../../types";
import {getConstraint} from "../../utils/ValidatorUtils";

@ChildEntity('Student')
export class StudentEntity extends BaseContactEntity {
    @Column({ name: 'first_name', length: 255, nullable: false, unique: false })
    @IsNotEmpty({ message: 'Blank first names are not allowed' })
    firstName!: string

    @Column({ name: 'middle_name', length: 255, nullable: true, unique: false })
    @Validate(IsNonEmptyStringConstraint, { message: 'Blank middle names are not allowed' })
    middleName?: string

    @Column({ name: 'last_name', length: 255, nullable: false, unique: false })
    @IsNotEmpty({ message: 'Blank last names are not allowed' })
    lastName!: string

    @Column({ name: 'grade', length: 3, nullable: false})
    @IsNotEmpty({ message: 'Blank grade is not allowed'})
    grade!: string

    @Column({ name: 'date_of_birth', nullable: false})
    dateOfBirth!: Date

    @Column({name:'owner_id', nullable:true})
    ownerId?: string

    @Column({name:'tenant_id', nullable:true})
    tenantId?: string

    @Column({ name: 'display_name', length: 255, nullable: false, unique: false })
    @IsNotEmpty({ message: 'Blank display names are not allowed' })
    displayName!: string

    @BeforeInsert()
    @BeforeUpdate()
    async validate(): Promise<void> {
        const validation: Array<ValidationError> = await validate(this)
        if (validation.length > 0) {
            const constraint: ValidationConstraint | undefined = getConstraint(validation[0])
            if (constraint) {
                const message: string = Object.values(constraint!)[0]
                return Promise.reject(Error(message))
            }
        }
    }
}